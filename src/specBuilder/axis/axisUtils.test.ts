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
import { SubLabel } from '../../types';
import { defaultAxisProps, defaultXBaselineMark, defaultYBaselineMark } from './axisTestUtils';
import { getBaselineRule, getDefaultAxis, getSubLabelAxis } from './axisUtils';

describe('getBaselineRule', () => {
	describe('initial state', () => {
		test("position: 'bottom', baseline: true", () => {
			expect(getBaselineRule(0, 'bottom')).toStrictEqual(defaultXBaselineMark);
		});
		test("position: 'left', baseline: true", () => {
			expect(getBaselineRule(0, 'left')).toStrictEqual(defaultYBaselineMark);
		});
	});
	describe('baselineOffset', () => {
		test('should apply offset', () => {
			expect(getBaselineRule(1, 'bottom').encode?.update?.y).toHaveProperty('value', 1);
			expect(getBaselineRule(100, 'bottom').encode?.update?.y).toHaveProperty('value', 100);
			expect(getBaselineRule(-100, 'bottom').encode?.update?.y).toHaveProperty('value', -100);
		});
	});
});

describe('getDefaultAxis()', () => {
	test('tickMinStep: linear scale', () => {
		expect(
			getDefaultAxis(
				{
					baseline: false,
					baselineOffset: 0,
					children: [],
					colorScheme: 'light',
					granularity: 'day',
					grid: true,
					hideDefaultLabels: false,
					index: 0,
					labelAlign: 'center',
					labelFontWeight: 'normal',
					labelOrientation: 'horizontal',
					labels: [],
					name: 'axis0',
					numberFormat: 'shortNumber',
					position: 'left',
					scaleType: 'linear',
					subLabels: [],
					ticks: false,
					title: 'Users',
					tickMinStep: 5,
				},
				'yLinear'
			)
		).toStrictEqual({
			scale: 'yLinear',
			orient: 'left',
			grid: true,
			ticks: false,
			tickCount: {
				signal: 'clamp(ceil(height/100), 2, 10)',
			},
			tickMinStep: 5,
			title: 'Users',
			labels: true,
			labelAlign: 'right',
			labelAngle: 0,
			labelBaseline: 'middle',
			labelFontWeight: 'normal',
			labelOffset: undefined,
			labelPadding: undefined,
			encode: {
				labels: {
					update: {
						text: [
							{
								test: "isNumber(datum['value']) && abs(datum['value']) >= 1000",
								signal: "upper(replace(format(datum['value'], '.3~s'), /(\\d+)G/, '$1B'))",
							},
							{
								signal: 'datum.value',
							},
						],
					},
				},
			},
		});
	});
	test('tickMinStep: linear scale', () => {
		expect(
			getDefaultAxis(
				{
					baseline: false,
					baselineOffset: 0,
					colorScheme: 'light',
					children: [],
					granularity: 'day',
					grid: true,
					hideDefaultLabels: false,
					index: 0,
					labelAlign: 'center',
					labelFontWeight: 'normal',
					labelOrientation: 'horizontal',
					labels: [],
					name: 'axis0',
					numberFormat: 'shortNumber',
					position: 'left',
					scaleType: 'point',
					subLabels: [],
					ticks: false,
					title: 'Users',
					tickMinStep: 5,
				},
				'yLinear'
			)
		).toStrictEqual({
			scale: 'yLinear',
			orient: 'left',
			grid: true,
			ticks: false,
			tickCount: {
				signal: 'clamp(ceil(height/100), 2, 10)',
			},
			tickMinStep: undefined,
			title: 'Users',
			labels: true,
			labelAlign: 'right',
			labelAngle: 0,
			labelBaseline: 'middle',
			labelFontWeight: 'normal',
			labelOffset: undefined,
			labelPadding: undefined,
			encode: {
				labels: {
					update: {
						text: [
							{
								test: "isNumber(datum['value']) && abs(datum['value']) >= 1000",
								signal: "upper(replace(format(datum['value'], '.3~s'), /(\\d+)G/, '$1B'))",
							},
							{
								signal: 'datum.value',
							},
						],
					},
				},
			},
		});
	});
	test('should set values to empty array if hideDefaultLabels === true', () => {
		expect(getDefaultAxis({ ...defaultAxisProps, hideDefaultLabels: true }, 'xLinear')).toHaveProperty(
			'labels',
			false
		);
	});
});

describe('getSubLabelAxis()', () => {
	test('should set the labelPadding to 32 if ticks are enabled and 24 if not', () => {
		const subLabels: SubLabel[] = [
			{ value: 1, subLabel: 'one', align: 'start' },
			{ value: 2, subLabel: 'two', align: 'end' },
		];
		expect(getSubLabelAxis({ ...defaultAxisProps, subLabels }, 'xLinear')).toHaveProperty('labelPadding', 24);
		expect(getSubLabelAxis({ ...defaultAxisProps, subLabels, ticks: true }, 'xLinear')).toHaveProperty(
			'labelPadding',
			32
		);
	});

	test('should set values to undefined if sublabels have length 0', () => {
		expect(getSubLabelAxis({ ...defaultAxisProps, subLabels: [] }, 'xLinear')).toHaveProperty('values', undefined);
	});
});
