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

import { Trendline } from '@components/Trendline';
import {
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_CONTINUOUS_DIMENSION,
	DEFAULT_METRIC,
	FILTERED_TABLE,
	TABLE,
} from '@constants';
import { createElement } from 'react';
import { LineSpecProps } from 'types';
import { Data, Spec } from 'vega';

import { initializeSpec } from '../specUtils';
import { addData, addLine, addLineMarks, addSignals, setScales } from './lineSpecBuilder';
import * as signalSpecBuilder from '../signal/signalSpecBuilder';
import { MetricRange } from '@components/MetricRange';
import { ChartPopover } from '@components/ChartPopover';

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
};

const startingSpec: Spec = initializeSpec({
	scales: [{ name: 'color', type: 'ordinal' }],
});

const defaultSpec = initializeSpec({
	data: [
		{
			name: TABLE,
			transform: [
				{ as: 'prismMarkId', type: 'identifier' },
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

const line0_hoverRuleMark = {
	name: 'line0_hoverRule',
	type: 'rule',
	from: {
		data: 'line0_highlightedData',
	},
	interactive: false,
	encode: {
		enter: {
			y: {
				value: 0,
			},
			y2: {
				signal: 'height',
			},
			strokeWidth: {
				value: 1,
			},
		},
		update: {
			x: {
				scale: 'xTime',
				field: 'datetime0',
			},
		},
	},
};

const line0_pointsForVoronoiMark = {
	name: 'line0_pointsForVoronoi',
	type: 'symbol',
	from: {
		data: FILTERED_TABLE,
	},
	interactive: false,
	encode: {
		enter: {
			y: {
				scale: 'yLinear',
				field: 'value',
			},
			fill: {
				value: 'transparent',
			},
			stroke: {
				value: 'transparent',
			},
		},
		update: {
			x: {
				scale: 'xTime',
				field: 'datetime0',
			},
		},
	},
};

const line0_voronoiMark = {
	name: 'line0_voronoi',
	type: 'path',
	from: {
		data: 'line0_pointsForVoronoi',
	},
	encode: {
		enter: {
			fill: {
				value: 'transparent',
			},
			stroke: {
				value: 'transparent',
			},
			isVoronoi: {
				value: true,
			},
			tooltip: undefined,
		},
		update: {
			cursor: undefined,
		},
	},
	transform: [
		{
			type: 'voronoi',
			x: 'datum.x',
			y: 'datum.y',
			size: [
				{
					signal: 'max(width, 1)',
				},
				{
					signal: 'max(height, 1)',
				},
			],
		},
	],
};

const metricRangeGroupMark = {
	name: 'line0MetricRange0_group',
	type: 'group',
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
						field: undefined,

						scale: 'yLinear',
					},
					y2: {
						field: undefined,
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

const metricRangeMarks = [
	line0_groupMark,
	metricRangeGroupMark,
	line0_hoverRuleMark,
	{
		name: 'line0_pointBackground',
		type: 'symbol',
		from: {
			data: 'line0_highlightedData',
		},
		interactive: false,
		encode: {
			enter: {
				y: {
					scale: 'yLinear',
					field: 'value',
				},
				fill: {
					signal: 'backgroundColor',
				},
				stroke: {
					signal: 'backgroundColor',
				},
			},
			update: {
				x: {
					scale: 'xTime',
					field: 'datetime0',
				},
				size: [
					{
						value: 100,
					},
				],
				strokeWidth: [
					{
						value: 2,
					},
				],
			},
		},
	},
	{
		name: 'line0_point',
		type: 'symbol',
		from: {
			data: 'line0_highlightedData',
		},
		interactive: false,
		encode: {
			enter: {
				y: {
					scale: 'yLinear',
					field: 'value',
				},
				fill: {
					signal: 'backgroundColor',
				},
				stroke: {
					scale: 'color',
					field: 'series',
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
	line0_pointsForVoronoiMark,
	line0_voronoiMark,
];

const metricRangeWithDisplayPointMarks = [
	line0_groupMark,
	{
		name: 'line0_points',
		type: 'symbol',
		from: {
			data: 'line0_pointsData',
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
					signal: 'backgroundColor',
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
	line0_hoverRuleMark,
	{
		name: 'line0_pointBackground',
		type: 'symbol',
		from: {
			data: 'line0_highlightedData',
		},
		interactive: false,
		encode: {
			enter: {
				y: {
					scale: 'yLinear',
					field: 'value',
				},
				fill: {
					signal: 'backgroundColor',
				},
				stroke: {
					signal: 'backgroundColor',
				},
			},
			update: {
				x: {
					scale: 'xTime',
					field: 'datetime0',
				},
				size: [
					{
						test: 'datum.staticPoint && datum.staticPoint === true',
						value: 64,
					},
					{
						value: 100,
					},
				],
				strokeWidth: [
					{
						test: 'datum.staticPoint && datum.staticPoint === true',
						value: 6,
					},
					{
						value: 2,
					},
				],
			},
		},
	},
	{
		name: 'line0_point',
		type: 'symbol',
		from: {
			data: 'line0_highlightedData',
		},
		interactive: false,
		encode: {
			enter: {
				y: {
					scale: 'yLinear',
					field: 'value',
				},
				fill: {
					signal: 'backgroundColor',
				},
				stroke: {
					scale: 'color',
					field: 'series',
				},
			},
			update: {
				x: {
					scale: 'xTime',
					field: 'datetime0',
				},
				size: [
					{
						test: 'datum.staticPoint && datum.staticPoint === true',
						value: 64,
					},
					{
						value: 100,
					},
				],
				stroke: [
					{
						test: '(line0_voronoiHoveredId && line0_voronoiHoveredId === datum.prismMarkId || line0_selectedId && line0_selectedId === datum.prismMarkId) && datum.staticPoint',
						scale: 'color',
						field: 'series',
					},
					{
						test: 'datum.staticPoint && datum.staticPoint === true',
						signal: 'backgroundColor',
					},
					{
						scale: 'color',
						field: 'series',
					},
				],
				strokeWidth: [
					{
						test: 'datum.staticPoint && datum.staticPoint === true',
						value: 6,
					},
					{
						value: 2,
					},
				],
				fill: [
					{
						test: 'datum.staticPoint && datum.staticPoint === true',
						scale: 'color',
						field: 'series',
					},
					{
						signal: 'backgroundColor',
					},
				],
				strokeOpacity: [
					{
						test: '(line0_voronoiHoveredId && line0_voronoiHoveredId === datum.prismMarkId || line0_selectedId && line0_selectedId === datum.prismMarkId) && datum.staticPoint',
						value: 0.2,
					},
				],
			},
		},
	},
	line0_pointsForVoronoiMark,
	line0_voronoiMark,
];

const displayPointMarks = [
	line0_groupMark,
	{
		name: 'line0_points',
		type: 'symbol',
		from: {
			data: 'line0_pointsData',
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
					signal: 'backgroundColor',
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
				})[2].transform,
			).toStrictEqual([
				{
					type: 'joinaggregate',
					groupby: ['series'],
					fields: ['value'],
					ops: ['mean'],
					as: ['prismTrendlineValue'],
				},
			]);
		});

		test('should not do anything for movingAverage trendline since it is not supported yet', () => {
			expect(
				addData(baseData, {
					...defaultLineProps,
					children: [createElement(Trendline, { method: 'movingAverage' })],
				})[0].transform,
			).toHaveLength(2);
		});

		test('adds point data if displayPointMark is not undefined', () => {
			const resultData = addData(baseData ?? [], {
				...defaultLineProps,
				staticPoint: 'staticPoint',
			});
			expect(resultData.find((data) => data.name === 'line0_pointsData')).toStrictEqual({
				name: 'line0_pointsData',
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
				}),
			).toStrictEqual([defaultSpec.scales?.[0], defaultLinearScale, defaultSpec.scales?.[2]]);
		});

		test('point', () => {
			expect(
				setScales(startingSpec.scales ?? [], {
					...defaultLineProps,
					scaleType: 'point',
				}),
			).toStrictEqual([defaultSpec.scales?.[0], defaultPointScale, defaultSpec.scales?.[2]]);
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
			expect(addLineMarks([], { ...defaultLineProps, children: [createElement(MetricRange)] })).toStrictEqual(
				metricRangeMarks,
			);
		});

		test('with displayPointMark', () => {
			expect(addLineMarks([], { ...defaultLineProps, staticPoint: 'staticPoint' })).toStrictEqual(
				displayPointMarks,
			);
		});

		test('with displayPointMark and metric range', () => {
			expect(
				addLineMarks([], {
					...defaultLineProps,
					staticPoint: 'staticPoint',
					children: [createElement(MetricRange)],
				}),
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
					defaultLineProps,
				),
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
				{ ...defaultLineProps, children: [createElement(ChartPopover)] },
			);

			expect(getGenericSignalSpy).toHaveBeenCalledTimes(1);
			expect(getGenericSignalSpy).not.toHaveBeenCalledWith('line0_selectedSeries');
		});

		test('hover signals with metric range', () => {
			expect(addSignals([], { ...defaultLineProps, children: [createElement(MetricRange)] })).toStrictEqual([
				{
					name: 'line0MetricRange_hoveredSeries',
					value: null,
					on: [
						{
							events: '@line0_voronoi:mouseover',
							update: 'datum.datum.prismSeriesId',
						},
						{
							events: '@line0_voronoi:mouseout',
							update: 'null',
						},
					],
				},
				{
					name: 'line0_voronoiHoveredId',
					value: null,
					on: [
						{
							events: '@line0_voronoi:mouseover',
							update: 'datum.datum.prismMarkId',
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
					children: [createElement(MetricRange)],
				}),
			).toStrictEqual([
				{
					name: 'line0MetricRange_hoveredSeries',
					value: null,
					on: [
						{
							events: '@line0_voronoi:mouseover',
							update: 'datum.datum.prismSeriesId',
						},
						{
							events: '@line0_voronoi:mouseout',
							update: 'null',
						},
					],
				},
				{
					name: 'line0_voronoiHoveredId',
					value: null,
					on: [
						{
							events: '@line0_voronoi:mouseover',
							update: 'datum.datum.prismMarkId',
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
