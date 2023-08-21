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
import { DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_CONTINUOUS_DIMENSION, DEFAULT_METRIC } from '@constants';
import { createElement } from 'react';
import { LineSpecProps } from 'types';
import { Spec } from 'vega';

import { initializeSpec } from '../specUtils';
import { addData, addLine, addLineMarks, addSignals, setScales } from './lineSpecBuilder';

const defaultLineProps: LineSpecProps = {
	children: [],
	name: 'line0',
	dimension: DEFAULT_CONTINUOUS_DIMENSION,
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
			name: 'table',
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
	],
	marks: [
		{
			from: { facet: { data: 'table', groupby: [DEFAULT_COLOR], name: 'line0Facet' } },
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
					from: { data: 'line0Facet' },
					name: 'line0',
					type: 'line',
					interactive: false,
				},
			],
			name: 'line0Group',
			type: 'group',
		},
	],
	scales: [
		{ domain: { data: 'table', fields: [DEFAULT_COLOR] }, name: 'color', type: 'ordinal' },
		{
			domain: { data: 'table', fields: ['datetime0'] },
			name: 'xTime',
			padding: 32,
			range: 'width',
			type: 'time',
		},
		{
			domain: { data: 'table', fields: ['value'] },
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
	domain: { data: 'table', fields: [DEFAULT_CONTINUOUS_DIMENSION] },
	name: 'xLinear',
	padding: 32,
	range: 'width',
	type: 'linear',
};

const defaultPointScale = {
	domain: { data: 'table', fields: [DEFAULT_CONTINUOUS_DIMENSION] },
	name: 'xPoint',
	paddingOuter: 0.5,
	range: 'width',
	type: 'point',
};

describe('lineSpecBuilder', () => {
	describe('addLine()', () => {
		test('should add line', () => {
			expect(addLine(startingSpec, { color: DEFAULT_COLOR })).toStrictEqual(defaultSpec);
		});
	});

	describe('addData()', () => {
		let baseData;

		beforeEach(() => {
			baseData = initializeSpec().data;
		});

		test('basic', () => {
			expect(addData(baseData ?? [], defaultLineProps)).toStrictEqual(defaultSpec.data);
		});

		test('scaleTypes "point" and "linear" should return the original data', () => {
			expect(addData([], { ...defaultLineProps, scaleType: 'point' })).toEqual([]);
			expect(addData([], { ...defaultLineProps, scaleType: 'linear' })).toEqual([]);
		});

		test('should add trendline transform', () => {
			expect(
				addData(baseData ?? [], {
					...defaultLineProps,
					children: [createElement(Trendline, { method: 'average' })],
				})[1].transform
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
				addData(baseData ?? [], {
					...defaultLineProps,
					children: [createElement(Trendline, { method: 'movingAverage' })],
				})[0].transform
			).toHaveLength(2);
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
	});

	describe('addLineMarks()', () => {
		test('basic', () => {
			expect(addLineMarks([], defaultLineProps)).toStrictEqual(defaultSpec.marks);
		});

		test('dashed', () => {
			expect(addLineMarks([], { ...defaultLineProps, lineType: { value: [8, 8] } })).toStrictEqual([
				{
					from: { facet: { data: 'table', groupby: [DEFAULT_COLOR], name: 'line0Facet' } },
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
							from: { data: 'line0Facet' },
							name: 'line0',
							type: 'line',
							interactive: false,
						},
					],
					name: 'line0Group',
					type: 'group',
				},
			]);
		});
	});

	describe('addSignals()', () => {
		test('on children', () => {
			expect(addSignals([], defaultLineProps)).toStrictEqual([]);
		});
	});
});
