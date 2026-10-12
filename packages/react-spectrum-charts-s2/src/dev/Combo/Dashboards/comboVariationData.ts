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
const START_DATE = Date.UTC(2026, 0, 5);
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CHANNELS = [
  ['Web', 0.6],
  ['Mobile', 0.4],
] as const;

export interface ComboVariationDatum extends Record<string, unknown> {
  /** Unique row id for `Chart.idKey`. */
  id: string;
  /** UTC timestamp; the default combo dimension. */
  datetime: number;
  /** Categorical label for the same day. */
  day: string;
  series: string;
  /** Bar metric. */
  orders: number;
  /** Line metric on a scale comparable to `orders`. */
  visits: number;
  /** Second line metric, below `visits`. */
  returningVisits: number;
  /** Line metric on a 0–1 scale for dual-axis variations. */
  conversionRate: number;
  /** Forecast continuation of `visits` for the last two days; null before that. */
  visitsForecast: number | null;
  /** Total visits for the day, identical across channel rows. */
  totalVisits: number;
  /** Truthy on the highest-visits row for `staticPoint`. */
  isPeak: boolean;
  /** Point annotation text; set on the peak row only. */
  note: string;
}

/**
 * Builds single-series combo rows from parallel `orders` and `visits` arrays.
 * @param orders
 * @param visits
 * @returns ComboVariationDatum[]
 */
const toRows = (orders: number[], visits: number[]): ComboVariationDatum[] => {
  const peak = Math.max(...visits);
  return orders.map((orderCount, index) => {
    const datetime = START_DATE + index * DAY_MS;
    const visitCount = visits[index];
    const isForecast = orders.length > 2 && index >= orders.length - 2;
    return {
      id: `orders-${index}`,
      datetime,
      day: `${WEEKDAYS[index % 7]} ${new Date(datetime).getUTCDate()}`,
      series: 'Orders',
      orders: orderCount,
      visits: visitCount,
      returningVisits: Math.round(visitCount * 0.45),
      conversionRate: visitCount === 0 ? 0 : Math.round(Math.abs(orderCount / visitCount) * 1000) / 1000,
      visitsForecast: isForecast ? Math.round(visitCount * 1.08) : null,
      totalVisits: visitCount,
      isPeak: visitCount === peak,
      note: visitCount === peak ? 'Peak' : '',
    };
  });
};

const standard = toRows([42, 55, 61, 48, 70, 65, 58], [120, 134, 151, 128, 176, 190, 162]);

const single = toRows([42], [120]);

const manyPoints = toRows(
  Array.from({ length: 30 }, (_, index) => Math.round(50 + 20 * Math.sin(index / 3) + (index % 5) * 3)),
  Array.from({ length: 30 }, (_, index) => Math.round(140 + 45 * Math.sin(index / 4 + 1) + (index % 7) * 4))
);

const negative = toRows([32, -14, 21, -28, 40, 12, -6], [55, 18, -12, -40, 26, 64, 30]);

const zeros = toRows([42, 0, 61, 0, 0, 65, 58], [120, 0, 151, 128, 0, 190, 0]);

const largeValues = toRows(
  [4_200_000, 3_100_000, 5_600_000, 2_900_000, 6_700_000, 4_900_000, 3_800_000],
  [9_100_000, 8_400_000, 11_200_000, 7_600_000, 13_900_000, 12_300_000, 9_800_000]
);

export const comboVariationDatasets = {
  standard,
  single,
  manyPoints,
  negative,
  zeros,
  largeValues,
} as const;

export type ComboVariationDatasetName = keyof typeof comboVariationDatasets;

export const comboDatasetOptions: VariationDataset[] = [
  { label: 'Standard (7 days)', value: 'standard', description: 'One week of orders (bars) and visits (line).' },
  { label: 'Single point (1 day)', value: 'single', description: 'One bar and a single line point.' },
  {
    label: 'Many points (30 days)',
    value: 'manyPoints',
    description: 'Thirty days; stresses bar width and axis labels.',
  },
  { label: 'Negative (7 days)', value: 'negative', description: 'Bar and line values cross zero.' },
  { label: 'Zeros (7 days)', value: 'zeros', description: 'Zero-height bars and line points on the baseline.' },
  { label: 'Large values (7 days)', value: 'largeValues', description: 'Millions; stresses number formatting.' },
];

/**
 * Splits each day into Web and Mobile rows so bars and lines can facet by series.
 * @param data
 * @returns ComboVariationDatum[]
 */
export const toChannelRows = (data: ComboVariationDatum[]): ComboVariationDatum[] =>
  data.flatMap((datum) =>
    CHANNELS.map(([series, share]) => ({
      ...datum,
      id: `${series}-${datum.id}`,
      series,
      orders: Math.round(datum.orders * share),
      visits: Math.round(datum.visits * share),
      returningVisits: Math.round(datum.returningVisits * share),
      visitsForecast: datum.visitsForecast === null ? null : Math.round(datum.visitsForecast * share),
    }))
  );

/**
 * Returns the series names in first-seen order.
 * @param data
 * @returns string[]
 */
export const getComboSeries = (data: ComboVariationDatum[]): string[] => [
  ...new Set(data.map(({ series }) => series)),
];

/**
 * Returns the timestamp where the forecast begins, falling back to the last row.
 * @param data
 * @returns number
 */
export const getForecastStart = (data: ComboVariationDatum[]): number =>
  data.find(({ visitsForecast }) => visitsForecast !== null)?.datetime ?? data.at(-1)?.datetime ?? START_DATE;
