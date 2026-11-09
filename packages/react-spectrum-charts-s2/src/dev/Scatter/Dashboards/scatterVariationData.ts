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
import { VariationDataset } from '../../VariationDashboard.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const START_DATE = Date.UTC(2025, 0, 6);

export interface ScatterVariationDatum extends Record<string, unknown> {
  /** Unique row id for `Chart.idKey`. */
  id: string;
  /** Default dimension. */
  x: number;
  /** Default metric. */
  value: number;
  series: string;
  /** Second categorical facet for line type, opacity and stroke. */
  segment: 'New' | 'Returning';
  /** Numeric facet (1–10) for size, linear color and path width. */
  weight: number;
  /** Short point label for ScatterAnnotation `textKey`. */
  label: string;
  /** Order of the point within its series. */
  step: number;
  /** UTC timestamp for `dimensionScaleType="time"`. */
  datetime: number;
  /** Alternate dimension field. */
  adoption: number;
  /** Alternate metric field. */
  satisfaction: number;
  /** Truthy for the first series so ChartInspect `excludeDataKeys` can skip it. */
  excludeFromInspect: boolean;
  /** Truthy for the last point of each series so Trendline `excludeDataKeys` can skip it. */
  excludeFromTrendline: boolean;
}

interface SeriesConfig {
  series: string;
  points: [number, number][];
}

/** Deterministic pseudo-random value in [-1, 1]. */
const jitter = (seed: number): number => Math.sin(seed * 12.9898) * 0.5 + Math.sin(seed * 78.233) * 0.5;

const round = (value: number, digits = 1): number => Math.round(value * 10 ** digits) / 10 ** digits;

/**
 * Expands per-series points into scatter rows with every helper field the dashboard uses.
 * @param configs
 * @returns ScatterVariationDatum[]
 */
const toRows = (configs: SeriesConfig[]): ScatterVariationDatum[] =>
  configs.flatMap(({ series, points }, seriesIndex) =>
    points.map(([x, value], step) => ({
      id: `${series}-${step}`,
      x,
      value,
      series,
      segment: step % 2 === 0 ? 'New' : 'Returning',
      weight: ((step * 3 + seriesIndex * 2) % 10) + 1,
      label: `${series.slice(0, 1)}${step + 1}`,
      step,
      datetime: START_DATE + Math.round(x * 7) * DAY_MS,
      adoption: round(x * 0.6 + 2 + jitter(step + seriesIndex * 31)),
      satisfaction: round(value * 0.05 + 2 + jitter(step * 7 + seriesIndex) * 0.6),
      excludeFromInspect: seriesIndex === 0,
      excludeFromTrendline: step === points.length - 1,
    }))
  );

/**
 * Generates `count` points along a noisy line, sorted by x.
 * @param count
 * @param intercept
 * @param slope
 * @param noise
 * @param seed
 * @returns [number, number][]
 */
const linearPoints = (
  count: number,
  intercept: number,
  slope: number,
  noise: number,
  seed: number
): [number, number][] =>
  Array.from({ length: count }, (_, index) => {
    const x = round(1 + index * (11 / Math.max(1, count - 1)) + jitter(seed + index) * 0.3);
    return [x, round(intercept + slope * x + jitter(seed * 3 + index) * noise)];
  });

const scalePoints = (points: [number, number][], xScale: number, xOffset = 0): [number, number][] =>
  points.map(([x, value]) => [round(x * xScale + xOffset), value]);

const standard = toRows([
  { series: 'Mobile', points: linearPoints(12, 22, 4.2, 6, 1) },
  { series: 'Desktop', points: linearPoints(12, 40, 2.1, 5, 2) },
  { series: 'Tablet', points: linearPoints(12, 12, 1.4, 4, 3) },
]);

const single = toRows([{ series: 'Sessions', points: linearPoints(24, 18, 3.4, 7, 4) }]);

const dense = toRows(
  ['Atlas', 'Beacon', 'Cobalt', 'Delta', 'Ember', 'Falcon'].map((series, index) => ({
    series,
    points: linearPoints(60, 10 + index * 6, 1.5 + index * 0.4, 9, 10 + index),
  }))
);

const overlapping = toRows(
  ['Mobile', 'Desktop', 'Tablet'].map((series, seriesIndex) => ({
    series,
    points: Array.from({ length: 40 }, (_, index): [number, number] => [
      round(6 + jitter(index + seriesIndex * 50) * 1.5 + seriesIndex * 0.6),
      round(40 + jitter(index * 5 + seriesIndex * 17) * 8 + seriesIndex * 3),
    ]),
  }))
);

const sparse = toRows([
  { series: 'Mobile', points: [[3, 34]] },
  { series: 'Desktop', points: [[6, 52]] },
  { series: 'Tablet', points: [[9, 25]] },
]);

const singlePoint = toRows([{ series: 'Only', points: [[5, 42]] }]);

const negative = toRows([
  { series: 'Mobile', points: scalePoints(linearPoints(12, -30, 5, 6, 21), 1, -6) },
  { series: 'Desktop', points: scalePoints(linearPoints(12, 20, -4, 6, 22), 1, -6) },
]);

const largeValues = toRows([
  { series: 'Mobile', points: scalePoints(linearPoints(12, 2e8, 4e8, 3e8, 31), 1e6) },
  { series: 'Desktop', points: scalePoints(linearPoints(12, 9e8, 2e8, 2e8, 32), 1e6) },
]);

const outliers = toRows([
  { series: 'Mobile', points: [...linearPoints(11, 22, 4.2, 4, 41), [6, 140]] },
  { series: 'Desktop', points: [...linearPoints(11, 40, 2.1, 4, 42), [11.5, 2]] },
]);

const duplicatePoints = toRows(
  ['Mobile', 'Desktop', 'Tablet'].map((series) => ({
    series,
    points: [
      [2, 20],
      [4, 30],
      [6, 30],
      [8, 45],
    ],
  }))
);

const longLabels = toRows(
  [
    'Customer acquisition through unpaid organic search results',
    'Enterprise accounts with multi-region deployment requirements',
    'Returning visitors using privacy-focused browser configurations',
  ].map((series, index) => ({ series, points: linearPoints(10, 15 + index * 12, 2.5, 5, 51 + index) }))
);

const trajectory = toRows([
  {
    series: 'Analytics',
    points: [
      [12, 18],
      [15, 22],
      [19, 17],
      [21, 11],
      [22, 6],
    ],
  },
  {
    series: 'Commerce',
    points: [
      [24, 6],
      [23, 3],
      [25, 8],
      [27, 9],
      [30, 12],
    ],
  },
  {
    series: 'Messaging',
    points: [
      [5, 30],
      [8, 26],
      [10, 14],
      [11, 7],
      [10, 2],
    ],
  },
]);

export const scatterVariationDatasets = {
  standard,
  single,
  dense,
  overlapping,
  sparse,
  singlePoint,
  negative,
  largeValues,
  outliers,
  duplicatePoints,
  longLabels,
  trajectory,
} as const;

export type ScatterVariationDatasetName = keyof typeof scatterVariationDatasets;

/**
 * Gets the unique series names in data order.
 * @param data
 * @returns string[]
 */
export const getScatterSeries = (data: ScatterVariationDatum[]): string[] => [
  ...new Set(data.map(({ series }) => series)),
];

/**
 * Keeps only the rows of the first series.
 * @param data
 * @returns ScatterVariationDatum[]
 */
export const getFirstSeries = (data: ScatterVariationDatum[]): ScatterVariationDatum[] => {
  const [first] = getScatterSeries(data);
  return data.filter(({ series }) => series === first);
};

export const scatterDatasetOptions: VariationDataset[] = [
  { label: 'Standard (3 × 12)', value: 'standard', description: 'Three correlated series.' },
  { label: 'Single series (24)', value: 'single', description: 'One series with a clear trend.' },
  { label: 'Dense (6 × 60)', value: 'dense', description: 'Many overlapping points across six series.' },
  { label: 'Overlapping (3 × 40)', value: 'overlapping', description: 'Tight clusters that stress blending.' },
  { label: 'Sparse (3)', value: 'sparse', description: 'One point per series.' },
  { label: 'Single point (1)', value: 'singlePoint', description: 'Minimum non-empty dataset.' },
  { label: 'Negative (2 × 12)', value: 'negative', description: 'Dimension and metric cross zero.' },
  { label: 'Large values (2 × 12)', value: 'largeValues', description: 'Millions on x and billions on y.' },
  { label: 'Outliers (2 × 12)', value: 'outliers', description: 'One extreme point per series.' },
  {
    label: 'Duplicate points (3 × 4)',
    value: 'duplicatePoints',
    description: 'Every series shares identical coordinates.',
  },
  { label: 'Long labels (3 × 10)', value: 'longLabels', description: 'Verbose series names.' },
  { label: 'Trajectory (3 × 5)', value: 'trajectory', description: 'Ordered steps that double back on x.' },
];
