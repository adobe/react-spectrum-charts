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

import { ReferenceLine } from '@components/ReferenceLine';
import { DEFAULT_LABEL_FONT_WEIGHT, FILTERED_TABLE } from '@constants';
import { Axis, GroupMark, ProductionRule, Scale, Signal, TextValueRef } from 'vega';

import { SubLabel } from '../../types';
import {
	addAxes,
	addAxesMarks,
	addAxis,
	addAxisSignals,
	getLabelSignalValue,
	setAxisBaseline,
} from './axisSpecBuilder';
import { defaultAxisProps, defaultXBaselineMark, defaultYBaselineMark } from './axisTestUtils';

const defaultAxis: Axis = {
	orient: 'bottom',
	scale: 'xPoint',
	grid: false,
	ticks: false,
	tickCount: undefined,
	tickMinStep: undefined,
	domain: false,
	domainWidth: 2,
	title: undefined,
	labels: true,
	labelAlign: undefined,
	labelBaseline: 'top',
	labelAngle: 0,
	labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
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
					{ signal: 'datum.value' },
				],
			},
		},
	},
};

const defaultSubLabelAxis: Axis = {
	...defaultAxis,
	encode: {
		labels: {
			update: {
				text: [
					{
						signal: "axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].subLabel",
						test: "indexof(pluck(axis0_subLabels, 'value'), datum.value) !== -1",
					},
					{ signal: 'datum.value' },
				],
				align: [
					{
						test: "indexof(pluck(axis0_subLabels, 'value'), datum.value) !== -1 && axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].align",
						signal: "axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].align",
					},
					{
						value: 'center',
					},
				],
				baseline: [
					{
						test: "indexof(pluck(axis0_subLabels, 'value'), datum.value) !== -1 && axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].baseline",
						signal: "axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].baseline",
					},
					{
						value: 'top',
					},
				],
				fontWeight: [
					{
						test: "indexof(pluck(axis0_subLabels, 'value'), datum.value) !== -1 && axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].fontWeight",
						signal: "axis0_subLabels[indexof(pluck(axis0_subLabels, 'value'), datum.value)].fontWeight",
					},
					{
						value: 'normal',
					},
				],
			},
		},
	},
	domain: false,
	domainWidth: undefined,
	grid: false,
	labelAlign: 'center',
	labelPadding: 24,
	title: undefined,
	values: ['test'],
};

const defaultScales: Scale[] = [
	{
		name: 'xPoint',
		type: 'point',
		range: 'width',
		domain: { data: FILTERED_TABLE, field: 'x' },
	},
	{
		name: 'yLinear',
		type: 'linear',
		range: 'height',
		nice: true,
		zero: true,
		domain: { data: FILTERED_TABLE, field: 'y' },
	},
];

const defaultLinearScales: Scale[] = [
	{
		name: 'xLinear',
		type: 'linear',
		range: 'width',
		domain: { data: FILTERED_TABLE, field: 'x' },
	},
	{
		name: 'yLinear',
		type: 'linear',
		range: 'height',
		nice: true,
		zero: true,
		domain: { data: FILTERED_TABLE, field: 'y' },
	},
];

const defaultSubLabels: SubLabel[] = [{ value: 'test', subLabel: 'testing', align: undefined }];

const defaultSignal: Signal = {
	name: 'axis0_subLabels',
	value: defaultSubLabels,
};

const defaultTrellisGroupMark: GroupMark = {
	name: 'xTrellisGroup',
	type: 'group',
	marks: [defaultYBaselineMark],
	from: {
		facet: {
			data: FILTERED_TABLE,
			name: 'bar0_trellis',
			groupby: 'event',
		},
	},
};

describe('Spec builder, Axis', () => {
	describe('addAxis()', () => {
		describe('no initial state', () => {
			test('position = "bottom"', () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { domain, domainWidth, ...axis } = defaultAxis;
				expect(addAxis({ scales: defaultScales }, { position: 'bottom' })).toStrictEqual({
					scales: defaultScales,
					axes: [{ ...axis, labelAlign: 'center' }],
					marks: [],
					signals: [],
					data: [],
				});
			});
			test('position = "left"', () => {
				expect(addAxis({ scales: defaultScales }, { position: 'left' })).toStrictEqual({
					scales: defaultScales,
					axes: [
						{
							...defaultAxis,
							orient: 'left',
							scale: 'yLinear',
							labelAlign: 'right',
							labelBaseline: 'middle',
						},
					],
					signals: [],
					marks: [],
					data: [],
				});
			});
			test('type = percentage', () => {
				expect(
					addAxis({ scales: defaultScales }, { position: 'left', labelFormat: 'percentage' })
				).toStrictEqual({
					scales: defaultScales,
					axes: [
						{
							...defaultAxis,
							orient: 'left',
							scale: 'yLinear',
							labelAlign: 'right',
							labelBaseline: 'middle',
							encode: {
								labels: {
									update: {
										text: [
											{ test: 'isNumber(datum.value)', signal: "format(datum.value, '~%')" },
											{ signal: 'datum.value' },
										],
									},
								},
							},
						},
					],
					signals: [],
					marks: [],
					data: [],
				});
			});
			test('subLabels', () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { domain, domainWidth, ...axis } = defaultAxis;
				expect(
					addAxis({ scales: defaultScales }, { position: 'bottom', subLabels: defaultSubLabels })
				).toStrictEqual({
					scales: defaultScales,
					axes: [{ ...axis, labelAlign: 'center', titlePadding: 24 }, defaultSubLabelAxis],
					marks: [],
					signals: [{ ...defaultSignal, value: [{ ...defaultSignal.value[0], baseline: undefined }] }],
					data: [],
				});
			});
			test('custom X range', () => {
				const resultScales = addAxis(
					{ scales: defaultLinearScales },
					{ position: 'bottom', range: [0, 100] }
				).scales;

				expect(resultScales?.at(0)?.domain).toEqual([0, 100]);
			});
			test('custom Y range', () => {
				const resultScales = addAxis(
					{ scales: defaultLinearScales },
					{ position: 'left', range: [0, 100] }
				).scales;

				expect(resultScales?.at(1)?.domain).toEqual([0, 100]);
			});
		});
		describe('no scales', () => {
			test('should add scales', () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { domain, domainWidth, ...axis } = defaultAxis;
				expect(addAxis({}, { position: 'bottom' })).toStrictEqual({
					axes: [{ ...axis, labelAlign: 'center', scale: 'xLinear' }],
					marks: [],
					signals: [],
					data: [],
				});
			});
		});
	});

	describe('addAxes()', () => {
		test('should add test to hide labels if they would overlap the reference line icon', () => {
			const labelTextEncoding = addAxes([], {
				...defaultAxisProps,
				children: [createElement(ReferenceLine, { value: 10, icon: 'date' })],
				scaleName: 'xLinear',
				scaleType: 'linear',
			})[0].encode?.labels?.update?.text as ProductionRule<TextValueRef>;
			expect(labelTextEncoding).toHaveLength(3);
			expect(labelTextEncoding[0]).toEqual({
				test: "abs(scale('xLinear', 10) - scale('xLinear', datum.value)) < 30",
				value: '',
			});
		});
		test('should add and tests for each referenceline to hide labels if they would overlap the reference line icon', () => {
			const labelTextEncoding = addAxes([], {
				...defaultAxisProps,
				children: [
					createElement(ReferenceLine, { value: 10, icon: 'date' }),
					createElement(ReferenceLine, { value: 15, icon: 'date' }),
				],
				scaleName: 'xLinear',
				scaleType: 'linear',
			})[0].encode?.labels?.update?.text as ProductionRule<TextValueRef>;

			// 2 tests for the two reference lines plus 2 default tests = 4 tests
			expect(labelTextEncoding).toHaveLength(4);
		});
		test('should set the values on the axis if labels is set', () => {
			const axes = addAxes([], {
				...defaultAxisProps,
				labels: [1, 2, 3],
				scaleName: 'xLinear',
				scaleType: 'linear',
			});
			expect(axes).toHaveLength(1);
			expect(axes[0].values).toEqual([1, 2, 3]);
		});
	});

	describe('setAxisBaseline()', () => {
		//Vega uses "domain", we use "baseline"
		describe('no baseline prop', () => {
			test('should set domain to default (false)', () => {
				expect(setAxisBaseline(defaultAxis, undefined)).toStrictEqual({
					...defaultAxis,
					domain: false,
				});
			});
		});
		describe('baseline prop', () => {
			test('should override existing domain', () => {
				expect(setAxisBaseline({ ...defaultAxis, domain: true }, false)).toStrictEqual({
					...defaultAxis,
					domain: false,
				});
			});
			test('should set domain if it did not previously exist', () => {
				expect(setAxisBaseline(defaultAxis, false)).toStrictEqual({
					...defaultAxis,
					domain: false,
				});
			});
		});
	});

	describe('addAxesMarks()', () => {
		test('should add baseline to the end of the marks if baseline offset is 0', () => {
			const marks = addAxesMarks([defaultYBaselineMark], {
				...defaultAxisProps,
				baseline: true,
				baselineOffset: 0,
				opposingScaleType: 'linear',
				scaleName: 'xLinear',
			});

			expect(marks).toEqual([defaultYBaselineMark, defaultXBaselineMark]);
		});

		test('should add baseline to the start of the marks if baseline offset is not 0', () => {
			const marks = addAxesMarks([defaultYBaselineMark], {
				...defaultAxisProps,
				baseline: true,
				baselineOffset: 10,
				opposingScaleType: 'linear',
				scaleName: 'xLinear',
			});

			expect(marks).toEqual([
				{
					...defaultXBaselineMark,
					encode: {
						update: {
							...defaultXBaselineMark.encode?.update,
							y: {
								...defaultXBaselineMark.encode?.update?.y,
								value: 10,
							},
						},
					},
				},
				defaultYBaselineMark,
			]);
		});

		test('should add baseline to first mark group if chart is trellised', () => {
			const marks = addAxesMarks([defaultTrellisGroupMark], {
				...defaultAxisProps,
				baseline: true,
				baselineOffset: 0,
				opposingScaleType: 'linear',
				scaleName: 'xLinear',
			});

			expect(marks).toHaveLength(1);
			expect((marks[0] as GroupMark).marks).toEqual([defaultYBaselineMark, defaultXBaselineMark]);
		});

		test('should add baseline to first mark group if chart is trellised and baseline offset is not 0', () => {
			const marks = addAxesMarks([defaultTrellisGroupMark], {
				...defaultAxisProps,
				baseline: true,
				baselineOffset: 10,
				opposingScaleType: 'linear',
				scaleName: 'xLinear',
			});

			expect(marks).toHaveLength(1);
			expect((marks[0] as GroupMark).marks).toEqual([
				{
					...defaultXBaselineMark,
					encode: {
						update: {
							...defaultXBaselineMark.encode?.update,
							y: {
								...defaultXBaselineMark.encode?.update?.y,
								value: 10,
							},
						},
					},
				},
				defaultYBaselineMark,
			]);
		});

		test('should add an axis to the trellis group if the chart is trellised and opposing scale type is not linear', () => {
			const marks = addAxesMarks([defaultTrellisGroupMark], {
				...defaultAxisProps,
				baseline: true,
				baselineOffset: 0,
				opposingScaleType: 'band',
				scaleName: 'xLinear',
			}) as GroupMark[];

			expect(marks[0].axes).toHaveLength(1);
		});

		test('should show trellis axis labels if chart orientation matches trellis orientation', () => {
			const marks = addAxesMarks([defaultTrellisGroupMark], {
				...defaultAxisProps,
				position: 'bottom',
				baseline: true,
				baselineOffset: 0,
				opposingScaleType: 'band',
				scaleName: 'xLinear',
			}) as GroupMark[];

			expect(marks[0].axes?.[0].labels).toBe(true);
		});

		test('should not show trellis axis labels if chart orientation does not match trellis orientation', () => {
			const marks = addAxesMarks([defaultTrellisGroupMark], {
				...defaultAxisProps,
				position: 'left',
				baseline: true,
				baselineOffset: 0,
				opposingScaleType: 'band',
				scaleName: 'yLinear',
			}) as GroupMark[];

			expect(marks[0].axes?.[0].labels).toBe(false);
		});
	});

	describe('addAxisSignals()', () => {
		test('should not add any signals if there labels and subLabels are undefined', () => {
			const signals = addAxisSignals([], defaultAxisProps);
			expect(signals).toHaveLength(0);
		});

		test('should add labels signal if labels exist', () => {
			const signals = addAxisSignals([], {
				...defaultAxisProps,
				labels: [1, 'test', { value: 2, label: 'two', align: 'start' }],
			});
			expect(signals).toHaveLength(1);
			expect(signals[0]).toHaveProperty('name', 'axis0_labels');
			expect(signals[0]).toHaveProperty('value', [{ value: 2, label: 'two', align: 'left', baseline: 'top' }]);
		});

		test('should add subLabels if subLabels exist', () => {
			const signals = addAxisSignals([], {
				...defaultAxisProps,
				subLabels: [
					{ value: 1, subLabel: 'one', align: 'start' },
					{ value: 2, subLabel: 'two', align: 'end' },
				],
			});
			expect(signals).toHaveLength(1);
			expect(signals[0]).toHaveProperty('name', 'axis0_subLabels');
			expect(signals[0]).toHaveProperty('value', [
				{ value: 1, subLabel: 'one', align: 'left', baseline: 'top' },
				{ value: 2, subLabel: 'two', align: 'right', baseline: 'top' },
			]);
		});
	});

	describe('getLabelSignalValue()', () => {
		test('should filter out any labels that are not objects', () => {
			const labelValue = getLabelSignalValue(
				[1, 'test', { value: 2, label: 'two', align: 'start' }],
				'bottom',
				'horizontal'
			);
			expect(labelValue).toHaveLength(1);
			expect(labelValue[0]).toEqual({ value: 2, label: 'two', align: 'left', baseline: 'top' });
		});
	});
});
