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

import { ChartPopover } from '@components/ChartPopover';
import { MetricRange } from '@components/MetricRange';
import { Trendline } from '@components/Trendline';
import {
	BACKGROUND_COLOR,
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_CONTINUOUS_DIMENSION,
	DEFAULT_METRIC,
	FILTERED_TABLE,
	MARK_ID,
	SERIES_ID,
	TABLE,
	TRENDLINE_VALUE,
} from '@constants';
import { LineSpecProps, MetricRangeElement, MetricRangeProps } from 'types';
import { Data, Spec } from 'vega';

import * as signalSpecBuilder from '../signal/signalSpecBuilder';
import { initializeSpec } from '../specUtils';
import { addData, addLine, addLineMarks, addSignals, setScales } from './lineSpecBuilder';

const defaultLineProps: LineSpecProps = {
	children: [],
	name: 'line0',
	dimension: DEFAULT_CONTINUOUS_DIMENSION,
	index: 0,
	metric: DEFAULT_METRIC,
	color: DEFAULT_COLOR,
	scaleType: 'time',
	lineType: { value: 'solid' },
	opacity: { value: 1 },
	colorScheme: DEFAULT_COLOR_SCHEME,
	interactiveMarkName: undefined,
	popoverMarkName: undefined,
};

const getMetricRangeElement = (props?: Partial<MetricRangeProps>): MetricRangeElement =>
	createElement(MetricRange, {
		metricEnd: 'end',
		metricStart: 'start',
		...props,
	});

const startingSpec: Spec = initializeSpec({
	scales: [{ name: 'color', type: 'ordinal' }],
});

const defaultSpec = initializeSpec({
	data: [
		{
			name: TABLE,
			transform: [
				{ as: MARK_ID, type: 'identifier' },
				{
					as: ['datetime0', 'datetime1'],
					field: DEFAULT_CONTINUOUS_DIMENSION,
					type: 'timeunit',
					units: ['year', 'month', 'date', 'hours', 'minutes'],
				},
			],
			values: [],
		},
		{
			name: FILTERED_TABLE,
			source: TABLE,
		},
	],
	marks: [
		{
			from: { facet: { data: FILTERED_TABLE, groupby: [DEFAULT_COLOR], name: 'line0_facet' } },
			marks: [
				{
					encode: {
						enter: {
							stroke: { field: DEFAULT_COLOR, scale: 'color' },
							strokeDash: { value: [] },
							strokeWidth: undefined,
							y: { field: 'value', scale: 'yLinear' },
						},
						update: { x: { field: 'datetime0', scale: 'xTime' }, strokeOpacity: [{ value: 1 }] },
					},
					from: { data: 'line0_facet' },
					name: 'line0',
					type: 'line',
					interactive: false,
				},
			],
			name: 'line0_group',
			type: 'group',
		},
	],
	scales: [
		{ domain: { data: TABLE, fields: [DEFAULT_COLOR] }, name: 'color', type: 'ordinal' },
		{
			domain: { data: FILTERED_TABLE, fields: ['datetime0'] },
			name: 'xTime',
			padding: 32,
			range: 'width',
			type: 'time',
		},
		{
			domain: { data: FILTERED_TABLE, fields: ['value'] },
			name: 'yLinear',
			nice: true,
			range: 'height',
			type: 'linear',
			zero: true,
		},
	],
	signals: [],
});

const defaultLinearScale = {
	domain: { data: FILTERED_TABLE, fields: [DEFAULT_CONTINUOUS_DIMENSION] },
	name: 'xLinear',
	padding: 32,
	range: 'width',
	type: 'linear',
};

const defaultPointScale = {
	domain: { data: FILTERED_TABLE, fields: [DEFAULT_CONTINUOUS_DIMENSION] },
	name: 'xPoint',
	paddingOuter: 0.5,
	range: 'width',
	type: 'point',
};

const line0_groupMark = {
	name: 'line0_group',
	type: 'group',
	from: {
		facet: {
			name: 'line0_facet',
			data: FILTERED_TABLE,
			groupby: ['series'],
		},
	},
	marks: [
		{
			name: 'line0',
			type: 'line',
			from: {
				data: 'line0_facet',
			},
			interactive: false,
			encode: {
				enter: {
					y: {
						scale: 'yLinear',
						field: 'value',
					},
					stroke: {
						scale: 'color',
						field: 'series',
					},
					strokeDash: {
						value: [],
					},
					strokeWidth: undefined,
				},
				update: {
					x: {
						scale: 'xTime',
						field: 'datetime0',
					},
					strokeOpacity: [
						{
							value: 1,
						},
					],
				},
			},
		},
	],
};

const metricRangeGroupMark = {
	name: 'line0MetricRange0_group',
	type: 'group',
	clip: true,
	from: {
		facet: {
			name: 'line0MetricRange0_facet',
			data: FILTERED_TABLE,
			groupby: ['series'],
		},
	},
	marks: [
		{
			name: 'line0',
			type: 'line',
			from: {
				data: 'line0MetricRange0_facet',
			},
			interactive: false,
			encode: {
				enter: {
					y: {
						scale: 'yLinear',
						field: 'value',
					},
					stroke: {
						scale: 'color',
						field: 'series',
					},
					strokeDash: {
						value: [7, 4],
					},
					strokeWidth: {
						value: 1.5,
					},
				},
				update: {
					x: {
						scale: 'xTime',
						field: 'datetime0',
					},
					strokeOpacity: [
						{
							value: 1,
						},
					],
				},
			},
		},
		{
			name: 'line0MetricRange0',
			type: 'area',
			from: {
				data: 'line0MetricRange0_facet',
			},
			interactive: false,
			encode: {
				enter: {
					y: {
						field: 'start',

						scale: 'yLinear',
					},
					y2: {
						field: 'end',
						scale: 'yLinear',
					},
					fill: {
						scale: 'color',
						field: 'series',
					},
					tooltip: undefined,
				},
				update: {
					cursor: undefined,
					x: {
						scale: 'xTime',
						field: 'datetime0',
					},
					fillOpacity: [
						{
							value: 0.8,
						},
					],
				},
			},
		},
	],
};

const metricRangeMarks = [line0_groupMark, metricRangeGroupMark];

const metricRangeWithDisplayPointMarks = [
	line0_groupMark,
	{
		name: 'line0_staticPoints',
		type: 'symbol',
		from: {
			data: 'line0_staticPointData',
		},
		interactive: false,
		encode: {
			enter: {
				y: {
					scale: 'yLinear',
					field: 'value',
				},
				fill: {
					scale: 'color',
					field: 'series',
				},
				stroke: {
					signal: BACKGROUND_COLOR,
				},
			},
			update: {
				x: {
					scale: 'xTime',
					field: 'datetime0',
				},
			},
		},
	},
	metricRangeGroupMark,
];

const displayPointMarks = [
	line0_groupMark,
	{
		name: 'line0_staticPoints',
		type: 'symbol',
		from: {
			data: 'line0_staticPointData',
		},
		interactive: false,
		encode: {
			enter: {
				y: {
					scale: 'yLinear',
					field: 'value',
				},
				fill: {
					scale: 'color',
					field: 'series',
				},
				stroke: {
					signal: BACKGROUND_COLOR,
				},
			},
			update: {
				x: {
					scale: 'xTime',
					field: 'datetime0',
				},
			},
		},
	},
];

describe('lineSpecBuilder', () => {
	describe('addLine()', () => {
		test('should add line', () => {
			expect(addLine(startingSpec, { color: DEFAULT_COLOR })).toStrictEqual(defaultSpec);
		});
	});

	describe('addData()', () => {
		let baseData: Data[];

		beforeEach(() => {
			baseData = initializeSpec().data ?? [];
		});

		test('basic', () => {
			expect(addData(baseData, defaultLineProps)).toStrictEqual(defaultSpec.data);
		});

		test('scaleTypes "point" and "linear" should return the original data', () => {
			expect(addData([], { ...defaultLineProps, scaleType: 'point' })).toEqual([]);
			expect(addData([], { ...defaultLineProps, scaleType: 'linear' })).toEqual([]);
		});

		test('should add trendline transform', () => {
			expect(
				addData(baseData, {
					...defaultLineProps,
					children: [createElement(Trendline, { method: 'average' })],
				})[2].transform
			).toStrictEqual([
				{
					type: 'joinaggregate',
					groupby: ['series'],
					fields: ['value'],
					ops: ['mean'],
					as: [TRENDLINE_VALUE],
				},
			]);
		});

		test('should not do anything for movingAverage trendline since it is not supported yet', () => {
			expect(
				addData(baseData, {
					...defaultLineProps,
					children: [createElement(Trendline, { method: 'movingAverage-7' })],
				})[0].transform
			).toHaveLength(2);
		});

		test('adds point data if displayPointMark is not undefined', () => {
			const resultData = addData(baseData ?? [], {
				...defaultLineProps,
				staticPoint: 'staticPoint',
			});
			expect(resultData.find((data) => data.name === 'line0_staticPointData')).toStrictEqual({
				name: 'line0_staticPointData',
				source: FILTERED_TABLE,
				transform: [{ expr: 'datum.staticPoint === true', type: 'filter' }],
			});
		});
	});

	describe('setScales()', () => {
		test('time', () => {
			expect(setScales(startingSpec.scales ?? [], defaultLineProps)).toStrictEqual(defaultSpec.scales);
		});

		test('linear', () => {
			expect(
				setScales(startingSpec.scales ?? [], {
					...defaultLineProps,
					scaleType: 'linear',
				})
			).toStrictEqual([defaultSpec.scales?.[0], defaultLinearScale, defaultSpec.scales?.[2]]);
		});

		test('point', () => {
			expect(
				setScales(startingSpec.scales ?? [], {
					...defaultLineProps,
					scaleType: 'point',
				})
			).toStrictEqual([defaultSpec.scales?.[0], defaultPointScale, defaultSpec.scales?.[2]]);
		});

		test('with metric range fields', () => {
			const [metricStart, metricEnd] = ['metricStart', 'metricEnd'];
			const metricRangeMetricScale = {
				...defaultSpec.scales?.[2],
				domain: {
					...defaultSpec.scales?.[2].domain,
					fields: ['value', metricStart, metricEnd],
				},
			};
			expect(
				setScales(startingSpec.scales ?? [], {
					...defaultLineProps,
					children: [createElement(MetricRange, { scaleAxisToFit: true, metricEnd, metricStart })],
				})
			).toStrictEqual([defaultSpec.scales?.[0], defaultSpec.scales?.[1], metricRangeMetricScale]);
		});
	});

	describe('addLineMarks()', () => {
		test('basic', () => {
			expect(addLineMarks([], defaultLineProps)).toStrictEqual(defaultSpec.marks);
		});

		test('dashed', () => {
			expect(addLineMarks([], { ...defaultLineProps, lineType: { value: [8, 8] } })).toStrictEqual([
				{
					from: { facet: { data: FILTERED_TABLE, groupby: [DEFAULT_COLOR], name: 'line0_facet' } },
					marks: [
						{
							encode: {
								enter: {
									stroke: { field: DEFAULT_COLOR, scale: 'color' },
									strokeDash: { value: [8, 8] },
									strokeWidth: undefined,
									y: { field: 'value', scale: 'yLinear' },
								},
								update: { x: { field: 'datetime0', scale: 'xTime' }, strokeOpacity: [{ value: 1 }] },
							},
							from: { data: 'line0_facet' },
							name: 'line0',
							type: 'line',
							interactive: false,
						},
					],
					name: 'line0_group',
					type: 'group',
				},
			]);
		});

		test('with metric range', () => {
			expect(addLineMarks([], { ...defaultLineProps, children: [getMetricRangeElement()] })).toStrictEqual(
				metricRangeMarks
			);
		});

		test('with displayPointMark', () => {
			expect(addLineMarks([], { ...defaultLineProps, staticPoint: 'staticPoint' })).toStrictEqual(
				displayPointMarks
			);
		});

		test('with displayPointMark and metric range', () => {
			expect(
				addLineMarks([], {
					...defaultLineProps,
					staticPoint: 'staticPoint',
					children: [getMetricRangeElement()],
				})
			).toStrictEqual(metricRangeWithDisplayPointMarks);
		});
	});

	describe('addSignals()', () => {
		test('on children', () => {
			expect(addSignals([], defaultLineProps)).toStrictEqual([]);
		});

		test('does not add selected series if it already exists', () => {
			const hasSignalByNameSpy = jest.spyOn(signalSpecBuilder, 'hasSignalByName');
			expect(
				addSignals(
					[
						{
							name: 'line0_selectedSeries',
							value: null,
						},
					],
					defaultLineProps
				)
			).toStrictEqual([
				{
					name: 'line0_selectedSeries',
					value: null,
				},
			]);

			expect(hasSignalByNameSpy).not.toHaveBeenCalled();
		});

		test('does not add selected series if it already exists and there are interactive children', () => {
			const getGenericSignalSpy = jest.spyOn(signalSpecBuilder, 'getGenericSignal');

			addSignals(
				[
					{
						name: 'line0_selectedSeries',
						value: null,
					},
				],
				{ ...defaultLineProps, children: [createElement(ChartPopover)] }
			);

			expect(getGenericSignalSpy).toHaveBeenCalledTimes(1);
			expect(getGenericSignalSpy).not.toHaveBeenCalledWith('line0_selectedSeries');
		});

		test('hover signals with metric range', () => {
			expect(
				addSignals([], { ...defaultLineProps, children: [getMetricRangeElement({ displayOnHover: true })] })
			).toStrictEqual([
				{
					name: 'line0_hoveredSeries',
					value: null,
					on: [
						{
							events: '@line0_voronoi:mouseover',
							update: `datum.datum.${SERIES_ID}`,
						},
						{
							events: '@line0_voronoi:mouseout',
							update: 'null',
						},
					],
				},
				{
					name: 'line0_hoveredId',
					value: null,
					on: [
						{
							events: '@line0_voronoi:mouseover',
							update: `datum.datum.${MARK_ID}`,
						},
						{
							events: '@line0_voronoi:mouseout',
							update: 'null',
						},
					],
				},
				{
					name: 'line0_selectedId',
					value: null,
				},
				{
					name: 'line0_selectedSeries',
					value: null,
				},
			]);
		});

		test('adds hover signals when displayPointMark is not undefined', () => {
			expect(addSignals([], { ...defaultLineProps, staticPoint: 'staticPoint' })).toStrictEqual([]);
		});

		test('adds hover signals with metric range when displayPointMark is not undefined', () => {
			expect(
				addSignals([], {
					...defaultLineProps,
					staticPoint: 'staticPoint',
					children: [getMetricRangeElement({ displayOnHover: true })],
				})
			).toStrictEqual([
				{
					name: 'line0_hoveredSeries',
					value: null,
					on: [
						{
							events: '@line0_voronoi:mouseover',
							update: `datum.datum.${SERIES_ID}`,
						},
						{
							events: '@line0_voronoi:mouseout',
							update: 'null',
						},
					],
				},
				{
					name: 'line0_hoveredId',
					value: null,
					on: [
						{
							events: '@line0_voronoi:mouseover',
							update: `datum.datum.${MARK_ID}`,
						},
						{
							events: '@line0_voronoi:mouseout',
							update: 'null',
						},
					],
				},
				{
					name: 'line0_selectedId',
					value: null,
				},
				{
					name: 'line0_selectedSeries',
					value: null,
				},
			]);
		});
	});
});
