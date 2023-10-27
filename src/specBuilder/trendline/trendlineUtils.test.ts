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
import { ChartPopover } from '@components/ChartPopover';
import { ChartTooltip } from '@components/ChartTooltip';
import { Trendline } from '@components/Trendline';
import {
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_CONTINUOUS_DIMENSION,
	DEFAULT_METRIC,
	FILTERED_TABLE,
	TRENDLINE_VALUE,
} from '@constants';
import { LineSpecProps } from 'types';
import { Facet, From } from 'vega';

import {
	applyTrendlinePropDefaults,
	getMovingAverageTransform,
	getPolynomialOrder,
	getRegressionTransform,
	getTrendlineData,
	getTrendlineDimensionRangeTransforms,
	getTrendlineMarks,
	getTrendlineParamFormulaTransforms,
	getTrendlineSignals,
	getTrendlines,
} from './trendlineUtils';

const defaultLineProps: LineSpecProps = {
	children: [createElement(Trendline, { method: 'average' })],
	color: DEFAULT_COLOR,
	colorScheme: DEFAULT_COLOR_SCHEME,
	dimension: DEFAULT_CONTINUOUS_DIMENSION,
	index: 0,
	lineType: { value: 'solid' },
	metric: DEFAULT_METRIC,
	name: 'line0',
	opacity: { value: 1 },
	scaleType: 'time',
};

describe('getTrendlines()', () => {
	test('should return an array of trendline props', () => {
		const children = [
			createElement(Annotation),
			createElement(Trendline, { method: 'average' }),
			createElement(Trendline, { method: 'linear' }),
		];
		const trendlines = getTrendlines(children, 'line0');
		expect(trendlines).toHaveLength(2);
		expect(trendlines[0]).toHaveProperty('method', 'average');
		expect(trendlines[1]).toHaveProperty('method', 'linear');
	});

	test('should return an empty array if there are not any trendline child elements', () => {
		const children = [createElement(Annotation)];
		const trendlines = getTrendlines(children, 'line0');
		expect(trendlines).toHaveLength(0);
	});
});

describe('applyTrendlinePropDefaults()', () => {
	test('should add defaults', () => {
		const props = applyTrendlinePropDefaults({}, 'line0', 0);
		expect(props).toHaveProperty('method', 'linear');
		expect(props).toHaveProperty('dimensionRange', [null, null]);
		expect(props).toHaveProperty('lineType', 'dashed');
		expect(props).toHaveProperty('lineWidth', 'M');
		expect(props).toHaveProperty('metric', TRENDLINE_VALUE);
	});
});

describe('getTrendlineMarks()', () => {
	test('should return line mark', () => {
		const marks = getTrendlineMarks(defaultLineProps);
		// group mark
		expect(marks).toHaveLength(1);
		expect(marks[0]).toHaveProperty('type', 'group');
		// line mark
		expect(marks[0].marks).toHaveLength(1);
		expect(marks[0].marks?.[0]).toHaveProperty('type', 'line');
	});
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

describe('getTrendlineData()', () => {
	test('should return data source for trendline', () => {
		const trendlineData = getTrendlineData(defaultLineProps);
		expect(trendlineData).toStrictEqual([
			{
				name: 'line0Trendline0_data',
				source: FILTERED_TABLE,
				transform: [
					{
						as: [TRENDLINE_VALUE],
						fields: [DEFAULT_METRIC],
						groupby: [DEFAULT_COLOR],
						ops: ['mean'],
						type: 'joinaggregate',
					},
				],
			},
		]);
	});

	test('should add data sources for hover interactiontions if ChartTooltip exists', () => {
		const trendlineData = getTrendlineData({
			...defaultLineProps,
			children: [createElement(Trendline, {}, createElement(ChartTooltip))],
		});
		expect(trendlineData).toHaveLength(5);
		expect(trendlineData[3]).toHaveProperty('name', 'line0_allTrendlineData');
		expect(trendlineData[4]).toHaveProperty('name', 'line0Trendline_highlightedData');
	});

	test('should add _highResolutionData if doing a regression method', () => {
		const trendlineData = getTrendlineData({
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'linear' })],
		});
		expect(trendlineData).toHaveLength(1);
		expect(trendlineData[0]).toHaveProperty('name', 'line0Trendline0_highResolutionData');
	});

	test('should add _params and _data if doing a regression method and there is a tooltip on the trendline', () => {
		const trendlineData = getTrendlineData({
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'linear' }, createElement(ChartTooltip))],
		});
		expect(trendlineData).toHaveLength(5);
		expect(trendlineData[1]).toHaveProperty('name', 'line0Trendline0_params');
		expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline0_data');
	});

	test('should add window trandform and then dimension range filter transform for movingAverage', () => {
		const trendlineData = getTrendlineData({
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'movingAverage-3', dimensionRange: [1, 2] })],
		});
		expect(trendlineData).toHaveLength(1);
		expect(trendlineData[0]).toHaveProperty('name', 'line0Trendline0_data');
		expect(trendlineData[0].transform).toHaveLength(2);
		expect(trendlineData[0].transform?.[0]).toHaveProperty('type', 'window');
		expect(trendlineData[0].transform?.[1]).toHaveProperty('type', 'filter');
	});
});

describe('getTrendlineDimensionRangeTransforms()', () => {
	test('should add filters if the dimensionRange has non-null values', () => {
		const transforms = getTrendlineDimensionRangeTransforms(DEFAULT_CONTINUOUS_DIMENSION, [1, 2]);
		expect(transforms).toHaveLength(1);
		expect(transforms[0].expr.split(' && ')).toHaveLength(2);
		expect(transforms).toStrictEqual([
			{
				type: 'filter',
				expr: `datum.${DEFAULT_CONTINUOUS_DIMENSION} >= 1 && datum.${DEFAULT_CONTINUOUS_DIMENSION} <= 2`,
			},
		]);
		expect(
			getTrendlineDimensionRangeTransforms(DEFAULT_CONTINUOUS_DIMENSION, [null, 2])[0].expr.split(' && ')
		).toHaveLength(1);
		expect(
			getTrendlineDimensionRangeTransforms(DEFAULT_CONTINUOUS_DIMENSION, [1, null])[0].expr.split(' && ')
		).toHaveLength(1);
		expect(getTrendlineDimensionRangeTransforms(DEFAULT_CONTINUOUS_DIMENSION, [null, null])).toHaveLength(0);
	});
});

describe('getTrendlineParamFormulaTransforms()', () => {
	test('should return the correct formula for each polynomial method', () => {
		expect(getTrendlineParamFormulaTransforms('x', 'linear')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'quadratic')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1) + datum.coef[2] * pow(datum.x, 2)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'polynomial-1')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'polynomial-2')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1) + datum.coef[2] * pow(datum.x, 2)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'polynomial-3')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1) + datum.coef[2] * pow(datum.x, 2) + datum.coef[3] * pow(datum.x, 3)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'polynomial-8')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1) + datum.coef[2] * pow(datum.x, 2) + datum.coef[3] * pow(datum.x, 3) + datum.coef[4] * pow(datum.x, 4) + datum.coef[5] * pow(datum.x, 5) + datum.coef[6] * pow(datum.x, 6) + datum.coef[7] * pow(datum.x, 7) + datum.coef[8] * pow(datum.x, 8)'
		);
	});
	test('should return the correct formula for other non-polynomial regression methods', () => {
		expect(getTrendlineParamFormulaTransforms('x', 'exponential')[0].expr).toEqual(
			'datum.coef[0] + exp(datum.coef[1] * datum.x)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'logarithmic')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * log(datum.x)'
		);
		expect(getTrendlineParamFormulaTransforms('x', 'power')[0].expr).toEqual(
			'datum.coef[0] * pow(datum.x, datum.coef[1])'
		);
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
	test('should use datetime0 as ouput dimension if scaleType is time', () => {
		const transform = getRegressionTransform(
			{ ...defaultLineProps, dimension: 'x', scaleType: 'time' },
			'linear',
			false
		);
		expect(transform.as).toHaveLength(2);
		expect(transform.as).toEqual(['datetime0', TRENDLINE_VALUE]);
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

describe('getMovingAverageTransform()', () => {
	test('should return a window transform with the correct frame', () => {
		const transform = getMovingAverageTransform(defaultLineProps, 'movingAverage-7');
		expect(transform).toHaveProperty('type', 'window');
		expect(transform).toHaveProperty('frame', [6, 0]);
	});
	test('should throw error if the method is not of form "moveingAverage-${number}"', () => {
		expect(() => getMovingAverageTransform(defaultLineProps, 'linear')).toThrowError();
		expect(() => getMovingAverageTransform(defaultLineProps, 'movingAverage-0')).toThrowError();
	});
});

describe('getTrendlineSignals()', () => {
	test('should return voronoi hover signal if ChartTooltip exists', () => {
		const signals = getTrendlineSignals({
			...defaultLineProps,
			children: [createElement(Trendline, {}, createElement(ChartTooltip))],
		});
		expect(signals).toHaveLength(1);
		expect(signals[0]).toHaveProperty('name', 'line0Trendline_voronoiHoveredId');
	});

	test('should not return any signals if there is not a ChartTooltip', () => {
		const signals = getTrendlineSignals(defaultLineProps);
		expect(signals).toHaveLength(0);
	});

	test('should return voronoi selected signal if ChartPopover exists', () => {
		const signals = getTrendlineSignals({
			...defaultLineProps,
			children: [
				createElement(Trendline, {}, createElement(ChartTooltip)),
				createElement(Trendline, {}, createElement(ChartPopover)),
			],
		});
		expect(signals).toHaveLength(2);
		expect(signals[1]).toHaveProperty('name', 'line0Trendline_selectedId');
	});

	test('should not return selected signal if there is not a ChartPopover', () => {
		const signals = getTrendlineSignals({
			...defaultLineProps,
			children: [createElement(Trendline, {}, createElement(ChartTooltip))],
		});
		expect(signals).toHaveLength(1);
		expect(signals[0].name).not.toContain('selected');
	});
});
