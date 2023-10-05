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

import { DEFAULT_COLOR, HIGHLIGHT_CONTRAST_RATIO } from '@constants';
import { getHighlightOpacityRule, getOpacityRule, setHoverOpacityForMarks } from './legendHighlightUtils';
import { defaultMark } from './legendTestUtils';
import { Mark } from 'vega';

const defaultGroupMark: Mark = {
	type: 'group',
	marks: [defaultMark],
};

const defaultOpacityEncoding = {
	fillOpacity: [
		{ test: `highlightedSeries && highlightedSeries !== datum.prismSeriesId`, value: 1 / HIGHLIGHT_CONTRAST_RATIO },
	],
	strokeOpacity: [
		{ test: `highlightedSeries && highlightedSeries !== datum.prismSeriesId`, value: 1 / HIGHLIGHT_CONTRAST_RATIO },
	],
};

describe('getHighlightOpacityrule()', () => {
	test('scale ref should divide by highlight contrast ratio', () => {
		expect(getHighlightOpacityRule({ scale: 'opacity', field: DEFAULT_COLOR })).toStrictEqual({
			test: 'highlightedSeries && highlightedSeries !== datum.prismSeriesId',
			signal: `scale('opacity', datum.${DEFAULT_COLOR}) / ${HIGHLIGHT_CONTRAST_RATIO}`,
		});
	});
	test('signal ref should divide by highlight contrast ratio', () => {
		expect(getHighlightOpacityRule({ signal: `scale('opacity', datum.${DEFAULT_COLOR})` })).toStrictEqual({
			test: 'highlightedSeries && highlightedSeries !== datum.prismSeriesId',
			signal: `scale('opacity', datum.${DEFAULT_COLOR}) / ${HIGHLIGHT_CONTRAST_RATIO}`,
		});
	});
	test('value ref should divide by highlight contrast ratio', () => {
		expect(getHighlightOpacityRule({ value: 0.5 })).toStrictEqual({
			test: 'highlightedSeries && highlightedSeries !== datum.prismSeriesId',
			value: 0.5 / HIGHLIGHT_CONTRAST_RATIO,
		});
	});
	test('empty ref should rturn default rule', () => {
		expect(getHighlightOpacityRule({})).toStrictEqual({
			test: 'highlightedSeries && highlightedSeries !== datum.prismSeriesId',
			value: 1 / HIGHLIGHT_CONTRAST_RATIO,
		});
	});
});

describe('getOpacityRule()', () => {
	test('array, should return the last value', () => {
		expect(getOpacityRule([{ value: 0.5 }])).toStrictEqual({ value: 0.5 });
		expect(getOpacityRule([{ value: 0.5 }, { signal: `scale('opacity', datum.${DEFAULT_COLOR})` }])).toStrictEqual({
			signal: `scale('opacity', datum.${DEFAULT_COLOR})`,
		});
	});
	test('empty array, should return default value', () => {
		expect(getOpacityRule([])).toStrictEqual({ value: 1 });
	});
	test('object, should return object', () => {
		expect(getOpacityRule({ value: 0.5 })).toStrictEqual({ value: 0.5 });
	});
	test('undefined, should return default value', () => {
		expect(getOpacityRule(undefined)).toStrictEqual({ value: 1 });
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
		test('encoding should be added for fillOpacity and strokOpacity', () => {
			const marks = JSON.parse(JSON.stringify([defaultMark]));
			setHoverOpacityForMarks(marks);
			expect(marks).toStrictEqual([
				{ ...defaultMark, encode: { ...defaultMark.encode, update: defaultOpacityEncoding } },
			]);
		});
		test('fillOpacity encoding already exists, rules should be added in the correct spot', () => {
			const marks = JSON.parse(
				JSON.stringify([
					{ ...defaultMark, encode: { ...defaultMark.encode, update: { fillOpacity: [{ value: 1 }] } } },
				]),
			);
			setHoverOpacityForMarks(marks);
			expect(marks).toStrictEqual([
				{
					...defaultMark,
					encode: {
						...defaultMark.encode,
						update: {
							...defaultOpacityEncoding,
							fillOpacity: [...defaultOpacityEncoding.fillOpacity, { value: 1 }],
						},
					},
				},
			]);
		});
	});
	describe('group mark initial state', () => {
		test('encoding should be added for fillOpacity and strokOpacity', () => {
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
