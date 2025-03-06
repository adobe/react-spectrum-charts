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
import { DEFAULT_METRIC, DEFAULT_TIME_DIMENSION, FILTERED_TABLE, MS_PER_DAY, TRENDLINE_VALUE } from '../../constants';
import { defaultLineOptions } from './trendlineTestUtils';
import {
	applyTrendlinePropDefaults,
	getPolynomialOrder,
	getRegressionExtent,
	getTrendlineColorFromMarkOptions,
	getTrendlineLineTypeFromMarkOptions,
	getTrendlines,
} from './trendlineUtils';

describe('getTrendlines()', () => {
	test('should return an array of trendline options', () => {
		const trendlines = getTrendlines({
			...defaultLineOptions,
			trendlines: [{ method: 'average' }, { method: 'linear' }],
		});
		expect(trendlines).toHaveLength(2);
		expect(trendlines[0]).toHaveProperty('method', 'average');
		expect(trendlines[1]).toHaveProperty('method', 'linear');
	});

	test('should return an empty array if there are not any trendlines', () => {
		const trendlines = getTrendlines({ ...defaultLineOptions, trendlines: [] });
		expect(trendlines).toHaveLength(0);
	});
});

describe('applyTrendlinePropDefaults()', () => {
	test('should add defaults', () => {
		const options = applyTrendlinePropDefaults(defaultLineOptions, {}, 0);
		expect(options).toHaveProperty('method', 'linear');
		expect(options).toHaveProperty('dimensionRange', [null, null]);
		expect(options).toHaveProperty('lineType', 'dashed');
		expect(options).toHaveProperty('lineWidth', 'M');
		expect(options).toHaveProperty('metric', TRENDLINE_VALUE);
		expect(options).toHaveProperty('trendlineColor', defaultLineOptions.color);
	});
	test('should swap dimension and metric if orientation is vertical', () => {
		const options = applyTrendlinePropDefaults(defaultLineOptions, { orientation: 'vertical' }, 0);
		expect(options).toHaveProperty('trendlineDimension', DEFAULT_METRIC);
		expect(options).toHaveProperty('trendlineMetric', DEFAULT_TIME_DIMENSION);
	});
	test('should use color from trendline if defined', () => {
		const options = applyTrendlinePropDefaults(defaultLineOptions, { color: 'gray-700' }, 0);
		expect(options).toHaveProperty('trendlineColor', { value: 'gray-700' });
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

describe('getTrendlineColorFromMarkOptions()', () => {
	test('should return first facet if dual facet', () => {
		expect(getTrendlineColorFromMarkOptions(['series', 'subSeries'])).toEqual('series');
	});

	test('should return what was passed in if it is not a dual facet', () => {
		expect(getTrendlineColorFromMarkOptions('series')).toEqual('series');
		expect(getTrendlineColorFromMarkOptions({ value: 'red-500' })).toEqual({ value: 'red-500' });
	});
});

describe('getTrendlineLineTypeFromMarkOptions()', () => {
	test('should return first facet if dual facet', () => {
		expect(getTrendlineLineTypeFromMarkOptions(['series', 'subSeries'])).toEqual('series');
	});

	test('should return what was passed in if it is not a dual facet', () => {
		expect(getTrendlineLineTypeFromMarkOptions('series')).toEqual('series');
		expect(getTrendlineLineTypeFromMarkOptions({ value: 'dashed' })).toEqual({ value: 'dashed' });
	});
});
