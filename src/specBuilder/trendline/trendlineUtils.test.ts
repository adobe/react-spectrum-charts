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
