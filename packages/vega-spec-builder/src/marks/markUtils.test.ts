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
import { SignalRef } from 'vega';

import {
  COLOR_SCALE,
  DEFAULT_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_OPACITY_RULE,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_TIME_DIMENSION,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  HIGHLIGHTED_ITEM,
  HIGHLIGHT_CONTRAST_RATIO,
  HOVERED_ITEM,
  LINEAR_COLOR_SCALE,
  LINE_TYPE_SCALE,
  LINE_WIDTH_SCALE,
  OPACITY_SCALE,
  SELECTED_GROUP,
  SELECTED_ITEM,
  SYMBOL_SIZE_SCALE,
} from '@spectrum-charts/constants';

import { defaultBarOptions } from '../bar/barTestUtils';
import { ProductionRuleTests } from '../types';
import {
  getColorProductionRule,
  getColorProductionRuleSignalString,
  getCursor,
  getHighlightOpacityValue,
  getInteractiveMarkName,
  getLineWidthProductionRule,
  getMarkOpacity,
  getOpacityProductionRule,
  getStrokeDashProductionRule,
  getSymbolSizeProductionRule,
  getTooltip,
  getXProductionRule,
  getYProductionRule,
  hasTooltip,
  isInteractive,
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
      signal:
        "scale('lineWidths', datum.series)[indexof(domain('secondaryLineWidth'), datum.subSeries)% length(scale('lineWidths', datum.series))]",
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
    expect(hasTooltip({ chartTooltips: [{}] })).toBeTruthy();
  });
  test('should be false if ChartTooltip does not exist in children', () => {
    expect(hasTooltip({})).toBeFalsy();
  });
});

describe('getTooltip()', () => {
  test('should return undefined if there are not any interactive children', () => {
    expect(getTooltip([], 'line0')).toBeUndefined();
  });
  test('should return signal ref if there are interactive children', () => {
    const rule = getTooltip([{}], 'line0');
    expect(rule).toHaveProperty('signal');
  });
  test('should reference a nested datum if nestedDatum is true', () => {
    const rule = getTooltip([{}], 'line0', true) as SignalRef;
    expect(rule.signal).toContain('datum.datum');
  });
  test('should add condition test when excludeDataKey is present', () => {
    const rule = getTooltip(
      [{ excludeDataKeys: ['excludeFromTooltip'] }],
      'line0',
      false
    ) as ProductionRuleTests<SignalRef>;
    expect(rule).toHaveLength(2);
    expect(rule[0].test).toBe('datum.excludeFromTooltip');
    expect(rule[0].signal).toBe('false');
  });
  test('should have default tooltip as second item when excludeDataKey is present', () => {
    const rule = getTooltip(
      [{ excludeDataKeys: ['excludeFromTooltip'] }],
      'line0',
      false
    ) as ProductionRuleTests<SignalRef>;
    expect(rule).toHaveLength(2);
    expect(rule[1]).toHaveProperty('signal');
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

describe('getYProductionRule()', () => {
  test('should return the correct encoding based on metricAxis', () => {
    expect(getYProductionRule('metricAxis1', 'metric1')).toEqual({
      scale: 'metricAxis1',
      field: 'metric1',
    });
    expect(getYProductionRule(undefined, 'metric2')).toEqual({
      scale: 'yLinear',
      field: 'metric2',
    });
  });
});

describe('isInteractive()', () => {
  test('should return true based on having interactive children', () => {
    expect(isInteractive({ chartTooltips: [{}] })).toEqual(true);
    expect(isInteractive({})).toEqual(false);
    expect(isInteractive({ chartPopovers: [{}], chartTooltips: [{}] })).toEqual(true);
  });

  test('should return true if hasOnClick', () => {
    expect(isInteractive({ hasOnClick: true })).toEqual(true);
  });
});

describe('getCursor()', () => {
  test('should return pointer object if there are any popovers', () => {
    expect(getCursor([{}])).toEqual({ value: 'pointer' });
  });

  test('should return pointer object if hasOnClick is true', () => {
    expect(getCursor([], true)).toEqual({ value: 'pointer' });
  });

  test('should return falsy value if there are not any popovers and hasOnClick is not false', () => {
    expect(getCursor([])).toBeFalsy();
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

describe('getMarkOpacity()', () => {
  test('no children, should use default opacity', () => {
    expect(getMarkOpacity(defaultBarOptions)).toStrictEqual([DEFAULT_OPACITY_RULE]);
  });
  test('Tooltip child, should return tests for hover and default to opacity', () => {
    const opacity = getMarkOpacity({ ...defaultBarOptions, chartTooltips: [{}] });
    expect(opacity).toHaveLength(4);
    expect(opacity[0].test).toContain(HOVERED_ITEM);
    expect(opacity[1].test).toContain(HIGHLIGHTED_ITEM);
    expect(opacity.at(-1)).toStrictEqual(DEFAULT_OPACITY_RULE);
  });
  test('Popover child, should return tests for hover and select and default to opacity', () => {
    const opacity = getMarkOpacity({ ...defaultBarOptions, chartPopovers: [{}] });
    expect(opacity).toHaveLength(8);
    expect(opacity[0].test).toContain(`${SELECTED_ITEM} !==`);
    expect(opacity[1].test).toContain(`${SELECTED_ITEM} ===`);

    expect(opacity[2].test).toContain(`${SELECTED_GROUP} ===`);
    expect(opacity[3].test).toContain(`${SELECTED_GROUP} !==`);

    expect(opacity[4].test).toContain(HOVERED_ITEM);
    expect(opacity[5].test).toContain(HIGHLIGHTED_ITEM);
    expect(opacity.at(-1)).toStrictEqual(DEFAULT_OPACITY_RULE);
  });
});

describe('getInteractiveMarkName()', () => {
  test('should return undefined if there are no interactive children', () => {
    expect(getInteractiveMarkName({}, 'line0')).toBeUndefined();
    expect(getInteractiveMarkName({ trendlines: [{}] }, 'line0')).toBeUndefined();
  });
  test('should return the name provided if there is a tooltip or popover in the children', () => {
    expect(getInteractiveMarkName({ chartTooltips: [{}] }, 'line0')).toEqual('line0');
    expect(getInteractiveMarkName({ chartPopovers: [{}] }, 'line0')).toEqual('line0');
  });
  test('should return the name provided if options.onClick is defined', () => {
    expect(getInteractiveMarkName({ hasOnClick: true }, 'line0')).toEqual('line0');
  });
  test('should return the name provided if highlightedItem is defined', () => {
    expect(getInteractiveMarkName({ highlightedItem: 'someItem0' }, 'line0')).toEqual('line0');
  });
  test('should return the aggregated trendline name if the line has a trendline with any interactive children', () => {
    expect(getInteractiveMarkName({ trendlines: [{ chartTooltips: [{}] }] }, 'line0')).toEqual('line0Trendline');
  });
});
