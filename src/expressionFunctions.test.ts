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

import { expressionFunctions } from './expressionFunctions';

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
