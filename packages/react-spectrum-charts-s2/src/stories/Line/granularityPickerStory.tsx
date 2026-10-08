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

/* eslint-disable react/prop-types -- story args are typed via StoryFn generics, not React propTypes */
import { ComponentProps, Key, ReactElement, useMemo, useState } from 'react';

import { CalendarDate } from '@internationalized/date';
import { DateRangePicker, Picker, PickerItem } from '@react-spectrum/s2';
import { Granularity } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../Chart.js';
import { Axis, ChartInspect, Legend, Line } from '../../components/index.js';
import useChartProps from '../../hooks/useChartProps.js';
import { GeneratedTimeSeriesDatum } from '../../storyShared/storyUtils.js';
import { ChartProps } from '../../types/index.js';

const CHART_HEIGHT = 450;
const DEFAULT_CHART_WIDTH = 800;
const MIN_CHART_WIDTH = 200;
const MAX_CHART_WIDTH = 1600;
const RESIZE_HANDLE_HEIGHT = 48;

const RESIZE_HANDLE_STYLES = `
  .rsc-time-granularity-resize-handle {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    border: none;
    outline: none;
    position: absolute;
    top: 0;
    left: 0;
    height: ${CHART_HEIGHT}px;
    pointer-events: none;
    z-index: 20;
  }
  .rsc-time-granularity-resize-handle::-webkit-slider-runnable-track {
    background: transparent;
    height: ${CHART_HEIGHT}px;
  }
  .rsc-time-granularity-resize-handle::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: ${RESIZE_HANDLE_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    cursor: ew-resize;
    pointer-events: all;
    margin-top: ${(CHART_HEIGHT - RESIZE_HANDLE_HEIGHT) / 2}px;
  }
  .rsc-time-granularity-resize-handle::-moz-range-track {
    background: transparent;
  }
  .rsc-time-granularity-resize-handle::-moz-range-thumb {
    width: 8px;
    height: ${RESIZE_HANDLE_HEIGHT}px;
    border-radius: 4px;
    background: #999;
    border: none;
    cursor: ew-resize;
  }
`;

type DateRange = { start: CalendarDate; end: CalendarDate };

export type GranularityPickerArgs = Omit<ComponentProps<typeof Axis>, 'granularity' | 'labelFormat'>;

const DATA_START = new CalendarDate(2016, 1, 1);
const DATA_END = new CalendarDate(2026, 6, 30);
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const SERIES = ['Desktop', 'Mobile'];

type Preset = { id: string; label: string; getStart?: (end: CalendarDate) => CalendarDate };

const PRESETS: Preset[] = [
  { id: 'today', label: 'Today', getStart: (end) => end },
  { id: 'last3Days', label: 'Last 3 days', getStart: (end) => end.subtract({ days: 2 }) },
  { id: 'last7Days', label: 'Last 7 days', getStart: (end) => end.subtract({ days: 6 }) },
  { id: 'last30Days', label: 'Last 30 days', getStart: (end) => end.subtract({ days: 29 }) },
  { id: 'last90Days', label: 'Last 90 days', getStart: (end) => end.subtract({ days: 89 }) },
  { id: 'last6Months', label: 'Last 6 months', getStart: (end) => end.subtract({ months: 6 }).add({ days: 1 }) },
  { id: 'last12Months', label: 'Last 12 months', getStart: (end) => end.subtract({ years: 1 }).add({ days: 1 }) },
  { id: 'last2Years', label: 'Last 2 years', getStart: (end) => end.subtract({ years: 2 }).add({ days: 1 }) },
  { id: 'last5Years', label: 'Last 5 years', getStart: (end) => end.subtract({ years: 5 }).add({ days: 1 }) },
  { id: 'allTime', label: 'All time', getStart: () => DATA_START },
  { id: 'custom', label: 'Custom' },
];

const DEFAULT_PRESET_ID = 'last30Days';

const getPresetRange = (presetId: string): DateRange | undefined => {
  const getStart = PRESETS.find(({ id }) => id === presetId)?.getStart;
  return getStart ? { start: getStart(DATA_END), end: DATA_END } : undefined;
};

const toDate = ({ year, month, day }: CalendarDate): Date => new Date(year, month - 1, day);

const getDayCount = ({ start, end }: DateRange): number =>
  Math.round((toDate(end).getTime() - toDate(start).getTime()) / MS_PER_DAY) + 1;

const hashToUnit = (a: number, b: number): number => {
  let t = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 1, 0xc2b2ae35);
  t ^= t >>> 16;
  t = Math.imul(t, 0x7feb352d);
  t ^= t >>> 15;
  return (t >>> 0) / 4294967296;
};

const getDailyValue = (date: Date, seriesIndex: number): number => {
  const dayIndex = Math.round((date.getTime() - toDate(DATA_START).getTime()) / MS_PER_DAY);
  const years = dayIndex / 365.25;
  const baseline = seriesIndex === 0 ? 1200 : 700;
  const growth = 1 + (seriesIndex === 0 ? 0.06 : 0.14) * years;
  const seasonality = 1 + 0.2 * Math.sin(2 * Math.PI * years + seriesIndex * (Math.PI / 2));
  const weekly = [0, 6].includes(date.getDay()) ? 0.75 : 1;
  const noise = 1 + 0.2 * (hashToUnit(dayIndex, seriesIndex) - 0.5);
  return baseline * growth * seasonality * weekly * noise;
};

const HOURLY_WEIGHTS = Array.from({ length: 24 }, (_, hour) => 1.2 + Math.sin(((hour - 8) / 24) * 2 * Math.PI));
const HOURLY_WEIGHT_TOTAL = HOURLY_WEIGHTS.reduce((sum, weight) => sum + weight, 0);

const getBucketStart = (date: Date, granularity: Granularity): number => {
  const year = date.getFullYear();
  const month = date.getMonth();
  switch (granularity) {
    case 'week':
      return new Date(year, month, date.getDate() - date.getDay()).getTime();
    case 'month':
      return new Date(year, month, 1).getTime();
    case 'year':
      return new Date(year, 0, 1).getTime();
    default:
      return date.getTime();
  }
};

const MAJOR_TIME_TICK_SPACING = 50;
const CHART_FRAME_INSET = 36;

// Points per parent calendar period; each major tick interval may hold at most one parent period.
const POINTS_PER_PARENT_PERIOD: [Granularity, number][] = [
  ['hour', 24],
  ['day', 7],
  ['week', 4],
  ['month', 12],
];

const getBucketCount = (range: DateRange, granularity: Granularity): number => {
  const dayCount = getDayCount(range);
  if (granularity === 'hour') return dayCount * 24;
  if (granularity === 'day') return dayCount;
  const start = toDate(range.start);
  const buckets = new Set<number>();
  for (let dayOffset = 0; dayOffset < dayCount; dayOffset++) {
    buckets.add(
      getBucketStart(new Date(start.getFullYear(), start.getMonth(), start.getDate() + dayOffset), granularity)
    );
  }
  return buckets.size;
};

/**
 * Picks the finest granularity that keeps at most one parent period of points per major tick interval.
 * @param range
 * @param chartWidth
 * @returns Granularity
 */
const getAutoGranularity = (range: DateRange, chartWidth: number): Granularity => {
  const tickIntervals = Math.max(1, Math.floor((chartWidth - CHART_FRAME_INSET) / MAJOR_TIME_TICK_SPACING));
  const fit = POINTS_PER_PARENT_PERIOD.find(
    ([granularity, pointCount]) => getBucketCount(range, granularity) / pointCount <= tickIntervals
  );
  return fit?.[0] ?? 'year';
};

/**
 * Generates download totals for each granularity bucket within the range.
 * @param range
 * @param granularity
 * @returns GeneratedTimeSeriesDatum[]
 */
const generateTimeSeries = (range: DateRange, granularity: Granularity): GeneratedTimeSeriesDatum[] => {
  const totals = new Map<number, number[]>();
  const dayCount = getDayCount(range);
  const start = toDate(range.start);

  for (let dayOffset = 0; dayOffset < dayCount; dayOffset++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + dayOffset);
    const dailyValues = SERIES.map((_, seriesIndex) => getDailyValue(date, seriesIndex));

    if (granularity === 'hour') {
      HOURLY_WEIGHTS.forEach((weight, hour) => {
        const datetime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour).getTime();
        totals.set(
          datetime,
          dailyValues.map((value) => (value * weight) / HOURLY_WEIGHT_TOTAL)
        );
      });
      continue;
    }

    const bucket = getBucketStart(date, granularity);
    const bucketTotals = totals.get(bucket) ?? SERIES.map(() => 0);
    totals.set(
      bucket,
      bucketTotals.map((total, seriesIndex) => total + dailyValues[seriesIndex])
    );
  }

  return [...totals.entries()].flatMap(([datetime, values]) =>
    SERIES.map((series, seriesIndex) => ({ datetime, series, value: Math.round(values[seriesIndex]) }))
  );
};

export const GranularityPickerStory = ({ position, ...axisProps }: GranularityPickerArgs): ReactElement => {
  const [chartWidth, setChartWidth] = useState(DEFAULT_CHART_WIDTH);
  const [presetId, setPresetId] = useState<string>(DEFAULT_PRESET_ID);
  const [range, setRange] = useState<DateRange>(() => getPresetRange(DEFAULT_PRESET_ID) as DateRange);
  const granularity = useMemo(() => getAutoGranularity(range, DEFAULT_CHART_WIDTH), [range]);
  const data = useMemo(() => generateTimeSeries(range, granularity), [range, granularity]);
  const chartProps: ChartProps = useChartProps({ data, width: 'auto', height: '100%' });

  const onPresetChange = (key: Key | null) => {
    if (key === null) return;
    setPresetId(String(key));
    const presetRange = getPresetRange(String(key));
    if (presetRange) setRange(presetRange);
  };

  const onRangeChange = (value: DateRange | null) => {
    if (!value) return;
    setPresetId('custom');
    setRange(value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <style>{RESIZE_HANDLE_STYLES}</style>
      <div style={{ display: 'flex', gap: 16, alignItems: 'end' }}>
        <Picker label="Preset" value={presetId} onChange={onPresetChange} items={PRESETS}>
          {(preset) => <PickerItem id={preset.id}>{preset.label}</PickerItem>}
        </Picker>
        <DateRangePicker
          label="Date range"
          value={range}
          onChange={onRangeChange}
          minValue={DATA_START}
          maxValue={DATA_END}
        />
        <div aria-live="polite" style={{ paddingBlockEnd: 8 }}>
          Granularity: <strong>{granularity}</strong> ({data.length / SERIES.length} points)
        </div>
      </div>
      <div style={{ position: 'relative', display: 'inline-block', alignSelf: 'flex-start' }}>
        <div
          style={{
            boxSizing: 'border-box',
            overflow: 'hidden',
            width: chartWidth,
            height: CHART_HEIGHT,
            border: '2px solid var(--spectrum-gray-400)',
            padding: 16,
          }}
        >
          <Chart {...chartProps}>
            <Axis position="left" grid title="Downloads" />
            <Axis {...axisProps} position={position} labelFormat="time" granularity={granularity} />
            <Line color="series" dimension="datetime" metric="value" scaleType="time">
              <ChartInspect>
                {(datum) => (
                  <div>
                    <div>{new Date(datum.datetime as number).toLocaleString()}</div>
                    <div>Downloads: {Number(datum.value).toLocaleString()}</div>
                  </div>
                )}
              </ChartInspect>
            </Line>
            <Legend highlight />
          </Chart>
        </div>
        <input
          type="range"
          className="rsc-time-granularity-resize-handle"
          aria-label="Chart width"
          min={0}
          max={MAX_CHART_WIDTH}
          value={chartWidth}
          onChange={(event) => setChartWidth(Math.max(MIN_CHART_WIDTH, Number(event.target.value)))}
          style={{ width: MAX_CHART_WIDTH }}
        />
      </div>
    </div>
  );
};
