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
import { MARK_ID, SERIES_ID } from '@constants';
import { Signal } from 'vega';

import { getSeriesHoveredSignal, getUncontrolledHoverSignal } from './signalSpecBuilder';

export const defaultHighlightSignal: Signal = {
	name: 'highlightedSeries',
	value: null,
	on: [
		{
			events: '@legend0_legendEntry:mouseover',
			update: 'indexof(hiddenSeries, domain("legend0Entries")[datum.index]) === -1 ? domain("legend0Entries")[datum.index] : ""',
		},
		{ events: '@legend0_legendEntry:mouseout', update: '""' },
	],
};

describe('Signal spec builder', () => {
	describe('getUncontrolledHoverSignal()', () => {
		test('not nested', () => {
			expect(getUncontrolledHoverSignal('bar0')).toStrictEqual({
				name: 'bar0_hoveredId',
				on: [
					{ events: '@bar0:mouseover', update: `datum.${MARK_ID}` },
					{ events: '@bar0:mouseout', update: 'null' },
				],
				value: null,
			});
		});

		test('nested', () => {
			expect(getUncontrolledHoverSignal('bar0', true)).toStrictEqual({
				name: 'bar0_hoveredId',
				on: [
					{ events: '@bar0:mouseover', update: `datum.datum.${MARK_ID}` },
					{ events: '@bar0:mouseout', update: 'null' },
				],
				value: null,
			});
		});

		test('should use eventName if provided', () => {
			expect(getUncontrolledHoverSignal('line0', false, 'line0_voronoi')).toStrictEqual({
				name: 'line0_hoveredId',
				on: [
					{ events: '@line0_voronoi:mouseover', update: `datum.${MARK_ID}` },
					{ events: '@line0_voronoi:mouseout', update: 'null' },
				],
				value: null,
			});
		});
	});

	describe('getSeriesHoveredSignal()', () => {
		test('uses name for eventName if eventName provided', () => {
			expect(getSeriesHoveredSignal('bar0', true)).toStrictEqual({
				name: 'bar0_hoveredSeries',
				on: [
					{ events: '@bar0:mouseover', update: `datum.datum.${SERIES_ID}` },
					{ events: '@bar0:mouseout', update: 'null' },
				],
				value: null,
			});
		});

		test('uses eventName if provided', () => {
			expect(getSeriesHoveredSignal('bar0', true, 'bar0_voronoi')).toStrictEqual({
				name: 'bar0_hoveredSeries',
				on: [
					{ events: '@bar0_voronoi:mouseover', update: `datum.datum.${SERIES_ID}` },
					{ events: '@bar0_voronoi:mouseout', update: 'null' },
				],
				value: null,
			});
		});

		test('should not nest datum if nestedDatum is false', () => {
			expect(getSeriesHoveredSignal('bar0', false, 'bar0_voronoi')).toStrictEqual({
				name: 'bar0_hoveredSeries',
				on: [
					{ events: '@bar0_voronoi:mouseover', update: `datum.${SERIES_ID}` },
					{ events: '@bar0_voronoi:mouseout', update: 'null' },
				],
				value: null,
			});
		});
	});
});
