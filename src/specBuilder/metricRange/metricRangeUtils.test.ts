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

import { MetricRange } from '@components/MetricRange';
import {
	COLOR_SCALE,
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_METRIC,
	DEFAULT_OPACITY_RULE,
	DEFAULT_TIME_DIMENSION,
	DEFAULT_TRANSFORMED_TIME_DIMENSION,
	FILTERED_TABLE,
} from '@constants';

import { LineSpecProps, MetricRangeProps, MetricRangeSpecProps } from '../../types';
import {
	applyMetricRangePropDefaults,
	getMetricRangeData,
	getMetricRangeGroupMarks,
	getMetricRangeMark,
} from './metricRangeUtils';

const defaultMetricRangeProps: MetricRangeProps = {
	children: [],
	lineType: 'shortDash',
	lineWidth: 'S',
	rangeOpacity: 0.2,
	metricEnd: 'metricEnd',
	metricStart: 'metricStart',
	metric: 'metric',
};

const defaultMetricRangeSpecProps: MetricRangeSpecProps = {
	children: [],
	lineType: 'shortDash',
	lineWidth: 'S',
	rangeOpacity: 0.2,
	metricEnd: 'metricEnd',
	metricStart: 'metricStart',
	metric: 'metric',
	name: 'line0MetricRange0',
};

const defaultLineProps: LineSpecProps = {
	children: [createElement(MetricRange, defaultMetricRangeProps)],
	name: 'line0',
	dimension: DEFAULT_TIME_DIMENSION,
	index: 0,
	markType: 'line',
	metric: DEFAULT_METRIC,
	color: DEFAULT_COLOR,
	scaleType: 'time',
	lineType: { value: 'solid' },
	opacity: { value: 1 },
	colorScheme: DEFAULT_COLOR_SCHEME,
	interactiveMarkName: undefined,
	popoverMarkName: undefined,
};

const basicMetricRangeMarks = [
	{
		name: 'line0MetricRange0_line',
		type: 'line',
		from: {
			data: 'line0MetricRange0_facet',
		},
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: 'metric' },
				stroke: { scale: COLOR_SCALE, field: 'series' },
				strokeDash: { value: [3, 4] },
				strokeOpacity: DEFAULT_OPACITY_RULE,
				strokeWidth: { value: 1.5 },
			},
			update: {
				x: {
					scale: 'xTime',
					field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
				},
				opacity: [DEFAULT_OPACITY_RULE],
			},
		},
	},
	{
		name: 'line0MetricRange0_area',
		type: 'area',
		from: {
			data: 'line0MetricRange0_facet',
		},
		interactive: false,
		encode: {
			enter: {
				tooltip: undefined,
				y: { scale: 'yLinear', field: 'metricStart' },
				y2: { scale: 'yLinear', field: 'metricEnd' },
				fill: { scale: COLOR_SCALE, field: 'series' },
			},
			update: {
				cursor: undefined,
				x: { scale: 'xTime', field: DEFAULT_TRANSFORMED_TIME_DIMENSION },
				fillOpacity: { value: 0.2 },
				opacity: [DEFAULT_OPACITY_RULE],
			},
		},
	},
];

describe('applyMetricRangePropDefaults', () => {
	test('applies defaults', () => {
		expect(
			applyMetricRangePropDefaults({ metricEnd: 'metricStart', metricStart: 'metricEnd' }, 'line0', 0)
		).toEqual({
			children: {},
			displayOnHover: false,
			lineType: 'dashed',
			lineWidth: 'S',
			name: 'line0MetricRange0',
			rangeOpacity: 0.2,
			metricEnd: 'metricStart',
			metricStart: 'metricEnd',
			metric: 'value',
		});
	});
	test('skips assigned values', () => {
		expect(
			applyMetricRangePropDefaults(
				{
					lineType: 'solid',
					lineWidth: 'L',
					metricEnd: 'metricStart',
					metricStart: 'metricEnd',
					metric: 'testMetric',
					rangeOpacity: 0.5,
					displayOnHover: true,
				},
				'line0',
				0
			)
		).toEqual({
			children: {},
			displayOnHover: true,
			lineType: 'solid',
			lineWidth: 'L',
			name: 'line0MetricRange0',
			rangeOpacity: 0.5,
			metric: 'testMetric',
			metricEnd: 'metricStart',
			metricStart: 'metricEnd',
		});
	});
});

describe('getMetricRangeMark', () => {
	test('creates MetricRange mark from basic input', () => {
		expect(getMetricRangeMark(defaultLineProps, defaultMetricRangeSpecProps)).toEqual(basicMetricRangeMarks);
	});
});

describe('getMetricRangeGroupMarks', () => {
	test('creates MetricRange group mark from basic input', () => {
		expect(getMetricRangeGroupMarks(defaultLineProps)).toEqual([
			{
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
				marks: basicMetricRangeMarks,
			},
		]);
	});
});

describe('getMetricRangeData', () => {
	test('creates metric range data from basic input', () => {
		const data = getMetricRangeData({
			...defaultLineProps,
			children: [createElement(MetricRange, { ...defaultMetricRangeProps, displayOnHover: true })],
		});
		expect(data).toHaveLength(1);
		expect(data[0]).toHaveProperty('name', 'line0MetricRange0_highlightedData');
	});
});
