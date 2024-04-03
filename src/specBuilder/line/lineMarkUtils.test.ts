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
import {
	COLOR_SCALE,
	DEFAULT_OPACITY_RULE,
	DEFAULT_TRANSFORMED_TIME_DIMENSION,
	EASE_OUT_CUBIC,
	HIGHLIGHTED_SERIES,
	SELECTED_SERIES,
	SERIES_ID,
} from '@constants';

import { getLineHoverMarks, getLineMark, getLineOpacity } from './lineMarkUtils';
import { defaultLineMarkProps } from './lineTestUtils';

describe('getLineMark()', () => {
	test('should return line mark', () => {
		const lineMark = getLineMark(defaultLineMarkProps, 'line0_facet');
		expect(lineMark).toEqual({
			name: 'line0',
			description: 'line0',
			type: 'line',
			from: { data: 'line0_facet' },
			interactive: false,
			encode: {
				enter: {
					stroke: { field: 'series', scale: COLOR_SCALE },
					strokeDash: { value: [] },
					strokeOpacity: DEFAULT_OPACITY_RULE,
					strokeWidth: { value: 1 },
					y: { field: 'value', scale: 'yLinear' },
				},
				update: {
					x: { field: DEFAULT_TRANSFORMED_TIME_DIMENSION, scale: 'xTime' },
					opacity: [DEFAULT_OPACITY_RULE],
				},
			},
		});
	});

  test('should have no opacity rule for dimension popover highlighting', () => {
    const lineMark = getLineMark(
      { ...defaultLineMarkProps, children: [createElement(ChartPopover, { UNSAFE_highlightBy: 'dimension' })] },
      'line0_facet'
    );
    expect(lineMark.encode?.update?.opacity).toBeUndefined();
  })

  test('should return line mark with animations', () => {
		const lineMark = getLineMark({...defaultLineMarkProps, animations: true, animateFromZero: true}, 'line0_facet');
		expect(lineMark).toEqual({
			name: 'line0',
			type: 'line',
			from: { data: 'line0_facet' },
			interactive: false,
			encode: {
				enter: {
					stroke: { field: 'series', scale: COLOR_SCALE },
					strokeDash: { value: [] },
					strokeOpacity: DEFAULT_OPACITY_RULE,
					strokeWidth: { value: 1 },
					y: { field: 'value', scale: 'yLinear' },
				},
				update: {
					y: {
						scale: 'yLinear',
						signal: `datum.value * ${EASE_OUT_CUBIC}`
					},
					x: { field: DEFAULT_TRANSFORMED_TIME_DIMENSION, scale: 'xTime' },
					opacity: [DEFAULT_OPACITY_RULE],
				},
			},
		});
	});

	test('should have undefined strokeWidth if lineWidth if undefined', () => {
		const lineMark = getLineMark({ ...defaultLineMarkProps, lineWidth: undefined }, 'line0_facet');
		expect(lineMark.encode?.enter?.strokeWidth).toBeUndefined();
	});

	test('adds metric range opacity rules if isMetricRange and displayOnHover', () => {
		const lineMark = getLineMark(
			{ ...defaultLineMarkProps, interactiveMarkName: 'line0', displayOnHover: true },
			'line0_facet'
		);
		expect(lineMark.encode?.update?.opacity).toEqual([DEFAULT_OPACITY_RULE]);
	});

	test('does not add metric range opacity rules if displayOnHover is false and isMetricRange', () => {
		const lineMark = getLineMark({ ...defaultLineMarkProps, displayOnHover: false }, 'line0_facet');
		expect(lineMark.encode?.update?.opacity).toEqual([{ value: 1 }]);
	});
});

describe('getLineHoverMarks()', () => {
	test('should return 5 marks by default', () => {
		expect(
			getLineHoverMarks({ ...defaultLineMarkProps, isHighlightedByDimension: true, children: [] }, 'line0_facet')
		).toHaveLength(5);
	});
	test('should return 4 marks if interactionMode is item', () => {
		expect(
			getLineHoverMarks(
				{ ...defaultLineMarkProps, isHighlightedByDimension: true, children: [], interactionMode: 'item' },
				'line0_facet'
			)
		).toHaveLength(4);
	});
	test('should return 7 marks if a popover is present', () => {
		expect(
			getLineHoverMarks(
				{
					...defaultLineMarkProps,
					isHighlightedByDimension: true,
					children: [createElement(ChartPopover, { UNSAFE_highlightBy: 'dimension' })],
				},
				'line0_facet'
			)
		).toHaveLength(7);
	});
	test('should have opacity of 0 if a selected item exists', () => {
		const marks = getLineHoverMarks(
			{ ...defaultLineMarkProps, isHighlightedByDimension: true, children: [createElement(ChartPopover)] },
			'line0_facet'
		);
		expect(marks[0].encode?.update?.opacity).toEqual({ signal: "length(data('line0_selectedData')) > 0 ? 0 : 1" });
	});
});

describe('getLineOpacity()', () => {
	test('should return a basic opacity rule when using default line props', () => {
		const opacityRule = getLineOpacity(defaultLineMarkProps);
		expect(opacityRule).toEqual([{ value: 1 }]);
	});

	test('should include hover rules if line has a tooltip', () => {
		const opacityRule = getLineOpacity({
			...defaultLineMarkProps,
			interactiveMarkName: 'line0',
			children: [createElement(ChartTooltip)],
		});
		expect(opacityRule).toEqual([
			{ test: `isValid(${HIGHLIGHTED_SERIES}) && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`, value: 0.2 },
			{
				test: `length(data('line0_highlightedData')) > 0 && indexof(pluck(data('line0_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) === -1`,
				value: 0.2,
			},
			{ value: 1 },
		]);
	});

	test('should include select rules if line has a popover', () => {
		const opacityRule = getLineOpacity({
			...defaultLineMarkProps,
			interactiveMarkName: 'line0',
			popoverMarkName: 'line0',
			children: [createElement(ChartPopover)],
		});
		expect(opacityRule).toEqual([
			{ test: `isValid(${HIGHLIGHTED_SERIES}) && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`, value: 0.2 },
			{
				test: `length(data('line0_highlightedData')) > 0 && indexof(pluck(data('line0_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) === -1`,
				value: 0.2,
			},
			{ test: `isValid(${SELECTED_SERIES}) && ${SELECTED_SERIES} !== datum.${SERIES_ID}`, value: 0.2 },
			{ value: 1 },
		]);
	});

	test('should include displayOnHover rules if displayOnHover is true', () => {
		const opacityRule = getLineOpacity({
			...defaultLineMarkProps,
			interactiveMarkName: 'line0',
			displayOnHover: true,
		});
		expect(opacityRule).toEqual([DEFAULT_OPACITY_RULE]);
	});

	test('should add highlightedData rule for multiple series if isHighlightedByGroup is true', () => {
		const opacityRule = getLineOpacity({
			...defaultLineMarkProps,
			interactiveMarkName: 'line0',
			children: [createElement(ChartTooltip)],
			isHighlightedByGroup: true,
		});
		expect(opacityRule).toHaveLength(4);
		expect(opacityRule[0]).toHaveProperty(
			'test',
			`indexof(pluck(data('line0_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1`
		);
	});
});
