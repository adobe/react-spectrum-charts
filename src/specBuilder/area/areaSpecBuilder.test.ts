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

import { ChartTooltip } from '@components/ChartTooltip';
import {
	BACKGROUND_COLOR,
	COLOR_SCALE,
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_METRIC,
	DEFAULT_TIME_DIMENSION,
	DEFAULT_TRANSFORMED_TIME_DIMENSION,
	PREVIOUS_TABLE,
	FILTERED_PREVIOUS_TABLE,
	FILTERED_TABLE,
	HIGHLIGHTED_ITEM,
	HIGHLIGHTED_SERIES,
	MARK_ID,
	SELECTED_ITEM,
	SELECTED_SERIES,
	TABLE,
	RSC_ANIMATION
} from '@constants';
import { defaultSignals } from '@specBuilder/specTestUtils';
import { AreaSpecProps } from 'types';
import { Data, GroupMark, Spec } from 'vega';

import { initializeSpec } from '../specUtils';
import { addArea, addAreaMarks, addData, addSignals, setScales } from './areaSpecBuilder';
import { defaultAnimationScales } from '@specBuilder/scale/scaleSpecBuilder.test';

const startingSpec: Spec = initializeSpec({
	scales: [{ name: COLOR_SCALE, type: 'ordinal' }]
});

const defaultAreaProps: AreaSpecProps = {
	children: [],
	colorScheme: DEFAULT_COLOR_SCHEME,
	color: DEFAULT_COLOR,
	dimension: DEFAULT_TIME_DIMENSION,
	index: 0,
	metric: DEFAULT_METRIC,
	name: 'area0',
	opacity: 0.8,
	scaleType: 'time',
	animations: false
};

const defaultSpec = initializeSpec({
	data: [
		{
			name: TABLE,
			transform: [
				{ as: MARK_ID, type: 'identifier' },
				{
					as: [DEFAULT_TRANSFORMED_TIME_DIMENSION, `${DEFAULT_TIME_DIMENSION}1`],
					field: DEFAULT_TIME_DIMENSION,
					type: 'timeunit',
					units: ['year', 'month', 'date', 'hours', 'minutes'],
				},
			],
			values: [],
		},
		{
			name: FILTERED_TABLE,
			source: TABLE,
			transform: [
				{
					as: ['value0', 'value1'],
					field: DEFAULT_METRIC,
					groupby: [DEFAULT_TIME_DIMENSION],
					sort: undefined,
					type: 'stack',
				},
			],
		},
		{
			name: PREVIOUS_TABLE,
			transform: [
				{ as: MARK_ID, type: 'identifier' },
				{
					as: [DEFAULT_TRANSFORMED_TIME_DIMENSION, `${DEFAULT_TIME_DIMENSION}1`],
					field: DEFAULT_TIME_DIMENSION,
					type: 'timeunit',
					units: ['year', 'month', 'date', 'hours', 'minutes'],
				},
			],
			values: [],
		},
		{
			name: FILTERED_PREVIOUS_TABLE,
			source: PREVIOUS_TABLE,
			transform: [
				{
					as: ['value0', 'value1'],
					field: DEFAULT_METRIC,
					groupby: [DEFAULT_TIME_DIMENSION],
					sort: undefined,
					type: 'stack',
				},
			],
		}
	],
	marks: [
		{
			from: {
				facet: { data: FILTERED_TABLE, groupby: DEFAULT_COLOR, name: 'area0_facet' },
			},
			marks: [
				{
					encode: {
						enter: {
							fill: { field: DEFAULT_COLOR, scale: COLOR_SCALE },
							y: { field: 'value0', scale: 'yLinear' },
							y2: { field: 'value1', scale: 'yLinear' },
							stroke: { signal: BACKGROUND_COLOR },
							strokeWidth: { value: 1.5 },
							strokeJoin: { value: 'round' },
							tooltip: undefined,
						},
						update: {
							x: { field: DEFAULT_TRANSFORMED_TIME_DIMENSION, scale: 'xTime' },
							cursor: undefined,
							fillOpacity: [{ value: 0.8 }],
						},
					},
					interactive: false,
					from: { data: 'area0_facet' },
					name: 'area0',
					type: 'area',
				},
			],
			name: 'area0_group',
			type: 'group',
		},
	],
	scales: [
		{
			domain: { data: TABLE, fields: [DEFAULT_COLOR] },
			name: COLOR_SCALE,
			type: 'ordinal',
		},
		{
			domain: { data: FILTERED_TABLE, fields: [DEFAULT_TRANSFORMED_TIME_DIMENSION] },
			name: 'xTime',
			padding: 32,
			range: 'width',
			type: 'time',
		},
		{
			domain: { data: FILTERED_TABLE, fields: ['value0', 'value1'] },
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
	domain: { data: FILTERED_TABLE, fields: [DEFAULT_TIME_DIMENSION] },
	name: 'xLinear',
	padding: 32,
	range: 'width',
	type: 'linear',
};

const defaultPointScale = {
	domain: { data: FILTERED_TABLE, fields: [DEFAULT_TIME_DIMENSION] },
	name: 'xPoint',
	paddingOuter: 0.5,
	range: 'width',
	type: 'point',
};

describe('areaSpecBuilder', () => {
	describe('addArea()', () => {
		test('should add area', () => {
			expect(addArea(startingSpec, { animations: false })).toStrictEqual(defaultSpec);
		});

		test('metricStart defined but valueEnd not defined, should default to value', () => {
			expect(addArea(startingSpec, { metricStart: 'test', animations: false })).toStrictEqual(defaultSpec);
		});
	});

	describe('addData()', () => {
		let baseData: Data[];

		beforeEach(() => {
			baseData = initializeSpec().data ?? [];
		});
		test('basic', () => {
			expect(addData(startingSpec.data ?? [], defaultAreaProps)).toStrictEqual(defaultSpec.data);
		});

		test('scaleTypes "point" and "linear" should not add timeunit transforms return the original data', () => {
			expect(
				addData(baseData, { ...defaultAreaProps, scaleType: 'point' })[0].transform?.find(
					(t) => t.type === 'timeunit'
				)
			).toBeUndefined();
			expect(
				addData(baseData, { ...defaultAreaProps, scaleType: 'linear' })[0].transform?.find(
					(t) => t.type === 'timeunit'
				)
			).toBeUndefined();
		});
	});

	describe('addSignals()', () => {
		test('no children: should return nothing', () => {
			expect(addSignals(defaultSignals, defaultAreaProps)).toStrictEqual(defaultSignals);
		});

		test('children: should add signals', () => {
			const tooltip = createElement(ChartTooltip);
			const signals = addSignals(defaultSignals, { ...defaultAreaProps, children: [tooltip] });
			expect(signals).toHaveLength(5);
			expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
			expect(signals[1]).toHaveProperty('name', HIGHLIGHTED_SERIES);
			expect(signals[1].on).toHaveLength(2);
			expect(signals[2]).toHaveProperty('name', SELECTED_ITEM);
			expect(signals[3]).toHaveProperty('name', SELECTED_SERIES);
			expect(signals[4]).toHaveProperty('name', 'area0_controlledHoveredId');
		});

		test('children: should add signals with animations', () => {
			const tooltip = createElement(ChartTooltip);
			const signals = addSignals(defaultSignals, { ...defaultAreaProps, children: [tooltip], animations: true });
			expect(signals).toHaveLength(10);
			expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
			expect(signals[1]).toHaveProperty('name', HIGHLIGHTED_SERIES);
			expect(signals[1].on).toHaveLength(2);
			expect(signals[2]).toHaveProperty('name', SELECTED_ITEM);
			expect(signals[3]).toHaveProperty('name', SELECTED_SERIES);
			expect(signals[4]).toHaveProperty('name', RSC_ANIMATION);
			expect(signals[4].on).toHaveLength(1);
			expect(signals[5]).toHaveProperty('name', 'rscColorAnimationDirection');
			expect(signals[5].on).toHaveLength(2);
			expect(signals[6]).toHaveProperty('name', 'rscColorAnimation');
			expect(signals[6].on).toHaveLength(1);
			expect(signals[7]).toHaveProperty('name', `${HIGHLIGHTED_ITEM}_prev`);
			expect(signals[7].on).toHaveLength(1);
			expect(signals[8]).toHaveProperty('name', `${HIGHLIGHTED_SERIES}_prev`);
			expect(signals[8].on).toHaveLength(1);
			expect(signals[9]).toHaveProperty('name', 'area0_controlledHoveredId');
		});
	});

	describe('setScales()', () => {
		test('time', () => {
			expect(setScales(startingSpec.scales ?? [], defaultAreaProps)).toStrictEqual(defaultSpec.scales);
		});

		test('linear', () => {
			expect(setScales(startingSpec.scales ?? [], { ...defaultAreaProps, scaleType: 'linear' })).toStrictEqual([
				defaultSpec.scales?.[0],
				defaultLinearScale,
				defaultSpec.scales?.[2],
			]);
		});

		test('linear with animations', () => {
			expect(setScales(startingSpec.scales ?? [], { ...defaultAreaProps, scaleType: 'linear', children: [createElement(ChartTooltip)], animations: true })).toStrictEqual([
				defaultSpec.scales?.[0],
				...defaultAnimationScales,
				defaultLinearScale,
				defaultSpec.scales?.[2],
			]);
		});

		test('point', () => {
			expect(setScales(startingSpec.scales ?? [], { ...defaultAreaProps, scaleType: 'point' })).toStrictEqual([
				defaultSpec.scales?.[0],
				defaultPointScale,
				defaultSpec.scales?.[2],
			]);
		});
	});

	describe('addAreaMarks()', () => {
		test('basic', () => {
			expect(addAreaMarks([], defaultAreaProps)).toStrictEqual(defaultSpec.marks);
		});

		test('linear', () => {
			const groupMark: GroupMark = defaultSpec.marks?.[0] as GroupMark;

			expect(addAreaMarks([], { ...defaultAreaProps, scaleType: 'linear' })).toStrictEqual([
				{
					...groupMark,
					marks: [
						{
							...groupMark.marks?.[0],
							encode: {
								...groupMark.marks?.[0].encode,
								update: {
									...groupMark.marks?.[0]?.encode?.update,
									x: { scale: 'xLinear', field: DEFAULT_TIME_DIMENSION },
								},
							},
						},
					],
				},
			]);
		});
	});
});
