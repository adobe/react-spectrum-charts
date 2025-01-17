/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { createElement } from 'react';

import { Annotation } from '@components/Annotation';
import { Trendline } from '@components/Trendline';
import { DEFAULT_METRIC, DEFAULT_TIME_DIMENSION, FILTERED_TABLE, MS_PER_DAY, TRENDLINE_VALUE } from '@constants';

import { defaultLineProps } from './trendlineTestUtils';
import {
	applyTrendlinePropDefaults,
	getPolynomialOrder,
	getRegressionExtent,
	getTrendlineColorFromMarkProps,
	getTrendlineLineTypeFromMarkProps,
	getTrendlines,
} from './trendlineUtils';

describe('getTrendlines()', () => {
	test('should return an array of trendline props', () => {
		const children = [
			createElement(Annotation),
			createElement(Trendline, { method: 'average' }),
			createElement(Trendline, { method: 'linear' }),
		];
		const trendlines = getTrendlines({ ...defaultLineProps, children });
		expect(trendlines).toHaveLength(2);
		expect(trendlines[0]).toHaveProperty('method', 'average');
		expect(trendlines[1]).toHaveProperty('method', 'linear');
	});

	test('should return an empty array if there are not any trendline child elements', () => {
		const children = [createElement(Annotation)];
		const trendlines = getTrendlines({ ...defaultLineProps, children });
		expect(trendlines).toHaveLength(0);
	});
});

describe('applyTrendlinePropDefaults()', () => {
	test('should add defaults', () => {
		const props = applyTrendlinePropDefaults(defaultLineProps, {}, 0);
		expect(props).toHaveProperty('method', 'linear');
		expect(props).toHaveProperty('dimensionRange', [null, null]);
		expect(props).toHaveProperty('lineType', 'dashed');
		expect(props).toHaveProperty('lineWidth', 'M');
		expect(props).toHaveProperty('metric', TRENDLINE_VALUE);
		expect(props).toHaveProperty('trendlineColor', defaultLineProps.color);
	});
	test('should swap dimension and metric if orientation is vertical', () => {
		const props = applyTrendlinePropDefaults(defaultLineProps, { orientation: 'vertical' }, 0);
		expect(props).toHaveProperty('trendlineDimension', DEFAULT_METRIC);
		expect(props).toHaveProperty('trendlineMetric', DEFAULT_TIME_DIMENSION);
	});
	test('should use color from trendline if defined', () => {
		const props = applyTrendlinePropDefaults(defaultLineProps, { color: 'gray-700' }, 0);
		expect(props).toHaveProperty('trendlineColor', { value: 'gray-700' });
	test('should use series color if static color is not provided', () => {
		const marks = getTrendlineMarks(defaultLineProps);
		expect(marks[0].marks?.[0].encode?.enter?.stroke).toEqual({ field: 'series', scale: 'color' });
	});
	test('should use static color if provided', () => {
		const marks = getTrendlineMarks({
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'average', color: 'gray-500' })],
		});
		expect(marks[0].marks?.[0].encode?.enter?.stroke).toEqual({ value: 'rgb(144, 144, 144)' });
	});
	test('should add hover marks if ChartTooltip exists on Trendline', () => {
		const marks = getTrendlineMarks({
			...defaultLineProps,
			children: [createElement(Trendline, {}, createElement(ChartTooltip))],
		});
		expect(marks).toHaveLength(2);
		expect(marks[1]).toHaveProperty('type', 'group');
		// line mark
		expect(marks[1].marks).toHaveLength(5);
		expect(marks[1].marks?.[0]).toHaveProperty('type', 'rule');
		expect(marks[1].marks?.[1]).toHaveProperty('type', 'symbol');
		expect(marks[1].marks?.[2]).toHaveProperty('type', 'symbol');
		expect(marks[1].marks?.[3]).toHaveProperty('type', 'symbol'); // highlight point background
		expect(marks[1].marks?.[4]).toHaveProperty('type', 'path');
	});
	test('should reference _data for average method', () => {
		const marks = getTrendlineMarks(defaultLineProps);
		expect(
			(
				marks[0].from as From & {
					facet: Facet;
				}
			).facet.data
		).toEqual('line0Trendline0_data');
	});
	test('should reference _highResolutionData for average method', () => {
		const marks = getTrendlineMarks({
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'linear' })],
		});
		expect(
			(
				marks[0].from as From & {
					facet: Facet;
				}
			).facet.data
		).toEqual('line0Trendline0_highResolutionData');
	});
});

describe('addTrendlineData()', () => {
	test('should add normalized dimension for regression trendline', () => {
		const trendlineData = getDefaultData();
		addTrendlineData(trendlineData, {
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'linear' })],
		});
		expect(trendlineData[0].transform).toHaveLength(3);
		expect(trendlineData[0].transform?.[1]).toStrictEqual({
			as: ['datetimeMin'],
			fields: ['datetime'],
			ops: ['min'],
			type: 'joinaggregate',
		});
		expect(trendlineData[0].transform?.[2]).toStrictEqual({
			as: 'datetimeNormalized',
			expr: `(datum.datetime - datum.datetimeMin + ${MS_PER_DAY}) / ${MS_PER_DAY}`,
			type: 'formula',
		});
	});

	test('should not add normalized dimension in not regression trendline', () => {
		const trendlineData = getDefaultData();
		addTrendlineData(trendlineData, defaultLineProps);
		expect(trendlineData[0].transform).toHaveLength(1);
	});

	test('should add datasource for trendline', () => {
		const trendlineData = getDefaultData();
		expect(trendlineData).toHaveLength(4);
		addTrendlineData(trendlineData, defaultLineProps);
		expect(trendlineData).toHaveLength(4);
		expect(trendlineData[3]).toStrictEqual({
			name: 'line0Trendline0_data',
			source: FILTERED_TABLE,
			transform: [
				{
					type: 'collect',
					sort: {
						field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
					},
				},
				{
					as: [TRENDLINE_VALUE],
					fields: ['value'],
					groupby: ['series'],
					ops: ['mean'],
					type: 'joinaggregate',
				},
			],
		});
	});

	test('should add data sources for hover interactiontions if ChartTooltip exists', () => {
		const trendlineData = getDefaultData();
		addTrendlineData(trendlineData, {
			...defaultLineProps,
			children: [createElement(Trendline, {}, createElement(ChartTooltip))],
		});
		expect(trendlineData).toHaveLength(9);
		expect(trendlineData[6]).toHaveProperty('name', 'line0_allTrendlineData');
		expect(trendlineData[7]).toHaveProperty('name', 'line0Trendline_highlightedData');
	});

	test('should add _highResolutionData if doing a regression method', () => {
		const trendlineData = getDefaultData();

		addTrendlineData(trendlineData, {
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'linear' })],
		});
		expect(trendlineData).toHaveLength(5);
		expect(trendlineData[3]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
	});

	test('should add _params and _data if doing a regression method and there is a tooltip on the trendline', () => {
		const trendlineData = getDefaultData();

		addTrendlineData(trendlineData, {
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'linear' }, createElement(ChartTooltip))],
		});
		expect(trendlineData).toHaveLength(9);
		expect(trendlineData[4]).toHaveProperty('name', 'line0Trendline0_params');
		expect(trendlineData[5]).toHaveProperty('name', 'line0Trendline0_data');
	});

	test('should add sort transform, then window trandform, and then dimension range filter transform for movingAverage', () => {
		const trendlineData = getDefaultData();
		addTrendlineData(trendlineData, {
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'movingAverage-3', dimensionRange: [1, 2] })],
		});
		expect(trendlineData).toHaveLength(5);
		expect(trendlineData[3]).toHaveProperty('name', 'line0Trendline0_data');
		expect(trendlineData[3].transform).toHaveLength(3);
		expect(trendlineData[3].transform?.[0]).toHaveProperty('type', 'collect');
		expect(trendlineData[3].transform?.[1]).toHaveProperty('type', 'window');
		expect(trendlineData[3].transform?.[2]).toHaveProperty('type', 'filter');
	});
});

describe('getTrendlineDimensionRangeTransforms()', () => {
	test('should add filters if the dimensionRange has non-null values', () => {
		const transforms = getTrendlineDimensionRangeTransforms(DEFAULT_TIME_DIMENSION, [1, 2]);
		expect(transforms).toHaveLength(1);
		expect(transforms[0].expr.split(' && ')).toHaveLength(2);
		expect(transforms).toStrictEqual([
			{
				type: 'filter',
				expr: `datum.${DEFAULT_TIME_DIMENSION} >= 1 && datum.${DEFAULT_TIME_DIMENSION} <= 2`,
			},
		]);
		expect(
			getTrendlineDimensionRangeTransforms(DEFAULT_TIME_DIMENSION, [null, 2])[0].expr.split(' && ')
		).toHaveLength(1);
		expect(
			getTrendlineDimensionRangeTransforms(DEFAULT_TIME_DIMENSION, [1, null])[0].expr.split(' && ')
		).toHaveLength(1);
		expect(getTrendlineDimensionRangeTransforms(DEFAULT_TIME_DIMENSION, [null, null])).toHaveLength(0);
	});
});

describe('getTrendlineParamFormulaTransforms()', () => {
	test('should return the correct formula for each polynomial method', () => {
		expect(getTrendlineParamFormulaTransforms('x', 'linear', 'linear')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'quadratic', 'linear')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1) + datum.coef[2] * pow(datum.x, 2)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'polynomial-1', 'linear')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'polynomial-2', 'linear')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1) + datum.coef[2] * pow(datum.x, 2)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'polynomial-3', 'linear')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1) + datum.coef[2] * pow(datum.x, 2) + datum.coef[3] * pow(datum.x, 3)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'polynomial-8', 'linear')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1) + datum.coef[2] * pow(datum.x, 2) + datum.coef[3] * pow(datum.x, 3) + datum.coef[4] * pow(datum.x, 4) + datum.coef[5] * pow(datum.x, 5) + datum.coef[6] * pow(datum.x, 6) + datum.coef[7] * pow(datum.x, 7) + datum.coef[8] * pow(datum.x, 8)'
		);
	});
	test('should return the correct formula for other non-polynomial regression methods', () => {
		expect(getTrendlineParamFormulaTransforms('x', 'exponential', 'linear')[0].expr).toEqual(
			'datum.coef[0] + exp(datum.coef[1] * datum.x)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'logarithmic', 'linear')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * log(datum.x)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'power', 'linear')[0].expr).toEqual(
			'datum.coef[0] * pow(datum.x, datum.coef[1])'
		);
	});
	test('should use normalized dimension for time scaleType', () => {
		expect(getTrendlineParamFormulaTransforms('x', 'exponential', 'time')[0].expr).toEqual(
			'datum.coef[0] + exp(datum.coef[1] * datum.xNormalized)'
		);
	});
});

describe('getAggregateTransform()', () => {
	test('should return the correct method', () => {
		expect(getAggregateTransform(defaultLineProps, 'average')).toHaveProperty('ops', ['mean']);
		expect(getAggregateTransform(defaultLineProps, 'median')).toHaveProperty('ops', ['median']);
	});
});

describe('getRegressionTransform()', () => {
	test('should return the correct regression method', () => {
		expect(getRegressionTransform(defaultLineProps, 'exponential', false)).toHaveProperty('method', 'exp');
		expect(getRegressionTransform(defaultLineProps, 'logarithmic', false)).toHaveProperty('method', 'log');
		expect(getRegressionTransform(defaultLineProps, 'power', false)).toHaveProperty('method', 'pow');
		expect(getRegressionTransform(defaultLineProps, 'linear', false)).toHaveProperty('method', 'poly');
		expect(getRegressionTransform(defaultLineProps, 'quadratic', false)).toHaveProperty('method', 'poly');
		expect(getRegressionTransform(defaultLineProps, 'polynomial-4', false)).toHaveProperty('method', 'poly');
		expect(getRegressionTransform(defaultLineProps, 'polynomial-25', false)).toHaveProperty('method', 'poly');
	});
	test('should return the correct order for polynomials', () => {
		expect(getRegressionTransform(defaultLineProps, 'linear', false)).toHaveProperty('order', 1);
		expect(getRegressionTransform(defaultLineProps, 'quadratic', false)).toHaveProperty('order', 2);
		expect(getRegressionTransform(defaultLineProps, 'polynomial-4', false)).toHaveProperty('order', 4);
		expect(getRegressionTransform(defaultLineProps, 'polynomial-25', false)).toHaveProperty('order', 25);
		expect(getRegressionTransform(defaultLineProps, 'power', false).order).toBeUndefined();
	});
	test('should use ${dimension}Normalized as ouput dimension if scaleType is time', () => {
		const transform = getRegressionTransform(
			{ ...defaultLineProps, dimension: 'x', scaleType: 'time' },
			'linear',
			false
		);
		expect(transform.as).toHaveLength(2);
		expect(transform.as).toEqual(['xNormalized', TRENDLINE_VALUE]);
	});
	test('should have params on transform and no `as` property when params is true', () => {
		const transform = getRegressionTransform(defaultLineProps, 'linear', true);
		expect(transform.as).toBeUndefined();
		expect(transform).toHaveProperty('params', true);
	});
});

describe('getPolynomialOrder()', () => {
	test('should trow error if the polynomial order is less than 1', () => {
		expect(() => getPolynomialOrder('polynomial-0')).toThrowError();
	});
});

describe('getRegressionExtent()', () => {
	test('should the correct extent based on extent value', () => {
		const name = 'line0Trendline0';
		expect(getRegressionExtent([1, 2], name, false)).toHaveProperty('signal', '[1, 2]');
		expect(getRegressionExtent([1, 2], name, true)).toHaveProperty(
			'signal',
			`[(1 - data('${FILTERED_TABLE}')[0].datetimeMin + ${MS_PER_DAY}) / ${MS_PER_DAY}, (2 - data('${FILTERED_TABLE}')[0].datetimeMin + ${MS_PER_DAY}) / ${MS_PER_DAY}]`
		);
		expect(getRegressionExtent([null, null], name, false)).toHaveProperty(
			'signal',
			`[${name}_extent[0], ${name}_extent[1]]`
		);
		expect(getRegressionExtent(['domain', 'domain'], name, false)).toHaveProperty(
			'signal',
			`[${name}_extent[0] - (${name}_extent[1] - ${name}_extent[0]) * 0.3, ${name}_extent[1] + (${name}_extent[1] - ${name}_extent[0]) * 0.3]`
		);
	});
});

describe('getTrendlineColorFromMarkProps()', () => {
	test('should return first facet if dual facet', () => {
		expect(getTrendlineColorFromMarkProps(['series', 'subSeries'])).toEqual('series');
	});

	test('should return what was passed in if it is not a dual facet', () => {
		expect(getTrendlineColorFromMarkProps('series')).toEqual('series');
		expect(getTrendlineColorFromMarkProps({ value: 'red-500' })).toEqual({ value: 'red-500' });
	});
});

describe('getTrendlineLineTypeFromMarkProps()', () => {
	test('should return first facet if dual facet', () => {
		expect(getTrendlineLineTypeFromMarkProps(['series', 'subSeries'])).toEqual('series');
	});

	test('should return what was passed in if it is not a dual facet', () => {
		expect(getTrendlineLineTypeFromMarkProps('series')).toEqual('series');
		expect(getTrendlineLineTypeFromMarkProps({ value: 'dashed' })).toEqual({ value: 'dashed' });
	});
});
