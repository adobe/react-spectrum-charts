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
  comboDatasetOptions,
  comboVariationDatasets,
  getComboSeries,
  getForecastStart,
  toChannelRows,
} from './comboVariationData.js';

describe('Combo variation datasets', () => {
  test('provides a selector option for every fixture', () => {
    expect(comboDatasetOptions.map(({ value }) => value).sort()).toEqual(Object.keys(comboVariationDatasets).sort());
  });

  test('covers sparse, dense, negative, zero, and large value stress variations', () => {
    expect(comboVariationDatasets.standard).toHaveLength(7);
    expect(comboVariationDatasets.single).toHaveLength(1);
    expect(comboVariationDatasets.manyPoints).toHaveLength(30);
    expect(comboVariationDatasets.negative.some(({ orders }) => orders < 0)).toBe(true);
    expect(comboVariationDatasets.negative.some(({ visits }) => visits < 0)).toBe(true);
    expect(comboVariationDatasets.zeros.some(({ orders }) => orders === 0)).toBe(true);
    expect(comboVariationDatasets.zeros.some(({ visits }) => visits === 0)).toBe(true);
    expect(comboVariationDatasets.largeValues.every(({ orders }) => orders >= 1_000_000)).toBe(true);
  });

  test('uses unique ids and a single peak row in every fixture', () => {
    Object.values(comboVariationDatasets).forEach((data) => {
      expect(new Set(data.map(({ id }) => id)).size).toBe(data.length);
      expect(data.filter(({ isPeak }) => isPeak)).toHaveLength(1);
    });
  });

  test('keeps conversion rate on a 0-1 scale for the dual axis', () => {
    expect(comboVariationDatasets.standard.every(({ conversionRate }) => conversionRate >= 0 && conversionRate <= 1)).toBe(
      true
    );
  });

  test('splits rows into channel series with unique ids', () => {
    const rows = toChannelRows(comboVariationDatasets.standard);
    expect(rows).toHaveLength(14);
    expect(getComboSeries(rows)).toEqual(['Web', 'Mobile']);
    expect(new Set(rows.map(({ id }) => id)).size).toBe(rows.length);
    expect(rows.filter(({ datetime }) => datetime === rows[0].datetime).map(({ totalVisits }) => totalVisits)).toEqual([
      120, 120,
    ]);
  });

  test('starts the forecast at the first forecast row', () => {
    const { standard, single } = comboVariationDatasets;
    expect(getForecastStart(standard)).toBe(standard[5].datetime);
    expect(getForecastStart(single)).toBe(single[0].datetime);
    expect(getForecastStart([])).toBeGreaterThan(0);
  });
});
