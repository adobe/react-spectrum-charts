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

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const START_DATE = Date.UTC(2025, 0, 6);

export interface AreaVariationDatum extends Record<string, unknown> {
  /** Unique row id for `Chart.idKey`. */
  id: string;
  /** Week start as a UTC timestamp; the default `datetime` dimension. */
  datetime: number;
  /** Week start as a date string, for time parsing of string dimensions. */
  date: string;
  /** Week number; a numeric dimension for `scaleType="linear"`. */
  week: number;
  /** Week label; a categorical dimension for `scaleType="point"`. */
  label: string;
  series: string;
  /** Alternate color facet that groups series into two channels. */
  channel: string;
  value: number | undefined;
  /** `value` for the prior period (80%); an alternate metric field. */
  previous: number | undefined;
  /** Lower bound of a band around `value` (85%). */
  low: number | undefined;
  /** Upper bound of a band around `value` (115%). */
  high: number | undefined;
  /** Series index reversed, so the first series has the highest stack order. */
  order: number;
  /** Truthy for the first series so ChartInspect `excludeDataKeys` can skip it. */
  excludeFromInspect: boolean;
}

/**
 * Builds one area row with every helper field the dashboard uses.
 * @param series
 * @param seriesIndex
 * @param seriesCount
 * @param weekIndex
 * @param value
 * @returns AreaVariationDatum
 */
const toRow = (
  series: string,
  seriesIndex: number,
  seriesCount: number,
  weekIndex: number,
  value: number | undefined
): AreaVariationDatum => {
  const datetime = START_DATE + weekIndex * WEEK_MS;
  const scale = (factor: number) => (value === undefined ? undefined : Math.round(value * factor));
  return {
    id: `${series}-${weekIndex}`,
    datetime,
    date: new Date(datetime).toISOString().slice(0, 10),
    week: weekIndex + 1,
    label: `W${weekIndex + 1}`,
    series,
    channel: seriesIndex % 2 === 0 ? 'Owned' : 'Paid',
    value,
    previous: scale(0.8),
    low: scale(0.85),
    high: scale(1.15),
    order: seriesCount - seriesIndex,
    excludeFromInspect: seriesIndex === 0,
  };
};

/**
 * Expands per-series value arrays into weekly area rows.
 * @param valuesBySeries
 * @param weekIndexes optional week index per value, for uneven sampling
 * @returns AreaVariationDatum[]
 */
const toRows = (
  valuesBySeries: Record<string, (number | undefined)[]>,
  weekIndexes: Record<string, number[]> = {}
): AreaVariationDatum[] => {
  const entries = Object.entries(valuesBySeries);
  return entries.flatMap(([series, values], seriesIndex) =>
    values.map((value, index) => toRow(series, seriesIndex, entries.length, weekIndexes[series]?.[index] ?? index, value))
  );
};

const standard = toRows({
  Organic: [4200, 4350, 4480, 4400, 4620, 4810, 4760, 4950, 5120, 5080, 5310, 5460],
  Paid: [2600, 2750, 2900, 3400, 3650, 3300, 3100, 2950, 3050, 3200, 3350, 3500],
  Email: [1200, 1850, 1150, 1250, 1900, 1180, 1300, 2050, 1250, 1350, 2100, 1400],
});

const single = toRows({ Sessions: [8000, 8950, 8530, 9050, 10170, 9290, 9160, 9950, 9420, 9630, 10760, 10360] });

const dense = toRows(
  Object.fromEntries(
    Array.from({ length: 8 }, (_, seriesIndex) => [
      `Product ${String.fromCodePoint(65 + seriesIndex)}`,
      Array.from({ length: 52 }, (_, index) =>
        Math.round(400 + 300 * Math.abs(Math.sin(index / 6 + seriesIndex)) + 40 * seriesIndex)
      ),
    ])
  )
);

const fewPoints = toRows({ Organic: [4200, 5460], Paid: [2600, 3500], Email: [1200, 1400] });

const singlePoint = toRows({ Organic: [4200], Paid: [2600], Email: [1200] });

const negative = toRows({
  'Net new': [1310, 820, 130, -100, -700, -290, 240, 610, 880, 420, -150, 360],
  Churned: [-640, -210, -380, -450, -120, -60, -300, -520, -200, -90, -410, -230],
});

const zeros = toRows({
  Organic: [4200, 4350, 0, 0, 4620, 4810, 0, 4950, 5120, 0, 0, 5460],
  Paid: [0, 0, 2900, 3400, 0, 0, 3100, 2950, 0, 0, 3350, 0],
});

const gaps = toRows({
  Organic: [4200, 4350, undefined, 4400, 4620, 4810, undefined, undefined, 5120, 5080, 5310, 5460],
  Paid: [2600, 2750, 2900, 3400, undefined, 3300, 3100, 2950, 3050, undefined, 3350, 3500],
});

const uneven = toRows(
  {
    Organic: [4200, 4480, 4620, 4760, 5120, 5310],
    Paid: [2600, 2750, 2900, 3400, 3650, 3300, 3100, 2950, 3050, 3200, 3350, 3500],
    Email: [1200, 1250, 1300, 1350],
  },
  { Organic: [0, 2, 4, 6, 8, 10], Email: [3, 4, 5, 6] }
);

const largeValues = toRows({
  Revenue: [4.2e9, 4.4e9, 4.1e9, 4.6e9, 4.9e9, 5.2e9, 5.0e9, 5.4e9, 5.6e9, 5.3e9, 5.8e9, 6.1e9],
  Cost: [2.9e9, 3.0e9, 3.1e9, 3.3e9, 3.2e9, 3.4e9, 3.6e9, 3.5e9, 3.7e9, 3.9e9, 3.8e9, 4.0e9],
});

const longLabels = toRows({
  'Paid social traffic attributed via last-click model (all regions)': [
    4100, 4200, 3900, 4400, 4600, 4300, 4500, 4800, 4700, 4900, 5100, 5000,
  ],
  'Organic traffic from every non-paid acquisition channel combined': [
    2600, 2500, 2800, 2900, 2700, 3000, 3100, 2900, 3200, 3300, 3100, 3400,
  ],
});

export const areaVariationDatasets = {
  standard,
  single,
  dense,
  fewPoints,
  singlePoint,
  negative,
  zeros,
  gaps,
  uneven,
  largeValues,
  longLabels,
} as const;

export type AreaVariationDatasetName = keyof typeof areaVariationDatasets;

export const areaDatasetOptions: VariationDataset[] = [
  { label: 'Standard (3 × 12)', value: 'standard', description: 'Three series across twelve weeks.' },
  { label: 'Single series (1 × 12)', value: 'single', description: 'One series across twelve weeks.' },
  {
    label: 'Dense (8 × 52)',
    value: 'dense',
    description: 'Eight series across a year of weeks; stresses color, legend and stack height.',
  },
  { label: 'Few points (3 × 2)', value: 'fewPoints', description: 'Two weeks per series; straight-edged areas.' },
  { label: 'Single point (3 × 1)', value: 'singlePoint', description: 'One week; areas have no width.' },
  { label: 'Negative (2 × 12)', value: 'negative', description: 'Values cross zero.' },
  { label: 'Zeros (2 × 12)', value: 'zeros', description: 'Series drop to zero between active weeks.' },
  { label: 'Gaps (2 × 12)', value: 'gaps', description: 'Two series with undefined values.' },
  {
    label: 'Uneven sampling (3 series)',
    value: 'uneven',
    description: 'Series sampled on different weeks; stresses stack alignment.',
  },
  { label: 'Large values (2 × 12)', value: 'largeValues', description: 'Billions; stresses number formatting.' },
  { label: 'Long labels (2 × 12)', value: 'longLabels', description: 'Very long series names; stresses legend labels.' },
];

/**
 * Returns the series names in first-seen order.
 * @param data
 * @returns string[]
 */
export const getAreaSeries = (data: AreaVariationDatum[]): string[] => [...new Set(data.map(({ series }) => series))];

/**
 * Keeps only the first series so single-series features apply to any dataset.
 * @param data
 * @returns AreaVariationDatum[]
 */
export const getFirstSeries = (data: AreaVariationDatum[]): AreaVariationDatum[] => {
  const [first] = getAreaSeries(data);
  return data.filter(({ series }) => series === first);
};

/**
 * Returns the id of the first series' row with the largest value.
 * @param data
 * @returns string | undefined
 */
export const getPeakId = (data: AreaVariationDatum[]): string | undefined =>
  getFirstSeries(data).reduce<AreaVariationDatum | undefined>(
    (peak, datum) => ((datum.value ?? Number.NEGATIVE_INFINITY) > (peak?.value ?? Number.NEGATIVE_INFINITY) ? datum : peak),
    undefined
  )?.id;
