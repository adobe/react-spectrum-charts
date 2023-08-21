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

import { ReferenceLine } from '@components/ReferenceLine';
import {
	DEFAULT_COLOR_SCHEME,
	DEFAULT_GRANULARITY,
	DEFAULT_LABEL_ALIGN,
	DEFAULT_LABEL_FONT_WEIGHT,
	TABLE,
} from '@constants';
import { createElement } from 'react';
import { AxisSpecProps, SubLabel } from 'types';
import { Axis, GroupMark, Mark, ProductionRule, Scale, Signal, TextValueRef } from 'vega';

import {
	addAxes,
	addAxesMarks,
	addAxis,
	addAxisSignals,
	getBaselineRule,
	getDefaultAxis,
	getEncodedLabelBaselineAlign,
	getLabelAlign,
	getLabelBaseline,
	getLabelBaselineAlign,
	getLabelOffset,
	getLabelSignalValue,
	getLabelValue,
	getSubLabelAxis,
	getTrellisAxisProps,
	setAxisBaseline,
} from './axisSpecBuilder';

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
	labelBaseline: undefined,
	labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
	labelOffset: undefined,
	labelPadding: undefined,
	encode: {
		labels: {
			update: {
				text: [
					{
						test: 'isNumber(datum.value) && abs(datum.value) >= 1000',
						signal: "upper(replace(format(datum.value, '.3~s'), 'G', 'B'))",
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
						signal: "axis0SubLabels[indexof(pluck(axis0SubLabels, 'value'), datum.value)].subLabel",
						test: "indexof(pluck(axis0SubLabels, 'value'), datum.value) !== -1",
					},
					{ signal: 'datum.value' },
				],
				align: [
					{
						test: "indexof(pluck(axis0SubLabels, 'value'), datum.value) !== -1 && axis0SubLabels[indexof(pluck(axis0SubLabels, 'value'), datum.value)].align",
						signal: "axis0SubLabels[indexof(pluck(axis0SubLabels, 'value'), datum.value)].align",
					},
					{
						value: 'center',
					},
				],
				fontWeight: [
					{
						test: "indexof(pluck(axis0SubLabels, 'value'), datum.value) !== -1 && axis0SubLabels[indexof(pluck(axis0SubLabels, 'value'), datum.value)].fontWeight",
						signal: "axis0SubLabels[indexof(pluck(axis0SubLabels, 'value'), datum.value)].fontWeight",
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

const defaultAxisProps: AxisSpecProps = {
	name: 'axis0',
	baseline: false,
	baselineOffset: 0,
	colorScheme: DEFAULT_COLOR_SCHEME,
	granularity: DEFAULT_GRANULARITY,
	grid: false,
	hideDefaultLabels: false,
	labelAlign: DEFAULT_LABEL_ALIGN,
	labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
	position: 'bottom',
	ticks: false,
};
const defaultXBaselineMark: Mark = {
	name: 'xBaseline',
	type: 'rule',
	interactive: false,
	encode: {
		update: {
			x: { value: 0 },
			x2: { signal: 'width' },
			y: { scale: 'yLinear', value: 0 },
		},
	},
};
const defaultYBaselineMark: Mark = {
	name: 'yBaseline',
	type: 'rule',
	interactive: false,
	encode: {
		update: {
			y: { value: 0 },
			y2: { signal: 'height' },
			x: { scale: 'xLinear', value: 0 },
		},
	},
};

const defaultScales: Scale[] = [
	{
		name: 'xPoint',
		type: 'point',
		range: 'width',
		domain: { data: TABLE, field: 'x' },
	},
	{
		name: 'yLinear',
		type: 'linear',
		range: 'height',
		nice: true,
		zero: true,
		domain: { data: TABLE, field: 'y' },
	},
];

const defaultLinearScales: Scale[] = [
	{
		name: 'xLinear',
		type: 'linear',
		range: 'width',
		domain: { data: TABLE, field: 'x' },
	},
	{
		name: 'yLinear',
		type: 'linear',
		range: 'height',
		nice: true,
		zero: true,
		domain: { data: TABLE, field: 'y' },
	},
];

const defaultSubLabels: SubLabel[] = [{ value: 'test', subLabel: 'testing', align: undefined }];

const defaultSignal: Signal = {
	name: 'axis0SubLabels',
	value: defaultSubLabels,
};

describe('Prism spec builder, Axis', () => {
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
							labelBaseline: 'middle',
						},
					],
					signals: [],
					marks: [],
				});
			});
			test('type = percentage', () => {
				expect(
					addAxis({ scales: defaultScales }, { position: 'left', labelFormat: 'percentage' }),
				).toStrictEqual({
					scales: defaultScales,
					axes: [
						{
							...defaultAxis,
							orient: 'left',
							scale: 'yLinear',
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
				});
			});
			test('subLabels', () => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { domain, domainWidth, ...axis } = defaultAxis;
				expect(
					addAxis({ scales: defaultScales }, { position: 'bottom', subLabels: defaultSubLabels }),
				).toStrictEqual({
					scales: defaultScales,
					axes: [{ ...axis, labelAlign: 'center', titlePadding: 24 }, defaultSubLabelAxis],
					marks: [],
					signals: [defaultSignal],
				});
			});
			test('custom X range', () => {
				const resultScales = addAxis(
					{ scales: defaultLinearScales },
					{ position: 'bottom', range: [0, 100] },
				).scales;

				expect(resultScales?.at(0)?.domain).toEqual([0, 100]);
			});
			test('custom Y range', () => {
				const resultScales = addAxis(
					{ scales: defaultLinearScales },
					{ position: 'left', range: [0, 100] },
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
				});
			});
		});
	});

	describe('addAxes()', () => {
		test('should add test to hide labels if they would overlap the reference line icon', () => {
			const labelTextEncoding = addAxes([], {
				...defaultAxisProps,
				children: createElement(ReferenceLine, { value: 10, icon: 'date' }),
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

	describe('getLabelValue()', () => {
		test('should return the value key if an object', () => {
			expect(getLabelValue({ value: 1 })).toEqual(1);
			expect(getLabelValue({ value: 'test', label: 'testing' })).toEqual('test');
		});
		test('should return the label as is if not an object', () => {
			expect(getLabelValue(1)).toEqual(1);
			expect(getLabelValue('test')).toEqual('test');
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
			const trellisGroupMark: Mark = {
				name: 'xTrellisGroup',
				type: 'group',
				marks: [defaultYBaselineMark],
			};

			const marks = addAxesMarks([trellisGroupMark], {
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
			const trellisGroupMark: Mark = {
				name: 'xTrellisGroup',
				type: 'group',
				marks: [defaultYBaselineMark],
			};

			const marks = addAxesMarks([trellisGroupMark], {
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
			const trellisGroupMark: Mark = {
				name: 'xTrellisGroup',
				type: 'group',
				marks: [defaultYBaselineMark],
			};

			const marks = addAxesMarks([trellisGroupMark], {
				...defaultAxisProps,
				baseline: true,
				baselineOffset: 0,
				opposingScaleType: 'band',
				scaleName: 'xLinear',
			}) as GroupMark[];

			expect(marks[0].axes).toHaveLength(1);
		});

		test('should show trellis axis labels if chart orientation matches trellis orientation', () => {
			const trellisGroupMark: Mark = {
				name: 'xTrellisGroup',
				type: 'group',
				marks: [defaultYBaselineMark],
			};

			const marks = addAxesMarks([trellisGroupMark], {
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
			const trellisGroupMark: Mark = {
				name: 'xTrellisGroup',
				type: 'group',
				marks: [defaultYBaselineMark],
			};

			const marks = addAxesMarks([trellisGroupMark], {
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

	describe('getLabelBaselineAlign()', () => {
		describe('bottom/top axis', () => {
			test('should return labelAlign object', () => {
				expect(getLabelBaselineAlign('start', 'bottom')).toEqual('left');
				expect(getLabelBaselineAlign('start', 'top')).toEqual('left');
				expect(getLabelBaselineAlign('center', 'bottom')).toEqual('center');
				expect(getLabelBaselineAlign('center', 'top')).toEqual('center');
				expect(getLabelBaselineAlign('end', 'bottom')).toEqual('right');
				expect(getLabelBaselineAlign('end', 'top')).toEqual('right');
			});
		});
		describe('left/right axis', () => {
			test('should return labelBaseline object', () => {
				expect(getLabelBaselineAlign('start', 'left')).toEqual('top');
				expect(getLabelBaselineAlign('start', 'right')).toEqual('top');
				expect(getLabelBaselineAlign('center', 'left')).toEqual('middle');
				expect(getLabelBaselineAlign('center', 'right')).toEqual('middle');
				expect(getLabelBaselineAlign('end', 'left')).toEqual('bottom');
				expect(getLabelBaselineAlign('end', 'right')).toEqual('bottom');
			});
		});
	});

	describe('getLabelOffset()', () => {
		test('start', () => {
			expect(getLabelOffset('start', 'xBand')).toStrictEqual({ signal: "bandwidth('xBand') / -2" });
		});
		test('end', () => {
			expect(getLabelOffset('end', 'xBand')).toStrictEqual({ signal: "bandwidth('xBand') / 2" });
		});
		test('center', () => {
			expect(getLabelOffset('center', 'xBand')).toStrictEqual(undefined);
		});
		test('should return vegaLabelOffset if provided', () => {
			expect(getLabelOffset('start', 'xBand', 10)).toEqual(10);
			expect(getLabelOffset('start', 'xBand', 0)).toEqual(0);
		});
	});

	describe('getEncodedLabelBaselineAlign()', () => {
		test('should return the correct key based on the position of the axis', () => {
			expect(getEncodedLabelBaselineAlign('bottom', 'mySignal', 'center')).toHaveProperty('align');
			expect(getEncodedLabelBaselineAlign('top', 'mySignal', 'center')).toHaveProperty('align');
			expect(getEncodedLabelBaselineAlign('left', 'mySignal', 'center')).toHaveProperty('baseline');
			expect(getEncodedLabelBaselineAlign('right', 'mySignal', 'center')).toHaveProperty('baseline');
		});
	});

	describe('getLabelAlign()', () => {
		test('should return the correct mappings for labelAlgin to vega Align', () => {
			expect(getLabelAlign(undefined, 'bottom')).toBeUndefined();
			expect(getLabelAlign('start', 'bottom')).toEqual('left');
			expect(getLabelAlign('center', 'bottom')).toEqual('center');
			expect(getLabelAlign('end', 'bottom')).toEqual('right');
		});
		test('should return controlled vegaLabelAlign value if supplied', () => {
			expect(getLabelAlign(undefined, 'bottom', 'left')).toEqual('left');
			expect(getLabelAlign('start', 'bottom', 'left')).toEqual('left');
			expect(getLabelAlign('center', 'bottom', 'left')).toEqual('left');
			expect(getLabelAlign('end', 'bottom', 'left')).toEqual('left');
		});
		test('should return undefined if position is left or right', () => {
			expect(getLabelAlign(undefined, 'left')).toBeUndefined();
			expect(getLabelAlign('start', 'left')).toBeUndefined();
			expect(getLabelAlign('center', 'left')).toBeUndefined();
			expect(getLabelAlign('end', 'left')).toBeUndefined();
			expect(getLabelAlign(undefined, 'right')).toBeUndefined();
			expect(getLabelAlign('start', 'right')).toBeUndefined();
			expect(getLabelAlign('center', 'right')).toBeUndefined();
			expect(getLabelAlign('end', 'right')).toBeUndefined();
		});
	});

	describe('getLabelBaseline()', () => {
		test('should return the correct mappings for labelAlgin to vega Align', () => {
			expect(getLabelBaseline(undefined, 'left')).toEqual(undefined);
			expect(getLabelBaseline('start', 'left')).toEqual('top');
			expect(getLabelBaseline('center', 'left')).toEqual('middle');
			expect(getLabelBaseline('end', 'left')).toEqual('bottom');
		});
		test('should return controlled vegaLabelBaseline value if supplied', () => {
			expect(getLabelBaseline(undefined, 'left', 'top')).toEqual('top');
			expect(getLabelBaseline('start', 'left', 'top')).toEqual('top');
			expect(getLabelBaseline('center', 'left', 'top')).toEqual('top');
			expect(getLabelBaseline('end', 'left', 'top')).toEqual('top');
		});
		test('should return undefined if position is top or bottom', () => {
			expect(getLabelBaseline(undefined, 'top')).toBeUndefined();
			expect(getLabelBaseline('start', 'top')).toBeUndefined();
			expect(getLabelBaseline('center', 'top')).toBeUndefined();
			expect(getLabelBaseline('end', 'top')).toBeUndefined();
			expect(getLabelBaseline(undefined, 'bottom')).toBeUndefined();
			expect(getLabelBaseline('start', 'bottom')).toBeUndefined();
			expect(getLabelBaseline('center', 'bottom')).toBeUndefined();
			expect(getLabelBaseline('end', 'bottom')).toBeUndefined();
		});
	});

	describe('getDefaultAxis()', () => {
		test('tickMinStep: linear scale', () => {
			expect(
				getDefaultAxis(
					{
						baseline: false,
						baselineOffset: 0,
						colorScheme: 'light',
						granularity: 'day',
						grid: true,
						hideDefaultLabels: false,
						labelAlign: 'center',
						labelFontWeight: 'normal',
						name: 'axis0',
						position: 'left',
						ticks: false,
						title: 'Users',
						tickMinStep: 5,
					},
					'yLinear',
					'linear',
				),
			).toStrictEqual({
				scale: 'yLinear',
				orient: 'left',
				grid: true,
				ticks: false,
				tickCount: {
					signal: 'clamp(ceil(height/40), 2, 5)',
				},
				tickMinStep: 5,
				title: 'Users',
				labels: true,
				labelAlign: undefined,
				labelBaseline: 'middle',
				labelFontWeight: 'normal',
				labelOffset: undefined,
				labelPadding: undefined,
				encode: {
					labels: {
						update: {
							text: [
								{
									test: 'isNumber(datum.value) && abs(datum.value) >= 1000',
									signal: "upper(replace(format(datum.value, '.3~s'), 'G', 'B'))",
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
						granularity: 'day',
						grid: true,
						hideDefaultLabels: false,
						labelAlign: 'center',
						labelFontWeight: 'normal',
						name: 'axis0',
						position: 'left',
						ticks: false,
						title: 'Users',
						tickMinStep: 5,
					},
					'yLinear',
					'point',
				),
			).toStrictEqual({
				scale: 'yLinear',
				orient: 'left',
				grid: true,
				ticks: false,
				tickCount: {
					signal: 'clamp(ceil(height/40), 2, 5)',
				},
				tickMinStep: undefined,
				title: 'Users',
				labels: true,
				labelAlign: undefined,
				labelBaseline: 'middle',
				labelFontWeight: 'normal',
				labelOffset: undefined,
				labelPadding: undefined,
				encode: {
					labels: {
						update: {
							text: [
								{
									test: 'isNumber(datum.value) && abs(datum.value) >= 1000',
									signal: "upper(replace(format(datum.value, '.3~s'), 'G', 'B'))",
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
			expect(
				getDefaultAxis({ ...defaultAxisProps, hideDefaultLabels: true }, 'xLinear', 'linear'),
			).toHaveProperty('labels', false);
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
			expect(signals[0]).toHaveProperty('name', 'axis0Labels');
			expect(signals[0]).toHaveProperty('value', [{ value: 2, label: 'two', align: 'left' }]);
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
			expect(signals[0]).toHaveProperty('name', 'axis0SubLabels');
			expect(signals[0]).toHaveProperty('value', [
				{ value: 1, subLabel: 'one', align: 'left' },
				{ value: 2, subLabel: 'two', align: 'right' },
			]);
		});
	});

	describe('getLabelSignalValue()', () => {
		test('should filter out any labels that are not objects', () => {
			const labelValue = getLabelSignalValue([1, 'test', { value: 2, label: 'two', align: 'start' }], 'bottom');
			expect(labelValue).toHaveLength(1);
			expect(labelValue[0]).toEqual({ value: 2, label: 'two', align: 'left' });
		});
	});

	describe('getSubLabelAxis()', () => {
		test('should set the labelPadding to 32 if ticks are enabled and 24 if not', () => {
			const subLabels: SubLabel[] = [
				{ value: 1, subLabel: 'one', align: 'start' },
				{ value: 2, subLabel: 'two', align: 'end' },
			];
			expect(getSubLabelAxis({ ...defaultAxisProps, subLabels }, 'xLinear', 'linear')).toHaveProperty(
				'labelPadding',
				24,
			);
			expect(
				getSubLabelAxis({ ...defaultAxisProps, subLabels, ticks: true }, 'xLinear', 'linear'),
			).toHaveProperty('labelPadding', 32);
		});

		test('should set values to undefined if sublabels have length 0', () => {
			expect(getSubLabelAxis({ ...defaultAxisProps, subLabels: [] }, 'xLinear', 'linear')).toHaveProperty(
				'values',
				undefined,
			);
		});
	});

	describe('getTrellisAxisProps()', () => {
		test('should generate trellis axis props for x axis', () => {
			const trellisAxisProps = getTrellisAxisProps('xTrellisBand');
			expect(trellisAxisProps).toHaveProperty('position', 'top');
			expect(trellisAxisProps).toHaveProperty('vegaLabelOffset', { signal: "bandwidth('xTrellisBand') / -2" });
			expect(trellisAxisProps).toHaveProperty('vegaLabelPadding', 8);
		});
		test('should generate trellis axis props for y axis', () => {
			const trellisAxisProps = getTrellisAxisProps('yTrellisBand');
			expect(trellisAxisProps).toHaveProperty('position', 'left');
			expect(trellisAxisProps).toHaveProperty('vegaLabelOffset', {
				signal: "bandwidth('yTrellisBand') / -2 - 8",
			});
			expect(trellisAxisProps).toHaveProperty('vegaLabelPadding', 0);
		});
		test('should retrun empty object if not for a trellis axis', () => {
			expect(getTrellisAxisProps('xLinear')).toEqual({});
		});
	});
});
