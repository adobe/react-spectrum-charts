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
  getFirstSeries,
  getScatterSeries,
  scatterDatasetOptions,
  scatterVariationDatasets,
} from './scatterVariationData.js';

describe('Scatter variation datasets', () => {
  test('provides a selector option for every fixture', () => {
    expect(scatterDatasetOptions.map(({ value }) => value).sort()).toEqual(
      Object.keys(scatterVariationDatasets).sort()
    );
  });

  test('covers series count, point count, sign and numeric stress variations', () => {
    expect(getScatterSeries(scatterVariationDatasets.standard)).toHaveLength(3);
    expect(getScatterSeries(scatterVariationDatasets.single)).toHaveLength(1);
    expect(scatterVariationDatasets.dense.length).toBeGreaterThanOrEqual(300);
    expect(scatterVariationDatasets.singlePoint).toHaveLength(1);
    expect(scatterVariationDatasets.negative.some(({ x }) => x < 0)).toBe(true);
    expect(scatterVariationDatasets.negative.some(({ value }) => value < 0)).toBe(true);
    expect(scatterVariationDatasets.largeValues.every(({ x }) => x >= 1e6)).toBe(true);
    expect(getScatterSeries(scatterVariationDatasets.longLabels).every((series) => series.length > 50)).toBe(true);
    const duplicateCoordinates = new Set(
      scatterVariationDatasets.duplicatePoints.map(({ x, value }) => `${x},${value}`)
    );
    expect(duplicateCoordinates.size).toBeLessThan(scatterVariationDatasets.duplicatePoints.length);
  });

  test('gives every row a unique id and the facet helper fields', () => {
    Object.values(scatterVariationDatasets).forEach((data) => {
      expect(new Set(data.map(({ id }) => id)).size).toBe(data.length);
      data.forEach(({ weight }) => {
        expect(weight).toBeGreaterThanOrEqual(1);
        expect(weight).toBeLessThanOrEqual(10);
      });
    });
    const { standard } = scatterVariationDatasets;
    expect(new Set(standard.map(({ segment }) => segment))).toEqual(new Set(['New', 'Returning']));
    expect(standard.filter(({ excludeFromTrendline }) => excludeFromTrendline)).toHaveLength(3);
  });

  test('keeps trajectory steps out of x order so paths double back', () => {
    const analytics = scatterVariationDatasets.trajectory.filter(({ series }) => series === 'Messaging');
    const xs = analytics.map(({ x }) => x);
    expect(xs).not.toEqual([...xs].sort((a, b) => a - b));
  });

  test('derives single-series rows', () => {
    expect(getScatterSeries(getFirstSeries(scatterVariationDatasets.standard))).toEqual(['Mobile']);
  });
});
