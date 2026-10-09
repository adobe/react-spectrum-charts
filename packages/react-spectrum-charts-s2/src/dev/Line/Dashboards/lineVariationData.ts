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
/** Share of each series' points treated as actuals; the remainder is forecast/estimated. */
const ACTUAL_SHARE = 0.6;

export interface LineVariationDatum extends Record<string, unknown> {
  /** Unique row id for `Chart.idKey`. */
  id: string;
  /** Time dimension (ms). */
  datetime: number;
  /** 1-based point index for linear and point scale variations. */
  index: number;
  series: string;
  value: number | null;
  /** `value` before the forecast start, null after. */
  actual: number | null;
  /** `value` from the forecast start on, null before. */
  forecast: number | null;
  /** Truthy from the forecast start on. */
  isEstimated: boolean;
  /** Truthy for each series' maximum. */
  isPeak: boolean;
  /** Text for LinePointAnnotation on each series' peak; empty elsewhere. */
  annotation: string;
  /** Pre-formatted value for `hoverLabelKey`. */
  displayValue: string;
  /** Lower and upper bounds for MetricRange. */
  low: number | null;
  high: number | null;
  /** Truthy for the first series so ChartInspect `excludeDataKeys` can skip it. */
  excludeFromInspect: boolean;
}

/**
 * Expands per-series value arrays into line rows with every helper field the dashboard uses.
 * @param valuesBySeries
 * @param stepMs
 * @returns LineVariationDatum[]
 */
const toRows = (valuesBySeries: Record<string, (number | null)[]>, stepMs = DAY_MS): LineVariationDatum[] =>
  Object.entries(valuesBySeries).flatMap(([series, values], seriesIndex) => {
    const forecastStart = Math.max(1, Math.floor(values.length * ACTUAL_SHARE));
    const peak = Math.max(...values.map((value) => value ?? -Infinity));
    const peakIndex = Math.max(0, values.indexOf(peak));
    return values.map((value, index) => {
      const isForecast = index >= forecastStart;
      const spread = value === null ? 0 : Math.abs(value) * 0.12 + 1;
      return {
        id: `${series}-${index + 1}`,
        datetime: START_DATE + index * stepMs,
        index: index + 1,
        series,
        value,
        actual: isForecast ? null : value,
        forecast: isForecast ? value : null,
        isEstimated: isForecast,
        isPeak: index === peakIndex,
        annotation: index === peakIndex ? `${series} peak` : '',
        displayValue: value === null ? '' : `${value.toLocaleString('en-US')} visits`,
        low: value === null ? null : value - spread,
        high: value === null ? null : value + spread,
        excludeFromInspect: seriesIndex === 0,
      };
    });
  });

const wave = (length: number, base: number, amplitude: number, phase = 0): number[] =>
  Array.from({ length }, (_, index) =>
    Math.round(base + amplitude * Math.sin(index / 2 + phase) + index * base * 0.01)
  );

const standard = toRows({
  'Organic search': [3180, 2950, 5200, 5480, 5390, 5610, 5020, 3300, 3050, 5350, 5620, 5540, 5790, 5210],
  'Paid search': [2100, 1980, 3100, 3350, 3280, 3420, 3150, 2600, 2450, 3600, 3920, 4100, 4250, 3880],
  Email: [650, 600, 1450, 4200, 1600, 1380, 1300, 700, 640, 1500, 4450, 1650, 1420, 1350],
  Social: [1200, 1350, 1500, 1420, 1610, 1580, 1700, 1820, 1760, 1900, 2050, 1980, 2150, 2300],
});

const single = toRows({
  'Paid search': [2100, 1980, 3100, 3350, 3280, 3420, 3150, 2600, 2450, 3600, 3920, 4100, 4250, 3880],
});

const dense = toRows(
  Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => [
      `Channel ${String(index + 1).padStart(2, '0')}`,
      wave(14, 1000 + index * 350, 300 + index * 20, index),
    ])
  )
);

const long = toRows({
  Mobile: wave(120, 52000, 6000),
  Desktop: wave(120, 41000, 4000, 1.5),
  Tablet: wave(120, 9000, 1500, 3),
});

const sparse = toRows(
  {
    Mobile: [512000, 534000, 575000, 604000],
    Desktop: [421000, 428000, 402000, 391000],
  },
  30 * DAY_MS
);

const singlePoint = toRows({ Mobile: [512000], Desktop: [421000] });

const gaps = toRows({
  'Organic search': [3180, 2950, null, null, 5390, 5610, 5020, 3300, null, 5350, 5620, 5540, 5790, 5210],
  'Paid search': [2100, 1980, 3100, 3350, 3280, null, null, null, 2450, 3600, 3920, 4100, 4250, 3880],
});

const negative = toRows({
  'Net revenue': [-1200, -800, -300, 150, 600, 420, -150, -600, 200, 900, 1400, 1100, 650, 300],
  'Net margin': [-300, -120, 40, 260, 180, -90, -240, 60, 310, 480, 390, 210, 40, -60],
});

const flat = toRows({
  Baseline: Array.from({ length: 14 }, () => 500),
  Target: Array.from({ length: 14 }, () => 500),
});

const largeValues = toRows({
  'Annual revenue': wave(14, 4_200_000_000, 600_000_000),
  'Annual cost': wave(14, 2_900_000_000, 300_000_000, 2),
});

const longLabels = toRows({
  'Organic search traffic from all non-branded queries across every region': wave(14, 4000, 900),
  'Paid search traffic attributed via last-click model (EMEA, APAC, and Americas)': wave(14, 2800, 600, 1),
  'Email newsletter re-engagement campaign — Q4 holiday sequence': wave(14, 1500, 400, 2),
});

export const lineVariationDatasets = {
  standard,
  single,
  dense,
  long,
  sparse,
  singlePoint,
  gaps,
  negative,
  flat,
  largeValues,
  longLabels,
} as const;

export type LineVariationDatasetName = keyof typeof lineVariationDatasets;

export const lineDatasetOptions: VariationDataset[] = [
  { label: 'Standard (4 × 14)', value: 'standard', description: 'Four daily series over two weeks.' },
  { label: 'Single series (1 × 14)', value: 'single', description: 'Enables single-series features such as gradient.' },
  {
    label: 'Dense (12 × 14)',
    value: 'dense',
    description: 'Twelve overlapping series; stresses color, legend and labels.',
  },
  {
    label: 'Long (3 × 120)',
    value: 'long',
    description: 'Four months of daily points; stresses time ticks and hover.',
  },
  { label: 'Sparse (2 × 4)', value: 'sparse', description: 'Four monthly points per series.' },
  {
    label: 'Single point (2 × 1)',
    value: 'singlePoint',
    description: 'One point per series; lines collapse to points.',
  },
  { label: 'Gaps (2 × 14)', value: 'gaps', description: 'Null values break each line into segments.' },
  { label: 'Negative (2 × 14)', value: 'negative', description: 'Values cross zero.' },
  { label: 'Flat (2 × 14)', value: 'flat', description: 'Every value is identical; zero-range metric domain.' },
  { label: 'Large values (2 × 14)', value: 'largeValues', description: 'Billions; stresses number formatting.' },
  {
    label: 'Long labels (3 × 14)',
    value: 'longLabels',
    description: 'Very long series names; stresses legend and labels.',
  },
];

/**
 * Returns the series names in first-seen order.
 * @param data
 * @returns string[]
 */
export const getLineSeries = (data: LineVariationDatum[]): string[] => [...new Set(data.map(({ series }) => series))];

/**
 * Returns the earliest datetime with a forecast value, or the last datetime when there is none.
 * @param data
 * @returns number
 */
export const getForecastStart = (data: LineVariationDatum[]): number => {
  const starts = data.filter(({ forecast }) => forecast !== null).map(({ datetime }) => datetime);
  return starts.length ? Math.min(...starts) : Math.max(...data.map(({ datetime }) => datetime));
};
