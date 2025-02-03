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
import { DonutSummarySpecOptions } from '../../types';
import {
	getBooleanDonutSummaryGroupMark,
	getDonutSummaryData,
	getDonutSummaryGroupMark,
	getDonutSummaryScales,
	getDonutSummarySignals,
	getSummaryValueBaseline,
	getSummaryValueLimit,
	getSummaryValueText,
} from './donutSummaryUtils';
import { defaultDonutOptions } from './donutTestUtils';

const defaultDonutSummaryOptions: DonutSummarySpecOptions = {
	donutOptions: defaultDonutOptions,
	label: 'Visitors',
	numberFormat: 'shortNumber',
};

describe('getDonutSummaryData()', () => {
	test('should return empty array if there is not a DonutSummary on the Donut', () => {
		const data = getDonutSummaryData(defaultDonutOptions);
		expect(data).toHaveLength(0);
	});

	test('should return summary data if there is a DonutSummary on the Donut', () => {
		const data = getDonutSummaryData({
			...defaultDonutOptions,
			donutSummaries: [{ label: 'Visitors' }],
		});
		expect(data).toHaveLength(1);
		expect(data[0].name).toEqual('testName_summaryData');
	});
});

describe('getDonutSummaryScales()', () => {
	test('should return empty array if there is not a DonutSummary on the Donut', () => {
		const scales = getDonutSummaryScales(defaultDonutOptions);
		expect(scales).toHaveLength(0);
	});

	test('should return summary font size scale if there is a DonutSummary on the Donut', () => {
		const scales = getDonutSummaryScales({
			...defaultDonutOptions,
			donutSummaries: [{ label: 'Visitors' }],
		});
		expect(scales).toHaveLength(1);
		expect(scales[0].name).toEqual('testName_summaryFontSizeScale');
	});
});

describe('getDonutSummarySignals()', () => {
	test('should return empty array if there is not a DonutSummary on the Donut', () => {
		const signals = getDonutSummarySignals(defaultDonutOptions);
		expect(signals).toHaveLength(0);
	});

	test('should return summary font size scale if there is a DonutSummary on the Donut', () => {
		const signals = getDonutSummarySignals({
			...defaultDonutOptions,
			donutSummaries: [{ label: 'Visitors' }],
		});
		expect(signals).toHaveLength(1);
		expect(signals[0].name).toEqual('testName_summaryFontSize');
	});
});

describe('getDonutSummaryGroupMark()', () => {
	test('should return a single mark if label is undefined', () => {
		const groupMark = getDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, label: undefined });
		expect(groupMark.marks).toHaveLength(1);
		expect(groupMark.marks?.[0].name).toEqual('testName_summaryValue');
	});

	test('should return a metric label if label is defined', () => {
		const groupMark = getDonutSummaryGroupMark(defaultDonutSummaryOptions);
		expect(groupMark.marks).toHaveLength(2);
		expect(groupMark.marks?.[1].name).toEqual('testName_summaryLabel');
	});
});

describe('getBooleanDonutSummaryGroupMark()', () => {
	test('should return a single mark if label is undefined', () => {
		const groupMark = getBooleanDonutSummaryGroupMark({ ...defaultDonutSummaryOptions, label: undefined });
		expect(groupMark.marks).toHaveLength(1);
		expect(groupMark.marks?.[0].name).toEqual('testName_booleanSummaryValue');
	});

	test('should return a metric label if label is defined', () => {
		const groupMark = getBooleanDonutSummaryGroupMark(defaultDonutSummaryOptions);
		expect(groupMark.marks).toHaveLength(2);
		expect(groupMark.marks?.[1].name).toEqual('testName_booleanSummaryLabel');
	});
});

describe('getSummaryValueText()', () => {
	test('should return the correct text for boolean metric', () => {
		const result = getSummaryValueText({
			...defaultDonutSummaryOptions,
			donutOptions: { ...defaultDonutOptions, isBoolean: true },
		});
		expect(result).toEqual({ signal: `format(datum['testMetric'], '.0%')` });
	});

	test('should return the correct text for non-boolean metric', () => {
		const result = getSummaryValueText(defaultDonutSummaryOptions);
		expect(result).toEqual([
			{
				signal: "upper(replace(format(datum['sum'], '.3~s'), /(\\d+)G/, '$1B'))",
				test: "isNumber(datum['sum']) && abs(datum['sum']) >= 1000",
			},
			{ field: 'sum' },
		]);
	});
});

describe('getSummaryValueBaseline()', () => {
	test('should return alphabetic if label is truthy', () => {
		const baseline = getSummaryValueBaseline('Visitors');
		expect(baseline).toHaveProperty('value', 'alphabetic');
	});

	test('should return middle if label is falsey', () => {
		const baseline = getSummaryValueBaseline(undefined);
		expect(baseline).toHaveProperty('value', 'middle');
	});
});

describe('getSummaryValueLimit()', () => {
	test('should use full font size in signal if label is truthy', () => {
		expect(getSummaryValueLimit({ ...defaultDonutSummaryOptions, label: 'Visitors' })).toEqual({
			signal: '2 * sqrt(pow((min(width, height) / 2 - 2) * 0.85, 2) - pow(testName_summaryFontSize, 2))',
		});
	});

	test('should use 1/2 font size in signal if label is falsey', () => {
		expect(getSummaryValueLimit({ ...defaultDonutSummaryOptions, label: '' })).toEqual({
			signal: '2 * sqrt(pow((min(width, height) / 2 - 2) * 0.85, 2) - pow(testName_summaryFontSize * 0.5, 2))',
		});
	});
});
