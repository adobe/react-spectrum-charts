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
import { EdgeCaseDataset } from '../../EdgeCaseDashboard';

export interface DonutEdgeCaseDatum extends Record<string, unknown> {
  displayName: string;
  series: string;
  value: number;
}

const standard: DonutEdgeCaseDatum[] = [
  { displayName: 'Chrome browser', series: 'Chrome', value: 10390 },
  { displayName: 'Firefox browser', series: 'Firefox', value: 8281 },
  { displayName: 'Safari browser', series: 'Safari', value: 7045 },
  { displayName: 'Opera browser', series: 'Opera', value: 6166 },
  { displayName: 'Other browser', series: 'Other', value: 4201 },
  { displayName: 'Brave browser', series: 'Brave', value: 3261 },
  { displayName: 'Unknown browser', series: 'Unknown', value: 1021 },
];

const singleSegment: DonutEdgeCaseDatum[] = [{ displayName: 'Only category', series: 'Only', value: 100 }];

const twoSegments: DonutEdgeCaseDatum[] = [
  { displayName: 'Completed', series: 'Completed', value: 62 },
  { displayName: 'Remaining', series: 'Remaining', value: 38 },
];

const dense: DonutEdgeCaseDatum[] = Array.from({ length: 24 }, (_, index) => ({
  displayName: `Category ${String(index + 1).padStart(2, '0')}`,
  series: `Category ${String(index + 1).padStart(2, '0')}`,
  value: 25 - index,
}));

const dominantWithSlivers: DonutEdgeCaseDatum[] = [
  { displayName: 'Dominant category', series: 'Dominant', value: 9800 },
  ...Array.from({ length: 12 }, (_, index) => ({
    displayName: `Sliver ${index + 1}`,
    series: `Sliver ${index + 1}`,
    value: index + 1,
  })),
];

const longLabels: DonutEdgeCaseDatum[] = [
  {
    displayName: 'Customer acquisition through unpaid organic search results',
    series: 'Customer acquisition through unpaid organic search results',
    value: 34,
  },
  {
    displayName: 'Enterprise accounts with multi-region deployment requirements',
    series: 'Enterprise accounts with multi-region deployment requirements',
    value: 27,
  },
  {
    displayName: 'Returning visitors using privacy-focused browser configurations',
    series: 'Returning visitors using privacy-focused browser configurations',
    value: 21,
  },
  {
    displayName: 'All remaining traffic sources and uncategorized referrals',
    series: 'All remaining traffic sources and uncategorized referrals',
    value: 18,
  },
];

const specialCharacters: DonutEdgeCaseDatum[] = [
  { displayName: 'Revenue / Growth (YoY)', series: 'Revenue / Growth (YoY)', value: 24 },
  { displayName: 'Quotes "double" & \'single\'', series: 'Quotes "double" & \'single\'', value: 20 },
  { displayName: 'Café + crème brûlée', series: 'Café + crème brûlée', value: 18 },
  { displayName: '日本語のカテゴリ', series: '日本語のカテゴリ', value: 16 },
  { displayName: 'مرحبا بالعالم', series: 'مرحبا بالعالم', value: 13 },
  { displayName: 'Launch readiness 🚀', series: 'Launch readiness 🚀', value: 9 },
];

const duplicateLabels: DonutEdgeCaseDatum[] = [
  { displayName: 'Repeated', series: 'Repeated', value: 40 },
  { displayName: 'Repeated', series: 'Repeated', value: 25 },
  { displayName: 'Unique A', series: 'Unique A', value: 20 },
  { displayName: 'Unique B', series: 'Unique B', value: 15 },
];

const fractionalValues: DonutEdgeCaseDatum[] = [
  { displayName: 'One ten-thousandth', series: 'Tiny', value: 0.0001 },
  { displayName: 'One quarter', series: 'Quarter', value: 0.25 },
  { displayName: 'One and a half', series: 'One and a half', value: 1.5 },
  { displayName: 'Twelve and three quarters', series: 'Twelve and three quarters', value: 12.75 },
];

const mixedZeroValues: DonutEdgeCaseDatum[] = [
  { displayName: 'Active A', series: 'Active A', value: 50 },
  { displayName: 'Zero A', series: 'Zero A', value: 0 },
  { displayName: 'Active B', series: 'Active B', value: 30 },
  { displayName: 'Zero B', series: 'Zero B', value: 0 },
  { displayName: 'Active C', series: 'Active C', value: 20 },
];

export const donutEdgeCaseDatasets = {
  standard,
  singleSegment,
  twoSegments,
  dense,
  dominantWithSlivers,
  longLabels,
  specialCharacters,
  duplicateLabels,
  fractionalValues,
  mixedZeroValues,
} as const;

export type DonutEdgeCaseDatasetName = keyof typeof donutEdgeCaseDatasets;

export const donutDatasetOptions: EdgeCaseDataset[] = [
  { label: 'Standard (7)', value: 'standard', description: 'Balanced baseline data.' },
  { label: 'Single segment (1)', value: 'singleSegment', description: 'Minimum non-empty dataset.' },
  { label: 'Two segments (2)', value: 'twoSegments', description: 'Sparse comparison data.' },
  { label: 'Dense (24)', value: 'dense', description: 'Many gradually decreasing segments.' },
  {
    label: 'Dominant with slivers (13)',
    value: 'dominantWithSlivers',
    description: 'One dominant segment with many extremely thin segments.',
  },
  {
    label: 'Long labels (4)',
    value: 'longLabels',
    description: 'Verbose labels that stress truncation and collisions.',
  },
  {
    label: 'Special characters (6)',
    value: 'specialCharacters',
    description: 'Punctuation, accents, non-Latin scripts, RTL text, and emoji.',
  },
  { label: 'Duplicate labels (4)', value: 'duplicateLabels', description: 'Repeated color-facet values.' },
  {
    label: 'Fractional values (4)',
    value: 'fractionalValues',
    description: 'Values spanning several orders of magnitude.',
  },
  {
    label: 'Mixed zero values (5)',
    value: 'mixedZeroValues',
    description: 'Positive and zero-valued categories together.',
  },
];
