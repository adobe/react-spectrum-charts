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
  barDatasetOptions,
  barVariationDatasets,
  getBarSeries,
  getFirstSeries,
  toRegionRows,
  toSegmentRows,
} from './barVariationData.js';

describe('Bar variation datasets', () => {
  test('provides a selector option for every fixture', () => {
    expect(barDatasetOptions.map(({ value }) => value).sort()).toEqual(Object.keys(barVariationDatasets).sort());
  });

  test('covers series count, category count, sign and numeric stress variations', () => {
    expect(getBarSeries(barVariationDatasets.single)).toHaveLength(1);
    expect(getBarSeries(barVariationDatasets.dense)).toHaveLength(8);
    expect(barVariationDatasets.manyCategories).toHaveLength(40);
    expect(new Set(barVariationDatasets.singleCategory.map(({ category }) => category)).size).toBe(1);
    expect(barVariationDatasets.negative.some(({ value }) => value < 0)).toBe(true);
    expect(barVariationDatasets.zeros.some(({ value }) => value === 0)).toBe(true);
    expect(barVariationDatasets.largeValues.every(({ value }) => value > 1e8)).toBe(true);
    expect(getBarSeries(barVariationDatasets.longLabels).every((series) => series.length > 50)).toBe(true);
  });

  test('gives every row a unique id and a sign-based override color', () => {
    Object.values(barVariationDatasets).forEach((data) => {
      expect(new Set(data.map(({ id }) => id)).size).toBe(data.length);
    });
    const { negative } = barVariationDatasets;
    expect(new Set(negative.map(({ barColor }) => barColor)).size).toBe(2);
  });

  test('derives single-series, segment and region rows with unique ids', () => {
    const { standard } = barVariationDatasets;
    expect(getBarSeries(getFirstSeries(standard))).toEqual(['Organic']);
    const segments = toSegmentRows(standard);
    expect(segments).toHaveLength(standard.length * 2);
    expect(new Set(segments.map(({ id }) => id)).size).toBe(segments.length);
    const regions = toRegionRows(standard);
    expect(new Set(regions.map(({ region }) => region)).size).toBe(3);
    expect(new Set(regions.map(({ id }) => id)).size).toBe(regions.length);
  });
});
