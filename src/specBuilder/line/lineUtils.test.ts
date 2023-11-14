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
import { ChartTooltip } from '@components/ChartTooltip';
import { Trendline } from '@components/Trendline';
import {
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_CONTINUOUS_DIMENSION,
	DEFAULT_METRIC,
	FILTERED_TABLE,
	SERIES_ID,
} from '@constants';
import { FilterTransform } from 'vega';

import {
	LineMarkProps,
	getInteractiveMarkName,
	getLineHighlightedData,
	getLineHoverMarks,
	getLineMark,
	getLineStrokeOpacity,
	getPopoverMarkName,
	getXProductionRule,
} from './lineUtils';

const defaultLineProps: LineMarkProps = {
	name: 'line0',
	color: DEFAULT_COLOR,
	metric: DEFAULT_METRIC,
	dimension: DEFAULT_CONTINUOUS_DIMENSION,
	scaleType: 'time',
	lineType: { value: 'solid' },
	lineWidth: { value: 1 },
	opacity: { value: 1 },
	colorScheme: DEFAULT_COLOR_SCHEME,
};

describe('getInteractiveMarkName()', () => {
	test('should return undefined if there are no interactive children', () => {
		expect(getInteractiveMarkName([], 'line0')).toBeUndefined();
		expect(getInteractiveMarkName([createElement(Trendline)], 'line0')).toBeUndefined();
	});
	test('should return the name provided if there is a tooltip or popover in the children', () => {
		expect(getInteractiveMarkName([createElement(ChartTooltip)], 'line0')).toEqual('line0');
		expect(getInteractiveMarkName([createElement(ChartPopover)], 'line0')).toEqual('line0');
	});
	test('should return the aggregated trendline name if the line has a trendline with any interactive children', () => {
		expect(getInteractiveMarkName([createElement(Trendline, {}, createElement(ChartTooltip))], 'line0')).toEqual(
			'line0Trendline'
		);
		expect(getInteractiveMarkName([createElement(Trendline, {}, createElement(ChartPopover))], 'line0')).toEqual(
			'line0Trendline'
		);
	});
});

describe('getPopoverMarkName()', () => {
	test('should return undefined if there are no popovers', () => {
		expect(getPopoverMarkName([], 'line0')).toBeUndefined();
		expect(getPopoverMarkName([createElement(Trendline)], 'line0')).toBeUndefined();
		expect(getPopoverMarkName([createElement(ChartTooltip)], 'line0')).toBeUndefined();
	});
	test('should return the name provided if there is a popover in the children', () => {
		expect(getPopoverMarkName([createElement(ChartPopover)], 'line0')).toEqual('line0');
	});
	test('should return the aggregated trendline name if the line has a trendline with a popover on it', () => {
		expect(getPopoverMarkName([createElement(Trendline, {}, createElement(ChartPopover))], 'line0')).toEqual(
			'line0Trendline'
		);
	});
});

describe('getLineMark()', () => {
	test('should return line mark', () => {
		const lineMark = getLineMark(defaultLineProps, 'line0_facet');
		expect(lineMark).toEqual({
			name: 'line0',
			type: 'line',
			from: { data: 'line0_facet' },
			interactive: false,
			encode: {
				enter: {
					stroke: { field: 'series', scale: 'color' },
					strokeDash: { value: [] },
					strokeWidth: { value: 1 },
					y: { field: 'value', scale: 'yLinear' },
				},
				update: { x: { field: 'datetime0', scale: 'xTime' }, strokeOpacity: [{ value: 1 }] },
			},
		});
	});

	test('should have undefined strokeWidth if lineWidth if undefined', () => {
		const lineMark = getLineMark({ ...defaultLineProps, lineWidth: undefined }, 'line0_facet');
		expect(lineMark.encode?.enter?.strokeWidth).toBeUndefined();
	});

	test('adds metric range opacity rules if isMetricRange and displayOnHover', () => {
		const lineMark = getLineMark(
			{ ...defaultLineProps, interactiveMarkName: 'line0', displayOnHover: true },
			'line0_facet'
		);
		expect(lineMark.encode?.update?.strokeOpacity).toEqual([
			{
				test: `line0_hoveredSeries && line0_hoveredSeries !== datum.${SERIES_ID}`,
				value: 0,
			},
			{
				test: `line0_hoveredSeries && line0_hoveredSeries === datum.${SERIES_ID}`,
				value: 1,
			},
			{
				test: `line0_selectedSeries && line0_selectedSeries === datum.${SERIES_ID}`,
				value: 1,
			},
			{ test: `highlightedSeries && highlightedSeries === datum.${SERIES_ID}`, value: 1 },
			{ value: 0 },
		]);
	});

	test('does not add metric range opacity rules if displayOnHover is false and isMetricRange', () => {
		const lineMark = getLineMark({ ...defaultLineProps, displayOnHover: false }, 'line0_facet');
		expect(lineMark.encode?.update?.strokeOpacity).toEqual([{ value: 1 }]);
	});
});

describe('getXProductionRule()', () => {
	test('should return the correct scale based on scale type', () => {
		expect(getXProductionRule('time', 'datetime')).toEqual({ scale: 'xTime', field: 'datetime0' });
		expect(getXProductionRule('linear', 'datetime')).toEqual({ scale: 'xLinear', field: 'datetime' });
		expect(getXProductionRule('point', 'datetime')).toEqual({ scale: 'xPoint', field: 'datetime' });
	});
});

describe('getLineHoverMarks()', () => {
	test('should return 4 marks', () => {
		expect(getLineHoverMarks({ ...defaultLineProps, children: [] }, 'line0_facet')).toHaveLength(5);
	});
});

describe('getLineHighlightedData()', () => {
	test('should include select signal if hasPopover', () => {
		const expr = (getLineHighlightedData('line0', FILTERED_TABLE, true).transform?.[0] as FilterTransform).expr;
		expect(expr.includes('line0_selectedId')).toBeTruthy();
	});
	test('should not include select signal if does not hasPopover', () => {
		const expr = (getLineHighlightedData('line0', FILTERED_TABLE, false).transform?.[0] as FilterTransform).expr;
		expect(expr.includes('line0_selectedId')).toBeFalsy();
	});
});

describe('getLineStrokeOpacity()', () => {
	test('should return a basic opacity rule when using default line props', () => {
		const opacityRule = getLineStrokeOpacity(defaultLineProps);
		expect(opacityRule).toEqual([{ value: 1 }]);
	});

	test('should include hover rules if line has a tooltip', () => {
		const opacityRule = getLineStrokeOpacity({
			...defaultLineProps,
			interactiveMarkName: 'line0',
			children: [createElement(ChartTooltip)],
		});
		expect(opacityRule).toEqual([
			{ test: `line0_hoveredSeries && line0_hoveredSeries !== datum.${SERIES_ID}`, value: 0.2 },
			{ value: 1 },
		]);
	});

	test('should include select rules if line has a popover', () => {
		const opacityRule = getLineStrokeOpacity({
			...defaultLineProps,
			interactiveMarkName: 'line0',
			popoverMarkName: 'line0',
			children: [createElement(ChartPopover)],
		});
		expect(opacityRule).toEqual([
			{ test: `line0_hoveredSeries && line0_hoveredSeries !== datum.${SERIES_ID}`, value: 0.2 },
			{ test: `line0_selectedSeries && line0_selectedSeries !== datum.${SERIES_ID}`, value: 0.2 },
			{ value: 1 },
		]);
	});

	test('should include displayOnHover rules if displayOnHover is true', () => {
		const opacityRule = getLineStrokeOpacity({
			...defaultLineProps,
			interactiveMarkName: 'line0',
			displayOnHover: true,
		});
		expect(opacityRule).toEqual([
			{ test: `line0_hoveredSeries && line0_hoveredSeries !== datum.${SERIES_ID}`, value: 0 },
			{ test: `line0_hoveredSeries && line0_hoveredSeries === datum.${SERIES_ID}`, value: 1 },
			{ test: `line0_selectedSeries && line0_selectedSeries === datum.${SERIES_ID}`, value: 1 },
			{ test: `highlightedSeries && highlightedSeries === datum.${SERIES_ID}`, value: 1 },
			{ value: 0 },
		]);
	});
});
