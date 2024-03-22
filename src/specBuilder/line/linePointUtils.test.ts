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
import { createElement } from 'react';

import { ChartPopover } from '@components/ChartPopover';
import {
	BACKGROUND_COLOR,
	COLOR_SCALE,
	DEFAULT_COLOR,
	DEFAULT_SYMBOL_SIZE,
	DEFAULT_SYMBOL_STROKE_WIDTH,
	MARK_ID,
	SELECTED_ITEM,
} from '@constants';

import {
	getHighlightPointFill,
	getHighlightPointSize,
	getHighlightPointStroke,
	getHighlightPointStrokeOpacity,
	getHighlightPointStrokeWidth,
} from './linePointUtils';
import { defaultLineMarkProps } from './lineTestUtils';

describe('getHighlightPointFill()', () => {
	test('should return simple background rule with default props', () => {
		const rules = getHighlightPointFill(defaultLineMarkProps);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({ signal: BACKGROUND_COLOR });
	});

	test('should include a static point rule if staticPoint is set', () => {
		const staticPoint = 'test';
		const rules = getHighlightPointFill({ ...defaultLineMarkProps, staticPoint });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
	});

	test('should include selection rule if hasPopover', () => {
		const rules = getHighlightPointFill({ ...defaultLineMarkProps, children: [createElement(ChartPopover)] });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty('test', `${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}`);
	});
});

describe('getHighlightPointStroke()', () => {
	test('should return simple series color rule with default props', () => {
		const rules = getHighlightPointStroke(defaultLineMarkProps);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({ scale: COLOR_SCALE, field: DEFAULT_COLOR });
	});

	test('should include a static point rule if staticPoint is set', () => {
		const staticPoint = 'test';
		const rules = getHighlightPointStroke({ ...defaultLineMarkProps, staticPoint });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
	});

	test('should include selection rule if hasPopover', () => {
		const rules = getHighlightPointStroke({ ...defaultLineMarkProps, children: [createElement(ChartPopover)] });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty('test', `${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}`);
	});
});

describe('getHighlightPointStrokeOpacity()', () => {
	test('should return simple series color rule with default props', () => {
		const rules = getHighlightPointStrokeOpacity(defaultLineMarkProps);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({ value: 1 });
	});

	test('should include a static point rule if staticPoint is set', () => {
		const staticPoint = 'test';
		const rules = getHighlightPointStrokeOpacity({ ...defaultLineMarkProps, staticPoint });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
	});
});

describe('getHighlightPointSize()', () => {
	test('should return simple symbol size rule with default props', () => {
		const rules = getHighlightPointSize(defaultLineMarkProps);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({ value: DEFAULT_SYMBOL_SIZE });
	});

	test('should include a static point rule if staticPoint is set', () => {
		const staticPoint = 'test';
		const rules = getHighlightPointSize({ ...defaultLineMarkProps, staticPoint });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
	});
});

describe('getHighlightPointStrokeWidth()', () => {
	test('should return simple stroke width rule with default props', () => {
		const rules = getHighlightPointStrokeWidth(defaultLineMarkProps);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({ value: DEFAULT_SYMBOL_STROKE_WIDTH });
	});

	test('should include a static point rule if staticPoint is set', () => {
		const staticPoint = 'test';
		const rules = getHighlightPointStrokeWidth({ ...defaultLineMarkProps, staticPoint });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
	});
});
