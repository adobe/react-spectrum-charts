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
import { createElement } from 'react';

import { ChartTooltip } from '@components/ChartTooltip';
import { COLOR_SCALE, FILTERED_TABLE, HIGHLIGHTED_ITEM } from '@constants';
import { defaultSignals } from '@specBuilder/specTestUtils';

import { DonutSpecProps } from '../../types';
import { addData, addDonut, addMarks, addScales, addSignals } from './donutSpecBuilder';
import { defaultDonutProps } from './donutTestUtils';

describe('addData', () => {
	test('should add data correctly for boolean donut', () => {
		const data = [{ name: FILTERED_TABLE }];
		const result = addData(data, { ...defaultDonutProps, isBoolean: true });
		expect(result).toEqual([
			{
				name: FILTERED_TABLE,
				transform: [
					{
						type: 'pie',
						field: 'testMetric',
						startAngle: 0,
						endAngle: { signal: '0 + 2 * PI' },
					},
				],
			},
			{
				name: 'testName_booleanData',
				source: FILTERED_TABLE,
				transform: [
					{
						type: 'window',
						ops: ['row_number'],
						as: ['testName_rscRowIndex'],
					},
					{
						type: 'filter',
						expr: 'datum.testName_rscRowIndex === 1',
					},
				],
			},
		]);
	});

	test('should add data correctly for non-boolean donut', () => {
		const data = [{ name: 'filteredTable' }];
		const result = addData(data, defaultDonutProps);
		expect(result).toEqual([
			{
				name: FILTERED_TABLE,
				transform: [
					{
						type: 'pie',
						field: 'testMetric',
						startAngle: 0,
						endAngle: { signal: '0 + 2 * PI' },
					},
				],
			},
			{
				name: 'testName_aggregateData',
				source: FILTERED_TABLE,
				transform: [
					{
						type: 'aggregate',
						fields: ['testMetric'],
						ops: ['sum'],
						as: ['sum'],
					},
				],
			},
		]);
	});
});

describe('addMarks', () => {
	test('should throw error when hasDirectLabels is true but segment is not provided', () => {
		const marks = [];
		const props: DonutSpecProps = {
			index: 0,
			colorScheme: 'light',
			markType: 'donut',
			metric: 'testMetric',
			startAngle: 1.7,
			name: 'testName',
			isBoolean: false,
			segment: undefined,
			color: 'testColor',
			holeRatio: 0.5,
			hasDirectLabels: true,
			children: [],
		};
		expect(() => addMarks(marks, props)).toThrow(
			'If a Donut chart hasDirectLabels, a segment property name must be supplied.'
		);
	});
});

describe('addSignals()', () => {
	test('should add a summaryFontSize signal', () => {
		const signals = addSignals(defaultSignals, defaultDonutProps);
		expect(signals).toHaveLength(defaultSignals.length + 1);
		expect(signals.at(-1)).toHaveProperty('name', 'testName_summaryFontSize');
	});

	test('should add hover events when tooltip is present', () => {
		const signals = addSignals(defaultSignals, { ...defaultDonutProps, children: [createElement(ChartTooltip)] });
		expect(signals).toHaveLength(defaultSignals.length + 1);
		expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
		expect(signals[0].on).toHaveLength(2);
		expect(signals[0].on?.[0]).toHaveProperty('events', '@testName:mouseover');
		expect(signals[0].on?.[1]).toHaveProperty('events', '@testName:mouseout');
	});
	test('should exclude data with key from update if tooltip has excludeDataKey', () => {
		const signals = addSignals(defaultSignals, {
			...defaultDonutProps,
			children: [createElement(ChartTooltip, { excludeDataKeys: ['excludeFromTooltip'] })],
		});
		expect(signals).toHaveLength(defaultSignals.length + 1);
		expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
		expect(signals[0].on).toHaveLength(2);
		expect(signals[0].on?.[0]).toHaveProperty('events', '@testName:mouseover');
		expect(signals[0].on?.[0]).toHaveProperty('update', '(datum.excludeFromTooltip) ? null : datum.rscMarkId');
		expect(signals[0].on?.[1]).toHaveProperty('events', '@testName:mouseout');
	});
});

describe('donutSpecBuilder', () => {
	test('should add scales correctly', () => {
		const scales = [];
		const result = addScales(scales, defaultDonutProps);
		const expectedScales = [
			{
				domain: {
					data: 'table',
					fields: ['testColor'],
				},
				name: COLOR_SCALE,
				type: undefined,
			},
		];
		expect(result).toEqual(expectedScales);
	});
});

describe('donutSpecBuilder', () => {
	test('should add donut correctly', () => {
		const spec = { data: [{ name: FILTERED_TABLE }] };
		const props = { ...defaultDonutProps, holeRatio: 0.85 };
		const result = addDonut(spec, props);
		const expectedSpec = {
			data: addData(spec.data, props),
			scales: addScales([], props),
			marks: addMarks([], props),
			signals: addSignals([], props),
		};
		expect(result).toEqual(expectedSpec);
	});
});
