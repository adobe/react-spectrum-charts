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
import { GroupMark } from 'vega';

import {
	DEFAULT_OPACITY_RULE,
	HIGHLIGHTED_ITEM,
	MARK_ID,
	SELECTED_ITEM,
	SYMBOL_SIZE_SCALE,
} from '@spectrum-charts/constants';

import { addScatterMarks, getOpacity, getScatterHoverMarks, getSelectRingSize } from './scatterMarkUtils';
import { defaultScatterOptions } from './scatterTestUtils';

describe('addScatterMarks()', () => {
	test('should add the scatter group with the symbol marks', () => {
		const marks = addScatterMarks([], defaultScatterOptions);
		expect(marks).toHaveLength(1);
		expect(marks[0].name).toBe('scatter0_group');
		expect(marks[0].type).toBe('group');
		expect((marks[0] as GroupMark).marks).toHaveLength(1);
	});

	test('should use "multiply" blend mode in light mode', () => {
		const marks = addScatterMarks([], { ...defaultScatterOptions, colorScheme: 'light' });
		expect((marks[0] as GroupMark).marks?.[0].encode?.enter?.blend).toEqual({ value: 'multiply' });
	});
	test('should "screen" blend mode in dark mode', () => {
		const marks = addScatterMarks([], { ...defaultScatterOptions, colorScheme: 'dark' });
		expect((marks[0] as GroupMark).marks?.[0].encode?.enter?.blend).toEqual({ value: 'screen' });
	});
	test('should add trendline marks if trendline exists as a child', () => {
		const marks = addScatterMarks([], { ...defaultScatterOptions, trendlines: [{}] });
		expect(marks).toHaveLength(2);
		expect(marks[1].name).toBe('scatter0Trendline0_group');
	});
});

describe('getOpacity()', () => {
	test('should return the default rule if there are not any interactive children', () => {
		expect(getOpacity(defaultScatterOptions)).toEqual([DEFAULT_OPACITY_RULE]);
	});
	test('should include hover rules if tooltip exists', () => {
		const opacity = getOpacity({ ...defaultScatterOptions, chartTooltips: [{}] });
		expect(opacity).toHaveLength(3);
		expect(opacity[0]).toHaveProperty(
			'test',
			`isArray(${HIGHLIGHTED_ITEM}) && length(${HIGHLIGHTED_ITEM}) > 0 && indexof(${HIGHLIGHTED_ITEM}, datum.${MARK_ID}) === -1`
		);
		expect(opacity[1]).toHaveProperty(
			'test',
			`!isArray(${HIGHLIGHTED_ITEM}) && isValid(${HIGHLIGHTED_ITEM}) && ${HIGHLIGHTED_ITEM} !== datum.${MARK_ID}`
		);
	});
	test('should include select rule if popover exists', () => {
		const opacity = getOpacity({ ...defaultScatterOptions, chartPopovers: [{}] });
		expect(opacity).toHaveLength(4);
		expect(opacity[0]).toHaveProperty(
			'test',
			`isArray(${HIGHLIGHTED_ITEM}) && length(${HIGHLIGHTED_ITEM}) > 0 && indexof(${HIGHLIGHTED_ITEM}, datum.${MARK_ID}) === -1`
		);
		expect(opacity[1]).toHaveProperty(
			'test',
			`!isArray(${HIGHLIGHTED_ITEM}) && isValid(${HIGHLIGHTED_ITEM}) && ${HIGHLIGHTED_ITEM} !== datum.${MARK_ID}`
		);
		expect(opacity[2]).toHaveProperty('test', `isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} !== datum.${MARK_ID}`);
	});
});

describe('getScatterHoverMarks()', () => {
	test('should return the pointsForVoronoi mark if there is a tooltip', () => {
		expect(getScatterHoverMarks(defaultScatterOptions)).toHaveLength(0);

		const marks = getScatterHoverMarks({ ...defaultScatterOptions, chartTooltips: [{}] });
		expect(marks).toHaveLength(2);
		expect(marks[0].name).toBe('scatter0_pointsForVoronoi');
	});

	test('should return the voronoi mark if there is a tooltip', () => {
		expect(getScatterHoverMarks(defaultScatterOptions)).toHaveLength(0);

		const marks = getScatterHoverMarks({ ...defaultScatterOptions, chartTooltips: [{}] });
		expect(marks).toHaveLength(2);
		expect(marks[1].name).toBe('scatter0_voronoi');
	});
});

describe('getScatterSelectMarks()', () => {
	test('should return a staic value if a static value is provided', () => {
		const ringSize = getSelectRingSize({ value: 10 });
		// sqrt of 196 is 14 which is 4 pixels larger than 10;
		expect(ringSize).toHaveProperty('value', 196);
	});
	test('should return a signal if data key is provided', () => {
		const sizeKey = 'weight';
		const ringSize = getSelectRingSize(sizeKey);
		expect(ringSize).toHaveProperty('signal', `pow(sqrt(scale('${SYMBOL_SIZE_SCALE}', datum.${sizeKey})) + 4, 2)`);
	});
});
