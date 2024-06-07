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
import { DonutSummarySpecProps } from '../../types';
import { getDonutSummaryGroupMark, getSummaryValueText, getBooleanDonutSummaryGroupMark } from './donutSummaryUtils';
import { defaultDonutProps } from './donutTestUtils';

const defaultDonutSummaryProps: DonutSummarySpecProps = {
	donutProps: defaultDonutProps,
	label: 'Visitors',
	numberFormat: 'shortNumber',
};

describe('getAggregateMetricMark()', () => {
	test('should return a single mark if label is undefined', () => {
		const groupMark = getDonutSummaryGroupMark({ ...defaultDonutSummaryProps, label: undefined });
		expect(groupMark.marks).toHaveLength(1);
		expect(groupMark.marks?.[0].name).toEqual('testName_aggregateMetricNumber');
	});

	test('should return a metric label if label is defined', () => {
		const groupMark = getDonutSummaryGroupMark(defaultDonutSummaryProps);
		expect(groupMark.marks).toHaveLength(2);
		expect(groupMark.marks?.[1].name).toEqual('testName_aggregateMetricLabel');
	});
});

describe('getPercentMetricMark()', () => {
	test('should return a single mark if label is undefined', () => {
		const groupMark = getBooleanDonutSummaryGroupMark({ ...defaultDonutSummaryProps, label: undefined });
		expect(groupMark.marks).toHaveLength(1);
		expect(groupMark.marks?.[0].name).toEqual('testName_percentMetricNumber');
	});

	test('should return a metric label if label is defined', () => {
		const groupMark = getBooleanDonutSummaryGroupMark(defaultDonutSummaryProps);
		expect(groupMark.marks).toHaveLength(2);
		expect(groupMark.marks?.[1].name).toEqual('testName_percentMetricLabel');
	});
});

describe('getMetricNumberText()', () => {
	test('should return the correct text for boolean metric', () => {
		const result = getSummaryValueText({
			...defaultDonutSummaryProps,
			donutProps: { ...defaultDonutProps, isBoolean: true },
		});
		expect(result).toEqual({ signal: `format(datum['testMetric'], '.0%')` });
	});

	test('should return the correct text for non-boolean metric', () => {
		const result = getSummaryValueText(defaultDonutSummaryProps);
		expect(result).toEqual([
			{
				signal: "upper(replace(format(datum['sum'], '.3~s'), /(\\d+)G/, '$1B'))",
				test: "isNumber(datum['sum']) && abs(datum['sum']) >= 1000",
			},
			{ field: 'sum' },
		]);
	});
});
