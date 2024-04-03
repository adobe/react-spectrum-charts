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
import {
	COLOR_SCALE,
	DEFAULT_COLOR,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_OPACITY_RULE,
	DEFAULT_SECONDARY_COLOR,
	DEFAULT_TIME_DIMENSION,
	DEFAULT_TRANSFORMED_TIME_DIMENSION,
	HIGHLIGHTED_SERIES,
	HIGHLIGHT_CONTRAST_RATIO,
	LINEAR_COLOR_SCALE,
	LINE_TYPE_SCALE,
	LINE_WIDTH_SCALE,
	OPACITY_SCALE,
	SERIES_ID,
	SYMBOL_SIZE_SCALE,
} from '@constants';

import {
	getColorProductionRule,
	getColorProductionRuleSignalString,
	getHighlightOpacityAnimationValue,
	getHighlightOpacityValue,
	getLegendOpacityRules,
	getLineWidthProductionRule,
	getOpacityAnimationRules,
	getOpacityProductionRule,
	getStrokeDashProductionRule,
	getSymbolSizeProductionRule,
	getTooltip,
	getXProductionRule,
	hasMetricRange,
	hasTooltip,
} from './markUtils';

describe('getColorProductionRule', () => {
	test('should return scale reference if color is a string', () => {
		expect(getColorProductionRule(DEFAULT_COLOR, DEFAULT_COLOR_SCHEME)).toStrictEqual({
			scale: COLOR_SCALE,
			field: DEFAULT_COLOR,
		});
	});

	test('should use linear scale if colorScaleType is linear', () => {
		expect(getColorProductionRule(DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, 'linear')).toHaveProperty(
			'scale',
			LINEAR_COLOR_SCALE
		);
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
		expect(getLineWidthProductionRule(DEFAULT_COLOR)).toStrictEqual({
			scale: LINE_WIDTH_SCALE,
			field: DEFAULT_COLOR,
		});
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
		expect(getStrokeDashProductionRule(DEFAULT_COLOR)).toStrictEqual({
			scale: LINE_TYPE_SCALE,
			field: DEFAULT_COLOR,
		});
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
			signal: `scale('${OPACITY_SCALE}', datum.${DEFAULT_COLOR})`,
		});
	});
	test('should return value rule for static value', () => {
		expect(getOpacityProductionRule({ value: 0.5 })).toStrictEqual({ value: 0.5 });
	});
});

describe('getSymbolSizeProductionRule()', () => {
	test('should return scale rule for key reference', () => {
		expect(getSymbolSizeProductionRule('weight')).toStrictEqual({ scale: SYMBOL_SIZE_SCALE, field: 'weight' });
	});
	test('should return static value squared if static value supplied', () => {
		expect(getSymbolSizeProductionRule({ value: 5 })).toStrictEqual({ value: 25 });
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

describe('getHighlightOpacityValue()', () => {
	test('should divide a signal ref by the highlight contract ratio', () => {
		expect(getHighlightOpacityValue(getOpacityProductionRule(DEFAULT_COLOR))).toStrictEqual({
			signal: `scale('${OPACITY_SCALE}', datum.${DEFAULT_COLOR}) / ${HIGHLIGHT_CONTRAST_RATIO}`,
		});
	});
	test('shold divide a value ref by the highlight contrast ratio', () => {
		expect(getHighlightOpacityValue(getOpacityProductionRule({ value: 0.5 }))).toStrictEqual({
			value: 0.5 / HIGHLIGHT_CONTRAST_RATIO,
		});
	});
});

describe('getXProductionRule()', () => {
	test('should return the correct scale based on scale type', () => {
		expect(getXProductionRule('time', DEFAULT_TIME_DIMENSION)).toEqual({
			scale: 'xTime',
			field: DEFAULT_TRANSFORMED_TIME_DIMENSION,
		});
		expect(getXProductionRule('linear', DEFAULT_TIME_DIMENSION)).toEqual({
			scale: 'xLinear',
			field: DEFAULT_TIME_DIMENSION,
		});
		expect(getXProductionRule('point', DEFAULT_TIME_DIMENSION)).toEqual({
			scale: 'xPoint',
			field: DEFAULT_TIME_DIMENSION,
		});
	});
});

describe('getColorProductionRuleSignalString()', () => {
	test('should return signal reference if color is an array', () => {
		expect(
			getColorProductionRuleSignalString([DEFAULT_COLOR, DEFAULT_SECONDARY_COLOR], DEFAULT_COLOR_SCHEME)
		).toStrictEqual(
			`scale('colors', datum.${DEFAULT_COLOR})[indexof(domain('secondaryColor'), datum.${DEFAULT_SECONDARY_COLOR})% length(scale('colors', datum.${DEFAULT_COLOR}))]`
		);
	});
	test('should return scale reference if color is a string', () => {
		expect(getColorProductionRuleSignalString(DEFAULT_COLOR, DEFAULT_COLOR_SCHEME)).toStrictEqual(
			`scale('${COLOR_SCALE}', datum.${DEFAULT_COLOR})`
		);
	});
	test('should return static value if static value is provided', () => {
		const color = 'rgb(125, 125, 125)';
		expect(getColorProductionRuleSignalString({ value: color }, DEFAULT_COLOR_SCHEME)).toStrictEqual(`'${color}'`);
	});
});

describe('getHighlightOpacityAnimationValue()', () => {
	test('should receive signal highlight opacity animation value', () => {
		expect(getHighlightOpacityAnimationValue({signal: "test"})).toStrictEqual({ signal: `max(1-rscColorAnimation, test / ${HIGHLIGHT_CONTRAST_RATIO})` })
	})

	test('should receive value hightlight opacity animation value', () => {
		expect(getHighlightOpacityAnimationValue({value: 1})).toStrictEqual({ signal: `max(1-rscColorAnimation, 1 / ${HIGHLIGHT_CONTRAST_RATIO})` })
	})
})

describe('getOpacityAnimationRules()', () => {
	test('should receive signal opacity animation rules', () => {
		expect(getOpacityAnimationRules({signal: "test"})).toStrictEqual([
			{
				test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`,
				signal: `max(1-rscColorAnimation, test / ${HIGHLIGHT_CONTRAST_RATIO})`
			},
			{
				test: `!${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES}_prev !== datum.${SERIES_ID}`,
				signal: `max(1-rscColorAnimation, test / ${HIGHLIGHT_CONTRAST_RATIO})`
			},
			DEFAULT_OPACITY_RULE
		])
	})

	test('should receive default opacity animation rules', () => {
		expect(getOpacityAnimationRules()).toStrictEqual([
			{
				test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`,
				signal: `max(1-rscColorAnimation, 1 / ${HIGHLIGHT_CONTRAST_RATIO})`
			},
			{
				test: `!${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES}_prev !== datum.${SERIES_ID}`,
				signal: `max(1-rscColorAnimation, 1 / ${HIGHLIGHT_CONTRAST_RATIO})`
			},
			DEFAULT_OPACITY_RULE
		])
	})
})

describe('getOpacityAnimationRules()', () => {
	test('should receive default legend opacity animation rules', () => {
		expect(getLegendOpacityRules()).toStrictEqual([
			{
				test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.value`,
				signal: `max(1-rscColorAnimation, 1 / ${HIGHLIGHT_CONTRAST_RATIO})`
			},
			{
				test: `!${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES}_prev !== datum.value`,
				signal: `max(1-rscColorAnimation, 1 / ${HIGHLIGHT_CONTRAST_RATIO})`
			},
			DEFAULT_OPACITY_RULE
		])
	})
})
