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

	test('should have undefined strokeWidth if lineWidth if undefined', () => {
		const lineMark = getLineMark({ ...defaultLineMarkProps, lineWidth: undefined }, 'line0_facet');
		expect(lineMark.encode?.enter?.strokeWidth).toBeUndefined();
	});

	test('adds metric range opacity rules if isMetricRange and displayOnHover', () => {
		const lineMark = getLineMark(
			{ ...defaultLineMarkProps, interactiveMarkName: 'line0', displayOnHover: true },
			'line0_facet',
		);
		expect(lineMark.encode?.update?.opacity).toEqual([
			{
				test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`,
				value: 0,
			},
			{
				test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} === datum.${SERIES_ID}`,
				value: 1,
			},
			{
				test: `${SELECTED_SERIES} && ${SELECTED_SERIES} === datum.${SERIES_ID}`,
				value: 1,
			},
			{ test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} === datum.${SERIES_ID}`, value: 1 },
			{ value: 0 },
		]);
	});

	test('does not add metric range opacity rules if displayOnHover is false and isMetricRange', () => {
		const lineMark = getLineMark({ ...defaultLineMarkProps, displayOnHover: false }, 'line0_facet');
		expect(lineMark.encode?.update?.opacity).toEqual([{ value: 1 }]);
	});
});

describe('getLineHoverMarks()', () => {
	test('should return 4 marks', () => {
		expect(getLineHoverMarks({ ...defaultLineMarkProps, children: [] }, 'line0_facet')).toHaveLength(5);
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
			{ test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`, value: 0.2 },
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
			{ test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`, value: 0.2 },
			{ test: `${SELECTED_SERIES} && ${SELECTED_SERIES} !== datum.${SERIES_ID}`, value: 0.2 },
			{ value: 1 },
		]);
	});

	test('should include displayOnHover rules if displayOnHover is true', () => {
		const opacityRule = getLineOpacity({
			...defaultLineMarkProps,
			interactiveMarkName: 'line0',
			displayOnHover: true,
		});
		expect(opacityRule).toEqual([
			{ test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`, value: 0 },
			{ test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} === datum.${SERIES_ID}`, value: 1 },
			{ test: `${SELECTED_SERIES} && ${SELECTED_SERIES} === datum.${SERIES_ID}`, value: 1 },
			{ test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} === datum.${SERIES_ID}`, value: 1 },
			{ value: 0 },
		]);
	});
});
