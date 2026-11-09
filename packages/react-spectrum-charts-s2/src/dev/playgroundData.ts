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
import { ChartData } from '@spectrum-charts/vega-spec-builder-s2';

export type CartesianDataPreset = 'singleSeries' | 'multiSeries' | 'negativeValues' | 'longLabels' | 'timeSeries';
export type ScatterDataPreset = 'clusters' | 'sizedPoints' | 'linearTrend';
export type DonutDataPreset = 'browserShare' | 'emphasized' | 'boolean';
export type BulletDataPreset = 'progress' | 'ranked' | 'overTarget';

const DAY = 86_400_000;
const START = Date.UTC(2026, 0, 1);

export const playgroundTimeSeriesData: ChartData[] = [
  ['Create', [32, 37, 42, 44, 49, 54, 57, 61]],
  ['Review', [18, 22, 26, 29, 34, 36, 39, 41]],
  ['Publish', [10, 14, 18, 22, 25, 29, 35, 38]],
].flatMap(([series, values], seriesIndex) =>
  (values as number[]).map((value, index) => ({
    datetime: START + index * DAY,
    value,
    forecastValue: index > 4 ? value + 6 + seriesIndex * 2 : null,
    users: value * 120,
    revenue: value * 85,
    series,
    order: index,
    staticPoint: index === 3 || index === 6,
    annotation: index === 6 ? `${series} peak` : undefined,
    alternate: index > 4 ? 'Projected' : 'Actual',
  }))
);

const categoryRows: Record<string, unknown>[] = [
  {
    browser: 'Chrome',
    operatingSystem: 'macOS',
    value: 62,
    downloads: 6200,
    order: 0,
    profit: 22,
    trellis: 'Desktop',
    annotation: 'Top',
    lineType: 'solid',
    opacity: 1,
    thumbnail:
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='4' fill='%235b5ce2'/%3E%3Ccircle cx='12' cy='12' r='6' fill='white'/%3E%3C/svg%3E",
  },
  {
    browser: 'Chrome',
    operatingSystem: 'Windows',
    value: 54,
    downloads: 5400,
    order: 0,
    profit: -8,
    trellis: 'Desktop',
    annotation: 'Watch',
    lineType: 'dashed',
    opacity: 0.7,
    thumbnail:
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='4' fill='%235b5ce2'/%3E%3Ccircle cx='12' cy='12' r='6' fill='white'/%3E%3C/svg%3E",
  },
  {
    browser: 'Chrome',
    operatingSystem: 'Android',
    value: 39,
    downloads: 3900,
    order: 0,
    profit: -5,
    trellis: 'Mobile',
    annotation: 'Mobile dip',
    lineType: 'dotted',
    opacity: 0.6,
    thumbnail:
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='4' fill='%235b5ce2'/%3E%3Ccircle cx='12' cy='12' r='6' fill='white'/%3E%3C/svg%3E",
  },
  {
    browser: 'Safari',
    operatingSystem: 'macOS',
    value: 48,
    downloads: 4800,
    order: 1,
    profit: 16,
    trellis: 'Desktop',
    annotation: 'Growing',
    lineType: 'solid',
    opacity: 0.85,
    thumbnail:
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='4' fill='%235b5ce2'/%3E%3Ccircle cx='12' cy='12' r='6' fill='white'/%3E%3C/svg%3E",
  },
  {
    browser: 'Safari',
    operatingSystem: 'iOS',
    value: 44,
    downloads: 4400,
    order: 1,
    profit: 12,
    trellis: 'Mobile',
    annotation: 'Mobile',
    lineType: 'dashed',
    opacity: 0.75,
    thumbnail:
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='4' fill='%235b5ce2'/%3E%3Ccircle cx='12' cy='12' r='6' fill='white'/%3E%3C/svg%3E",
  },
  {
    browser: 'Edge',
    operatingSystem: 'Windows',
    value: 37,
    downloads: 3700,
    order: 2,
    profit: -14,
    trellis: 'Desktop',
    annotation: 'Needs attention',
    lineType: 'dotted',
    opacity: 0.65,
    thumbnail:
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='4' fill='%235b5ce2'/%3E%3Ccircle cx='12' cy='12' r='6' fill='white'/%3E%3C/svg%3E",
  },
  {
    browser: 'Edge',
    operatingSystem: 'macOS',
    value: 22,
    downloads: 2200,
    order: 2,
    profit: -3,
    trellis: 'Desktop',
    annotation: 'Watch',
    lineType: 'solid',
    opacity: 0.72,
    thumbnail:
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='4' fill='%235b5ce2'/%3E%3Ccircle cx='12' cy='12' r='6' fill='white'/%3E%3C/svg%3E",
  },
  {
    browser: 'Firefox',
    operatingSystem: 'Linux',
    value: 28,
    downloads: 2800,
    order: 3,
    profit: 6,
    trellis: 'Desktop',
    annotation: 'Stable',
    lineType: 'solid',
    opacity: 0.8,
    thumbnail:
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='4' fill='%235b5ce2'/%3E%3Ccircle cx='12' cy='12' r='6' fill='white'/%3E%3C/svg%3E",
  },
  {
    browser: 'Firefox',
    operatingSystem: 'Windows',
    value: 31,
    downloads: 3100,
    order: 3,
    profit: 4,
    trellis: 'Desktop',
    annotation: 'Stable',
    lineType: 'dashed',
    opacity: 0.72,
    thumbnail:
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='4' fill='%235b5ce2'/%3E%3Ccircle cx='12' cy='12' r='6' fill='white'/%3E%3C/svg%3E",
  },
  {
    browser: 'Mobile Safari with a very long label',
    operatingSystem: 'iOS',
    value: 42,
    downloads: 4200,
    order: 4,
    profit: 10,
    trellis: 'Mobile',
    annotation: 'Long label',
    lineType: 'dashed',
    opacity: 0.75,
    thumbnail:
      "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Crect width='24' height='24' rx='4' fill='%235b5ce2'/%3E%3Ccircle cx='12' cy='12' r='6' fill='white'/%3E%3C/svg%3E",
  },
];

export const playgroundScatterData: ChartData[] = [
  {
    name: 'Mario',
    speedNormal: 0.64,
    handlingNormal: 0.71,
    acceleration: 0.58,
    weightClass: 'Medium',
    series: 'Mario',
    pathGroup: 'heroes',
    size: 120,
    annotation: 'Balanced',
    opacity: 0.9,
  },
  {
    name: 'Luigi',
    speedNormal: 0.61,
    handlingNormal: 0.78,
    acceleration: 0.62,
    weightClass: 'Medium',
    series: 'Luigi',
    pathGroup: 'heroes',
    size: 90,
    annotation: 'Agile',
    opacity: 0.8,
  },
  {
    name: 'Peach',
    speedNormal: 0.55,
    handlingNormal: 0.84,
    acceleration: 0.75,
    weightClass: 'Light',
    series: 'Peach',
    pathGroup: 'heroes',
    size: 70,
    annotation: 'Easy turns',
    opacity: 0.75,
  },
  {
    name: 'Bowser',
    speedNormal: 0.91,
    handlingNormal: 0.38,
    acceleration: 0.32,
    weightClass: 'Heavy',
    series: 'Bowser',
    pathGroup: 'rivals',
    size: 180,
    annotation: 'Fast',
    opacity: 1,
  },
  {
    name: 'Wario',
    speedNormal: 0.82,
    handlingNormal: 0.45,
    acceleration: 0.4,
    weightClass: 'Heavy',
    series: 'Wario',
    pathGroup: 'rivals',
    size: 150,
    annotation: 'Power',
    opacity: 0.9,
  },
  {
    name: 'Toad',
    speedNormal: 0.42,
    handlingNormal: 0.92,
    acceleration: 0.88,
    weightClass: 'Light',
    series: 'Toad',
    pathGroup: 'heroes',
    size: 60,
    annotation: 'Nimble',
    opacity: 0.8,
  },
];

export const playgroundDonutData: ChartData[] = [
  { browser: 'Chrome', count: 48, segmentLabel: 'Chrome', emphasized: true },
  { browser: 'Safari', count: 24, segmentLabel: 'Safari', emphasized: true },
  { browser: 'Edge', count: 14, segmentLabel: 'Edge', emphasized: false },
  { browser: 'Firefox', count: 9, segmentLabel: 'Firefox', emphasized: false },
  { browser: 'Other', count: 5, segmentLabel: 'Other', emphasized: false },
];

export const playgroundBooleanDonutData: ChartData[] = [
  { browser: 'Complete', count: 72, segmentLabel: 'Complete' },
  { browser: 'Remaining', count: 28, segmentLabel: 'Remaining' },
];

const bulletRows: Record<string, unknown>[] = [
  {
    graphLabel: 'Acquisition',
    currentAmount: 78,
    currentAmountLabel: '78%',
    target: 82,
    targetLabel: '82%',
    segment: 'North America',
  },
  {
    graphLabel: 'Activation',
    currentAmount: 64,
    currentAmountLabel: '64%',
    target: 70,
    targetLabel: '70%',
    segment: 'Europe',
  },
  {
    graphLabel: 'Retention',
    currentAmount: 91,
    currentAmountLabel: '91%',
    target: 88,
    targetLabel: '88%',
    segment: 'APAC',
  },
];

export const playgroundThresholds = [
  { thresholdMin: 0, thresholdMax: 50, fill: 'gray-200' },
  { thresholdMin: 50, thresholdMax: 80, fill: 'blue-300' },
  { thresholdMin: 80, thresholdMax: 100, fill: 'green-400' },
];

export const playgroundCategoryData = categoryRows as ChartData[];

export const getCartesianData = (preset: CartesianDataPreset): ChartData[] => {
  if (preset === 'timeSeries') return playgroundTimeSeriesData;
  if (preset === 'negativeValues')
    return categoryRows.map((datum) => ({ ...datum, value: datum.profit })) as ChartData[];
  if (preset === 'longLabels' || preset === 'multiSeries') return playgroundCategoryData;
  return categoryRows.filter((datum) => datum.operatingSystem === 'macOS') as ChartData[];
};

export const getScatterData = (preset: ScatterDataPreset): ChartData[] => {
  if (preset === 'linearTrend')
    return playgroundScatterData.map((datum, index) => ({ ...datum, handlingNormal: 0.35 + index * 0.09 }));
  return playgroundScatterData;
};

export const getDonutData = (preset: DonutDataPreset): ChartData[] =>
  preset === 'boolean' ? playgroundBooleanDonutData : playgroundDonutData;

export const playgroundBulletData = bulletRows as ChartData[];

export const getBulletData = (preset: BulletDataPreset): ChartData[] => {
  if (preset === 'overTarget')
    return bulletRows.map((datum) => ({ ...datum, currentAmount: Number(datum.target) + 8 })) as ChartData[];
  if (preset === 'ranked')
    return [...bulletRows].sort((a, b) => Number(b.currentAmount) - Number(a.currentAmount)) as ChartData[];
  return playgroundBulletData;
};
