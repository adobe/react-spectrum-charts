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
import {
	DEFAULT_OPACITY_RULE,
	HIGHLIGHTED_GROUP,
	HIGHLIGHTED_ITEM,
	HIGHLIGHTED_SERIES,
	HIGHLIGHT_CONTRAST_RATIO,
	MARK_ID,
	SERIES_ID,
} from '@constants';
import { Mark } from 'vega';

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

const animationsOpacityEncodingDefault = { opacity: [{
	test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`,
	signal: `max(1-rscColorAnimation, 1 / ${HIGHLIGHT_CONTRAST_RATIO})`
},
{
	test: `!${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES}_prev !== datum.${SERIES_ID}`,
	signal: `max(1-rscColorAnimation, 1 / ${HIGHLIGHT_CONTRAST_RATIO})`
},
DEFAULT_OPACITY_RULE
]}

const animationsOpacityEncodingBarScatter = {
	opacity: [
		{
			// If there is no current selection, but there is a hover and the hover is NOT for the current bar
			test: `${HIGHLIGHTED_ITEM} && ${HIGHLIGHTED_ITEM} !== datum.${MARK_ID}`,
			signal: `max(1-rscColorAnimation, 1 / ${HIGHLIGHT_CONTRAST_RATIO})`
		},
		{
			// If there is a highlighted series and the highlighted series is NOT the series of the current bar
			test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`,
			signal: `max(1-rscColorAnimation, 1 / ${HIGHLIGHT_CONTRAST_RATIO})`
		},
		{
			// If there is no highlighted series and the previously highlighted series is the series of the current bar
			test: `!${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES}_prev == datum.${SERIES_ID}`,
			value: 1
		},
		{
			// If the previously hovered bar is NOT the current bar and the color animation direction is reversed (fading in)
			test: `${HIGHLIGHTED_ITEM}_prev !== datum.${MARK_ID} && rscColorAnimationDirection === -1`,
			signal: `max(1-rscColorAnimation, 1 / ${HIGHLIGHT_CONTRAST_RATIO})`
		},
		{ value: 1 }
	]
}

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
			setHoverOpacityForMarks(marks, false);
			expect(marks).toEqual([]);
		});
		test('should not modify the marks with animations', () => {
			const marks = [];
			setHoverOpacityForMarks(marks, true);
			expect(marks).toEqual([]);
		});
	});
	describe('bar mark initial state', () => {
		test('encoding should be added for opacity', () => {
			const marks = JSON.parse(JSON.stringify([defaultMark]));
			setHoverOpacityForMarks(marks, false);
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
			setHoverOpacityForMarks(marks, false);
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
			setHoverOpacityForMarks(marks, false);
			expect(marks).toStrictEqual([
				{
					...defaultGroupMark,
					marks: [{ ...defaultMark, encode: { ...defaultMark.encode, update: defaultOpacityEncoding } }],
				},
			]);
		});
	});
	describe('bar mark initial state with animations', () => {
		test('encoding should be added for opacity', () => {
			const marks = JSON.parse(JSON.stringify([defaultMark]));
			setHoverOpacityForMarks(marks, true);
			expect(marks).toStrictEqual([
				{ ...defaultMark, encode: { ...defaultMark.encode, update: animationsOpacityEncodingDefault } },
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
			setHoverOpacityForMarks(marks, true);
			expect(marks).toStrictEqual([
				{
					...defaultMark,
					encode: {
						...defaultMark.encode,
						update: animationsOpacityEncodingDefault,
					},
				},
			]);
		});
		test('opacity encoding for bar0', () => {
			const marks = JSON.parse(JSON.stringify([{
				...defaultMark,
				name: 'bar0',
				type: 'bar',
			}]));
			setHoverOpacityForMarks(marks, true);
			expect(marks).toStrictEqual([
				{ ...defaultMark, name: 'bar0', type:'bar', encode: { ...defaultMark.encode, update: animationsOpacityEncodingBarScatter } },
			]);
		})
		test('opacity encoding for scatter0', () => {
			const marks = JSON.parse(JSON.stringify([{
				...defaultMark,
				name: 'scatter0',
				type: 'scatter',
			}]));
			setHoverOpacityForMarks(marks, true);
			expect(marks).toStrictEqual([
				{ ...defaultMark, name: 'scatter0', type: 'scatter', encode: { ...defaultMark.encode, update: animationsOpacityEncodingBarScatter } },
			]);
		})
	});
});
