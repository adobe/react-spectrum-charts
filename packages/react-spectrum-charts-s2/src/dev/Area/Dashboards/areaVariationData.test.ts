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
  areaDatasetOptions,
  areaVariationDatasets,
  getAreaSeries,
  getFirstSeries,
  getPeakId,
} from './areaVariationData.js';

describe('Area variation datasets', () => {
  test('provides a selector option for every fixture', () => {
    expect(areaDatasetOptions.map(({ value }) => value).sort()).toEqual(Object.keys(areaVariationDatasets).sort());
  });

  test('covers series count, point count, sign, gap and numeric stress variations', () => {
    expect(getAreaSeries(areaVariationDatasets.single)).toHaveLength(1);
    expect(getAreaSeries(areaVariationDatasets.dense)).toHaveLength(8);
    expect(areaVariationDatasets.dense.length).toBe(8 * 52);
    expect(areaVariationDatasets.fewPoints).toHaveLength(6);
    expect(new Set(areaVariationDatasets.singlePoint.map(({ datetime }) => datetime)).size).toBe(1);
    expect(areaVariationDatasets.negative.some(({ value }) => value !== undefined && value < 0)).toBe(true);
    expect(areaVariationDatasets.zeros.some(({ value }) => value === 0)).toBe(true);
    expect(areaVariationDatasets.gaps.some(({ value, low, high }) => !value && !low && !high)).toBe(true);
    expect(areaVariationDatasets.largeValues.every(({ value }) => value !== undefined && value > 1e8)).toBe(true);
    expect(getAreaSeries(areaVariationDatasets.longLabels).every((series) => series.length > 50)).toBe(true);
  });

  test('samples uneven series on different weeks', () => {
    const weeksBySeries = getAreaSeries(areaVariationDatasets.uneven).map(
      (series) =>
        new Set(areaVariationDatasets.uneven.filter((datum) => datum.series === series).map(({ week }) => week))
    );
    expect(weeksBySeries.map(({ size }) => size)).toEqual([6, 12, 4]);
    expect([...weeksBySeries[0]]).toEqual([1, 3, 5, 7, 9, 11]);
  });

  test('gives every row a unique id, bounds around value and every dimension type', () => {
    Object.values(areaVariationDatasets).forEach((data) => {
      expect(new Set(data.map(({ id }) => id)).size).toBe(data.length);
    });
    const [first] = areaVariationDatasets.standard;
    expect(first).toMatchObject({ date: '2025-01-06', week: 1, label: 'W1', low: 3570, high: 4830 });
  });

  test('derives first-series rows and the peak id', () => {
    const { standard } = areaVariationDatasets;
    expect(getAreaSeries(getFirstSeries(standard))).toEqual(['Organic']);
    expect(getPeakId(standard)).toBe('Organic-11');
    expect(getPeakId([])).toBeUndefined();
  });
});
