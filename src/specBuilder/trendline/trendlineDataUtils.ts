/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {
	FILTERED_TABLE,
	HIGHLIGHTED_ITEM,
	HIGHLIGHTED_SERIES,
	SELECTED_ITEM,
	SELECTED_SERIES,
	SERIES_ID,
} from '@constants';
import { getSeriesIdTransform, getTableData } from '@specBuilder/data/dataUtils';
import { isInteractive } from '@specBuilder/marks/markUtils';
import { getFacetsFromOptions } from '@specBuilder/specUtils';
import { produce } from 'immer';
import { Data, SourceData, Transforms } from 'vega';

import { TrendlineMethod, TrendlineSpecOptions } from '../../types';
import {
	getAggregateTransform,
	getNormalizedDimensionTransform,
	getRegressionExtentTransform,
	getRegressionTransform,
	getSortTransform,
	getTrendlineDimensionRangeTransforms,
	getTrendlineParamFormulaTransforms,
	getTrendlineParamLookupTransform,
	getWindowTransform,
} from './trendlineDataTransformUtils';
import {
	TrendlineParentOptions,
	getTrendlineDimensionMetric,
	getTrendlines,
	isAggregateMethod,
	isRegressionMethod,
	isWindowMethod,
} from './trendlineUtils';

/**
 * Adds the necessary data sources and transforms for the trendlines
 * NOTE: this function mutates the data array because it gets called from within a data produce function
 * @param data
 * @param markOptions
 */
export const addTrendlineData = (data: Data[], markOptions: TrendlineParentOptions) => {
	data.push(...getTrendlineData(markOptions));

	const tableData = getTableData(data);
	tableData.transform = addTableDataTransforms(tableData.transform ?? [], markOptions);
};

/**
 * Gets all the data sources and transforms for all trendlines
 * @param data
 * @param markOptions
 * @returns Data[]
 */
export const getTrendlineData = (markOptions: TrendlineParentOptions): SourceData[] => {
	const data: SourceData[] = [];
	const { color, idKey, lineType, name: markName } = markOptions;
	const trendlines = getTrendlines(markOptions);

	const concatenatedTrendlineData: { name: string; source: string[] } = {
		name: `${markName}_allTrendlineData`,
		source: [],
	};

	for (const trendlineOptions of trendlines) {
		const { displayOnHover, method, name } = trendlineOptions;
		const { facets } = getFacetsFromOptions({ color, lineType });

		if (isRegressionMethod(method)) {
			data.push(...getRegressionTrendlineData(markOptions, trendlineOptions, facets));
		} else if (isAggregateMethod(method)) {
			data.push(...getAggregateTrendlineData(markOptions, trendlineOptions, facets));
		} else if (isWindowMethod(method)) {
			data.push(getWindowTrendlineData(markOptions, trendlineOptions));
		}
		if (displayOnHover) {
			data.push(getTrendlineDisplayOnHoverData(name, method));
		}
		if (isInteractive(trendlineOptions)) {
			concatenatedTrendlineData.source.push(`${name}_data`);
		}
	}

	if (trendlines.some((trendline) => isInteractive(trendline))) {
		data.push(concatenatedTrendlineData);
		data.push(getHighlightTrendlineData(markName, idKey));
	}

	return data;
};

/**
 * Gets the data sources and transforms for aggregate trendlines (average, median)
 * @param markOptions
 * @param trendlineOptions
 * @param facets
 * @returns Data[]
 */
export const getAggregateTrendlineData = (
	markOptions: TrendlineParentOptions,
	trendlineOptions: TrendlineSpecOptions,
	facets: string[]
) => {
	const data: SourceData[] = [];
	const { dimensionRange, name, trendlineDimension } = trendlineOptions;
	const dimensionRangeTransforms = getTrendlineDimensionRangeTransforms(trendlineDimension, dimensionRange);
	// high resolution data used for drawing the rule marks
	data.push({
		name: `${name}_highResolutionData`,
		source: FILTERED_TABLE,
		transform: [
			...getExcludeDataKeyTransforms(trendlineOptions.excludeDataKeys),
			...dimensionRangeTransforms,
			...getTrendlineStatisticalTransforms(markOptions, trendlineOptions, true),
			...getSeriesIdTransform(facets),
		],
	});
	if (isInteractive(trendlineOptions)) {
		// data used for each of the trendline points
		data.push({
			name: `${name}_data`,
			source: FILTERED_TABLE,
			transform: [
				...dimensionRangeTransforms,
				...getTrendlineStatisticalTransforms(markOptions, trendlineOptions, false),
			],
		});
	}
	return data;
};

/**
 * Gets the data sources and transforms for regression trendlines (linear, power, polynomial-x, etc.)
 * @param markOptions
 * @param trendlineOptions
 * @param facets
 * @returns Data[]
 */
export const getRegressionTrendlineData = (
	markOptions: TrendlineParentOptions,
	trendlineOptions: TrendlineSpecOptions,
	facets: string[]
) => {
	const data: SourceData[] = [];
	const { dimension, metric } = markOptions;
	const { dimensionRange, method, name, orientation, trendlineDimension } = trendlineOptions;
	const { trendlineDimension: standardTrendlineDimension } = getTrendlineDimensionMetric(
		dimension,
		metric,
		orientation,
		false
	);
	const dimensionRangeTransforms = getTrendlineDimensionRangeTransforms(standardTrendlineDimension, dimensionRange);
	// high resolution data used for drawing the smooth trendline
	data.push({
		name: `${name}_highResolutionData`,
		source: FILTERED_TABLE,
		transform: [
			...getExcludeDataKeyTransforms(trendlineOptions.excludeDataKeys),
			...dimensionRangeTransforms,
			...getTrendlineStatisticalTransforms(markOptions, trendlineOptions, true),
			...getSeriesIdTransform(facets),
		],
	});
	if (isInteractive(trendlineOptions)) {
		// params and data used for each of the trendline data points
		// the high resolution data has too much detail and we don't want a tooltip at each high resolution point
		data.push(
			{
				name: `${name}_params`,
				source: FILTERED_TABLE,
				transform: [
					...dimensionRangeTransforms,
					...getTrendlineStatisticalTransforms(markOptions, trendlineOptions, false),
				],
			},
			{
				name: `${name}_data`,
				source: FILTERED_TABLE,
				transform: [
					...dimensionRangeTransforms,
					getTrendlineParamLookupTransform(markOptions, trendlineOptions),
					...getTrendlineParamFormulaTransforms(trendlineDimension, method),
				],
			}
		);
	}
	return data;
};

/**
 * Gets the data source and transforms for window trendlines (movingAverage-x)
 * @param markOptions
 * @param trendlineOptions
 * @returns Data
 */
const getWindowTrendlineData = (
	markOptions: TrendlineParentOptions,
	trendlineOptions: TrendlineSpecOptions
): SourceData => ({
	name: `${trendlineOptions.name}_data`,
	source: FILTERED_TABLE,
	transform: [
		...getExcludeDataKeyTransforms(trendlineOptions.excludeDataKeys),
		...getTrendlineStatisticalTransforms(markOptions, trendlineOptions, false),
		...getTrendlineDimensionRangeTransforms(markOptions.dimension, trendlineOptions.dimensionRange),
	],
});

/**
 * gets the data source and transforms for highlighting trendlines
 * @param markName
 * @param trendlines
 * @returns Data
 */
const getHighlightTrendlineData = (markName: string, idKey: string): SourceData => {
	const expr = `${SELECTED_ITEM} === datum.${idKey} || !isValid(${SELECTED_ITEM}) && (isArray(${HIGHLIGHTED_ITEM}) && indexof(${HIGHLIGHTED_ITEM}, datum.${idKey}) || ${HIGHLIGHTED_ITEM} === datum.${idKey})`;
	return {
		name: `${markName}Trendline_highlightedData`,
		source: `${markName}_allTrendlineData`,
		transform: [
			{
				type: 'filter',
				expr,
			},
		],
	};
};

/**
 * Gets the statistical transforms that will calculate the trendline values
 * @param markOptions
 * @param trendlineOptions
 * @returns dataTransforms
 */
export const getTrendlineStatisticalTransforms = (
	markOptions: TrendlineParentOptions,
	trendlineOptions: TrendlineSpecOptions,
	isHighResolutionData: boolean
): Transforms[] => {
	const { method, trendlineDimension } = trendlineOptions;

	if (isAggregateMethod(method)) {
		return [getAggregateTransform(markOptions, trendlineOptions, isHighResolutionData)];
	}
	if (isRegressionMethod(method)) {
		return [getRegressionTransform(markOptions, trendlineOptions, isHighResolutionData)];
	}
	if (isWindowMethod(method)) {
		return [getSortTransform(trendlineDimension), getWindowTransform(markOptions, trendlineOptions)];
	}

	return [];
};

/**
 * Adds the table data transforms needed for trendlines
 * @param transforms
 * @param markOptions
 */
export const addTableDataTransforms = produce<Transforms[], [TrendlineParentOptions]>((transforms, markOptions) => {
	const { dimension, metric } = markOptions;

	const trendlines = getTrendlines(markOptions);
	for (const { isDimensionNormalized, method, name, orientation, trendlineDimension } of trendlines) {
		if (isRegressionMethod(method)) {
			// time scales need to be normalized for regression trendlines
			const { trendlineDimension: standardTrendlinDimension } = getTrendlineDimensionMetric(
				dimension,
				metric,
				orientation,
				false
			);

			if (isDimensionNormalized) {
				if (
					!transforms.some(
						(transform) => 'as' in transform && transform.as === `${standardTrendlinDimension}Normalized`
					)
				) {
					transforms.push(...getNormalizedDimensionTransform(standardTrendlinDimension));
				}
			}
			// add the extent transform
			transforms.push(getRegressionExtentTransform(trendlineDimension, name));
		}
	}
});

/**
 * Gets the data source and transforms for displaying the trendline on hover
 * @param trendlineName
 * @param method
 * @returns SourceData
 */
export const getTrendlineDisplayOnHoverData = (trendlineName: string, method: TrendlineMethod): SourceData => {
	const source = isWindowMethod(method) ? `${trendlineName}_data` : `${trendlineName}_highResolutionData`;
	return {
		name: `${trendlineName}_highlightedData`,
		source,
		transform: [
			{
				type: 'filter',
				expr: `datum.${SERIES_ID} === ${HIGHLIGHTED_SERIES} || datum.${SERIES_ID} === ${SELECTED_SERIES}`,
			},
		],
	};
};

const getExcludeDataKeyTransforms = (excludeDataKeys?: string[]): Transforms[] =>
	excludeDataKeys?.map((excludeDataKey) => ({
		type: 'filter',
		expr: `!datum.${excludeDataKey}`,
	})) ?? [];
