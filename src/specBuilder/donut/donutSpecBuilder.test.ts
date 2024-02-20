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

import { ChartPopover } from '@components/ChartPopover';
import { COLOR_SCALE, FILTERED_TABLE, MARK_ID } from '@constants';
import { DonutSpecProps } from 'types';

import { addData } from './donutSpecBuilder';
import { addMarks } from './donutSpecBuilder';
import { addSignals } from './donutSpecBuilder';
import { addScales } from './donutSpecBuilder';
import { addDonut } from './donutSpecBuilder';
import { getAggregateMetricMark, getArcMark, getDirectLabelMark, getPercentMetricMark } from './donutUtils';

describe('addData', () => {
	test('should add data correctly for boolean donut', () => {
		const data = [{ name: FILTERED_TABLE }];
		const props: DonutSpecProps = {
			index: 0,
			colorScheme: 'light',
			metric: 'testMetric',
			startAngle: 0,
			name: 'testName',
			isBoolean: true,
			segment: 'testSegment',
			color: 'testColor',
			holeRatio: 0.5,
			metricLabel: 'testLabel',
			hasDirectLabels: true,
			children: [],
		};
		const result = addData(data, props);
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
		const props: DonutSpecProps = {
			index: 0,
			colorScheme: 'light',
			metric: 'testMetric',
			startAngle: 1.7,
			name: 'testName',
			isBoolean: false,
			segment: 'testSegment',
			color: 'testColor',
			holeRatio: 0.5,
			metricLabel: 'testLabel',
			hasDirectLabels: true,
			children: [],
		};
		const result = addData(data, props);
		expect(result).toEqual([
			{
				name: FILTERED_TABLE,
				transform: [
					{
						type: 'pie',
						field: 'testMetric',
						startAngle: 1.7,
						endAngle: { signal: '1.7 + 2 * PI' },
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
	test('should add marks correctly for boolean donut', () => {
		const marks = [];
		const props: DonutSpecProps = {
			index: 0,
			colorScheme: 'light',
			metric: 'testMetric',
			startAngle: 0,
			name: 'testName',
			isBoolean: true,
			segment: 'testSegment',
			color: 'testColor',
			holeRatio: 0.5,
			metricLabel: 'testLabel',
			hasDirectLabels: true,
			children: [],
		};
		const result = addMarks(marks, props);
		const expectedMarks = [
			getArcMark(props.name, props.holeRatio, 'min(width, height) / 2', props.children),
			getPercentMetricMark(
				props.name,
				props.metric,
				'min(width, height) / 2',
				props.holeRatio,
				props.metricLabel,
			),
		];
		expect(result).toEqual(expectedMarks);
	});

	test('should add marks correctly for non-boolean donut', () => {
		const marks = [];
		const props: DonutSpecProps = {
			index: 0,
			colorScheme: 'light',
			metric: 'testMetric',
			startAngle: 1.7,
			name: 'testName',
			isBoolean: false,
			segment: 'testSegment',
			color: 'testColor',
			holeRatio: 0.5,
			metricLabel: 'testLabel',
			hasDirectLabels: true,
			children: [],
		};
		const result = addMarks(marks, props);
		const expectedMarks = [
			getArcMark(props.name, props.holeRatio, 'min(width, height) / 2', props.children),
			getAggregateMetricMark(
				props.name,
				props.metric,
				'min(width, height) / 2',
				props.holeRatio,
				props.metricLabel,
			),
			getDirectLabelMark(props.name, 'min(width, height) / 2', props.metric, props.segment!),
		];
		expect(result).toEqual(expectedMarks);
	});

	test('should throw error when hasDirectLabels is true but segment is not provided', () => {
		const marks = [];
		const props: DonutSpecProps = {
			index: 0,
			colorScheme: 'light',
			metric: 'testMetric',
			startAngle: 1.7,
			name: 'testName',
			isBoolean: false,
			segment: undefined,
			color: 'testColor',
			holeRatio: 0.5,
			metricLabel: 'testLabel',
			hasDirectLabels: true,
			children: [],
		};
		expect(() => addMarks(marks, props)).toThrow(
			'If a Donut chart hasDirectLabels, a segment property name must be supplied.',
		);
	});
});

describe('donutSpecBuilder', () => {
	test('should add signals correctly when there is no popover', () => {
		const signals = [];
		const props: DonutSpecProps = {
			index: 0,
			colorScheme: 'light',
			metric: 'testMetric',
			startAngle: 1.7,
			name: 'testName',
			isBoolean: false,
			segment: 'testSegment',
			color: 'testColor',
			holeRatio: 0.5,
			metricLabel: 'testLabel',
			hasDirectLabels: true,
			children: [],
		};
		const result = addSignals(signals, props);
		const expectedSignals = [
			{
				name: 'testName_hoveredId',
				value: null,
				on: [
					{
						events: '@testName:mouseover',
						update: `datum.${MARK_ID}`,
					},
					{
						events: '@testName:mouseout',
						update: 'null',
					},
				],
			},
		];
		expect(result).toEqual(expectedSignals);
	});

	test('doesnt double add hovoredId signal', () => {
		const signals = [
			{
				name: 'testName_hoveredId',
				value: null,
				on: [
					{
						events: '@testName:mouseover',
						update: `datum.${MARK_ID}`,
					},
					{
						events: '@testName:mouseout',
						update: 'null',
					},
				],
			},
		];
		const props: DonutSpecProps = {
			index: 0,
			colorScheme: 'light',
			metric: 'testMetric',
			startAngle: 1.7,
			name: 'testName',
			isBoolean: false,
			segment: 'testSegment',
			color: 'testColor',
			holeRatio: 0.5,
			metricLabel: 'testLabel',
			hasDirectLabels: true,
			children: [],
		};
		const result = addSignals(signals, props);
		const expectedSignals = [
			{
				name: 'testName_hoveredId',
				value: null,
				on: [
					{
						events: '@testName:mouseover',
						update: `datum.${MARK_ID}`,
					},
					{
						events: '@testName:mouseout',
						update: 'null',
					},
				],
			},
		];
		expect(result).toEqual(expectedSignals);
	});

	test('should add signals correctly when there is a popover', () => {
		const signals = [];
		const props: DonutSpecProps = {
			index: 0,
			colorScheme: 'light',
			metric: 'testMetric',
			startAngle: 1.7,
			name: 'testName',
			isBoolean: false,
			segment: 'testSegment',
			color: 'testColor',
			holeRatio: 0.5,
			metricLabel: 'testLabel',
			hasDirectLabels: true,
			children: [createElement(ChartPopover)],
		};
		const result = addSignals(signals, props);
		const expectedSignals = [
			{
				name: 'testName_hoveredId',
				value: null,
				on: [
					{
						events: '@testName:mouseover',
						update: `datum.${MARK_ID}`,
					},
					{
						events: '@testName:mouseout',
						update: 'null',
					},
				],
			},
			{
				name: 'testName_selectedId',
				value: null,
			},
		];
		expect(result).toEqual(expectedSignals);
	});

	test('doesnt double add selectedId signal', () => {
		const signals = [
			{
				name: 'testName_selectedId',
				value: null,
			},
		];
		const props: DonutSpecProps = {
			index: 0,
			colorScheme: 'light',
			metric: 'testMetric',
			startAngle: 1.7,
			name: 'testName',
			isBoolean: false,
			segment: 'testSegment',
			color: 'testColor',
			holeRatio: 0.5,
			metricLabel: 'testLabel',
			hasDirectLabels: true,
			children: [createElement(ChartPopover)],
		};
		const result = addSignals(signals, props);
		const expectedSignals = [
			{
				name: 'testName_selectedId',
				value: null,
			},
			{
				name: 'testName_hoveredId',
				value: null,
				on: [
					{
						events: '@testName:mouseover',
						update: `datum.${MARK_ID}`,
					},
					{
						events: '@testName:mouseout',
						update: 'null',
					},
				],
			},
		];
		expect(result).toEqual(expectedSignals);
	});
});

describe('donutSpecBuilder', () => {
	test('should add scales correctly', () => {
		const scales = [];
		const props: DonutSpecProps = {
			index: 0,
			colorScheme: 'light',
			metric: 'testMetric',
			startAngle: 0,
			name: 'testName',
			isBoolean: false,
			segment: 'testSegment',
			color: 'testColor',
			holeRatio: 0.5,
			metricLabel: 'testLabel',
			hasDirectLabels: true,
			children: [],
		};
		const result = addScales(scales, props);
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
		const props: DonutSpecProps = {
			children: [],
			color: 'testColor',
			colorScheme: 'light',
			index: 0,
			metric: 'testMetric',
			name: 'testName',
			startAngle: 0,
			holeRatio: 0.85,
			segment: 'testSegment',
			hasDirectLabels: false,
			isBoolean: false,
		};
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
