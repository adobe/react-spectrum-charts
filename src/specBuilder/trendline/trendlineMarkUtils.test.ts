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
import { DEFAULT_TIME_DIMENSION } from '@constants';
import { spectrumColors } from '@themes';
import { createElement } from 'react';
import { Facet, From, GroupMark, Mark } from 'vega';
import {
	getRuleX2ProductionRule,
	getRuleXProductionRule,
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
		expect(mark.encode?.enter?.stroke).toEqual({ field: 'series', scale: 'color' });
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

describe('getRuleXProductionRule()', () => {
	test('should return the correct production rule for a number value extent', () => {
		expect(getRuleXProductionRule(0, 'count', 'linear')).toEqual({ scale: 'xLinear', value: 0 });
		expect(getRuleXProductionRule(10, 'count', 'linear')).toEqual({ scale: 'xLinear', value: 10 });
	});
	test('should return the correct production rule for "domain" extent', () => {
		expect(getRuleXProductionRule('domain', 'count', 'linear')).toEqual({ value: 0 });
	});
	test('should return the correct production rule for null extent', () => {
		expect(getRuleXProductionRule(null, 'count', 'linear')).toEqual({ scale: 'xLinear', field: 'countMin' });
	});
});

describe('getRuleX2ProductionRule()', () => {
	test('should return the correct production rule for a number value extent', () => {
		expect(getRuleX2ProductionRule(0, 'count', 'linear')).toEqual({ scale: 'xLinear', value: 0 });
		expect(getRuleX2ProductionRule(10, 'count', 'linear')).toEqual({ scale: 'xLinear', value: 10 });
	});
	test('should return the correct production rule for "domain" extent', () => {
		expect(getRuleX2ProductionRule('domain', 'count', 'linear')).toEqual({ signal: 'width' });
	});
	test('should return the correct production rule for null extent', () => {
		expect(getRuleX2ProductionRule(null, 'count', 'linear')).toEqual({ scale: 'xLinear', field: 'countMax' });
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
		).toEqual({ field: 'datetime0', scale: 'xTime' });
		expect(
			getTrendlineLineMark(defaultLineProps, { ...defaultTrendlineProps, method: 'movingAverage-12' }).encode
				?.update?.x,
		).toEqual({ field: 'datetime0', scale: 'xTime' });
		expect(
			getTrendlineLineMark(
				{ ...defaultLineProps, scaleType: 'linear', dimension: 'count' },
				defaultTrendlineProps,
			).encode?.update?.x,
		).toEqual({ field: 'count', scale: 'xLinear' });
	});
	test('should use series color if static color is not provided', () => {
		const mark = getTrendlineLineMark(defaultLineProps, defaultTrendlineProps);
		expect(mark.encode?.enter?.stroke).toEqual({ field: 'series', scale: 'color' });
	});
	test('should use static color if provided', () => {
		const mark = getTrendlineLineMark(defaultLineProps, { ...defaultTrendlineProps, color: 'gray-500' });
		expect(mark.encode?.enter?.stroke).toEqual({ value: spectrumColors.light['gray-500'] });
	});
});
