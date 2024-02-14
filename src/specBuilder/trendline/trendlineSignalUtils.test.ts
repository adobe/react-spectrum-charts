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

import { getTrendlineSignals } from './trendlineSignalUtils';
import { createElement } from 'react';
import { ChartPopover } from '@components/ChartPopover';
import { ChartTooltip } from '@components/ChartTooltip';
import { Trendline } from '@components/Trendline';
import { defaultLineProps } from './trendlineTestUtils';

describe('getTrendlineSignals()', () => {
	test('should return voronoi hover signal if ChartTooltip exists', () => {
		const signals = getTrendlineSignals({
			...defaultLineProps,
			children: [createElement(Trendline, {}, createElement(ChartTooltip))],
		});
		expect(signals).toHaveLength(2);
		expect(signals[0]).toHaveProperty('name', 'line0Trendline_hoveredId');
		expect(signals[1]).toHaveProperty('name', 'line0Trendline_hoveredSeries');
	});

	test('should not return any signals if there is not a ChartTooltip', () => {
		const signals = getTrendlineSignals(defaultLineProps);
		expect(signals).toHaveLength(0);
	});

	test('should return voronoi selected signal if ChartPopover exists', () => {
		const signals = getTrendlineSignals({
			...defaultLineProps,
			children: [
				createElement(Trendline, {}, createElement(ChartTooltip)),
				createElement(Trendline, {}, createElement(ChartPopover)),
			],
		});
		expect(signals).toHaveLength(4);
		expect(signals[2]).toHaveProperty('name', 'line0Trendline_selectedId');
		expect(signals[3]).toHaveProperty('name', 'line0Trendline_selectedSeries');
	});

	test('should not return selected signal if there is not a ChartPopover', () => {
		const signals = getTrendlineSignals({
			...defaultLineProps,
			children: [createElement(Trendline, {}, createElement(ChartTooltip))],
		});
		expect(signals).toHaveLength(2);
		expect(signals[0].name).not.toContain('selected');
	});
});
