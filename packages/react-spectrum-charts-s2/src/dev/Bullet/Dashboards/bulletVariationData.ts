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
import { ThresholdBackground } from '@spectrum-charts/vega-spec-builder-s2';

import { VariationDataset } from '../../VariationDashboard.js';

export interface BulletVariationDatum extends Record<string, unknown> {
  graphLabel: string;
  currentAmount: number;
  currentAmountLabel: string;
  target: number | null;
  targetLabel: string;
  /** Previous-period value, used for custom metric key variations. */
  previous: number;
}

/** Builds a datum, deriving the pre-formatted label fields from the values. */
const row = (graphLabel: string, currentAmount: number, target: number | null, unit = ''): BulletVariationDatum => ({
  graphLabel,
  currentAmount,
  currentAmountLabel: `${currentAmount.toLocaleString('en-US')}${unit} actual`,
  target,
  targetLabel: target === null ? 'n/a' : `${target.toLocaleString('en-US')}${unit} goal`,
  previous: Number((currentAmount * 0.8).toPrecision(3)),
});

const standard: BulletVariationDatum[] = [
  row('New customers', 1240, 1500),
  row('Renewals', 860, 800),
  row('Upgrades', 410, 600),
];

const single: BulletVariationDatum[] = [row('Quarterly revenue', 72, 90, '%')];

const many: BulletVariationDatum[] = [
  row('Acquisition', 78, 82, '%'),
  row('Activation', 64, 70, '%'),
  row('Retention', 91, 88, '%'),
  row('Referral', 35, 50, '%'),
  row('Revenue', 57, 60, '%'),
  row('Engagement', 83, 75, '%'),
  row('Satisfaction', 69, 80, '%'),
  row('Conversion', 22, 30, '%'),
];

const overTarget: BulletVariationDatum[] = [
  row('New customers', 1640, 1500),
  row('Renewals', 920, 800),
  row('Upgrades', 700, 600),
];

const largeValues: BulletVariationDatum[] = [
  row('Thousands', 5500, 7500),
  row('Millions', 12_500_000, 15_000_000),
  row('Billions', 3_250_000_000, 4_000_000_000),
];

const fractional: BulletVariationDatum[] = [
  row('Error rate', 0.042, 0.05),
  row('Bounce rate', 0.31, 0.25),
  row('Churn', 0.0075, 0.01),
];

const negative: BulletVariationDatum[] = [
  row('Net growth', -120, 200),
  row('Margin change', 340, 300),
  row('Inventory delta', -45, 0),
];

const missingTarget: BulletVariationDatum[] = [
  row('New customers', 1240, 1500),
  row('Renewals', 860, null),
  row('Upgrades', 410, 600),
];

const zeroValues: BulletVariationDatum[] = [
  row('Not started', 0, 500),
  row('In progress', 260, 500),
  row('No goal', 180, 0),
];

const longLabels: BulletVariationDatum[] = [
  row('Customer acquisition through unpaid organic search results', 1240, 1500),
  row('Enterprise accounts with multi-region deployment requirements', 860, 800),
  row('Returning visitors using privacy-focused browser configurations', 410, 600),
];

const specialCharacters: BulletVariationDatum[] = [
  row('Revenue / Growth (YoY)', 1240, 1500),
  row('Café + crème brûlée', 860, 800),
  row('日本語のカテゴリ', 410, 600),
  row('Launch readiness 🚀', 520, 700),
];

export const bulletVariationDatasets = {
  standard,
  single,
  many,
  overTarget,
  largeValues,
  fractional,
  negative,
  missingTarget,
  zeroValues,
  longLabels,
  specialCharacters,
} as const;

export type BulletVariationDatasetName = keyof typeof bulletVariationDatasets;

export const bulletDatasetOptions: VariationDataset[] = [
  { label: 'Standard (3)', value: 'standard', description: 'Mixed under- and over-target KPIs.' },
  { label: 'Single (1)', value: 'single', description: 'Minimum non-empty dataset.' },
  { label: 'Many (8)', value: 'many', description: 'Percent KPIs that stress vertical spacing.' },
  { label: 'Over target (3)', value: 'overTarget', description: 'Every metric exceeds its target.' },
  { label: 'Large values (3)', value: 'largeValues', description: 'Thousands to billions on one scale.' },
  { label: 'Fractional (3)', value: 'fractional', description: 'Values below one.' },
  { label: 'Negative (3)', value: 'negative', description: 'Negative metrics and a zero target.' },
  { label: 'Missing target (3)', value: 'missingTarget', description: 'One row has a null target.' },
  { label: 'Zero values (3)', value: 'zeroValues', description: 'A zero metric and a zero target.' },
  { label: 'Long labels (3)', value: 'longLabels', description: 'Verbose dimension labels.' },
  {
    label: 'Special characters (4)',
    value: 'specialCharacters',
    description: 'Punctuation, accents, non-Latin scripts and emoji.',
  },
];

/** Gets the largest metric or target value in the data. */
export const getBulletMax = (data: BulletVariationDatum[]): number =>
  Math.max(0, ...data.flatMap(({ currentAmount, target }) => [currentAmount, target ?? 0]));

/** Splits the data range into red, orange and green thresholds at one third and two thirds of the max. */
export const getBulletThresholds = (data: BulletVariationDatum[]): ThresholdBackground[] => {
  const max = getBulletMax(data);
  const low = Number((max / 3).toPrecision(2));
  const high = Number(((max * 2) / 3).toPrecision(2));
  return [
    { thresholdMax: low, fill: 'rgb(234, 56, 41)' },
    { thresholdMin: low, thresholdMax: high, fill: 'rgb(249, 137, 23)' },
    { thresholdMin: high, fill: 'rgb(21, 164, 110)' },
  ];
};
