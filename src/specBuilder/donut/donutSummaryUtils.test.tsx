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
import { DonutSummary } from '@rsc/alpha';

import { DonutSummarySpecProps } from '../../types';
import {
	getBooleanDonutSummaryGroupMark,
	getDonutSummaryData,
	getDonutSummaryGroupMark,
	getDonutSummaryScales,
	getDonutSummarySignals,
	getSummaryValueText,
} from './donutSummaryUtils';
import { defaultDonutProps } from './donutTestUtils';

const defaultDonutSummaryProps: DonutSummarySpecProps = {
	donutProps: defaultDonutProps,
	label: 'Visitors',
	numberFormat: 'shortNumber',
};

describe('getDonutSummaryData()', () => {
	test('should return empty array if there is not a DonutSummary on the Donut', () => {
		const data = getDonutSummaryData(defaultDonutProps);
		expect(data).toHaveLength(0);
	});

	test('should return summary data if there is a DonutSummary on the Donut', () => {
		const data = getDonutSummaryData({
			...defaultDonutProps,
			children: [<DonutSummary key={0} label="Visitors" />],
		});
		expect(data).toHaveLength(1);
		expect(data[0].name).toEqual('testName_summaryData');
	});
});

describe('getDonutSummaryScales()', () => {
	test('should return empty array if there is not a DonutSummary on the Donut', () => {
		const scales = getDonutSummaryScales(defaultDonutProps);
		expect(scales).toHaveLength(0);
	});

	test('should return summary font size scale if there is a DonutSummary on the Donut', () => {
		const scales = getDonutSummaryScales({
			...defaultDonutProps,
			children: [<DonutSummary key={0} label="Visitors" />],
		});
		expect(scales).toHaveLength(1);
		expect(scales[0].name).toEqual('testName_summaryFontSizeScale');
	});
});

describe('getDonutSummarySignals()', () => {
	test('should return empty array if there is not a DonutSummary on the Donut', () => {
		const signals = getDonutSummarySignals(defaultDonutProps);
		expect(signals).toHaveLength(0);
	});

	test('should return summary font size scale if there is a DonutSummary on the Donut', () => {
		const signals = getDonutSummarySignals({
			...defaultDonutProps,
			children: [<DonutSummary key={0} label="Visitors" />],
		});
		expect(signals).toHaveLength(1);
		expect(signals[0].name).toEqual('testName_summaryFontSize');
	});
});

describe('getDonutSummaryGroupMark()', () => {
	test('should return a single mark if label is undefined', () => {
		const groupMark = getDonutSummaryGroupMark({ ...defaultDonutSummaryProps, label: undefined });
		expect(groupMark.marks).toHaveLength(1);
		expect(groupMark.marks?.[0].name).toEqual('testName_summaryValue');
	});

	test('should return a metric label if label is defined', () => {
		const groupMark = getDonutSummaryGroupMark(defaultDonutSummaryProps);
		expect(groupMark.marks).toHaveLength(2);
		expect(groupMark.marks?.[1].name).toEqual('testName_summaryLabel');
	});
});

describe('getBooleanDonutSummaryGroupMark()', () => {
	test('should return a single mark if label is undefined', () => {
		const groupMark = getBooleanDonutSummaryGroupMark({ ...defaultDonutSummaryProps, label: undefined });
		expect(groupMark.marks).toHaveLength(1);
		expect(groupMark.marks?.[0].name).toEqual('testName_booleanSummaryValue');
	});

	test('should return a metric label if label is defined', () => {
		const groupMark = getBooleanDonutSummaryGroupMark(defaultDonutSummaryProps);
		expect(groupMark.marks).toHaveLength(2);
		expect(groupMark.marks?.[1].name).toEqual('testName_booleanSummaryLabel');
	});
});

describe('getSummaryValueText()', () => {
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
