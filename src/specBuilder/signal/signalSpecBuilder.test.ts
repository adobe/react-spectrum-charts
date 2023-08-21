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

import { Signal } from 'vega';

import { getUncontrolledHoverSignal } from './signalSpecBuilder';

export const defaultHighlightSignal: Signal = {
	name: 'highlightedSeries',
	value: null,
	on: [
		{ events: '@legendEntry:mouseover', update: 'domain("legendEntries")[datum.index]' },
		{ events: '@legendEntry:mouseout', update: '""' },
	],
};

describe('Prism spec builder', () => {
	describe('getUncontrolledHoverSignal()', () => {
		test('not nested', () => {
			expect(getUncontrolledHoverSignal('rect0')).toStrictEqual({
				name: 'rect0HoveredId',
				on: [
					{ events: '@rect0:mouseover', update: 'datum.prismMarkId' },
					{ events: '@rect0:mouseout', update: 'null' },
				],
				value: null,
			});
		});

		test('nested', () => {
			expect(getUncontrolledHoverSignal('rect0', true)).toStrictEqual({
				name: 'rect0HoveredId',
				on: [
					{ events: '@rect0:mouseover', update: 'datum.datum.prismMarkId' },
					{ events: '@rect0:mouseout', update: 'null' },
				],
				value: null,
			});
		});
	});
});
