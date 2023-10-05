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

import { Annotation } from '@components/Annotation';
import { ChartPopover } from '@components/ChartPopover';
import { ChartTooltip } from '@components/ChartTooltip';
import { Trendline } from '@components/Trendline';
import {
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_CONTINUOUS_DIMENSION,
	DEFAULT_METRIC,
	FILTERED_TABLE,
	TABLE,
} from '@constants';
import { LineSpecProps } from 'types';

import {
	applyTrendlinePropDefaults,
	getTrendlineData,
	getTrendlineDimensionRangeTransforms,
	getTrendlineMarks,
	getTrendlineSignals,
	getTrendlines,
} from './trendlineUtils';

const defaultLineProps: LineSpecProps = {
	children: [createElement(Trendline, { method: 'average' })],
	color: DEFAULT_COLOR,
	colorScheme: DEFAULT_COLOR_SCHEME,
	dimension: DEFAULT_CONTINUOUS_DIMENSION,
	index: 0,
	lineType: { value: 'solid' },
	metric: DEFAULT_METRIC,
	name: 'line0',
	opacity: { value: 1 },
	scaleType: 'time',
};

describe('getTrendlines()', () => {
	test('should return an array of trendline props', () => {
		const children = [
			createElement(Annotation),
			createElement(Trendline, { method: 'average' }),
			createElement(Trendline, { method: 'linear' }),
		];
		const trendlines = getTrendlines(children, 'line0');
		expect(trendlines).toHaveLength(2);
		expect(trendlines[0]).toHaveProperty('method', 'average');
		expect(trendlines[1]).toHaveProperty('method', 'linear');
	});

	test('should return an empty array if there are not any trendline child elements', () => {
		const children = [createElement(Annotation)];
		const trendlines = getTrendlines(children, 'line0');
		expect(trendlines).toHaveLength(0);
	});
});

describe('applyTrendlinePropDefaults()', () => {
	test('should add defaults', () => {
		const props = applyTrendlinePropDefaults({}, 'line0', 0);
		expect(props).toHaveProperty('method', 'linear');
		expect(props).toHaveProperty('dimensionRange', [null, null]);
		expect(props).toHaveProperty('lineType', 'dashed');
		expect(props).toHaveProperty('lineWidth', 'M');
		expect(props).toHaveProperty('metric', 'prismTrendlineValue');
		expect(props).toHaveProperty('rollingWindow', 7);
	});
});

describe('getTrendlineMarks()', () => {
	test('should return line mark', () => {
		const marks = getTrendlineMarks(defaultLineProps);
		// group mark
		expect(marks).toHaveLength(1);
		expect(marks[0]).toHaveProperty('type', 'group');
		// line mark
		expect(marks[0].marks).toHaveLength(1);
		expect(marks[0].marks?.[0]).toHaveProperty('type', 'line');
	});
	test('should use series color if static color is not provided', () => {
		const marks = getTrendlineMarks(defaultLineProps);
		expect(marks[0].marks?.[0].encode?.enter?.stroke).toEqual({ field: 'series', scale: 'color' });
	});
	test('should use static color if provided', () => {
		const marks = getTrendlineMarks({
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'average', color: 'gray-500' })],
		});
		expect(marks[0].marks?.[0].encode?.enter?.stroke).toEqual({ value: 'rgb(144, 144, 144)' });
	});
	test('should add hover marks if ChartTooltip exists on Trendline', () => {
		const marks = getTrendlineMarks({
			...defaultLineProps,
			children: [createElement(Trendline, { children: createElement(ChartTooltip) })],
		});
		expect(marks).toHaveLength(2);
		expect(marks[1]).toHaveProperty('type', 'group');
		// line mark
		expect(marks[1].marks).toHaveLength(5);
		expect(marks[1].marks?.[0]).toHaveProperty('type', 'rule');
		expect(marks[1].marks?.[1]).toHaveProperty('type', 'symbol');
		expect(marks[1].marks?.[2]).toHaveProperty('type', 'symbol');
		expect(marks[1].marks?.[3]).toHaveProperty('type', 'symbol'); // highlight point background
		expect(marks[1].marks?.[4]).toHaveProperty('type', 'path');
	});
});

describe('getTrendlineData()', () => {
	test('should return data source for trendline', () => {
		const trendlineData = getTrendlineData(defaultLineProps);
		expect(trendlineData).toStrictEqual([
			{
				name: 'line0Trendline0_data',
				source: FILTERED_TABLE,
				transform: [
					{
						as: ['prismTrendlineValue'],
						fields: [DEFAULT_METRIC],
						groupby: [DEFAULT_COLOR],
						ops: ['mean'],
						type: 'joinaggregate',
					},
				],
			},
		]);
	});

	test('should add data sources for hover interactiontions if ChartTooltip exists', () => {
		const trendlineData = getTrendlineData({
			...defaultLineProps,
			children: [createElement(Trendline, { children: createElement(ChartTooltip) })],
		});
		expect(trendlineData).toHaveLength(3);
		expect(trendlineData[1]).toHaveProperty('name', 'line0_allTrendlineData');
		expect(trendlineData[2]).toHaveProperty('name', 'line0Trendline_highlightedData');
	});
});

describe('getTrendlineDimensionRangeTransforms()', () => {
	test('should add filters if the dimensionRange has non-null values', () => {
		const transforms = getTrendlineDimensionRangeTransforms(DEFAULT_CONTINUOUS_DIMENSION, [1, 2]);
		expect(transforms).toHaveLength(2);
		expect(transforms).toStrictEqual([
			{ expr: `datum.${DEFAULT_CONTINUOUS_DIMENSION} >= 1`, type: 'filter' },
			{ expr: `datum.${DEFAULT_CONTINUOUS_DIMENSION} <= 2`, type: 'filter' },
		]);
		expect(getTrendlineDimensionRangeTransforms(DEFAULT_CONTINUOUS_DIMENSION, [null, 2])).toHaveLength(1);
		expect(getTrendlineDimensionRangeTransforms(DEFAULT_CONTINUOUS_DIMENSION, [1, null])).toHaveLength(1);
		expect(getTrendlineDimensionRangeTransforms(DEFAULT_CONTINUOUS_DIMENSION, [null, null])).toHaveLength(0);
	});
});

describe('getTrendlineSignals()', () => {
	test('should return voronoi hover signal if ChartTooltip exists', () => {
		const signals = getTrendlineSignals({
			...defaultLineProps,
			children: [createElement(Trendline, { children: createElement(ChartTooltip) })],
		});
		expect(signals).toHaveLength(1);
		expect(signals[0]).toHaveProperty('name', 'line0Trendline_voronoiHoveredId');
	});

	test('should not return any signals if there is not a ChartTooltip', () => {
		const signals = getTrendlineSignals(defaultLineProps);
		expect(signals).toHaveLength(0);
	});

	test('should return voronoi selected signal if ChartPopover exists', () => {
		const signals = getTrendlineSignals({
			...defaultLineProps,
			children: [
				createElement(Trendline, { children: createElement(ChartTooltip) }),
				createElement(Trendline, { children: createElement(ChartPopover) }),
			],
		});
		expect(signals).toHaveLength(2);
		expect(signals[1]).toHaveProperty('name', 'line0Trendline_selectedId');
	});

	test('should not return selected signal if there is not a ChartPopover', () => {
		const signals = getTrendlineSignals({
			...defaultLineProps,
			children: [createElement(Trendline, { children: createElement(ChartTooltip) })],
		});
		expect(signals).toHaveLength(1);
		expect(signals[0].name).not.toContain('selected');
	});
});
