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

import { Annotation } from '@components/Annotation';
import { ChartPopover } from '@components/ChartPopover';
import { ChartTooltip } from '@components/ChartTooltip';
import { MetricRange } from '@components/MetricRange';
import { DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_SECONDARY_COLOR } from '@constants';

import {
	getColorProductionRule,
	getLineWidthProductionRule,
	getOpacityProductionRule,
	getStrokeDashProductionRule,
	getTooltip,
	hasMetricRange,
	hasTooltip,
} from './markUtils';

describe('getColorProductionRule', () => {
	test('should return scale reference if color is a string', () => {
		expect(getColorProductionRule(DEFAULT_COLOR, DEFAULT_COLOR_SCHEME)).toStrictEqual({
			scale: 'color',
			field: DEFAULT_COLOR,
		});
	});

	test('should return static value and convert spectrum name to color, respecting the theme', () => {
		expect(getColorProductionRule({ value: 'gray-700' }, 'light')).toStrictEqual({ value: 'rgb(70, 70, 70)' });
		expect(getColorProductionRule({ value: 'gray-700' }, 'dark')).toStrictEqual({ value: 'rgb(208, 208, 208)' });
	});

	test('should return static value of the css color provided', () => {
		expect(getColorProductionRule({ value: 'rgb(255, 255, 255)' }, DEFAULT_COLOR_SCHEME)).toStrictEqual({
			value: 'rgb(255, 255, 255)',
		});
	});
});

describe('getLineWidthProductionRule', () => {
	test('should return 2d lookup signal if array provided', () => {
		expect(getLineWidthProductionRule([DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR])).toStrictEqual({
			signal: "scale('lineWidths', datum.series)[indexof(domain('secondaryLineWidth'), datum.subSeries)% length(scale('lineWidths', datum.series))]",
		});
	});

	test('should return scale reference if lineWidth is a string', () => {
		expect(getLineWidthProductionRule(DEFAULT_COLOR)).toStrictEqual({ scale: 'lineWidth', field: DEFAULT_COLOR });
	});

	test('should return static value and convert preset line width to pixel value', () => {
		expect(getLineWidthProductionRule({ value: 'S' })).toStrictEqual({ value: 1.5 });
	});

	test('should return static value of the dash array provided', () => {
		expect(getLineWidthProductionRule({ value: 5 })).toStrictEqual({ value: 5 });
	});
});

describe('getStrokeDashProductionRule', () => {
	test('should return scale reference if lineType is a string', () => {
		expect(getStrokeDashProductionRule(DEFAULT_COLOR)).toStrictEqual({ scale: 'lineType', field: DEFAULT_COLOR });
	});

	test('should return static value and convert preset line type to dash array', () => {
		expect(getStrokeDashProductionRule({ value: 'dotted' })).toStrictEqual({ value: [2, 3] });
	});

	test('should return static value of the dash array provided', () => {
		expect(getStrokeDashProductionRule({ value: [2, 3, 4, 5, 6, 7] })).toStrictEqual({ value: [2, 3, 4, 5, 6, 7] });
	});
});

describe('getOpacityProductionRule()', () => {
	test('shold return signal rule for scale reference input', () => {
		expect(getOpacityProductionRule(DEFAULT_COLOR)).toStrictEqual({
			signal: `scale('opacity', datum.${DEFAULT_COLOR})`,
		});
	});
	test('should return value rule for static value', () => {
		expect(getOpacityProductionRule({ value: 0.5 })).toStrictEqual({ value: 0.5 });
	});
});

describe('hasTooltip()', () => {
	test('should be true if ChartTooltip exists in children', () => {
		expect(hasTooltip([createElement(ChartTooltip)])).toBeTruthy();
		expect(hasTooltip([createElement(ChartTooltip), createElement('div')])).toBeTruthy();
	});
	test('should be false if ChartTooltip does not exist in children', () => {
		expect(hasTooltip([createElement(ChartPopover)])).toBeFalsy();
		expect(hasTooltip([createElement(ChartPopover), createElement('div')])).toBeFalsy();
	});
});

describe('hasMetricRange()', () => {
	test('should be true if MetricRange exists in children', () => {
		expect(hasMetricRange([createElement(MetricRange)])).toBeTruthy();
		expect(hasMetricRange([createElement(MetricRange), createElement('div')])).toBeTruthy();
	});
	test('should be false if MetricRange does not exist in children', () => {
		expect(hasMetricRange([createElement(ChartPopover)])).toBeFalsy();
		expect(hasMetricRange([createElement(ChartPopover), createElement('div')])).toBeFalsy();
	});
});

describe('getTooltip()', () => {
	test('should return undefined if there are not any interactive children', () => {
		expect(getTooltip([createElement(Annotation)], 'line0')).toBeUndefined();
		expect(getTooltip([], 'line0')).toBeUndefined();
	});
	test('should return signal ref if there are interactive children', () => {
		const rule = getTooltip([createElement(ChartTooltip)], 'line0');
		expect(rule).toHaveProperty('signal');
	});
	test('should reference a nested datum if nestedDatum is true', () => {
		const rule = getTooltip([createElement(ChartTooltip)], 'line0', true);
		expect(rule?.signal).toContain('datum.datum');
	});
});
