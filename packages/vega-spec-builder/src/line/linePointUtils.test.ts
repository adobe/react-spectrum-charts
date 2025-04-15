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
	BACKGROUND_COLOR,
	COLOR_SCALE,
	DEFAULT_COLOR,
	DEFAULT_SYMBOL_SIZE,
	DEFAULT_SYMBOL_STROKE_WIDTH,
	MARK_ID,
	SELECTED_GROUP,
	SELECTED_ITEM,
} from '@spectrum-charts/constants';

import {
	getHighlightPointFill,
	getHighlightPointSize,
	getHighlightPointStroke,
	getHighlightPointStrokeOpacity,
	getHighlightPointStrokeWidth,
} from './linePointUtils';
import { defaultLineMarkOptions } from './lineTestUtils';

describe('getHighlightPointFill()', () => {
	test('should return simple background rule with default optionsdefaultLineMarkOptions', () => {
		const rules = getHighlightPointFill(defaultLineMarkOptions);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({ signal: BACKGROUND_COLOR });
	});

	test('should include a static point rule if staticPoint is set', () => {
		const staticPoint = 'test';
		const rules = getHighlightPointFill({ ...defaultLineMarkOptions, staticPoint });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
	});

	test('should include selection rule if hasPopover', () => {
		const rules = getHighlightPointFill({ ...defaultLineMarkOptions, chartPopovers: [{}] });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty(
			'test',
			`(${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}) || (${SELECTED_GROUP} && ${SELECTED_GROUP} === datum.line0_selectedGroupId)`
		);
	});
});

describe('getHighlightPointStroke()', () => {
	test('should return simple series color rule with default optionsdefaultLineMarkOptions', () => {
		const rules = getHighlightPointStroke(defaultLineMarkOptions);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({ scale: COLOR_SCALE, field: DEFAULT_COLOR });
	});

	test('should include a static point rule if staticPoint is set', () => {
		const staticPoint = 'test';
		const rules = getHighlightPointStroke({ ...defaultLineMarkOptions, staticPoint });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
	});

	test('should include selection rule if hasPopover', () => {
		const rules = getHighlightPointStroke({ ...defaultLineMarkOptions, chartPopovers: [{}] });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty(
			'test',
			`(${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}) || (${SELECTED_GROUP} && ${SELECTED_GROUP} === datum.line0_selectedGroupId)`
		);
	});
});

describe('getHighlightPointStrokeOpacity()', () => {
	test('should return simple series color rule with default optionsdefaultLineMarkOptions', () => {
		const rules = getHighlightPointStrokeOpacity(defaultLineMarkOptions);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({ value: 1 });
	});

	test('should include a static point rule if staticPoint is set', () => {
		const staticPoint = 'test';
		const rules = getHighlightPointStrokeOpacity({ ...defaultLineMarkOptions, staticPoint });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
	});
});

describe('getHighlightPointSize()', () => {
	test('should return simple symbol size rule with default optionsdefaultLineMarkOptions', () => {
		const rules = getHighlightPointSize(defaultLineMarkOptions);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({ value: DEFAULT_SYMBOL_SIZE });
	});

	test('should include a static point rule if staticPoint is set', () => {
		const staticPoint = 'test';
		const rules = getHighlightPointSize({ ...defaultLineMarkOptions, staticPoint });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
	});
});

describe('getHighlightPointStrokeWidth()', () => {
	test('should return simple stroke width rule with default optionsdefaultLineMarkOptions', () => {
		const rules = getHighlightPointStrokeWidth(defaultLineMarkOptions);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({ value: DEFAULT_SYMBOL_STROKE_WIDTH });
	});

	test('should include a static point rule if staticPoint is set', () => {
		const staticPoint = 'test';
		const rules = getHighlightPointStrokeWidth({ ...defaultLineMarkOptions, staticPoint });
		expect(rules).toHaveLength(2);
		expect(rules[0]).toHaveProperty(`test`, `datum.${staticPoint} && datum.${staticPoint} === true`);
	});
});
