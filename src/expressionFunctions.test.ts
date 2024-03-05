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

import { numberLocales } from '@locales';
import { expressionFunctions, formatTimeDurationLabels } from './expressionFunctions';

describe('truncateText()', () => {
	const longText =
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit.';
	const shortText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
	test('should truncate text that is too long', () => {
		expect(expressionFunctions.truncateText(longText, 24)).toBe('Lorem ipsum dolor s…');
		expect(expressionFunctions.truncateText(longText, 100)).toBe(
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsu…',
		);
	});
	test('should not truncate text that is shorter than maxLength', () => {
		expect(expressionFunctions.truncateText(shortText, 100)).toBe(shortText);
	});
});

describe('formatTimeDurationLabels()', () => {
	test('should format durations correctly', () => {
		const formatDurationsEnUS = formatTimeDurationLabels(numberLocales['en-US']);
		const formatDurationsFrFr = formatTimeDurationLabels(numberLocales['fr-FR']);
		const formatDurationsDeDe = formatTimeDurationLabels(numberLocales['de-DE']);

		expect(formatDurationsEnUS({ index: 0, label: '0', value: 1 })).toBe('00:00:01');
		expect(formatDurationsEnUS({ index: 0, label: '0', value: 61 })).toBe('00:01:01');
		expect(formatDurationsEnUS({ index: 0, label: '0', value: 3661 })).toBe('01:01:01');
		expect(formatDurationsEnUS({ index: 0, label: '0', value: 3603661 })).toBe('1,001:01:01');
		expect(formatDurationsFrFr({ index: 0, label: '0', value: 3603661 })).toBe('1\u00a0001:01:01');
		expect(formatDurationsDeDe({ index: 0, label: '0', value: 3603661 })).toBe('1.001:01:01');
	});
	test('should original string if type of value is string', () => {
		const formatDurationsEnUS = formatTimeDurationLabels(numberLocales['en-US']);
		expect(formatDurationsEnUS({ index: 0, label: '0', value: 'hello world!' })).toBe('hello world!');
	});
});
