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
  bulletDatasetOptions,
  bulletVariationDatasets,
  getBulletMax,
  getBulletThresholds,
} from './bulletVariationData.js';

describe('Bullet variation datasets', () => {
  test('provides a selector option for every fixture', () => {
    expect(bulletDatasetOptions.map(({ value }) => value).sort()).toEqual(Object.keys(bulletVariationDatasets).sort());
  });

  test('covers sparse, dense, edge-value and unusual label variations', () => {
    expect(bulletVariationDatasets.single).toHaveLength(1);
    expect(bulletVariationDatasets.many.length).toBeGreaterThanOrEqual(8);
    expect(
      bulletVariationDatasets.overTarget.every(({ currentAmount, target }) => currentAmount > Number(target))
    ).toBe(true);
    expect(bulletVariationDatasets.largeValues.some(({ currentAmount }) => currentAmount >= 1e9)).toBe(true);
    expect(bulletVariationDatasets.fractional.every(({ currentAmount }) => currentAmount < 1)).toBe(true);
    expect(bulletVariationDatasets.negative.some(({ currentAmount }) => currentAmount < 0)).toBe(true);
    expect(bulletVariationDatasets.missingTarget.some(({ target }) => target === null)).toBe(true);
    expect(bulletVariationDatasets.zeroValues.some(({ currentAmount }) => currentAmount === 0)).toBe(true);
    expect(bulletVariationDatasets.zeroValues.some(({ target }) => target === 0)).toBe(true);
    expect(bulletVariationDatasets.longLabels.every(({ graphLabel }) => graphLabel.length > 50)).toBe(true);
    expect(
      bulletVariationDatasets.specialCharacters.some(({ graphLabel }) => /[^\u0000-\u007f]/.test(graphLabel))
    ).toBe(true);
  });

  test('derives pre-formatted metric and target labels', () => {
    expect(bulletVariationDatasets.standard[0]).toMatchObject({
      currentAmountLabel: '1,240 actual',
      targetLabel: '1,500 goal',
    });
    expect(bulletVariationDatasets.missingTarget[1].targetLabel).toBe('n/a');
  });

  test('splits thresholds into contiguous thirds of the data max', () => {
    expect(getBulletMax(bulletVariationDatasets.standard)).toBe(1500);
    expect(getBulletThresholds(bulletVariationDatasets.standard)).toEqual([
      { thresholdMax: 500, fill: 'rgb(234, 56, 41)' },
      { thresholdMin: 500, thresholdMax: 1000, fill: 'rgb(249, 137, 23)' },
      { thresholdMin: 1000, fill: 'rgb(21, 164, 110)' },
    ]);
    const [low, , high] = getBulletThresholds(bulletVariationDatasets.fractional);
    expect(low.thresholdMax).toBeGreaterThan(0);
    expect(high.thresholdMin).toBeLessThan(getBulletMax(bulletVariationDatasets.fractional));
  });
});
