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
const START_DATE = Date.UTC(2024, 10, 2);
const POSITIVE_COLOR = '#2d7d46';
const NEGATIVE_COLOR = '#d7373f';

export interface BarVariationDatum extends Record<string, unknown> {
  /** Unique row id for `Chart.idKey`. */
  id: string;
  /** Categorical dimension. */
  category: string;
  /** One day per category, formatted for `dimensionDataType="time"`. */
  date: string;
  series: string;
  value: number;
  /** `value` for the prior period (80%); an alternate metric field. */
  previous: number;
  /** Series index; stack order. */
  order: number;
  /** CSS color for `colorOverride`: green when positive, red when negative. */
  barColor: string;
  /** Pre-formatted value for popover and inspect content. */
  displayValue: string;
  /** Truthy for the first series so ChartInspect `excludeDataKeys` can skip it. */
  excludeFromInspect: boolean;
}

/**
 * Expands per-series value arrays into bar rows with every helper field the dashboard uses.
 * @param categories
 * @param valuesBySeries
 * @returns BarVariationDatum[]
 */
const toRows = (categories: string[], valuesBySeries: Record<string, number[]>): BarVariationDatum[] =>
  Object.entries(valuesBySeries).flatMap(([series, values], seriesIndex) =>
    categories.map((category, index) => {
      const value = values[index];
      return {
        id: `${series}-${category}`,
        category,
        date: `${new Date(START_DATE + index * DAY_MS).toISOString().slice(0, 10)} 00:00:00.0`,
        series,
        value,
        previous: Math.round(value * 0.8),
        order: seriesIndex,
        barColor: value < 0 ? NEGATIVE_COLOR : POSITIVE_COLOR,
        displayValue: `${value.toLocaleString('en-US')} sign-ups`,
        excludeFromInspect: seriesIndex === 0,
      };
    })
  );

const channels = ['Email', 'Search', 'Social', 'Display', 'Referral', 'Affiliate'];

const standard = toRows(channels, {
  Organic: [5200, 4100, 3300, 1800, 2600, 900],
  Paid: [2100, 3900, 2400, 2900, 800, 1400],
  Partner: [900, 1200, 1700, 600, 1500, 1100],
});

const single = toRows(channels, { 'Sign-ups': [12600, 9400, 6200, 3300, 7600, 2100] });

const dense = toRows(
  Array.from({ length: 16 }, (_, index) => `Region ${String(index + 1).padStart(2, '0')}`),
  Object.fromEntries(
    Array.from({ length: 8 }, (_, seriesIndex) => [
      `Product ${String.fromCodePoint(65 + seriesIndex)}`,
      Array.from({ length: 16 }, (_, index) => Math.round(400 + 300 * Math.abs(Math.sin(index + seriesIndex)))),
    ])
  )
);

const manyCategories = toRows(
  Array.from({ length: 40 }, (_, index) => `SKU-${String(index + 1).padStart(3, '0')}`),
  { Units: Array.from({ length: 40 }, (_, index) => Math.round(200 + 180 * Math.abs(Math.sin(index / 3)))) }
);

const singleCategory = toRows(['Email'], { Organic: [5200], Paid: [2100], Partner: [900] });

const negative = toRows(channels, {
  'Net change': [1310, 820, 130, -100, -700, -290],
  'Prior change': [640, -210, 380, -450, 120, -60],
});

const zeros = toRows(channels, {
  Organic: [5200, 0, 3300, 0, 2600, 0],
  Paid: [0, 0, 2400, 0, 800, 0],
});

const largeValues = toRows(channels, {
  Revenue: [4_200_000_000, 3_100_000_000, 2_600_000_000, 1_900_000_000, 3_700_000_000, 900_000_000],
  Cost: [2_900_000_000, 2_400_000_000, 1_100_000_000, 1_600_000_000, 2_200_000_000, 700_000_000],
});

const longLabels = toRows(
  [
    'Instagram Stories advertisement campaign',
    'Facebook Video advertisement placement',
    'Organic search traffic from non-branded queries',
    'Email newsletter re-engagement sequence',
    'Display retargeting across partner networks',
  ],
  {
    'Paid social traffic attributed via last-click model (all regions)': [4100, 3200, 2600, 1800, 1200],
    'Organic traffic from every non-paid acquisition channel combined': [2600, 2100, 3900, 2400, 900],
  }
);

export const barVariationDatasets = {
  standard,
  single,
  dense,
  manyCategories,
  singleCategory,
  negative,
  zeros,
  largeValues,
  longLabels,
} as const;

export type BarVariationDatasetName = keyof typeof barVariationDatasets;

export const barDatasetOptions: VariationDataset[] = [
  { label: 'Standard (3 × 6)', value: 'standard', description: 'Three series across six channels.' },
  { label: 'Single series (1 × 6)', value: 'single', description: 'One series across six channels.' },
  {
    label: 'Dense (8 × 16)',
    value: 'dense',
    description: 'Eight series across sixteen categories; stresses color, legend and bar width.',
  },
  {
    label: 'Many categories (1 × 40)',
    value: 'manyCategories',
    description: 'Forty categories; stresses dimension labels and thin bars.',
  },
  { label: 'Single category (3 × 1)', value: 'singleCategory', description: 'One category; a single wide band.' },
  { label: 'Negative (2 × 6)', value: 'negative', description: 'Values cross zero.' },
  { label: 'Zeros (2 × 6)', value: 'zeros', description: 'Zero-height bars and empty categories.' },
  { label: 'Large values (2 × 6)', value: 'largeValues', description: 'Billions; stresses number formatting.' },
  {
    label: 'Long labels (2 × 5)',
    value: 'longLabels',
    description: 'Very long category and series names; stresses axis and legend labels.',
  },
];

/**
 * Returns the series names in first-seen order.
 * @param data
 * @returns string[]
 */
export const getBarSeries = (data: BarVariationDatum[]): string[] => [...new Set(data.map(({ series }) => series))];

/**
 * Keeps only the first series so single-series features (diverging) apply to any dataset.
 * @param data
 * @returns BarVariationDatum[]
 */
export const getFirstSeries = (data: BarVariationDatum[]): BarVariationDatum[] => {
  const [first] = getBarSeries(data);
  return data.filter(({ series }) => series === first);
};

/**
 * Splits each row into New and Returning rows (60/40) for dual-facet dodged-and-stacked bars.
 * @param data
 * @returns BarVariationDatum[]
 */
export const toSegmentRows = (data: BarVariationDatum[]): (BarVariationDatum & { segment: string })[] =>
  data.flatMap((datum) => [
    { ...datum, id: `${datum.id}-new`, segment: 'New', value: Math.round(datum.value * 0.6) },
    { ...datum, id: `${datum.id}-returning`, segment: 'Returning', value: Math.round(datum.value * 0.4) },
  ]);

/**
 * Repeats each row for three regions with scaled values for trellis bars.
 * @param data
 * @returns BarVariationDatum[]
 */
export const toRegionRows = (data: BarVariationDatum[]): (BarVariationDatum & { region: string })[] =>
  (
    [
      ['Americas', 1],
      ['EMEA', 0.7],
      ['APAC', 0.45],
    ] as const
  ).flatMap(([region, scale]) =>
    data.map((datum) => ({ ...datum, id: `${datum.id}-${region}`, region, value: Math.round(datum.value * scale) }))
  );
