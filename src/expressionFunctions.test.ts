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

import {
	LabelDatum,
	expressionFunctions,
	formatHorizontalTimeAxisLabels,
	formatTimeDurationLabels,
	formatVerticalAxisTimeLabels,
} from './expressionFunctions';

describe('truncateText()', () => {
	const longText =
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit.';
	const shortText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
	test('should truncate text that is too long', () => {
		expect(expressionFunctions.truncateText(longText, 24)).toBe('Lorem ipsum dolor s…');
		expect(expressionFunctions.truncateText(longText, 100)).toBe(
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsu…'
		);
	});
	test('should not truncate text that is shorter than maxLength', () => {
		expect(expressionFunctions.truncateText(shortText, 100)).toBe(shortText);
	});
});

describe('formatTimeDurationLabels()', () => {
	const formatDurationsEnUS = formatTimeDurationLabels(numberLocales['en-US']);
	const formatDurationsFrFr = formatTimeDurationLabels(numberLocales['fr-FR']);
	const formatDurationsDeDe = formatTimeDurationLabels(numberLocales['de-DE']);

	test('should format hour durations correctly', () => {
		expect(formatDurationsEnUS({ index: 0, label: '0', value: 1 })).toBe('0:01');
		expect(formatDurationsEnUS({ index: 0, label: '0', value: 61 })).toBe('1:01');
		expect(formatDurationsEnUS({ index: 0, label: '0', value: 3661 })).toBe('1:01:01');
		expect(formatDurationsEnUS({ index: 0, label: '0', value: -3661 })).toBe('-1:01:01');
		expect(formatDurationsEnUS({ index: 0, label: '0', value: 3603661 })).toBe('1,001:01:01');
		expect(formatDurationsFrFr({ index: 0, label: '0', value: 3603661 })).toBe('1\u00a0001:01:01');
		expect(formatDurationsDeDe({ index: 0, label: '0', value: 3603661 })).toBe('1.001:01:01');
	});
	test('should default to using en-US', () => {
		const formatDurations = formatTimeDurationLabels();
		expect(formatDurations({ index: 0, label: '0', value: 3603661 })).toBe('1,001:01:01');
	});
	test('should return original string if type of value is string', () => {
		expect(formatDurationsEnUS({ index: 0, label: '0', value: 'hello world!' })).toBe('hello world!');
	});
});

describe('formatHorizontalTimeAxisLabels()', () => {
	let formatter: (datum: LabelDatum) => string;
	beforeEach(() => {
		formatter = formatHorizontalTimeAxisLabels();
	});

	test('should return label if index is 0', () => {
		expect(formatter({ index: 0, label: '2024', value: 1 })).toBe('2024');
		expect(formatter({ index: 0, label: 'Nov', value: 1 })).toBe('Nov');
		expect(formatter({ index: 0, label: 'Nov', value: 2 })).toBe('Nov');
		expect(formatter({ index: 0, label: 'Nov 15', value: 1 })).toBe('Nov 15');
	});

	test('should return "" when previous label was the same', () => {
		expect(formatter({ index: 0, label: '2024', value: 2 })).toBe('2024');
		expect(formatter({ index: 1, label: '2024', value: 2 })).toBe('');
	});
});

describe('formatVerticalAxisTimeLabels()', () => {
	let formatter: (datum: LabelDatum) => string;
	beforeEach(() => {
		formatter = formatVerticalAxisTimeLabels();
	});

	test('should return full label if index is 0', () => {
		expect(formatter({ index: 0, label: '2024 \u2000Jan', value: 1 })).toBe('2024 \u2000Jan');
		expect(formatter({ index: 0, label: 'Nov \u200015', value: 1 })).toBe('Nov \u200015');
		expect(formatter({ index: 0, label: 'Nov \u200015', value: 2 })).toBe('Nov \u200015');
		expect(formatter({ index: 0, label: 'Nov 15 \u200012 AM', value: 1 })).toBe('Nov 15 \u200012 AM');
	});

	test('should drop the larger time granularity when previous label was the same larger time granularity', () => {
		expect(formatter({ index: 0, label: '2024 \u2000Jan', value: 1 })).toBe('2024 \u2000Jan');
		expect(formatter({ index: 1, label: '2024 \u2000Feb', value: 1 })).toBe('Feb');
	});
});
