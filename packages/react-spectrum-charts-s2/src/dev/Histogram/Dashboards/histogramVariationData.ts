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
import { createRandom, normal } from '../../../storyShared/Histogram/data.js';
import { VariationDataset } from '../../VariationDashboard.js';

export interface HistogramVariationDatum extends Record<string, unknown> {
  /** Unique row id for `Chart.idKey`. */
  id: string;
  /** Default metric. Non-finite in the `nonFinite` dataset. */
  value: number;
  series: string;
  /** Second numeric field for 2D histograms, correlated with `value`. */
  y: number;
  /** Alternate metric field. */
  duration: number;
}

interface SeriesConfig {
  series: string;
  count: number;
  /** Draws one value of the series. */
  draw: (random: () => number) => number;
}

const round = (value: number, digits = 1): number => Math.round(value * 10 ** digits) / 10 ** digits;

const logNormal =
  (median: number, spread: number) =>
  (random: () => number): number =>
    median * Math.exp(spread * normal(random));

const gaussian =
  (mean: number, sd: number) =>
  (random: () => number): number =>
    mean + sd * normal(random);

/**
 * Builds rows for each series from seeded draws, with a correlated `y` and an alternate `duration` field.
 * @param configs
 * @param seed
 * @returns HistogramVariationDatum[]
 */
const toRows = (configs: SeriesConfig[], seed: number): HistogramVariationDatum[] => {
  const random = createRandom(seed);
  return configs.flatMap(({ series, count, draw }) =>
    Array.from({ length: count }, (_, index) => {
      const value = round(draw(random));
      return {
        id: `${series}-${index}`,
        value,
        series,
        y: round(value * 0.4 + 20 + normal(random) * 12),
        duration: round(30 + Math.abs(normal(random)) * 40),
      };
    })
  );
};

const standard = toRows(
  [
    { series: 'Mobile', count: 120, draw: logNormal(180, 0.45) },
    { series: 'Desktop', count: 100, draw: logNormal(260, 0.4) },
    { series: 'Tablet', count: 60, draw: logNormal(340, 0.5) },
  ],
  1
);

const single = toRows([{ series: 'Sessions', count: 200, draw: gaussian(50, 12) }], 2);

const bimodal = toRows(
  [
    {
      series: 'Checkout',
      count: 240,
      draw: (random) => (random() < 0.55 ? gaussian(30, 6)(random) : gaussian(75, 9)(random)),
    },
  ],
  3
);

const dense = toRows(
  ['Atlas', 'Beacon', 'Cobalt', 'Delta', 'Ember', 'Falcon'].map((series, index) => ({
    series,
    count: 400,
    draw: logNormal(120 + index * 40, 0.4),
  })),
  4
);

const small = toRows([{ series: 'Sessions', count: 6, draw: gaussian(50, 15) }], 5);

const singleValue = toRows([{ series: 'Sessions', count: 20, draw: () => 42 }], 6);

const negative = toRows(
  [
    { series: 'Gain', count: 120, draw: gaussian(12, 18) },
    { series: 'Loss', count: 120, draw: gaussian(-14, 16) },
  ],
  7
);

const largeValues = toRows(
  [
    { series: 'Enterprise', count: 120, draw: logNormal(4e8, 0.5) },
    { series: 'Self-serve', count: 120, draw: logNormal(9e7, 0.6) },
  ],
  8
);

const outliers = [
  ...toRows([{ series: 'Mobile', count: 150, draw: logNormal(180, 0.3) }], 9),
  ...[2400, 3100, 5200].map((value, index) => ({
    id: `Outlier-${index}`,
    value,
    series: 'Mobile',
    y: 900,
    duration: 40,
  })),
];

const nonFinite = [
  ...single.slice(0, 80),
  ...[Number.NaN, Number.POSITIVE_INFINITY, null, undefined, 'n/a'].map((value, index) => ({
    id: `Invalid-${index}`,
    value: value as number,
    series: 'Sessions',
    y: 40,
    duration: 40,
  })),
];

const longLabels = toRows(
  [
    'Customer acquisition through unpaid organic search results',
    'Enterprise accounts with multi-region deployment requirements',
  ].map((series, index) => ({ series, count: 120, draw: logNormal(160 + index * 120, 0.4) })),
  10
);

export const histogramVariationDatasets = {
  standard,
  single,
  bimodal,
  dense,
  small,
  singleValue,
  negative,
  largeValues,
  outliers,
  nonFinite,
  longLabels,
} as const;

export type HistogramVariationDatasetName = keyof typeof histogramVariationDatasets;

/**
 * Gets the finite values of a numeric field, sorted ascending.
 * @param data
 * @param key
 * @returns number[]
 */
const getSortedValues = (data: HistogramVariationDatum[], key: 'value' | 'y'): number[] =>
  data
    .map((datum) => datum[key])
    .filter((value) => typeof value === 'number' && Number.isFinite(value))
    .sort((a, b) => a - b);

/**
 * Gets the value at quantile `q` (0 to 1) of a numeric field.
 * @param data
 * @param q
 * @param key
 * @returns number
 */
export const getQuantile = (data: HistogramVariationDatum[], q: number, key: 'value' | 'y' = 'value'): number => {
  const values = getSortedValues(data, key);
  if (!values.length) return 0;
  return values[Math.min(values.length - 1, Math.floor(q * values.length))];
};

/**
 * Gets a round bin width that splits the field's range into roughly `bins` bins.
 * @param data
 * @param bins
 * @param key
 * @returns number
 */
export const getRoundBinSize = (
  data: HistogramVariationDatum[],
  bins: number,
  key: 'value' | 'y' = 'value'
): number => {
  const range = getQuantile(data, 1, key) - getQuantile(data, 0, key);
  if (range <= 0) return 1;
  const raw = range / bins;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return Math.ceil(raw / magnitude) * magnitude;
};

/**
 * Gets ascending, uneven bin edges at the field's quantiles.
 * @param data
 * @returns number[]
 */
export const getQuantileEdges = (data: HistogramVariationDatum[]): number[] => {
  const edges = [0, 0.25, 0.5, 0.75, 0.9, 1].map((q) => getQuantile(data, q));
  const unique = [...new Set(edges)];
  return unique.length > 1 ? unique : [unique[0], unique[0] + 1];
};

/**
 * Gets the unique series names in data order.
 * @param data
 * @returns string[]
 */
export const getHistogramSeries = (data: HistogramVariationDatum[]): string[] => [
  ...new Set(data.map(({ series }) => series)),
];

export const histogramDatasetOptions: VariationDataset[] = [
  { label: 'Standard (3 series, 280)', value: 'standard', description: 'Right-skewed values in three series.' },
  { label: 'Single series (200)', value: 'single', description: 'One symmetric series.' },
  { label: 'Bimodal (240)', value: 'bimodal', description: 'Two peaks in one series.' },
  { label: 'Dense (6 series, 2400)', value: 'dense', description: 'Many rows across six overlapping series.' },
  { label: 'Small (6)', value: 'small', description: 'Fewer rows than the minimum bin count.' },
  { label: 'Single value (20)', value: 'singleValue', description: 'Every row has the same value.' },
  { label: 'Negative (2 series, 240)', value: 'negative', description: 'Values cross zero.' },
  { label: 'Large values (2 series, 240)', value: 'largeValues', description: 'Values in the hundreds of millions.' },
  { label: 'Outliers (153)', value: 'outliers', description: 'A tight cluster plus three extreme values.' },
  { label: 'Non-finite (85)', value: 'nonFinite', description: 'Adds NaN, Infinity, null and string values.' },
  { label: 'Long labels (2 series, 240)', value: 'longLabels', description: 'Verbose series names.' },
];
