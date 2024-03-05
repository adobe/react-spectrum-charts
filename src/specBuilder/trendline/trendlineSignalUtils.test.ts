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

import { ChartPopover } from '@components/ChartPopover';
import { ChartTooltip } from '@components/ChartTooltip';
import { Trendline } from '@components/Trendline';
import { HIGHLIGHTED_ITEM, HIGHLIGHTED_SERIES } from '@constants';
import { defaultSignals } from '@specBuilder/specTestUtils';
import { createElement } from 'react';
import { Signal } from 'vega';
import { setTrendlineSignals } from './trendlineSignalUtils';
import { defaultLineProps } from './trendlineTestUtils';

describe('getTrendlineSignals()', () => {
	let signals: Signal[];
	beforeEach(() => {
		signals = JSON.parse(JSON.stringify(defaultSignals));
	});
	test('should return voronoi hover signal if ChartTooltip exists', () => {
		setTrendlineSignals(signals, {
			...defaultLineProps,
			children: [createElement(Trendline, {}, createElement(ChartTooltip))],
		});
		expect(signals).toHaveLength(2);
		expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
		expect(signals[0].on).toHaveLength(2);
		expect(signals[1]).toHaveProperty('name', HIGHLIGHTED_SERIES);
		expect(signals[1].on).toHaveLength(2);
	});

	test('should not modify any signals if there is not a ChartTooltip', () => {
		setTrendlineSignals(signals, defaultLineProps);
		expect(signals).toStrictEqual(defaultSignals);
	});

	test('should return voronoi selected signal if ChartPopover exists', () => {
		setTrendlineSignals(signals, {
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
		setTrendlineSignals(signals, {
			...defaultLineProps,
			children: [createElement(Trendline, {}, createElement(ChartTooltip))],
		});
		expect(signals).toHaveLength(2);
		expect(signals[0].name).not.toContain('selected');
	});

	test('should add displayOnHover signals', () => {
		setTrendlineSignals(signals, {
			...defaultLineProps,
			children: [createElement(Trendline, { displayOnHover: true })],
		});
		expect(signals).toHaveLength(3);
		expect(signals[1]).toHaveProperty('name', HIGHLIGHTED_SERIES);
		expect(signals[2]).toHaveProperty('name', 'line0_selectedSeries');
	});
});
