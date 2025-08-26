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
import { SubLabel } from '../types';
import { defaultAxisOptions, defaultXBaselineMark, defaultYBaselineMark } from './axisTestUtils';
import { getBaselineRule, getDefaultAxis, getIsMetricAxis, getSubLabelAxis, getTickCount } from './axisUtils';

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
    expect(getTickCount('left', 5)).toEqual({
      signal: 'clamp(ceil(height/100), 2, 5)',
    });
    expect(getTickCount('bottom', 15)).toEqual({
      signal: 'clamp(ceil(width/100), 2, 15)',
    });
  });

  test('when grid is true and maxTicks is not provided, it should use 10 as the max value', () => {
    expect(getTickCount('left', undefined, true)).toEqual({
      signal: 'clamp(ceil(height/100), 2, 10)',
    });
    expect(getTickCount('bottom', undefined, true)).toEqual({
      signal: 'clamp(ceil(width/100), 2, 10)',
    });
  });

  test('when neither maxTicks nor grid is provided, it should return undefined', () => {
    expect(getTickCount('left')).toBeUndefined();
    expect(getTickCount('bottom')).toBeUndefined();
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
