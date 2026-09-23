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
import { donutDatasetOptions, donutVariationDatasets, getLargestDonutSeries } from './donutVariationData';

describe('Donut variation datasets', () => {
  test('provides a selector option for every fixture', () => {
    expect(donutDatasetOptions.map(({ value }) => value).sort()).toEqual(Object.keys(donutVariationDatasets).sort());
  });

  test('covers sparse, dense, unusual label, and numeric stress variations', () => {
    expect(donutVariationDatasets.singleSegment).toHaveLength(1);
    expect(donutVariationDatasets.dense.length).toBeGreaterThanOrEqual(20);
    expect(donutVariationDatasets.denseNamed).toHaveLength(18);
    expect(donutVariationDatasets.moderateDominantWithSlivers).toHaveLength(13);
    const moderateDominantTotal = donutVariationDatasets.moderateDominantWithSlivers.reduce(
      (total, { value }) => total + value,
      0
    );
    expect(donutVariationDatasets.moderateDominantWithSlivers[0].value / moderateDominantTotal).toBeCloseTo(
      0.8,
      1
    );
    expect(donutVariationDatasets.denseNamed.every(({ series }) => !series.startsWith('Category'))).toBe(true);
    expect(donutVariationDatasets.longLabels.some(({ series }) => series.length > 50)).toBe(true);
    expect(donutVariationDatasets.specialCharacters.some(({ series }) => /[^\u0000-\u007f]/.test(series))).toBe(true);
    expect(donutVariationDatasets.fractionalValues.some(({ value }) => value > 0 && value < 0.001)).toBe(true);
    expect(donutVariationDatasets.mixedZeroValues.some(({ value }) => value === 0)).toBe(true);
  });

  test('selects visible emphasized items by value instead of fixture order', () => {
    expect(getLargestDonutSeries(donutVariationDatasets.fractionalValues, 2)).toEqual([
      'Twelve and three quarters',
      'One and a half',
    ]);
    expect(donutVariationDatasets.fractionalValues[0].series).toBe('Tiny');
  });
});
