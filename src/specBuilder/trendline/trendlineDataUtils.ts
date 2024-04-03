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
	FILTERED_PREVIOUS_TABLE,
	FILTERED_TABLE,
	HIGHLIGHTED_ITEM,
	HIGHLIGHTED_SERIES,
	MARK_ID,
	PREVIOUS_PREFIX,
	SELECTED_ITEM,
	SELECTED_SERIES,
	SERIES_ID,
} from '@constants';
import { getPreviousTableData, getSeriesIdTransform, getTableData } from '@specBuilder/data/dataUtils';
import { hasInteractiveChildren } from '@specBuilder/marks/markUtils';
import { getFacetsFromProps } from '@specBuilder/specUtils';
import { produce } from 'immer';
import { TrendlineMethod, TrendlineSpecProps } from 'types';
import { Data, SourceData, Transforms } from 'vega';

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
	TrendlineParentProps,
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
 * @param markProps
 */
export const addTrendlineData = (data: Data[], markProps: TrendlineParentProps) => {
	data.push(...getTrendlineData(markProps));

	const tableData = getTableData(data);
	tableData.transform = addTableDataTransforms(tableData.transform ?? [], markProps);

	if (markProps.animations !== false) {
		const previousTableData = getPreviousTableData(data);
		previousTableData.transform = addTableDataTransforms(
			previousTableData.transform ?? [],
			markProps,
			PREVIOUS_PREFIX
		);
	}
};

/**
 * Gets all the data sources and transforms for all trendlines
 * @param data
 * @param markProps
 * @returns Data[]
 */
export const getTrendlineData = (markProps: TrendlineParentProps): SourceData[] => {
	const data: SourceData[] = [];
	const { color, lineType, name: markName } = markProps;
	const trendlines = getTrendlines(markProps);

	const concatenatedTrendlineData: { name: string; source: string[] } = {
		name: `${markName}_allTrendlineData`,
		source: [],
	};

	for (const trendlineProps of trendlines) {
		const { displayOnHover, method, name, children: trendlineChildren } = trendlineProps;
		const { facets } = getFacetsFromProps({ color, lineType });

		if (isRegressionMethod(method)) {
			data.push(
				...getRegressionTrendlineData(markProps, trendlineProps, facets, trendlineProps.name, FILTERED_TABLE)
			);
			if (markProps.animations !== false) {
				data.push(
					...getRegressionTrendlineData(
						markProps,
						trendlineProps,
						facets,
						`${PREVIOUS_PREFIX}${trendlineProps.name}`,
						FILTERED_PREVIOUS_TABLE
					)
				);
			}
		} else if (isAggregateMethod(method)) {
			data.push(...getAggregateTrendlineData(markProps, trendlineProps, facets));
		} else if (isWindowMethod(method)) {
			data.push(getWindowTrendlineData(markProps, trendlineProps, trendlineProps.name, FILTERED_TABLE));
			if (markProps.animations !== false) {
				data.push(
					getWindowTrendlineData(
						markProps,
						trendlineProps,
						`${PREVIOUS_PREFIX}${trendlineProps.name}`,
						FILTERED_PREVIOUS_TABLE
					)
				);
			}
		}
		if (displayOnHover) {
			data.push(getTrendlineDisplayOnHoverData(name, method));
		}
		if (hasInteractiveChildren(trendlineChildren)) {
			concatenatedTrendlineData.source.push(`${name}_data`);
		}
	}

	if (trendlines.some((trendline) => hasInteractiveChildren(trendline.children))) {
		data.push(concatenatedTrendlineData);
		data.push(getHighlightTrendlineData(markName));
	}

	return data;
};

/**
 * Gets the data sources and transforms for aggregate trendlines (average, median)
 * @param markProps
 * @param trendlineProps
 * @param facets
 * @returns Data[]
 */
export const getAggregateTrendlineData = (
	markProps: TrendlineParentProps,
	trendlineProps: TrendlineSpecProps,
	facets: string[]
) => {
	const data: SourceData[] = [];
	const { dimensionRange, name, children: trendlineChildren, trendlineDimension } = trendlineProps;
	const dimensionRangeTransforms = getTrendlineDimensionRangeTransforms(trendlineDimension, dimensionRange);
	// high resolution data used for drawing the rule marks
	data.push({
		name: `${name}_highResolutionData`,
		source: FILTERED_TABLE,
		transform: [
			...dimensionRangeTransforms,
			...getTrendlineStatisticalTransforms(markProps, trendlineProps, true),
			getSeriesIdTransform(facets),
		],
	});
	if (hasInteractiveChildren(trendlineChildren)) {
		// data used for each of the trendline points
		data.push({
			name: `${name}_data`,
			source: FILTERED_TABLE,
			transform: [
				...dimensionRangeTransforms,
				...getTrendlineStatisticalTransforms(markProps, trendlineProps, false),
			],
		});
	}
	return data;
};

/**
 * Gets the data sources and transforms for regression trendlines (linear, power, polynomial-x, etc.)
 * @param markProps
 * @param trendlineProps
 * @param facets
 * @returns Data[]
 */
export const getRegressionTrendlineData = (
	markProps: TrendlineParentProps,
	trendlineProps: TrendlineSpecProps,
	facets: string[],
	trendlineName: string,
	source: string
) => {
	const data: SourceData[] = [];
	const { dimension, metric } = markProps;
	const { dimensionRange, method, orientation, children: trendlineChildren, trendlineDimension } = trendlineProps;
	const { trendlineDimension: standardTrendlineDimension } = getTrendlineDimensionMetric(
		dimension,
		metric,
		orientation,
		false
	);
	const dimensionRangeTransforms = getTrendlineDimensionRangeTransforms(standardTrendlineDimension, dimensionRange);
	// high resolution data used for drawing the smooth trendline
	data.push({
		name: `${trendlineName}_highResolutionData`,
		source,
		transform: [
			...dimensionRangeTransforms,
			...getTrendlineStatisticalTransforms(markProps, trendlineProps, true),
			getSeriesIdTransform(facets),
		],
	});
	if (hasInteractiveChildren(trendlineChildren)) {
		// params and data used for each of the trendline data points
		// the high resolution data has too much detail and we don't want a tooltip at each high resolution point
		data.push(
			{
				name: `${trendlineName}_params`,
				source,
				transform: [
					...dimensionRangeTransforms,
					...getTrendlineStatisticalTransforms(markProps, trendlineProps, false),
				],
			},
			{
				name: `${trendlineName}_data`,
				source,
				transform: [
					...dimensionRangeTransforms,
					getTrendlineParamLookupTransform(markProps, trendlineProps),
					...getTrendlineParamFormulaTransforms(trendlineDimension, method),
				],
			}
		);
	}
	return data;
};

export /**
 * Gets the data source and transforms for window trendlines (movingAverage-x)
 * @param markProps
 * @param trendlineProps
 * @returns Data
 */
const getWindowTrendlineData = (
	markProps: TrendlineParentProps,
	trendlineProps: TrendlineSpecProps,
	name: string,
	source: string
): SourceData => ({
	name: `${name}_data`,
	source,
	transform: [
		...getTrendlineStatisticalTransforms(markProps, trendlineProps, false),
		...getTrendlineDimensionRangeTransforms(markProps.dimension, trendlineProps.dimensionRange),
	],
});

/**
 * gets the data source and transforms for highlighting trendlines
 * @param markName
 * @param trendlines
 * @returns Data
 */
const getHighlightTrendlineData = (markName: string): SourceData => {
	const expr = `${SELECTED_ITEM} === datum.${MARK_ID} || !${SELECTED_ITEM} && ${HIGHLIGHTED_ITEM} === datum.${MARK_ID}`;

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
 * @param markProps
 * @param trendlineProps
 * @returns dataTransforms
 */
export const getTrendlineStatisticalTransforms = (
	markProps: TrendlineParentProps,
	trendlineProps: TrendlineSpecProps,
	isHighResolutionData: boolean
): Transforms[] => {
	const { method, trendlineDimension } = trendlineProps;

	if (isAggregateMethod(method)) {
		return [getAggregateTransform(markProps, trendlineProps, isHighResolutionData)];
	}
	if (isRegressionMethod(method)) {
		return [getRegressionTransform(markProps, trendlineProps, isHighResolutionData)];
	}
	if (isWindowMethod(method)) {
		return [getSortTransform(trendlineDimension), getWindowTransform(markProps, trendlineProps)];
	}

	return [];
};

/**
 * Adds the table data transforms needed for trendlines
 * @param transforms
 * @param markProps
 */
export const addTableDataTransforms = produce<Transforms[], [TrendlineParentProps, string?]>(
	(transforms, markProps, extentPrefix = '') => {
		const { dimension, metric } = markProps;

		const trendlines = getTrendlines(markProps);
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
							(transform) =>
								'as' in transform && transform.as === `${standardTrendlinDimension}Normalized`
						)
					) {
						transforms.push(...getNormalizedDimensionTransform(standardTrendlinDimension));
					}
				}
				// add the extent transform
				transforms.push(getRegressionExtentTransform(trendlineDimension, `${extentPrefix}${name}`));
			}
		}
	}
);

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
