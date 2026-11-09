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
import { getForecastStart, getLineSeries, lineDatasetOptions, lineVariationDatasets } from './lineVariationData.js';

describe('Line variation datasets', () => {
  test('provides a selector option for every fixture', () => {
    expect(lineDatasetOptions.map(({ value }) => value).sort()).toEqual(Object.keys(lineVariationDatasets).sort());
  });

  test('covers series count, length, gap and numeric stress variations', () => {
    expect(getLineSeries(lineVariationDatasets.single)).toHaveLength(1);
    expect(getLineSeries(lineVariationDatasets.dense)).toHaveLength(12);
    expect(lineVariationDatasets.long).toHaveLength(360);
    expect(lineVariationDatasets.singlePoint).toHaveLength(2);
    expect(lineVariationDatasets.gaps.some(({ value }) => value === null)).toBe(true);
    expect(lineVariationDatasets.negative.some(({ value }) => (value ?? 0) < 0)).toBe(true);
    expect(new Set(lineVariationDatasets.flat.map(({ value }) => value)).size).toBe(1);
    expect(lineVariationDatasets.largeValues.every(({ value }) => (value ?? 0) > 1e9)).toBe(true);
    expect(getLineSeries(lineVariationDatasets.longLabels).every((series) => series.length > 50)).toBe(true);
  });

  test('splits actual and forecast without overlap', () => {
    const data = lineVariationDatasets.standard;
    expect(data.every(({ actual, forecast }) => (actual === null) !== (forecast === null))).toBe(true);
    const start = getForecastStart(data);
    expect(data.filter(({ datetime }) => datetime >= start).every(({ isEstimated }) => isEstimated)).toBe(true);
    expect(new Set(data.map(({ id }) => id)).size).toBe(data.length);
  });
});
