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
import { SERIES_ID } from '@constants';

import { getLineHoverMarks, getLineMark, getLineStrokeOpacity } from './lineMarkUtils';
import { defaultLineMarkProps } from './lineTestUtils';

describe('getLineMark()', () => {
	test('should return line mark', () => {
		const lineMark = getLineMark(defaultLineMarkProps, 'line0_facet');
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
		const lineMark = getLineMark({ ...defaultLineMarkProps, lineWidth: undefined }, 'line0_facet');
		expect(lineMark.encode?.enter?.strokeWidth).toBeUndefined();
	});

	test('adds metric range opacity rules if isMetricRange and displayOnHover', () => {
		const lineMark = getLineMark(
			{ ...defaultLineMarkProps, interactiveMarkName: 'line0', displayOnHover: true },
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
		const lineMark = getLineMark({ ...defaultLineMarkProps, displayOnHover: false }, 'line0_facet');
		expect(lineMark.encode?.update?.strokeOpacity).toEqual([{ value: 1 }]);
	});
});

describe('getLineHoverMarks()', () => {
	test('should return 4 marks', () => {
		expect(getLineHoverMarks({ ...defaultLineMarkProps, children: [] }, 'line0_facet')).toHaveLength(5);
	});
});

describe('getLineStrokeOpacity()', () => {
	test('should return a basic opacity rule when using default line props', () => {
		const opacityRule = getLineStrokeOpacity(defaultLineMarkProps);
		expect(opacityRule).toEqual([{ value: 1 }]);
	});

	test('should include hover rules if line has a tooltip', () => {
		const opacityRule = getLineStrokeOpacity({
			...defaultLineMarkProps,
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
			...defaultLineMarkProps,
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
			...defaultLineMarkProps,
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
