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

import { COLOR_SCALE, HIGHLIGHTED_ITEM, OPACITY_SCALE, TABLE } from '@constants';
import { ChartTooltip } from '@rsc';
import { defaultSignals } from '@specBuilder/specTestUtils';
import { initializeSpec } from '@specBuilder/specUtils';

import { addData, addMarks, addScales, addSignals, addSunburst } from './sunburstSpecBuilder';
import { defaultSunburstProps } from './sunburstTestUtils';

describe('sunburstSpecBuilder', () => {
	test('should return a spec', () => {
		const spec = addSunburst(initializeSpec(), defaultSunburstProps);
		expect(spec).toHaveProperty('data');
		expect(spec).toHaveProperty('scales');
		expect(spec).toHaveProperty('marks');
		expect(spec).toHaveProperty('signals');
	});

	describe('addData', () => {
		test('should add data tranforms correctly', () => {
			const data = addData(initializeSpec().data ?? [], { ...defaultSunburstProps });

			expect(data).toHaveLength(2);
			expect(data[0].transform).toHaveLength(3);
			expect(data[0].transform?.[0].type).toBe('identifier'); //this is added to all specs
			expect(data[0].transform?.[1].type).toBe('stratify');
			expect(data[0].transform?.[2].type).toBe('partition');
		});

		test('should add data transform even if there was no transform array yet', () => {
			const data = addData([{ name: TABLE }], { ...defaultSunburstProps });
			expect(data).toHaveLength(1);
			expect(data[0].transform).toHaveLength(2);
			expect(data[0].transform?.[0].type).toBe('stratify');
			expect(data[0].transform?.[1].type).toBe('partition');
		});
	});

	describe('addScales', () => {
		test('should add scales correctly', () => {
			const scales = addScales(initializeSpec().scales ?? [], defaultSunburstProps);
			expect(scales).toHaveLength(2);
			expect(scales[0]).toHaveProperty('name', OPACITY_SCALE);
			expect(scales[0].domain).toHaveProperty('fields', ['depth']);
			expect(scales[1]).toHaveProperty('name', COLOR_SCALE);
			expect(scales[1].domain).toHaveProperty('fields', [defaultSunburstProps.segmentKey]);
		});
	});

	describe('addMarks', () => {
		//more tests are specified in the sunburstMarkUtils.test.ts
		test('should add arc marks correctly', () => {
			const marks = addMarks(initializeSpec().marks ?? [], defaultSunburstProps);
			expect(marks).toHaveLength(1);
			expect(marks[0]).toHaveProperty('type', 'arc');
		});
	});

	describe('addSignals', () => {
		test('adds no signals if no interactive children', () => {
			const signals = addSignals(initializeSpec().signals ?? [], defaultSunburstProps);
			expect(signals).toHaveLength(0);
		});

		test('should add hover events when tooltip is present', () => {
			const signals = addSignals(defaultSignals, {
				...defaultSunburstProps,
				children: [createElement(ChartTooltip)],
			});
			expect(signals).toHaveLength(defaultSignals.length);
			expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
			expect(signals[0].on).toHaveLength(2);
			expect(signals[0].on?.[0]).toHaveProperty('events', '@testName:mouseover');
			expect(signals[0].on?.[1]).toHaveProperty('events', '@testName:mouseout');
		});
	});
});
