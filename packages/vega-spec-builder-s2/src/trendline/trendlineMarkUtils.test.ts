/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Facet, From, GroupMark, Mark } from 'vega';

import { COLOR_SCALE, DEFAULT_TIME_DIMENSION, TRENDLINE_VALUE } from '@spectrum-charts/constants';
import { spectrum2Colors } from '@spectrum-charts/themes';

import {
  getLineXProductionRule,
  getLineYProductionRule,
  getRuleXEncodings,
  getRuleYEncodings,
  getTrendlineLineMark,
  getTrendlineMarks,
  getTrendlineRuleMark,
} from './trendlineMarkUtils';
import { defaultLineOptions, defaultTrendlineOptions } from './trendlineTestUtils';

describe('getTrendlineMarks()', () => {
  test('should return rule mark for aggregate methods', () => {
    const marks = getTrendlineMarks({
      ...defaultLineOptions,
      trendlines: [{ method: 'median' }],
    });
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveProperty('type', 'rule');
  });
  test('should return group and line mark for non-aggregate methods', () => {
    const marks = getTrendlineMarks({
      ...defaultLineOptions,
      trendlines: [{ method: 'linear' }],
    });
    // group mark
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveProperty('type', 'group');
    const groupMark = marks[0] as GroupMark;
    // line mark
    expect(groupMark.marks).toHaveLength(1);
    expect(groupMark.marks?.[0]).toHaveProperty('type', 'line');
  });
  test('should add hover marks if ChartInspect exists on Trendline', () => {
    const marks = getTrendlineMarks({
      ...defaultLineOptions,
      trendlines: [{ chartInspects: [{}] }],
    });
    expect(marks).toHaveLength(2);
    expect(marks[1]).toHaveProperty('type', 'group');
    const trendlineMarks = (marks[1] as GroupMark).marks as Mark[];
    // line mark
    expect(trendlineMarks).toHaveLength(6);
    expect(trendlineMarks[0]).toHaveProperty('type', 'rule');
    expect(trendlineMarks[1]).toHaveProperty('type', 'symbol'); // highlight point
    expect(trendlineMarks[2]).toHaveProperty('type', 'text'); // hover label background
    expect(trendlineMarks[3]).toHaveProperty('type', 'text'); // hover label foreground
    expect(trendlineMarks[4]).toHaveProperty('type', 'symbol'); // voronoi points
    expect(trendlineMarks[5]).toHaveProperty('type', 'path'); // voronoi path
  });
  test('should reference _data for window method', () => {
    const marks = getTrendlineMarks({
      ...defaultLineOptions,
      trendlines: [{ method: 'movingAverage-2' }],
    });
    expect(
      (
        marks[0].from as From & {
          facet: Facet;
        }
      ).facet.data
    ).toEqual('line0Trendline0_data');
  });
  test('should reference _highResolutionData for linear method', () => {
    const marks = getTrendlineMarks({
      ...defaultLineOptions,
      trendlines: [{ method: 'linear' }],
    });
    expect(
      (
        marks[0].from as From & {
          facet: Facet;
        }
      ).facet.data
    ).toEqual('line0Trendline0_highResolutionData');
  });
});

describe('getTrendlineRuleMark()', () => {
  test('should use series color if static color is not provided', () => {
    const mark = getTrendlineRuleMark(defaultLineOptions, { ...defaultTrendlineOptions, method: 'median' });
    expect(mark.encode?.enter?.stroke).toEqual({ field: 'series', scale: COLOR_SCALE });
  });
  test('should use static color if provided', () => {
    const mark = getTrendlineRuleMark(defaultLineOptions, {
      ...defaultTrendlineOptions,
      trendlineColor: { value: 'gray-500' },
      method: 'median',
    });
    expect(mark.encode?.enter?.stroke).toEqual({ value: spectrum2Colors.light['gray-500'] });
  });

  test('opacity stays the static instant-rule array even when the parent line is animated', () => {
    // the trendline renders under its own mark name (`${parentName}Trendline${index}`), which has no
    // `_hoverFractionData` of its own — getLineMarkOptions forces isAnimate: false for exactly this
    // reason, otherwise this would reference a data source that was only created for the parent's name
    const mark = getTrendlineRuleMark(
      { ...defaultLineOptions, interactiveMarkName: 'line0', isAnimate: true },
      { ...defaultTrendlineOptions, method: 'median' }
    );
    expect(Array.isArray(mark.encode?.update?.opacity)).toBe(true);
  });
});

describe('getRuleYEncodings()', () => {
  test('should return the correct rules for numeric extent', () => {
    const encoding = getRuleYEncodings([0, 10], 'count', 'vertical');
    expect(encoding).toHaveProperty('y', { scale: 'yLinear', value: 0 });
    expect(encoding).toHaveProperty('y2', { scale: 'yLinear', value: 10 });
  });
  test('should return the correct rules for "domain" extent', () => {
    const encoding = getRuleYEncodings(['domain', 'domain'], 'count', 'vertical');
    expect(encoding).toHaveProperty('y', { signal: 'height' });
    expect(encoding).toHaveProperty('y2', { value: 0 });
  });
  test('should return the correct rules for null extent', () => {
    const encoding = getRuleYEncodings([null, null], 'count', 'vertical');
    expect(encoding).toHaveProperty('y', { scale: 'yLinear', field: 'countMin' });
    expect(encoding).toHaveProperty('y2', { scale: 'yLinear', field: 'countMax' });
  });

  test('should return the corret rules for horizontal orientation', () => {
    const encoding = getRuleYEncodings([0, 10], 'count', 'horizontal');
    expect(encoding).toHaveProperty('y', { scale: 'yLinear', field: TRENDLINE_VALUE });
    expect(encoding).not.toHaveProperty('y2');
  });
});

describe('getRuleXEncondings()', () => {
  test('should return the correct rules for numeric extent', () => {
    const encoding = getRuleXEncodings([0, 10], 'count', 'linear', 'horizontal');
    expect(encoding).toHaveProperty('x', { scale: 'xLinear', value: 0 });
    expect(encoding).toHaveProperty('x2', { scale: 'xLinear', value: 10 });
  });
  test('should return the correct rules for "domain" extent', () => {
    const encoding = getRuleXEncodings(['domain', 'domain'], 'count', 'linear', 'horizontal');
    expect(encoding).toHaveProperty('x', { value: 0 });
    expect(encoding).toHaveProperty('x2', { signal: 'width' });
  });
  test('should return the correct rules for null extent', () => {
    const encoding = getRuleXEncodings([null, null], 'count', 'linear', 'horizontal');
    expect(encoding).toHaveProperty('x', { scale: 'xLinear', field: 'countMin' });
    expect(encoding).toHaveProperty('x2', { scale: 'xLinear', field: 'countMax' });
  });

  test('should return the corret rules for vertical orientation', () => {
    const encoding = getRuleXEncodings([0, 10], 'count', 'linear', 'vertical');
    expect(encoding).toHaveProperty('x', { scale: 'xLinear', field: TRENDLINE_VALUE });
    expect(encoding).not.toHaveProperty('x2');
  });
});

describe('getTrendlineLineMark()', () => {
  test('should use normalized values for x if it is a regression method and scale is time', () => {
    expect(
      getTrendlineLineMark(defaultLineOptions, {
        ...defaultTrendlineOptions,
        isDimensionNormalized: true,
        method: 'linear',
        trendlineDimension: `${DEFAULT_TIME_DIMENSION}Normalized`,
      }).encode?.update?.x
    ).toEqual({
      scale: 'xTrendline',
      field: `${DEFAULT_TIME_DIMENSION}Normalized`,
    });
  });
  test('should use regular x rule if the x dimension is not normalized', () => {
    expect(
      getTrendlineLineMark(defaultLineOptions, { ...defaultTrendlineOptions, method: 'median' }).encode?.update?.x
    ).toEqual({ field: DEFAULT_TIME_DIMENSION, scale: 'xTime' });
    expect(
      getTrendlineLineMark(defaultLineOptions, { ...defaultTrendlineOptions, method: 'movingAverage-12' }).encode
        ?.update?.x
    ).toEqual({ field: DEFAULT_TIME_DIMENSION, scale: 'xTime' });
    expect(
      getTrendlineLineMark(
        { ...defaultLineOptions, scaleType: 'linear', dimension: 'count' },
        { ...defaultTrendlineOptions, dimensionScaleType: 'linear', trendlineDimension: 'count' }
      ).encode?.update?.x
    ).toEqual({ field: 'count', scale: 'xLinear' });
  });
  test('should use series color if static color is not provided', () => {
    const mark = getTrendlineLineMark(defaultLineOptions, defaultTrendlineOptions);
    expect(mark.encode?.enter?.stroke).toEqual({ field: 'series', scale: COLOR_SCALE });
  });
  test('should use static color if provided', () => {
    const mark = getTrendlineLineMark(defaultLineOptions, {
      ...defaultTrendlineOptions,
      trendlineColor: { value: 'gray-500' },
    });
    expect(mark.encode?.enter?.stroke).toEqual({ value: spectrum2Colors.light['gray-500'] });
  });

  test('opacity stays the static instant-rule array even when the parent line is animated', () => {
    const mark = getTrendlineLineMark(
      { ...defaultLineOptions, interactiveMarkName: 'line0', isAnimate: true },
      defaultTrendlineOptions
    );
    expect(Array.isArray(mark.encode?.update?.opacity)).toBe(true);
  });
});

describe('getLineYProductionRule()', () => {
  test('should use trendline dimension for vertical orientation', () => {
    expect(getLineYProductionRule('count', 'vertical')).toHaveProperty('field', 'count');
  });
  test('should use TRENDLINE_VALUE for horizontal orientation', () => {
    expect(getLineYProductionRule('count', 'horizontal')).toHaveProperty('field', TRENDLINE_VALUE);
  });
});

describe('getLineXProductionRule()', () => {
  test('should use TRENDLINE_VALUE for vertical orientation', () => {
    expect(getLineXProductionRule('count', 'linear', 'vertical', false)).toHaveProperty('field', TRENDLINE_VALUE);
  });
  test('should use xTrendline scale if horizontal and normalized', () => {
    expect(getLineXProductionRule('count', 'linear', 'horizontal', true)).toHaveProperty('scale', 'xTrendline');
  });
  test('should use trendline dimension if horizontal', () => {
    expect(getLineXProductionRule('count', 'linear', 'horizontal', true)).toHaveProperty('field', 'count');
    expect(getLineXProductionRule('count', 'linear', 'horizontal', false)).toHaveProperty('field', 'count');
  });
});
