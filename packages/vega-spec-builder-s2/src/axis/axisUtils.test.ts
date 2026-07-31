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
import { Scale } from 'vega';

import { AxisSpecOptions, SubLabel } from '../types';
import { defaultAxisOptions, defaultXBaselineMark, defaultYBaselineMark } from './axisTestUtils';
import {
  DivergingBarContext,
  getBaselineRule,
  getDefaultAxis,
  getDivergingAxisOffset,
  getDivergingLabelEncode,
  getDivergingTickIsNegativeTest,
  getIsMetricAxis,
  getOpposingScaleName,
  getPriorityMergedSignal,
  getSubLabelAxis,
  getTickCount,
  getTimeAxes,
  productionRuleToExpr,
} from './axisUtils';

describe('getBaselineRule', () => {
  describe('initial state', () => {
    test("position: 'bottom', baseline: true", () => {
      expect(getBaselineRule(0, 'bottom')).toStrictEqual(defaultXBaselineMark);
    });
    test("position: 'left', baseline: true", () => {
      expect(getBaselineRule(0, 'left')).toStrictEqual(defaultYBaselineMark);
    });
  });
  describe('baselineOffset', () => {
    test('should apply offset', () => {
      expect(getBaselineRule(1, 'bottom').encode?.update?.y).toHaveProperty('value', 1);
      expect(getBaselineRule(100, 'bottom').encode?.update?.y).toHaveProperty('value', 100);
      expect(getBaselineRule(-100, 'bottom').encode?.update?.y).toHaveProperty('value', -100);
    });
  });
});

describe('getDefaultAxis()', () => {
  test('tickMinStep: linear scale', () => {
    expect(
      getDefaultAxis(
        {
          axisAnnotations: [],
          axisThumbnails: [],
          baseline: false,
          baselineOffset: 0,
          colorScheme: 'light',
          granularity: 'day',
          grid: true,
          hideDefaultLabels: false,
          index: 0,
          labelAlign: 'center',
          labelFontWeight: 'normal',
          labelOrientation: 'horizontal',
          labels: [],
          name: 'axis0',
          numberFormat: 'shortNumber',
          position: 'left',
          referenceLines: [],
          scaleType: 'linear',
          subLabels: [],
          ticks: false,
          title: 'Users',
          tickMinStep: 5,
        },
        'yLinear'
      )
    ).toStrictEqual({
      scale: 'yLinear',
      orient: 'left',
      grid: true,
      ticks: false,
      tickCount: {
        signal: 'clamp(ceil(height/100), 2, 10)',
      },
      tickMinStep: 5,
      title: 'Users',
      labels: true,
      labelAlign: 'right',
      labelAngle: 0,
      labelBaseline: 'middle',
      labelFontWeight: 'normal',
      labelOffset: undefined,
      labelPadding: undefined,
      encode: {
        labels: {
          interactive: false,
          update: {
            text: [
              {
                test: "isNumber(datum['value'])",
                signal: "formatShortNumber(datum['value'])",
              },
              {
                signal: 'datum.value',
              },
            ],
          },
        },
      },
    });
  });
  test('tickMinStep: linear scale', () => {
    expect(
      getDefaultAxis(
        {
          axisAnnotations: [],
          axisThumbnails: [],
          baseline: false,
          baselineOffset: 0,
          colorScheme: 'light',
          granularity: 'day',
          grid: true,
          hideDefaultLabels: false,
          index: 0,
          labelAlign: 'center',
          labelFontWeight: 'normal',
          labelOrientation: 'horizontal',
          labels: [],
          name: 'axis0',
          numberFormat: 'shortNumber',
          position: 'left',
          referenceLines: [],
          scaleType: 'point',
          subLabels: [],
          ticks: false,
          title: 'Users',
          tickMinStep: 5,
        },
        'yLinear'
      )
    ).toStrictEqual({
      scale: 'yLinear',
      orient: 'left',
      grid: true,
      ticks: false,
      tickCount: {
        signal: 'clamp(ceil(height/100), 2, 10)',
      },
      tickMinStep: undefined,
      title: 'Users',
      labels: true,
      labelAlign: 'right',
      labelAngle: 0,
      labelBaseline: 'middle',
      labelFontWeight: 'normal',
      labelOffset: undefined,
      labelPadding: undefined,
      encode: {
        labels: {
          interactive: false,
          update: {
            text: [
              {
                test: "isNumber(datum['value'])",
                signal: "formatShortNumber(datum['value'])",
              },
              {
                signal: 'datum.value',
              },
            ],
          },
        },
      },
    });
  });
  test('should set values to empty array if hideDefaultLabels === true', () => {
    expect(getDefaultAxis({ ...defaultAxisOptions, hideDefaultLabels: true }, 'xLinear')).toHaveProperty(
      'labels',
      false
    );
  });

  test('should set labelLimit property with custom value', () => {
    expect(getDefaultAxis({ ...defaultAxisOptions, labelLimit: 5 }, 'xLinear')).toHaveProperty('labelLimit', 5);
  });

  test('should not include labelLimit property when not specified', () => {
    expect(getDefaultAxis(defaultAxisOptions, 'xLinear')).not.toHaveProperty('labelLimit');
  });
});

describe('getSubLabelAxis()', () => {
  test('should set the labelPadding to 32 if ticks are enabled and 24 if not', () => {
    const subLabels: SubLabel[] = [
      { value: 1, subLabel: 'one', align: 'start' },
      { value: 2, subLabel: 'two', align: 'end' },
    ];
    expect(getSubLabelAxis({ ...defaultAxisOptions, subLabels }, 'xLinear')).toHaveProperty('labelPadding', 24);
    expect(getSubLabelAxis({ ...defaultAxisOptions, subLabels, ticks: true }, 'xLinear')).toHaveProperty(
      'labelPadding',
      32
    );
  });

  test('should set values to undefined if sublabels have length 0', () => {
    expect(getSubLabelAxis({ ...defaultAxisOptions, subLabels: [] }, 'xLinear')).toHaveProperty('values', undefined);
  });
});

describe('getTickCount()', () => {
  test('when maxTicks is provided, it should use maxTicks as the max value', () => {
    expect(getTickCount('left', undefined,5)).toEqual({
      signal: 'clamp(ceil(height/100), 2, 5)',
    });
    expect(getTickCount('bottom', undefined,15)).toEqual({
      signal: 'clamp(ceil(width/100), 2, 15)',
    });
  });

  test('when tickCountMinimum is provided, it should use tickCountMinimum as the min value', () => {
    expect(getTickCount('left', 3, undefined, false)).toEqual({
      signal: 'clamp(ceil(height/100), 3, 10)',
    });
    expect(getTickCount('bottom', 5, undefined, false)).toEqual({
      signal: 'clamp(ceil(width/100), 5, 10)',
    });
  });

  test('when both tickCountMinimum and tickCountLimit are provided, it should use tickCountMinimum as the min value and tickCountLimit as the max value', () => {
    expect(getTickCount('left', 3, 5, false)).toEqual({
      signal: 'clamp(ceil(height/100), 3, 5)',
    });
    expect(getTickCount('bottom', 5, 15, false)).toEqual({
      signal: 'clamp(ceil(width/100), 5, 15)',
    });
  });

  test('when grid is true and maxTicks or tickCountMinimum is not provided, it should use 2 as the min value and 10 as the max value', () => {
    expect(getTickCount('left', undefined, undefined, true)).toEqual({
      signal: 'clamp(ceil(height/100), 2, 10)',
    });
    expect(getTickCount('bottom', undefined, undefined, true)).toEqual({
      signal: 'clamp(ceil(width/100), 2, 10)',
    });
  });

  test('when neither maxTicks nor grid is provided, it should return undefined', () => {
    expect(getTickCount('left')).toBeUndefined();
    expect(getTickCount('bottom')).toBeUndefined();
  });
});

describe('getTimeAxes()', () => {
  const baseTimeAxisOptions: AxisSpecOptions = {
    ...defaultAxisOptions,
    granularity: 'day',
    position: 'bottom',
  };

  test('uses granularity tickCount by default when no limits are set', () => {
    const [secondaryAxis] = getTimeAxes('xTime', baseTimeAxisOptions);
    expect(secondaryAxis).toHaveProperty('tickCount', 'day');
  });

  test('uses width-based signal when tickCountLimit is set', () => {
    const [secondaryAxis, primaryAxis] = getTimeAxes('xTime', { ...baseTimeAxisOptions, tickCountLimit: 5 });
    expect(secondaryAxis).toHaveProperty('tickCount', { signal: 'clamp(ceil(width/100), 2, 5)' });
    expect(primaryAxis).toHaveProperty('tickCount', { signal: 'clamp(ceil(width/100), 2, 5)' });
  });

  test('uses width-based signal when tickCountMinimum is set', () => {
    const [secondaryAxis, primaryAxis] = getTimeAxes('xTime', { ...baseTimeAxisOptions, tickCountMinimum: 3 });
    expect(secondaryAxis).toHaveProperty('tickCount', { signal: 'clamp(ceil(width/100), 3, 10)' });
    expect(primaryAxis).toHaveProperty('tickCount', { signal: 'clamp(ceil(width/100), 3, 10)' });
  });

  test('uses width-based signal with both min and max when both limits are set', () => {
    const [secondaryAxis, primaryAxis] = getTimeAxes('xTime', {
      ...baseTimeAxisOptions,
      tickCountMinimum: 3,
      tickCountLimit: 8,
    });
    expect(secondaryAxis).toHaveProperty('tickCount', { signal: 'clamp(ceil(width/100), 3, 8)' });
    expect(primaryAxis).toHaveProperty('tickCount', { signal: 'clamp(ceil(width/100), 3, 8)' });
  });

  test('falls back to granularity tickCount for non-time scale names', () => {
    const [secondaryAxis] = getTimeAxes('xLinear', { ...baseTimeAxisOptions, tickCountLimit: 5 });
    expect(secondaryAxis).toHaveProperty('tickCount', undefined);
  });
});

describe('getIsMetricAxis()', () => {
  describe('with vertical chart orientation', () => {
    test('should return true for left axis', () => {
      expect(getIsMetricAxis('left', 'vertical')).toBe(true);
    });

    test('should return true for right axis', () => {
      expect(getIsMetricAxis('right', 'vertical')).toBe(true);
    });

    test('should return false for top axis', () => {
      expect(getIsMetricAxis('top', 'vertical')).toBe(false);
    });

    test('should return false for bottom axis', () => {
      expect(getIsMetricAxis('bottom', 'vertical')).toBe(false);
    });
  });

  describe('with horizontal chart orientation', () => {
    test('should return false for left axis', () => {
      expect(getIsMetricAxis('left', 'horizontal')).toBe(false);
    });

    test('should return false for right axis', () => {
      expect(getIsMetricAxis('right', 'horizontal')).toBe(false);
    });

    test('should return true for top axis', () => {
      expect(getIsMetricAxis('top', 'horizontal')).toBe(true);
    });

    test('should return true for bottom axis', () => {
      expect(getIsMetricAxis('bottom', 'horizontal')).toBe(true);
    });
  });
});

describe('getOpposingScaleName()', () => {
  test('falls back to the default linear scale name when no matching scale is present', () => {
    expect(getOpposingScaleName([], 'left')).toBe('xLinear');
    expect(getOpposingScaleName([], 'right')).toBe('xLinear');
    expect(getOpposingScaleName([], 'top')).toBe('yLinear');
    expect(getOpposingScaleName([], 'bottom')).toBe('yLinear');
  });
  test('returns the name of the scale whose range matches the opposing dimension', () => {
    const scales = [
      { name: 'myMetric', type: 'linear', range: 'width' },
      { name: 'other', type: 'band', range: 'height' },
    ] as Scale[];
    expect(getOpposingScaleName(scales, 'left')).toBe('myMetric'); // vertical axis → opposing range 'width'
    expect(getOpposingScaleName(scales, 'bottom')).toBe('other'); // horizontal axis → opposing range 'height'
  });
});

describe('getDivergingAxisOffset()', () => {
  test('left/top move inward with a negated zero-position offset', () => {
    expect(getDivergingAxisOffset('left', 'testScale')).toStrictEqual({ signal: "-scale('testScale', 0)" });
    expect(getDivergingAxisOffset('top', 'testScale')).toStrictEqual({ signal: "-scale('testScale', 0)" });
  });
  test('right/bottom move inward relative to the range size', () => {
    expect(getDivergingAxisOffset('right', 'testScale')).toStrictEqual({ signal: "scale('testScale', 0) - width" });
    expect(getDivergingAxisOffset('bottom', 'testScale')).toStrictEqual({ signal: "scale('testScale', 0) - height" });
  });
});

describe('getDivergingTickIsNegativeTest()', () => {
  test('joins back to the bar data on the dimension and tests the metric sign', () => {
    const context: DivergingBarContext = { dataName: 'filteredTable', dimension: 'channel', metric: 'changeRate' };
    expect(getDivergingTickIsNegativeTest(context)).toBe(
      "data('filteredTable')[indexof(pluck(data('filteredTable'), 'channel'), datum.value)]['changeRate'] < 0"
    );
  });
});

describe('getDivergingLabelEncode()', () => {
  describe('vertical axes flip align + compensate dx', () => {
    test("left axis: default labelPadding (8) → 2*8 gap compensation", () => {
      expect(getDivergingLabelEncode('left', 'isNeg')).toStrictEqual({
        update: {
          align: [{ test: 'isNeg', value: 'left' }, { value: 'right' }],
          dx: [{ test: 'isNeg', value: 16 }, { value: 0 }],
        },
      });
    });
    test('right axis: flipped offset is negative', () => {
      expect(getDivergingLabelEncode('right', 'isNeg')).toStrictEqual({
        update: {
          align: [{ test: 'isNeg', value: 'left' }, { value: 'right' }],
          dx: [{ test: 'isNeg', value: 0 }, { value: -16 }],
        },
      });
    });
    test('custom labelPadding scales the gap compensation', () => {
      expect(getDivergingLabelEncode('left', 'isNeg', 24).update.dx).toStrictEqual([
        { test: 'isNeg', value: 48 },
        { value: 0 },
      ]);
    });
    test('extraOutwardOffset flips sign with the test (not added as a constant)', () => {
      expect(getDivergingLabelEncode('left', 'isNeg', 8, 20).update.dx).toStrictEqual([
        { test: 'isNeg', value: -4 },
        { value: 20 },
      ]);
    });
  });
  describe('horizontal axes flip baseline + compensate dy', () => {
    test('top axis', () => {
      expect(getDivergingLabelEncode('top', 'isNeg')).toStrictEqual({
        update: {
          baseline: [{ test: 'isNeg', value: 'bottom' }, { value: 'top' }],
          dy: [{ test: 'isNeg', value: 0 }, { value: 16 }],
        },
      });
    });
    test('bottom axis', () => {
      expect(getDivergingLabelEncode('bottom', 'isNeg')).toStrictEqual({
        update: {
          baseline: [{ test: 'isNeg', value: 'bottom' }, { value: 'top' }],
          dy: [{ test: 'isNeg', value: -16 }, { value: 0 }],
        },
      });
    });
  });
});

describe('productionRuleToExpr()', () => {
  test('single value rule → JSON literal', () => {
    expect(productionRuleToExpr({ value: 'left' })).toBe('"left"');
    expect(productionRuleToExpr({ value: 16 })).toBe('16');
  });
  test('single signal rule → the signal expression', () => {
    expect(productionRuleToExpr({ signal: 'foo + 1' })).toBe('foo + 1');
  });
  test('conditional rule array → nested ternary (never a stranded fallback)', () => {
    expect(productionRuleToExpr([{ test: 'T', value: 'a' }, { value: 'b' }])).toBe('(T ? ("a") : ("b"))');
  });
});

describe('getPriorityMergedSignal()', () => {
  test('priority tested entries win, then the full fallback chain, as one signal', () => {
    const priority = [{ test: 'P', value: 'x' }, { value: 'ignoredFallback' }];
    const fallback = [{ test: 'F', value: 'a' }, { value: 'b' }];
    expect(getPriorityMergedSignal(priority, fallback)).toStrictEqual({
      signal: '(P ? ("x") : ((F ? ("a") : ("b"))))',
    });
  });
});
