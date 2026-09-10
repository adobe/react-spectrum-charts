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
import {
  DEFAULT_BAR_ORIENTATION,
  DEFAULT_BAR_TYPE,
  DEFAULT_CATEGORICAL_DIMENSION,
  DEFAULT_LINE_SCALE_TYPE,
  DEFAULT_METRIC,
  DEFAULT_TIME_DIMENSION,
} from '@spectrum-charts/constants';

import { Bar } from '../components/Bar';
import { Line } from '../components/Line';
import { getNavigableChartType, resolveNavGeometryFields } from './navigableMarks';

describe('getNavigableChartType()', () => {
  test('maps the Bar and Line displayNames to their nav chart types', () => {
    expect(getNavigableChartType(Bar.displayName)).toBe('bar');
    expect(getNavigableChartType(Line.displayName)).toBe('line');
  });

  test('returns undefined for a non-navigable displayName', () => {
    expect(getNavigableChartType('Donut')).toBeUndefined();
    expect(getNavigableChartType(undefined)).toBeUndefined();
  });
});

describe('resolveNavGeometryFields()', () => {
  test('applies Bar defaults when props are omitted', () => {
    expect(resolveNavGeometryFields('bar', undefined, undefined)).toEqual({
      dimension: DEFAULT_CATEGORICAL_DIMENSION,
      metric: DEFAULT_METRIC,
      scaleType: undefined,
      metricAxis: undefined,
      orientation: DEFAULT_BAR_ORIENTATION,
      type: DEFAULT_BAR_TYPE,
      color: undefined,
    });
  });

  test('applies Line defaults when props are omitted', () => {
    expect(resolveNavGeometryFields('line', undefined, undefined)).toEqual({
      dimension: DEFAULT_TIME_DIMENSION,
      metric: DEFAULT_METRIC,
      scaleType: DEFAULT_LINE_SCALE_TYPE,
      metricAxis: undefined,
      orientation: undefined,
      type: undefined,
      color: undefined,
    });
  });

  test('prefers explicit mark props over defaults', () => {
    const fields = resolveNavGeometryFields(
      'bar',
      { dimension: 'category', metric: 'downloads', orientation: 'vertical', type: 'stacked', metricAxis: 'yLinear' },
      'series'
    );
    expect(fields).toEqual({
      dimension: 'category',
      metric: 'downloads',
      scaleType: undefined,
      metricAxis: 'yLinear',
      orientation: 'vertical',
      type: 'stacked',
      color: 'series',
    });
  });

  test('only carries the color field for bars', () => {
    expect(resolveNavGeometryFields('bar', undefined, 'series').color).toBe('series');
    expect(resolveNavGeometryFields('line', undefined, 'series').color).toBeUndefined();
  });
});
