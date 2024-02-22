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

import { DEFAULT_TIME_DIMENSION, TRENDLINE_VALUE } from '@constants';
import {
	getAggregateTransform,
	getRegressionTransform,
	getTrendlineDimensionRangeTransforms,
	getTrendlineParamFormulaTransforms,
	getWindowTransform,
} from './trendlineDataTransformUtils';
import { defaultLineProps, defaultTrendlineProps } from './trendlineTestUtils';

describe('getAggregateTransform()', () => {
	test('should return the correct method', () => {
		expect(
			getAggregateTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'average' }, false),
		).toHaveProperty('ops', ['mean']);
		expect(
			getAggregateTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'median' }, false),
		).toHaveProperty('ops', ['median']);
	});
});

describe('getRegressionTransform()', () => {
	test('should return the correct regression method', () => {
		expect(
			getRegressionTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'exponential' }, false),
		).toHaveProperty('method', 'exp');
		expect(
			getRegressionTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'logarithmic' }, false),
		).toHaveProperty('method', 'log');
		expect(
			getRegressionTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'power' }, false),
		).toHaveProperty('method', 'pow');
		expect(
			getRegressionTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'linear' }, false),
		).toHaveProperty('method', 'poly');
		expect(
			getRegressionTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'quadratic' }, false),
		).toHaveProperty('method', 'poly');
		expect(
			getRegressionTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'polynomial-4' }, false),
		).toHaveProperty('method', 'poly');
		expect(
			getRegressionTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'polynomial-25' }, false),
		).toHaveProperty('method', 'poly');
	});
	test('should return the correct order for polynomials', () => {
		expect(
			getRegressionTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'linear' }, false),
		).toHaveProperty('order', 1);
		expect(
			getRegressionTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'quadratic' }, false),
		).toHaveProperty('order', 2);
		expect(
			getRegressionTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'polynomial-4' }, false),
		).toHaveProperty('order', 4);
		expect(
			getRegressionTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'polynomial-25' }, false),
		).toHaveProperty('order', 25);
		expect(
			getRegressionTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'power' }, false).order,
		).toBeUndefined();
	});
	test('should use ${dimension}Normalized as ouput dimension if scaleType is time', () => {
		const transform = getRegressionTransform(
			{ ...defaultLineProps, dimension: 'x', scaleType: 'time' },
			{ ...defaultTrendlineProps, method: 'linear' },
			true,
		);
		expect(transform.as).toHaveLength(2);
		expect(transform.as).toEqual(['xNormalized', TRENDLINE_VALUE]);
	});
	test('should have params on transform and no `as` property when isHighResolutionData is false', () => {
		const transform = getRegressionTransform(
			defaultLineProps,
			{ ...defaultTrendlineProps, method: 'linear' },
			false,
		);
		expect(transform.as).toBeUndefined();
		expect(transform).toHaveProperty('params', true);
	});
});

describe('getWindowTransform()', () => {
	test('should return a window transform with the correct frame', () => {
		const transform = getWindowTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'movingAverage-7' });
		expect(transform).toHaveProperty('type', 'window');
		expect(transform).toHaveProperty('frame', [6, 0]);
	});
	test('should throw error if the method is not of form "moveingAverage-${number}"', () => {
		expect(() => getWindowTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'linear' })).toThrow(
			'Invalid moving average frame width: NaN, frame width must be an integer greater than 0',
		);
		expect(() =>
			getWindowTransform(defaultLineProps, { ...defaultTrendlineProps, method: 'movingAverage-0' }),
		).toThrow('Invalid moving average frame width: 0, frame width must be an integer greater than 0');
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
			getTrendlineDimensionRangeTransforms(DEFAULT_TIME_DIMENSION, [null, 2])[0].expr.split(' && '),
		).toHaveLength(1);
		expect(
			getTrendlineDimensionRangeTransforms(DEFAULT_TIME_DIMENSION, [1, null])[0].expr.split(' && '),
		).toHaveLength(1);
		expect(getTrendlineDimensionRangeTransforms(DEFAULT_TIME_DIMENSION, [null, null])).toHaveLength(0);
	});
});

describe('getTrendlineParamFormulaTransforms()', () => {
	test('should return the correct formula for each polynomial method', () => {
		expect(getTrendlineParamFormulaTransforms('x', 'linear')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1)',
		);
		expect(getTrendlineParamFormulaTransforms('x', 'quadratic')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1) + datum.coef[2] * pow(datum.x, 2)',
		);
		expect(getTrendlineParamFormulaTransforms('x', 'polynomial-1')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1)',
		);
		expect(getTrendlineParamFormulaTransforms('x', 'polynomial-2')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1) + datum.coef[2] * pow(datum.x, 2)',
		);
		expect(getTrendlineParamFormulaTransforms('x', 'polynomial-3')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1) + datum.coef[2] * pow(datum.x, 2) + datum.coef[3] * pow(datum.x, 3)',
		);
		expect(getTrendlineParamFormulaTransforms('x', 'polynomial-8')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * pow(datum.x, 1) + datum.coef[2] * pow(datum.x, 2) + datum.coef[3] * pow(datum.x, 3) + datum.coef[4] * pow(datum.x, 4) + datum.coef[5] * pow(datum.x, 5) + datum.coef[6] * pow(datum.x, 6) + datum.coef[7] * pow(datum.x, 7) + datum.coef[8] * pow(datum.x, 8)',
		);
	});
	test('should return the correct formula for other non-polynomial regression methods', () => {
		expect(getTrendlineParamFormulaTransforms('x', 'exponential')[0].expr).toEqual(
			'datum.coef[0] + exp(datum.coef[1] * datum.x)',
		);
		expect(getTrendlineParamFormulaTransforms('x', 'logarithmic')[0].expr).toEqual(
			'datum.coef[0] + datum.coef[1] * log(datum.x)',
		);
		expect(getTrendlineParamFormulaTransforms('x', 'power')[0].expr).toEqual(
			'datum.coef[0] * pow(datum.x, datum.coef[1])',
		);
	});
});
