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
import { SERIES_ID } from '@spectrum-charts/constants';
import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { getBarSeriesFields, getSeriesKey, isDodgedAndStackedBar, withViewKeys } from './barSeries';

describe('getBarSeriesFields', () => {
  test('a single color field is the only series field', () => {
    expect(getBarSeriesFields({ color: 'os' })).toEqual({ color: 'os', seriesFields: ['os'] });
  });

  test('has no series without a facet', () => {
    expect(getBarSeriesFields({})).toEqual({ color: undefined, seriesFields: [] });
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

describe('isDodgedAndStackedBar', () => {
  test('is true only when a facet is a two-field array', () => {
    expect(isDodgedAndStackedBar({ color: ['a', 'b'] })).toBe(true);
    expect(isDodgedAndStackedBar({ color: 'a', opacity: 'b' })).toBe(false);
  });
});

describe('getSeriesKey', () => {
  test('keeps a single field raw and joins several with " | "', () => {
    expect(getSeriesKey({ year: 2024 }, ['year'])).toBe(2024);
    expect(getSeriesKey({ series: 'A', period: 'Last' }, ['series', 'period'])).toBe('A | Last');
  });
});

describe('withViewKeys', () => {
  const data = [
    { series: 'A', period: 'Last', day: '2024-01-01' },
    { series: 'B', period: 'Prev', day: '2024-01-02' },
  ];
  const seriesIds = (rows: SimpleData[]) => rows.map((row) => row[SERIES_ID]);

  test("reads the view's series ids when its table lines up with the data", () => {
    const table = data.map((row, index) => ({ ...row, [SERIES_ID]: `id${index}` }));
    expect(seriesIds(withViewKeys(data, table, { seriesFields: ['series', 'period'] }).data)).toEqual(['id0', 'id1']);
  });

  test('joins the series fields when the table is unavailable', () => {
    expect(seriesIds(withViewKeys(data, undefined, { seriesFields: ['series', 'period'] }).data)).toEqual(['A | Last', 'B | Prev']);
  });

  test('leaves data untouched without series fields or a table', () => {
    expect(withViewKeys(data, undefined, { seriesFields: [], dimension: 'day' }).data).toBe(data);
  });

  test("keys a parsed dimension by the chart's value and keeps the original for labels", () => {
    const table = data.map((row) => ({ ...row, day: Date.parse(row.day) }));
    const { data: keyed, dimensionLabels } = withViewKeys(data, table, { seriesFields: ['series'], dimension: 'day' });
    expect(keyed.map((row) => row.day)).toEqual([Date.parse('2024-01-01'), Date.parse('2024-01-02')]);
    expect(dimensionLabels?.get(String(Date.parse('2024-01-01')))).toBe('2024-01-01');
  });

  test('has no dimension labels when the chart keeps the values as they are', () => {
    expect(withViewKeys(data, data, { seriesFields: ['series'], dimension: 'day' }).dimensionLabels).toBeUndefined();
  });

  test('ignores a table whose rows are a different or reordered data set', () => {
    const stale = [...data].reverse().map((row, index) => ({ ...row, day: Date.parse(row.day), [SERIES_ID]: `id${index}` }));
    const { data: keyed, dimensionLabels } = withViewKeys(data, stale, { seriesFields: ['series', 'period'], dimension: 'day' });
    expect(seriesIds(keyed)).toEqual(['A | Last', 'B | Prev']);
    expect(keyed.map((row) => row.day)).toEqual(['2024-01-01', '2024-01-02']);
    expect(dimensionLabels).toBeUndefined();
  });

  test('ignores a table whose parsed dimension is a different date', () => {
    const stale = data.map((row) => ({ ...row, day: Date.parse('2023-06-01') }));
    expect(withViewKeys(data, stale, { seriesFields: ['series'], dimension: 'day' }).data.map((row) => row.day)).toEqual([
      '2024-01-01',
      '2024-01-02',
    ]);
  });
});
