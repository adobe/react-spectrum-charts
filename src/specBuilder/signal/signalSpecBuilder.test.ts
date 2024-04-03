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
import { HIGHLIGHTED_ITEM, HIGHLIGHTED_SERIES } from '@constants';
import {
	defaultHighlightedItemSignal,
	defaultHighlightedSeriesSignal,
	defaultSignals,
} from '@specBuilder/specTestUtils';
import { Signal } from 'vega';

import { addHighlightedItemSignalEvents, addHighlightedSeriesSignalEvents } from './signalSpecBuilder';

describe('signalSpecBuilder', () => {
	let signals: Signal[];
	beforeEach(() => {
		signals = JSON.parse(JSON.stringify(defaultSignals));
	});
	describe('addHighlightedItemSignalEvents()', () => {
		test('should add on events', () => {
			addHighlightedItemSignalEvents({ signals, markName: 'line0' });
			expect(signals).toHaveLength(4);
			expect(signals[0]).toHaveProperty('name', HIGHLIGHTED_ITEM);
			expect(signals[0].on).toHaveLength(2);
			expect(signals[0]?.on?.[0]).toHaveProperty('events', '@line0:mouseover');
			expect(signals[0]?.on?.[1]).toHaveProperty('events', '@line0:mouseout');
			expect(signals[1].on).toBeUndefined();
			expect(signals[2].on).toBeUndefined();
			expect(signals[3].on).toBeUndefined();
		});
		test('should not do anything if the highlight signal is not found', () => {
			const signals = JSON.parse(JSON.stringify([defaultHighlightedSeriesSignal]));
			const signalsCopy = JSON.parse(JSON.stringify(signals));
			addHighlightedItemSignalEvents({ signals, markName: 'line0' });
			expect(signals).toEqual(signalsCopy);
		});
	});

	describe('addHighlightedSeriesSignalEvents()', () => {
		test('should add on events', () => {
			addHighlightedSeriesSignalEvents(signals, 'line0');
			expect(signals).toHaveLength(4);
			expect(signals[0].on).toBeUndefined();
			expect(signals[1]).toHaveProperty('name', HIGHLIGHTED_SERIES);
			expect(signals[1].on).toHaveLength(2);
			expect(signals[1]?.on?.[0]).toHaveProperty('events', '@line0:mouseover');
			expect(signals[1]?.on?.[1]).toHaveProperty('events', '@line0:mouseout');
			expect(signals[2].on).toBeUndefined();
			expect(signals[3].on).toBeUndefined();
		});
		test('should not do anything if the highlight signal is not found', () => {
			const signals = JSON.parse(JSON.stringify([defaultHighlightedItemSignal]));
			const signalsCopy = JSON.parse(JSON.stringify(signals));
			addHighlightedSeriesSignalEvents(signals, 'line0');
			expect(signals).toEqual(signalsCopy);
		});
	});
});
