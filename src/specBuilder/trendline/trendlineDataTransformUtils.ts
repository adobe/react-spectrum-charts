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
import { MS_PER_DAY, TRENDLINE_VALUE } from '@constants';
import { getFacetsFromOptions } from '@specBuilder/specUtils';
import {
	AggregateOp,
	AggregateTransform,
	CollectTransform,
	ExtentTransform,
	FilterTransform,
	FormulaTransform,
	JoinAggregateTransform,
	LookupTransform,
	RegressionMethod,
	RegressionTransform,
	Transforms,
	WindowTransform,
} from 'vega';

import { AggregateMethod, TrendlineMethod, TrendlineSpecOptions } from '../../types';
import { TrendlineParentOptions, getPolynomialOrder, getRegressionExtent, isPolynomialMethod } from './trendlineUtils';

/**
 * Gets the aggreagate transform used for calculating the average trendline
 * @param markOptions
 * @param trendlineSpecOptions
 * @param isHighResolutionData
 * @returns transform
 */
export const getAggregateTransform = (
	markOptions: TrendlineParentOptions,
	{ method, trendlineDimension, trendlineMetric }: TrendlineSpecOptions,
	isHighResolutionData: boolean
): AggregateTransform | JoinAggregateTransform => {
	const { color, lineType } = markOptions;
	const { facets } = getFacetsFromOptions({ color, lineType });
	const operations: Record<AggregateMethod, AggregateOp> = {
		average: 'mean',
		median: 'median',
	};
	if (isHighResolutionData) {
		return {
			type: 'aggregate',
			groupby: facets,
			ops: [operations[method], 'min', 'max'],
			fields: [trendlineMetric, trendlineDimension, trendlineDimension],
			as: [TRENDLINE_VALUE, `${trendlineDimension}Min`, `${trendlineDimension}Max`],
		};
	}
	return {
		type: 'joinaggregate',
		groupby: facets,
		ops: [operations[method]],
		fields: [trendlineMetric],
		as: [TRENDLINE_VALUE],
	};
};

/**
 * Gets the regression transform used for calculating the regression trendline.
 * Regression trendlines are ones that use the x value as a parameter
 * @see https://vega.github.io/vega/docs/transforms/regression/
 * @param markOptions
 * @param method
 * @param isHighResolutionData
 * @returns
 */
export const getRegressionTransform = (
	markOptions: TrendlineParentOptions,
	trendlineOptions: TrendlineSpecOptions,
	isHighResolutionData: boolean
): RegressionTransform => {
	const { color, lineType } = markOptions;
	const { dimensionExtent, isDimensionNormalized, method, name, trendlineDimension, trendlineMetric } =
		trendlineOptions;
	const { facets } = getFacetsFromOptions({ color, lineType });

	let regressionMethod: RegressionMethod | undefined;
	let order: number | undefined;

	switch (method) {
		case 'exponential':
			regressionMethod = 'exp';
			break;
		case 'logarithmic':
			regressionMethod = 'log';
			break;
		case 'power':
			regressionMethod = 'pow';
			break;
		default:
			order = getPolynomialOrder(method);
			regressionMethod = 'poly';
			break;
	}

	return {
		type: 'regression',
		method: regressionMethod,
		order,
		groupby: facets,
		x: trendlineDimension,
		y: trendlineMetric,
		as: isHighResolutionData ? [trendlineDimension, TRENDLINE_VALUE] : undefined,
		params: !isHighResolutionData,
		extent: isHighResolutionData ? getRegressionExtent(dimensionExtent, name, isDimensionNormalized) : undefined,
	};
};

/**
 * Gets the window transform used for calculating the moving average trendline.
 * @param markOptions
 * @param method
 * @returns
 */
export const getWindowTransform = (
	markOptions: TrendlineParentOptions,
	{ method, trendlineMetric }: TrendlineSpecOptions
): WindowTransform => {
	const frameWidth = parseInt(method.split('-')[1]);

	const { color, lineType } = markOptions;
	const { facets } = getFacetsFromOptions({ color, lineType });

	if (isNaN(frameWidth) || frameWidth < 1) {
		throw new Error(
			`Invalid moving average frame width: ${frameWidth}, frame width must be an integer greater than 0`
		);
	}

	return {
		type: 'window',
		ops: ['mean'],
		groupby: facets,
		fields: [trendlineMetric],
		as: [TRENDLINE_VALUE],
		frame: [frameWidth - 1, 0],
	};
};

/**
 * Gets the transforms that will normalize the dimension.
 * The dimension gets normalized for time scales on regression methods. This makes the regression calculations far more accurate than using the raw time values
 * @param dimension
 * @returns
 */
export const getNormalizedDimensionTransform = (dimension: string): Transforms[] => [
	{
		type: 'joinaggregate',
		fields: [dimension],
		as: [`${dimension}Min`],
		ops: ['min'],
	},
	{
		type: 'formula',
		expr: `(datum.${dimension} - datum.${dimension}Min + ${MS_PER_DAY}) / ${MS_PER_DAY}`,
		as: `${dimension}Normalized`,
	},
];

/**
 * Gets an extent transform.
 * This is used to calculate the min and max of the dimension so that it can be used to set the extent of the regression trendline
 * @param dimension
 * @param name
 * @returns
 */
export const getRegressionExtentTransform = (dimension: string, name: string): ExtentTransform => ({
	type: 'extent',
	field: dimension,
	signal: `${name}_extent`,
});

/**
 * Gets the sort transform for the provided dimension.
 * This is used to sort window methods so they are calculated and drawn in the correct order
 * @param dimension
 * @returns CollectTransform
 */
export const getSortTransform = (dimension: string): CollectTransform => ({
	type: 'collect',
	sort: {
		field: dimension,
	},
});

/**
 * gets the filter transforms that will restrict the data to the dimension range
 * @param dimension
 * @param dimensionRange
 * @returns filterTansforms
 */
export const getTrendlineDimensionRangeTransforms = (
	dimension: string,
	dimensionRange: [number | null, number | null]
): FilterTransform[] => {
	const filterExpressions: string[] = [];
	if (dimensionRange[0] !== null) {
		filterExpressions.push(`datum.${dimension} >= ${dimensionRange[0]}`);
	}
	if (dimensionRange[1] !== null) {
		filterExpressions.push(`datum.${dimension} <= ${dimensionRange[1]}`);
	}
	if (filterExpressions.length) {
		return [
			{
				type: 'filter',
				expr: filterExpressions.join(' && '),
			},
		];
	}
	return [];
};

/**
 * This transform is used to calculate the value of the trendline using the coef and the dimension
 * @param trendlineDimension mark dimension
 * @param method trenline method
 * @returns formula transorfm
 */
export const getTrendlineParamFormulaTransforms = (
	trendlineDimension: string,
	method: TrendlineMethod
): FormulaTransform[] => {
	let expr = '';
	if (isPolynomialMethod(method)) {
		const order = getPolynomialOrder(method);
		expr = [
			'datum.coef[0]',
			...Array(order)
				.fill(0)
				.map((_e, i) => `datum.coef[${i + 1}] * pow(datum.${trendlineDimension}, ${i + 1})`),
		].join(' + ');
	} else if (method === 'exponential') {
		expr = `datum.coef[0] + exp(datum.coef[1] * datum.${trendlineDimension})`;
	} else if (method === 'logarithmic') {
		expr = `datum.coef[0] + datum.coef[1] * log(datum.${trendlineDimension})`;
	} else if (method === 'power') {
		expr = `datum.coef[0] * pow(datum.${trendlineDimension}, datum.coef[1])`;
	}

	if (!expr) return [];
	return [
		{
			type: 'formula',
			expr,
			as: TRENDLINE_VALUE,
		},
	];
};

/**
 * Gets the lookup transform that will be used to lookup the coef for regression trendlines
 * @param markOptions
 * @param trendlineOptions
 * @returns LookupTransform
 */
export const getTrendlineParamLookupTransform = (
	{ color, lineType }: TrendlineParentOptions,
	{ name }: TrendlineSpecOptions
): LookupTransform => {
	const { facets } = getFacetsFromOptions({ color, lineType });
	return {
		type: 'lookup',
		from: `${name}_params`,
		key: 'keys',
		fields: facets,
		values: ['coef'],
	};
};
