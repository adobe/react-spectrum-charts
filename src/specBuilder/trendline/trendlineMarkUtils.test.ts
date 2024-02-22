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

import { ChartTooltip } from '@components/ChartTooltip';
import { Trendline } from '@components/Trendline';
import { COLOR_SCALE, DEFAULT_TIME_DIMENSION, TRENDLINE_VALUE } from '@constants';
import { spectrumColors } from '@themes';
import { createElement } from 'react';
import { Facet, From, GroupMark, Mark } from 'vega';
import {
	getRuleXEncodings,
	getRuleYEncodings,
	getTrendlineLineMark,
	getTrendlineMarks,
	getTrendlineRuleMark,
} from './trendlineMarkUtils';
import { defaultLineProps, defaultTrendlineProps } from './trendlineTestUtils';

describe('getTrendlineMarks()', () => {
	test('should return rule mark for aggregate methods', () => {
		const marks = getTrendlineMarks({
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'median' })],
		});
		expect(marks).toHaveLength(1);
		expect(marks[0]).toHaveProperty('type', 'rule');
	});
	test('should return group and line mark for non-aggregate methods', () => {
		const marks = getTrendlineMarks({
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'linear' })],
		});
		// group mark
		expect(marks).toHaveLength(1);
		expect(marks[0]).toHaveProperty('type', 'group');
		const groupMark = marks[0] as GroupMark;
		// line mark
		expect(groupMark.marks).toHaveLength(1);
		expect(groupMark.marks?.[0]).toHaveProperty('type', 'line');
	});
	test('should add hover marks if ChartTooltip exists on Trendline', () => {
		const marks = getTrendlineMarks({
			...defaultLineProps,
			children: [createElement(Trendline, {}, createElement(ChartTooltip))],
		});
		expect(marks).toHaveLength(2);
		expect(marks[1]).toHaveProperty('type', 'group');
		const trendlineMarks = (marks[1] as GroupMark).marks as Mark[];
		// line mark
		expect(trendlineMarks).toHaveLength(5);
		expect(trendlineMarks[0]).toHaveProperty('type', 'rule');
		expect(trendlineMarks[1]).toHaveProperty('type', 'symbol');
		expect(trendlineMarks[2]).toHaveProperty('type', 'symbol');
		expect(trendlineMarks[3]).toHaveProperty('type', 'symbol'); // highlight point background
		expect(trendlineMarks[4]).toHaveProperty('type', 'path');
	});
	test('should reference _data for window method', () => {
		const marks = getTrendlineMarks({
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'movingAverage-2' })],
		});
		expect(
			(
				marks[0].from as From & {
					facet: Facet;
				}
			).facet.data,
		).toEqual('line0Trendline0_data');
	});
	test('should reference _highResolutionData for linear method', () => {
		const marks = getTrendlineMarks({
			...defaultLineProps,
			children: [createElement(Trendline, { method: 'linear' })],
		});
		expect(
			(
				marks[0].from as From & {
					facet: Facet;
				}
			).facet.data,
		).toEqual('line0Trendline0_highResolutionData');
	});
});

describe('getTrendlineRuleMark()', () => {
	test('should use series color if static color is not provided', () => {
		const mark = getTrendlineRuleMark(defaultLineProps, { ...defaultTrendlineProps, method: 'median' });
		expect(mark.encode?.enter?.stroke).toEqual({ field: 'series', scale: COLOR_SCALE });
	});
	test('should use static color if provided', () => {
		const mark = getTrendlineRuleMark(defaultLineProps, {
			...defaultTrendlineProps,
			color: 'gray-500',
			method: 'median',
		});
		expect(mark.encode?.enter?.stroke).toEqual({ value: spectrumColors.light['gray-500'] });
	});
});

describe('getRuleYEncodings()', () => {
	test('should return the correct rules for numeric extent', () => {
		const encoding = getRuleYEncodings([0, 10], 'count', 'vertical');
		expect(encoding).toHaveProperty('y', { scale: 'yLinear', value: 0 });
		expect(encoding).toHaveProperty('y2', { scale: 'yLinear', value: 10 });
	});
	test('should return the correct rules for "domain" extent', () => {
		const encoding = getRuleYEncodings(['domain', 'domain'], 'count', 'vertical');
		expect(encoding).toHaveProperty('y', { value: 0 });
		expect(encoding).toHaveProperty('y2', { signal: 'height' });
	});
	test('should return the correct rules for null extent', () => {
		const encoding = getRuleYEncodings([null, null], 'count', 'vertical');
		expect(encoding).toHaveProperty('y', { scale: 'yLinear', field: 'countMin' });
		expect(encoding).toHaveProperty('y2', { scale: 'yLinear', field: 'countMax' });
	});

	test('should return the corret rules for horizontal orientation', () => {
		const encoding = getRuleYEncodings([0, 10], 'count', 'horizontal');
		expect(encoding).toHaveProperty('y', { scale: 'yLinear', field: TRENDLINE_VALUE });
		expect(encoding).not.toHaveProperty('y2');
	});
});

describe('getRuleXEncondings()', () => {
	test('should return the correct rules for numeric extent', () => {
		const encoding = getRuleXEncodings([0, 10], 'count', 'linear', 'horizontal');
		expect(encoding).toHaveProperty('x', { scale: 'xLinear', value: 0 });
		expect(encoding).toHaveProperty('x2', { scale: 'xLinear', value: 10 });
	});
	test('should return the correct rules for "domain" extent', () => {
		const encoding = getRuleXEncodings(['domain', 'domain'], 'count', 'linear', 'horizontal');
		expect(encoding).toHaveProperty('x', { value: 0 });
		expect(encoding).toHaveProperty('x2', { signal: 'width' });
	});
	test('should return the correct rules for null extent', () => {
		const encoding = getRuleXEncodings([null, null], 'count', 'linear', 'horizontal');
		expect(encoding).toHaveProperty('x', { scale: 'xLinear', field: 'countMin' });
		expect(encoding).toHaveProperty('x2', { scale: 'xLinear', field: 'countMax' });
	});

	test('should return the corret rules for vertical orientation', () => {
		const encoding = getRuleXEncodings([0, 10], 'count', 'linear', 'vertical');
		expect(encoding).toHaveProperty('x', { scale: 'xLinear', field: TRENDLINE_VALUE });
		expect(encoding).not.toHaveProperty('x2');
	});
});

describe('getTrendlineLineMark()', () => {
	test('should use normalized values for x if it is a regression method and scale is time', () => {
		expect(
			getTrendlineLineMark(defaultLineProps, { ...defaultTrendlineProps, method: 'linear' }).encode?.update?.x,
		).toEqual({
			scale: 'xTrendline',
			field: `${DEFAULT_TIME_DIMENSION}Normalized`,
		});
	});
	test('should use regular x rule if the x dimension is not normalized', () => {
		expect(
			getTrendlineLineMark(defaultLineProps, { ...defaultTrendlineProps, method: 'median' }).encode?.update?.x,
		).toEqual({ field: DEFAULT_TIME_DIMENSION, scale: 'xTime' });
		expect(
			getTrendlineLineMark(defaultLineProps, { ...defaultTrendlineProps, method: 'movingAverage-12' }).encode
				?.update?.x,
		).toEqual({ field: DEFAULT_TIME_DIMENSION, scale: 'xTime' });
		expect(
			getTrendlineLineMark(
				{ ...defaultLineProps, scaleType: 'linear', dimension: 'count' },
				{ ...defaultTrendlineProps, dimensionScaleType: 'linear' },
			).encode?.update?.x,
		).toEqual({ field: 'count', scale: 'xLinear' });
	});
	test('should use series color if static color is not provided', () => {
		const mark = getTrendlineLineMark(defaultLineProps, defaultTrendlineProps);
		expect(mark.encode?.enter?.stroke).toEqual({ field: 'series', scale: COLOR_SCALE });
	});
	test('should use static color if provided', () => {
		const mark = getTrendlineLineMark(defaultLineProps, { ...defaultTrendlineProps, color: 'gray-500' });
		expect(mark.encode?.enter?.stroke).toEqual({ value: spectrumColors.light['gray-500'] });
	});
});
