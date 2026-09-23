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

import { NumberField } from '@react-spectrum/s2';
import { Granularity } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../Chart';
import { Axis, ChartInspect, Legend, Line } from '../../../../components';
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

type TimeWindow = {
  defaultCount: number;
  maxCount: number;
  start: number;
  unit: 'hour' | 'day' | 'month' | 'quarter' | 'year';
  unitLabel: string;
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

const getTimeValue = (start: number, index: number, unit: TimeWindow['unit']): number => {
  const date = new Date(start);
  switch (unit) {
    case 'hour':
      date.setHours(date.getHours() + index);
      break;
    case 'day':
      date.setDate(date.getDate() + index);
      break;
    case 'month':
      date.setMonth(date.getMonth() + index);
      break;
    case 'quarter':
      date.setMonth(date.getMonth() + index * 3);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() + index);
  }
  return date.getTime();
};

const SERIES = ['Desktop', 'Mobile'];

const generateTimeSeries = ({ maxCount, start, unit }: TimeWindow): GeneratedTimeSeriesDatum[] => {
  const data: GeneratedTimeSeriesDatum[] = [];
  for (let index = 0; index < maxCount; index++) {
    const datetime = getTimeValue(start, index, unit);
    const progress = maxCount === 1 ? 0 : index / (maxCount - 1);
    SERIES.forEach((series, seriesIndex) => {
      data.push({
        datetime,
        series,
        value: getTimeSeriesValue(progress, seriesIndex),
      });
    });
  }
  return data;
};

const TimeGranularityStory = ({
  granularity,
  position,
  window,
  ...axisProps
}: TimeGranularityStoryProps): ReactElement => {
  const [chartWidth, setChartWidth] = useState(DEFAULT_CHART_WIDTH);
  const [itemCount, setItemCount] = useState(window.defaultCount);
  const sourceData = useMemo(() => generateTimeSeries(window), [window]);
  const data = useMemo(() => sourceData.slice(0, itemCount * SERIES.length), [itemCount, sourceData]);
  const chartProps: ChartProps = useChartProps({ data, width: 'auto', height: '100%' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <style>{RESIZE_HANDLE_STYLES}</style>
      <div style={{ width: 200 }}>
        <NumberField
          label={`${window.unitLabel} displayed`}
          minValue={1}
          maxValue={window.maxCount}
          value={itemCount}
          onChange={setItemCount}
        />
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

const hourlyWindow: TimeWindow = {
  start: new Date(2025, 0, 1).getTime(),
  defaultCount: 72,
  maxCount: 144,
  unit: 'hour',
  unitLabel: 'Hours',
};

const dailyWindow: TimeWindow = {
  start: new Date(2025, 0, 1).getTime(),
  defaultCount: 50,
  maxCount: 180,
  unit: 'day',
  unitLabel: 'Days',
};

const monthlyWindow: TimeWindow = {
  start: new Date(2024, 0, 1).getTime(),
  defaultCount: 24,
  maxCount: 48,
  unit: 'month',
  unitLabel: 'Months',
};

const quarterlyWindow: TimeWindow = {
  start: new Date(2022, 0, 1).getTime(),
  defaultCount: 16,
  maxCount: 32,
  unit: 'quarter',
  unitLabel: 'Quarters',
};

const yearlyWindow: TimeWindow = {
  start: new Date(2016, 0, 1).getTime(),
  defaultCount: 10,
  maxCount: 20,
  unit: 'year',
  unitLabel: 'Years',
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
