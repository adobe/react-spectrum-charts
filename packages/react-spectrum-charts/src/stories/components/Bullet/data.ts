/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

export const basicBulletData = [
  { graphLabel: 'Customers', currentAmount: 150, target: 50 },
  { graphLabel: 'Revenue', currentAmount: 350, target: 450 },
];

export const basicThresholdsData = [
  { thresholdMax: 120, fill: 'rgb(0, 0, 0)' },
  { thresholdMin: 120, thresholdMax: 235, fill: 'rgb(109, 109, 109)' },
  { thresholdMin: 235, fill: 'rgb(177, 177, 177)' },
];

export const coloredThresholdsData = [
  { thresholdMax: 120, fill: 'rgb(234, 56, 41)' },
  { thresholdMin: 120, thresholdMax: 235, fill: 'rgb(249, 137, 23)' },
  { thresholdMin: 235, fill: 'rgb(21, 164, 110)' },
];

export const largeNumbersBulletData = [
  { graphLabel: 'Q1 Revenue', currentAmount: 1500000000, target: 2000000000 }, // 1.5B vs 2B
  { graphLabel: 'Q2 Revenue', currentAmount: 2750000000, target: 3000000000 }, // 2.75B vs 3B
];

export const largeNumbersThresholdsData = [
  { thresholdMax: 1000000000, fill: 'rgb(234, 56, 41)' }, // < 1B = red
  { thresholdMin: 1000000000, thresholdMax: 2500000000, fill: 'rgb(249, 137, 23)' }, // 1B-2.5B = orange
  { thresholdMin: 2500000000, fill: 'rgb(21, 164, 110)' }, // > 2.5B = green
];

// Data showing K, M, B, T examples for comprehensive formatting tests
export const kmbtBulletData = [
  { graphLabel: 'Thousands', currentAmount: 5500, target: 7500 }, // 5.5K vs 7.5K
  { graphLabel: 'Millions', currentAmount: 12500000, target: 15000000 }, // 12.5M vs 15M
  { graphLabel: 'Billions', currentAmount: 3250000000, target: 4000000000 }, // 3.25B vs 4B
  { graphLabel: 'Trillions', currentAmount: 1750000000000, target: 2000000000000 }, // 1.75T vs 2T
];

export const kmbtThresholdsData = [
  { thresholdMax: 1000000000000, fill: 'rgb(234, 56, 41)' }, // < 1T = red
  { thresholdMin: 1000000000000, thresholdMax: 1800000000000, fill: 'rgb(249, 137, 23)' }, // 1T-1.8T = orange
  { thresholdMin: 1800000000000, fill: 'rgb(21, 164, 110)' }, // > 1.8T = green
];
