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
  getHistogramSeries,
  getQuantile,
  getQuantileEdges,
  getRoundBinSize,
  histogramDatasetOptions,
  histogramVariationDatasets,
} from './histogramVariationData.js';

describe('Histogram variation datasets', () => {
  test('provides a selector option for every fixture', () => {
    expect(histogramDatasetOptions.map(({ value }) => value).sort()).toEqual(
      Object.keys(histogramVariationDatasets).sort()
    );
  });

  test('covers series count, row count, sign and value stress variations', () => {
    const { standard, single, dense, small, singleValue, negative, largeValues, nonFinite } =
      histogramVariationDatasets;
    expect(getHistogramSeries(standard)).toHaveLength(3);
    expect(getHistogramSeries(single)).toHaveLength(1);
    expect(dense.length).toBeGreaterThanOrEqual(2000);
    expect(small.length).toBeLessThan(10);
    expect(new Set(singleValue.map(({ value }) => value)).size).toBe(1);
    expect(negative.some(({ value }) => value < 0)).toBe(true);
    expect(largeValues.every(({ value }) => value >= 1e6)).toBe(true);
    expect(nonFinite.some(({ value }) => !Number.isFinite(value))).toBe(true);
  });

  test('gives every row a unique id', () => {
    Object.values(histogramVariationDatasets).forEach((data) => {
      expect(new Set(data.map(({ id }) => id)).size).toBe(data.length);
    });
  });

  test('is deterministic across module loads', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const reloaded = require('./histogramVariationData.js') as { histogramVariationDatasets: unknown };
      expect(reloaded.histogramVariationDatasets).toEqual(histogramVariationDatasets);
    });
  });
});

describe('bin helpers', () => {
  test('getQuantileEdges returns ascending unique edges', () => {
    const edges = getQuantileEdges(histogramVariationDatasets.standard);
    expect(edges).toEqual([...edges].sort((a, b) => a - b));
    expect(new Set(edges).size).toBe(edges.length);
    expect(getQuantileEdges(histogramVariationDatasets.singleValue)).toEqual([42, 43]);
  });

  test('getQuantile ignores non-finite values', () => {
    expect(Number.isFinite(getQuantile(histogramVariationDatasets.nonFinite, 1))).toBe(true);
    expect(getQuantile([], 0.5)).toBe(0);
  });

  test('getRoundBinSize returns a round positive width', () => {
    expect(getRoundBinSize(histogramVariationDatasets.standard, 12)).toBeGreaterThan(0);
    expect(getRoundBinSize(histogramVariationDatasets.singleValue, 12)).toBe(1);
  });
});
