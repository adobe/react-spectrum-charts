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

import { Trendline } from '@components/Trendline';
import { GroupMark } from 'vega';
import { defaultScatterProps } from './scatterTestUtils';
import { addScatterMarks, getScatterHoverMarks } from './scatterMarkUtils';
import { ChartTooltip } from '@components/ChartTooltip';

describe('addScatterMarks()', () => {
	test('should add the scatter group with the symbol marks', () => {
		const marks = addScatterMarks([], defaultScatterProps);
		expect(marks).toHaveLength(1);
		expect(marks[0].name).toBe('scatter0_group');
		expect(marks[0].type).toBe('group');
		expect((marks[0] as GroupMark).marks).toHaveLength(1);
	});

	test('should use "multiply" blend mode in light mode', () => {
		const marks = addScatterMarks([], { ...defaultScatterProps, colorScheme: 'light' });
		expect((marks[0] as GroupMark).marks?.[0].encode?.enter?.blend).toEqual({ value: 'multiply' });
	});
	test('should "screen" blend mode in dark mode', () => {
		const marks = addScatterMarks([], { ...defaultScatterProps, colorScheme: 'dark' });
		expect((marks[0] as GroupMark).marks?.[0].encode?.enter?.blend).toEqual({ value: 'screen' });
	});
	test('should add trendline marks if trendline exists as a child', () => {
		const marks = addScatterMarks([], { ...defaultScatterProps, children: [createElement(Trendline)] });
		expect(marks).toHaveLength(2);
		expect(marks[1].name).toBe('scatter0Trendline0_group');
	});
});

describe('getScatterHoverMarks()', () => {
	test('should retrurn the voronoi mark if there is a tooltip', () => {
		expect(getScatterHoverMarks(defaultScatterProps)).toHaveLength(0);

		const marks = getScatterHoverMarks({ ...defaultScatterProps, children: [createElement(ChartTooltip)] });
		expect(marks).toHaveLength(1);
		expect(marks[0].name).toBe('scatter0_voronoi');
	});
});
