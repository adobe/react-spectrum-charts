import { createElement } from 'react';

import { ChartPopover } from '@components/ChartPopover';
import { BACKGROUND_COLOR, DEFAULT_COLOR, DEFAULT_SYMBOL_SIZE, DEFAULT_SYMBOL_STROKE_WIDTH, MARK_ID } from '@constants';

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
		expect(rules[0]).toHaveProperty(
			'test',
			`${defaultLineMarkProps.name}_selectedId && ${defaultLineMarkProps.name}_selectedId === datum.${MARK_ID}`
		);
	});
});

describe('getHighlightPointStroke()', () => {
	test('should return simple series color rule with default props', () => {
		const rules = getHighlightPointStroke(defaultLineMarkProps);
		expect(rules).toHaveLength(1);
		expect(rules[0]).toEqual({ scale: 'color', field: DEFAULT_COLOR });
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
		expect(rules[0]).toHaveProperty(
			'test',
			`${defaultLineMarkProps.name}_selectedId && ${defaultLineMarkProps.name}_selectedId === datum.${MARK_ID}`
		);
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
