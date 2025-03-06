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
import { Mark } from 'vega';

import {
	DEFAULT_OPACITY_RULE,
	HIGHLIGHTED_GROUP,
	HIGHLIGHTED_SERIES,
	HIGHLIGHT_CONTRAST_RATIO,
	SERIES_ID,
} from '../../constants';
import { getHighlightOpacityRule, setHoverOpacityForMarks } from './legendHighlightUtils';
import { defaultMark } from './legendTestUtils';

const defaultGroupMark: Mark = {
	type: 'group',
	marks: [defaultMark],
};

const defaultOpacityEncoding = {
	opacity: [
		{
			test: `isValid(${HIGHLIGHTED_SERIES}) && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`,
			value: 1 / HIGHLIGHT_CONTRAST_RATIO,
		},
	],
};

describe('getHighlightOpacityRule()', () => {
	test('should use HIGHLIGHTED_SERIES in test if there are not any keys', () => {
		const opacityRule = getHighlightOpacityRule();
		expect(opacityRule).toHaveProperty(
			'test',
			`isValid(${HIGHLIGHTED_SERIES}) && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`
		);
	});
	test('should use keys in test if there are keys', () => {
		const opacityRule = getHighlightOpacityRule(['key1'], 'legend0');
		expect(opacityRule).toHaveProperty(
			'test',
			`isValid(${HIGHLIGHTED_GROUP}) && ${HIGHLIGHTED_GROUP} !== datum.legend0_highlightGroupId`
		);
	});
});

describe('setHoverOpacityForMarks()', () => {
	describe('no initial state', () => {
		test('should not modify the marks', () => {
			const marks = [];
			setHoverOpacityForMarks(marks);
			expect(marks).toEqual([]);
		});
	});
	describe('bar mark initial state', () => {
		test('encoding should be added for opacity', () => {
			const marks = JSON.parse(JSON.stringify([defaultMark]));
			setHoverOpacityForMarks(marks);
			expect(marks).toStrictEqual([
				{ ...defaultMark, encode: { ...defaultMark.encode, update: defaultOpacityEncoding } },
			]);
		});
		test('opacity encoding already exists, rules should be added in the correct spot', () => {
			const marks = JSON.parse(
				JSON.stringify([
					{
						...defaultMark,
						encode: { ...defaultMark.encode, update: { opacity: [DEFAULT_OPACITY_RULE] } },
					},
				])
			);
			setHoverOpacityForMarks(marks);
			expect(marks).toStrictEqual([
				{
					...defaultMark,
					encode: {
						...defaultMark.encode,
						update: {
							...defaultOpacityEncoding,
							opacity: [...defaultOpacityEncoding.opacity, DEFAULT_OPACITY_RULE],
						},
					},
				},
			]);
		});
	});
	describe('group mark initial state', () => {
		test('encoding should be added for opacity', () => {
			const marks = JSON.parse(JSON.stringify([defaultGroupMark]));
			setHoverOpacityForMarks(marks);
			expect(marks).toStrictEqual([
				{
					...defaultGroupMark,
					marks: [{ ...defaultMark, encode: { ...defaultMark.encode, update: defaultOpacityEncoding } }],
				},
			]);
		});
	});
});
