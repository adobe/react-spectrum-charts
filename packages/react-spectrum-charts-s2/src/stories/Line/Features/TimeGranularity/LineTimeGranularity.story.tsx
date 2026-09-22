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
import { ComponentProps, ReactElement, useMemo, useState } from 'react';

import { StoryFn } from '@storybook/react';

import { Granularity } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../Chart';
import { Axis, ChartInspect, Line } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';
import { GeneratedTimeSeriesDatum } from '../../../storyUtils';

const GRANULARITIES: Granularity[] = ['hour', 'day', 'week', 'month', 'quarter', 'year'];

export default {
  title: 'React Spectrum Charts 2/Line/Features/Time Granularity',
  component: Axis,
  argTypes: {
    granularity: {
      control: 'select',
      options: GRANULARITIES,
      description: 'Time-axis granularity. The visible time window remains fixed when this changes.',
    },
    position: {
      control: 'select',
      options: ['top', 'bottom'],
    },
  },
};

const HOUR_MS = 3.6e6;
const CHART_HEIGHT = 400;
const DEFAULT_CHART_WIDTH = 700;
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

type TimeWindow = {
  end: number;
  sampleHours: number;
  start: number;
};

type TimeGranularityArgs = Omit<ComponentProps<typeof Axis>, 'granularity' | 'labelFormat'> & {
  granularity: Granularity;
};

type TimeGranularityStoryProps = TimeGranularityArgs & {
  window: TimeWindow;
};

const getTimeSeriesValue = (progress: number, seriesIndex: number): number => {
  const baseline = seriesIndex === 0 ? 150 : 105;
  const amplitude = seriesIndex === 0 ? 85 : 60;
  const phase = seriesIndex * (Math.PI / 2);
  const primaryWave = amplitude * Math.sin(2 * Math.PI * progress * 2 + phase);
  const secondaryWave = amplitude * 0.35 * Math.cos(2 * Math.PI * progress * 5 + phase);
  return Math.round(baseline + primaryWave + secondaryWave);
};

const generateTimeSeries = ({ end, sampleHours, start }: TimeWindow): GeneratedTimeSeriesDatum[] => {
  const data: GeneratedTimeSeriesDatum[] = [];
  const sampleDuration = sampleHours * HOUR_MS;
  for (let datetime = start; datetime < end; datetime += sampleDuration) {
    const progress = (datetime - start) / (end - start);
    ['Desktop', 'Mobile'].forEach((series, seriesIndex) => {
      data.push({
        datetime,
        series,
        value: getTimeSeriesValue(progress, seriesIndex),
      });
    });
  }
  return data;
};

/**
 * Gets the start of the local calendar bucket for a timestamp.
 * @param datetime
 * @param granularity
 * @returns bucket start timestamp
 */
const getBucketStart = (datetime: number, granularity: Granularity): number => {
  const date = new Date(datetime);
  switch (granularity) {
    case 'day':
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    case 'week': {
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      dayStart.setDate(dayStart.getDate() - dayStart.getDay());
      return dayStart.getTime();
    }
    case 'month':
      return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    case 'quarter':
      return new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1).getTime();
    case 'year':
      return new Date(date.getFullYear(), 0, 1).getTime();
    default:
      return datetime;
  }
};

const getBucketedData = (
  sourceData: GeneratedTimeSeriesDatum[],
  granularity: Granularity
): GeneratedTimeSeriesDatum[] => {
  if (granularity === 'hour') return sourceData;

  const buckets = new Map<string, { count: number; datetime: number; series: string; total: number }>();
  for (const { datetime, series, value } of sourceData) {
    const bucketStart = getBucketStart(datetime, granularity);
    const bucketKey = `${series}-${bucketStart}`;
    const bucket = buckets.get(bucketKey) ?? { count: 0, datetime: bucketStart, series, total: 0 };
    bucket.count += 1;
    bucket.total += value;
    buckets.set(bucketKey, bucket);
  }
  return Array.from(buckets.values())
    .sort((a, b) => a.datetime - b.datetime || a.series.localeCompare(b.series))
    .map(({ count, datetime, series, total }) => ({
      datetime,
      series,
      value: Math.round(total / count),
    }));
};

const TimeGranularityStory = ({
  granularity,
  position,
  window,
  ...axisProps
}: TimeGranularityStoryProps): ReactElement => {
  const [chartWidth, setChartWidth] = useState(DEFAULT_CHART_WIDTH);
  const sourceData = useMemo(() => generateTimeSeries(window), [window]);
  const data = useMemo(() => getBucketedData(sourceData, granularity), [granularity, sourceData]);
  const chartProps: ChartProps = useChartProps({ data, width: 'auto', height: '100%' });

  return (
    <div>
      <style>{RESIZE_HANDLE_STYLES}</style>
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

const hourlyWindow: TimeWindow = {
  start: new Date(2025, 0, 1).getTime(),
  end: new Date(2025, 0, 4).getTime(),
  sampleHours: 3,
};

const dailyWindow: TimeWindow = {
  start: new Date(2025, 0, 1).getTime(),
  end: new Date(2025, 1, 15).getTime(),
  sampleHours: 24,
};

const weeklyWindow: TimeWindow = {
  start: new Date(2024, 0, 1).getTime(),
  end: new Date(2024, 6, 1).getTime(),
  sampleHours: 24,
};

const monthlyWindow: TimeWindow = {
  start: new Date(2024, 0, 1).getTime(),
  end: new Date(2025, 6, 1).getTime(),
  sampleHours: 24,
};

const quarterlyWindow: TimeWindow = {
  start: new Date(2022, 0, 1).getTime(),
  end: new Date(2026, 0, 1).getTime(),
  sampleHours: 24,
};

const yearlyWindow: TimeWindow = {
  start: new Date(2016, 0, 1).getTime(),
  end: new Date(2026, 0, 1).getTime(),
  sampleHours: 24 * 7,
};

const HourlyStory: StoryFn<TimeGranularityArgs> = (args): ReactElement => (
  <TimeGranularityStory {...args} window={hourlyWindow} />
);
export const Hourly = bindWithProps(HourlyStory);
Hourly.args = { baseline: true, granularity: 'hour', position: 'bottom', ticks: true };

const DailyStory: StoryFn<TimeGranularityArgs> = (args): ReactElement => (
  <TimeGranularityStory {...args} window={dailyWindow} />
);
export const Daily = bindWithProps(DailyStory);
Daily.args = { baseline: true, granularity: 'day', position: 'bottom', ticks: true };

const WeeklyStory: StoryFn<TimeGranularityArgs> = (args): ReactElement => (
  <TimeGranularityStory {...args} window={weeklyWindow} />
);
export const Weekly = bindWithProps(WeeklyStory);
Weekly.args = { baseline: true, granularity: 'week', position: 'bottom', ticks: true };

const MonthlyStory: StoryFn<TimeGranularityArgs> = (args): ReactElement => (
  <TimeGranularityStory {...args} window={monthlyWindow} />
);
export const Monthly = bindWithProps(MonthlyStory);
Monthly.args = { baseline: true, granularity: 'month', position: 'bottom', ticks: true };

const QuarterlyStory: StoryFn<TimeGranularityArgs> = (args): ReactElement => (
  <TimeGranularityStory {...args} window={quarterlyWindow} />
);
export const Quarterly = bindWithProps(QuarterlyStory);
Quarterly.args = { baseline: true, granularity: 'quarter', position: 'bottom', ticks: true };

const YearlyStory: StoryFn<TimeGranularityArgs> = (args): ReactElement => (
  <TimeGranularityStory {...args} window={yearlyWindow} />
);
export const Yearly = bindWithProps(YearlyStory);
Yearly.args = { baseline: true, granularity: 'year', position: 'bottom', ticks: true };
