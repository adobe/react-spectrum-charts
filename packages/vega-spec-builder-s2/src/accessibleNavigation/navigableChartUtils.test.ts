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
import { DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_METRIC } from '@spectrum-charts/core-s2/constants';

import { AxisOptions, MarkOptions } from '../types/index.js';
import { getBarSeriesFields, getNavigableChart, getUnsupportedNavigationReason } from './navigableChartUtils.js';

describe('getBarSeriesFields()', () => {
  test('a single color field is the only series field', () => {
    expect(getBarSeriesFields({ color: 'os' })).toEqual({ color: 'os', seriesFields: ['os'] });
  });

  test('has no series without a facet field', () => {
    expect(getBarSeriesFields({})).toEqual({ color: undefined, seriesFields: [] });
    expect(getBarSeriesFields({ color: { value: 'red-500' } })).toEqual({ color: undefined, seriesFields: [] });
  });

  test('combines distinct color, lineType and opacity fields', () => {
    expect(getBarSeriesFields({ color: 'series', lineType: 'period', opacity: 'period' })).toEqual({
      color: 'series',
      seriesFields: ['series', 'period'],
    });
  });

  test('stacked dual facets dodge by the secondary fields and stack by the primary', () => {
    expect(getBarSeriesFields({ color: 'series', opacity: ['series', 'period'], type: 'stacked' })).toEqual({
      color: 'series',
      seriesFields: ['series', 'period'],
      dodgeFields: ['period'],
      stackFields: ['series'],
    });
  });

  test('dodged dual facets dodge by the primary fields and stack by the secondary', () => {
    expect(getBarSeriesFields({ color: ['series', 'subSeries'], opacity: 'period', type: 'dodged' })).toEqual({
      color: 'series',
      seriesFields: ['series', 'period', 'subSeries'],
      dodgeFields: ['series', 'period'],
      stackFields: ['subSeries'],
    });
  });
});

describe('getUnsupportedNavigationReason()', () => {
  test('supports a single bar', () => {
    expect(getUnsupportedNavigationReason([{ markType: 'bar', color: 'os', type: 'dodged' }])).toBeUndefined();
  });

  test.each<[string, MarkOptions[]]>([
    ['no marks', []],
    ['a non-bar mark', [{ markType: 'line' }]],
    ['two bars', [{ markType: 'bar' }, { markType: 'bar', name: 'bar1' }]],
    ['a bar with another mark', [{ markType: 'bar' }, { markType: 'line' }]],
    ['a trellised bar', [{ markType: 'bar', trellis: 'region' }]],
  ])('rejects %s', (_, marks) => {
    expect(getUnsupportedNavigationReason(marks)).toEqual(expect.any(String));
  });
});

describe('getNavigableChart()', () => {
  const bottomAxis: AxisOptions = { position: 'bottom', title: 'Browser' };
  const leftAxis: AxisOptions = { position: 'left', title: 'Users' };

  test('is undefined without a bar', () => {
    expect(getNavigableChart({ marks: [{ markType: 'scatter' }] })).toBeUndefined();
  });

  test('applies the bar defaults', () => {
    expect(getNavigableChart({ marks: [{ markType: 'bar' }] })).toEqual({
      chartType: 'bar',
      markName: 'bar0',
      dimension: DEFAULT_CATEGORICAL_DIMENSION,
      metric: DEFAULT_METRIC,
      seriesFields: [],
      type: 'stacked',
      orientation: 'vertical',
      fieldLabels: {},
      hasChartInspect: false,
    });
  });

  test('uses the name the mark has in the spec', () => {
    expect(getNavigableChart({ marks: [{ markType: 'bar', name: 'Revenue Bars' }] })?.markName).toBe('revenueBars');
  });

  test('is undefined for a chart navigation does not support', () => {
    const marks: MarkOptions[] = [
      { markType: 'line', name: 'trend' },
      { markType: 'bar', name: 'first' },
    ];
    expect(getNavigableChart({ marks })).toBeUndefined();
  });

  test('labels fields with the axis and legend titles in reading order', () => {
    const navigation = getNavigableChart({
      marks: [{ markType: 'bar', dimension: 'browser', metric: 'users', color: 'os', opacity: 'period' }],
      axes: [leftAxis, bottomAxis],
      legends: [{ title: 'Operating system' }],
    });
    expect(Object.entries(navigation?.fieldLabels ?? {})).toEqual([
      ['browser', 'Browser'],
      ['os', 'Operating system'],
      ['period', 'period'],
      ['users', 'Users'],
    ]);
  });

  test('swaps the dimension and metric axes for a horizontal bar', () => {
    const navigation = getNavigableChart({
      marks: [{ markType: 'bar', dimension: 'browser', metric: 'users', orientation: 'horizontal' }],
      axes: [
        { position: 'left', title: 'Browser' },
        { position: 'bottom', title: 'Users' },
      ],
    });
    expect(navigation?.fieldLabels).toEqual({ browser: 'Browser', users: 'Users' });
    expect(navigation?.xAxis).toBeUndefined();
  });

  test('joins a multi-line axis title', () => {
    const navigation = getNavigableChart({
      marks: [{ markType: 'bar', dimension: 'browser' }],
      axes: [{ position: 'bottom', title: ['Web', 'browser'] }],
    });
    expect(navigation?.fieldLabels).toEqual({ browser: 'Web browser' });
    expect(navigation?.xAxis).toEqual({ field: 'browser', title: 'Web browser' });
  });

  test('reads the series under the title of the legend for its color', () => {
    const navigation = getNavigableChart({
      marks: [{ markType: 'bar', color: 'os' }],
      axes: [bottomAxis],
      legends: [
        { color: 'region', title: 'Region' },
        { color: 'os', title: 'Operating system' },
      ],
    });
    expect(navigation?.fieldLabels.os).toBe('Operating system');
  });

  test('adds a bottom-axis region with the default dimension', () => {
    const navigation = getNavigableChart({ marks: [{ markType: 'bar' }], axes: [{ position: 'bottom' }] });
    expect(navigation?.xAxis).toEqual({ field: DEFAULT_CATEGORICAL_DIMENSION, title: undefined });
  });

  test('records the metric axis titles of a dual-metric-axis bar', () => {
    const axes: AxisOptions[] = [leftAxis, { position: 'right', title: 'Revenue' }];
    const dual = getNavigableChart({
      marks: [{ markType: 'bar', color: 'series', type: 'dodged', dualMetricAxis: true }],
      axes,
    });
    const stacked = getNavigableChart({ marks: [{ markType: 'bar', color: 'series', dualMetricAxis: true }], axes });
    expect(dual?.metricAxisTitles).toEqual({ primary: 'Users', secondary: 'Revenue' });
    expect(stacked?.metricAxisTitles).toBeUndefined();
  });

  test('records whether the bar has a ChartInspect', () => {
    expect(getNavigableChart({ marks: [{ markType: 'bar', chartInspects: [{}] }] })?.hasChartInspect).toBe(true);
  });
});
