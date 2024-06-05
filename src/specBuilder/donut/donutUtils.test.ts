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
import { defaultDonutProps } from './donutTestUtils';
import {
	fontBreakpoints,
	getAggregateMetricBaseline,
	getAggregateMetricMark,
	getMetricNumberText,
	getPercentMetricMark,
} from './donutUtils';

describe('getAggregateMetricMark()', () => {
	test('should return a single mark if metricLabel is undefined', () => {
		const groupMark = getAggregateMetricMark({ ...defaultDonutProps, metricLabel: undefined });
		expect(groupMark.marks).toHaveLength(1);
		expect(groupMark.marks![0].name).toEqual('testName_aggregateMetricNumber');
	});

	test('should return a metric label if metricLabel is defined', () => {
		const groupMark = getAggregateMetricMark(defaultDonutProps);
		expect(groupMark.marks).toHaveLength(2);
		expect(groupMark.marks![1].name).toEqual('testName_aggregateMetricLabel');
	});
});

describe('getPercentMetricMark()', () => {
	test('should return a single mark if metricLabel is undefined', () => {
		const groupMark = getPercentMetricMark({ ...defaultDonutProps, metricLabel: undefined });
		expect(groupMark.marks).toHaveLength(1);
		expect(groupMark.marks![0].name).toEqual('testName_percentMetricNumber');
	});

	test('should return a metric label if metricLabel is defined', () => {
		const groupMark = getPercentMetricMark(defaultDonutProps);
		expect(groupMark.marks).toHaveLength(2);
		expect(groupMark.marks![1].name).toEqual('testName_percentMetricLabel');
	});
});

describe('getMetricNumberText()', () => {
	test('should return the correct text for boolean metric', () => {
		const result = getMetricNumberText({ ...defaultDonutProps, isBoolean: true });
		expect(result).toEqual({ signal: `format(datum['testMetric'], '.0%')` });
	});

	test('should return the correct text for non-boolean metric', () => {
		const result = getMetricNumberText(defaultDonutProps);
		expect(result).toEqual([
			{
				signal: "upper(replace(format(datum['sum'], '.3~s'), /(\\d+)G/, '$1B'))",
				test: "isNumber(datum['sum']) && abs(datum['sum']) >= 1000",
			},
			{ field: 'sum' },
		]);
	});
});

describe('getAggregateMetricBaseline()', () => {
	test('should return middle when showingLabel is false', () => {
		const result = getAggregateMetricBaseline('min(width, height) / 2', 0.85, false);
		expect(result).toEqual({ signal: 'middle' });
	});

	test('should return an if for vega to resolve if showing label', () => {
		const result = getAggregateMetricBaseline('min(width, height) / 2', 0.85, true);
		expect(result).toEqual({
			signal: `min(width, height) / 2 * 0.85 > ${fontBreakpoints[2]} ? 'alphabetic' : 'middle'`,
		});
	});
});
