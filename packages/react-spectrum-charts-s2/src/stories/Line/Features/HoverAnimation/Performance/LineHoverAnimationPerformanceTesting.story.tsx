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
import { ComponentProps, ReactElement, useMemo } from 'react';

import { StoryFn } from '@storybook/react';

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../../Chart';
import { Axis, ChartInspect, Line } from '../../../../../components';
import useChartProps from '../../../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../../../stories/data/data';
import { GeneratedTimeSeriesDatum, formatTimestamp, generateLargeData } from '../../../../../stories/storyUtils';
import { bindWithProps } from '../../../../../test-utils';
import { ChartProps } from '../../../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features/HoverAnimation/Performance',
  component: Line,
  argTypes: {
    animations: {
      control: 'boolean',
      description: 'Chart-level toggle for the animated hover/highlight system.',
    },
    chartCount: {
      control: { type: 'number', min: 1, max: 40, step: 1 },
      description: 'Number of independent line charts to render in the dashboard grid.',
    },
    seriesPerChart: {
      control: { type: 'number', min: 1, max: 50, step: 1 },
      description: 'Number of series generated per chart.',
    },
    pointsPerSeries: {
      control: { type: 'number', min: 10, max: 5_000, step: 10 },
      description: 'Number of data points generated per series.',
    },
  },
  args: { animations: true, chartCount: 20, seriesPerChart: 30, pointsPerSeries: 10 },
};

type DashboardArgs = {
  animations?: boolean;
  chartCount: number;
  seriesPerChart: number;
  pointsPerSeries: number;
};

const CHART_HEIGHT = 260;

const defaultArgs = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time' as const,
};

const dialogContent = (datum: Datum): ReactElement => (
  <div>
    <div>{formatTimestamp(datum.datetime as number)}</div>
    <div>Series: {datum.series}</div>
    <div>Value: {Number(datum.value).toLocaleString()}</div>
  </div>
);

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

type DashboardChartProps = {
  data: GeneratedTimeSeriesDatum[];
  animations?: boolean;
};

/**
 * A single dashboard tile — its own Chart, sized to fill its grid cell. `ChartInspect` is what
 * makes the Line interactive (wires up the voronoi hover overlay + hoveredItem signal), which is
 * what the hover-animation system needs to trigger at all.
 */
const DashboardChart = ({ data, animations }: DashboardChartProps): ReactElement => {
  const chartProps: ChartProps = useChartProps({ data, animations, width: 'auto', height: '100%' });
  return (
    <div style={{ height: CHART_HEIGHT, overflow: 'hidden', border: '1px solid var(--spectrum-gray-300)' }}>
      <Chart {...chartProps}>
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" baseline />
        <Line {...defaultArgs}>
          <ChartInspect>{dialogContent}</ChartInspect>
        </Line>
      </Chart>
    </div>
  );
};

/**
 * Performance stress test — a resizable dashboard of `chartCount` independently-hovering line
 * charts, each seeded with its own deterministic dataset (`generateLargeData`). Resize the
 * container to see how the hover-animation system holds up under realistic dashboard layout
 * changes, not just data volume within a single chart.
 */
const DashboardStory: StoryFn<DashboardArgs> = ({
  animations,
  chartCount,
  seriesPerChart,
  pointsPerSeries,
}): ReactElement => {
  const chartData = useMemo(
    () =>
      Array.from({ length: chartCount }, (_, i) => ({
        id: `chart-${i}`,
        data: generateLargeData(seriesPerChart, pointsPerSeries, i),
      })),
    [chartCount, seriesPerChart, pointsPerSeries]
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
        width: 1400,
        minWidth: 600,
        maxWidth: 2800,
        height: 900,
        minHeight: 300,
        maxHeight: 2400,
        overflow: 'auto',
        resize: 'both',
        border: '2px solid var(--spectrum-gray-400)',
        padding: 16,
      }}
    >
      {chartData.map(({ id, data }) => (
        <DashboardChart key={id} data={data} animations={animations} />
      ))}
    </div>
  );
};

type LargeDatasetArgs = ComponentProps<typeof Line> & { seriesPerChart: number; pointsPerSeries: number; animations?: boolean };

/**
 * Performance stress test — a single chart with a large generated dataset. Hover a legend entry
 * or a data point to watch the hover-animation system fade/emphasize at scale (toggle
 * `animations` to compare).
 */
const LargeDatasetStory: StoryFn<LargeDatasetArgs> = ({ seriesPerChart, pointsPerSeries, animations, ...args }): ReactElement => {
  const data = useMemo(() => generateLargeData(seriesPerChart, pointsPerSeries), [seriesPerChart, pointsPerSeries]);
  const chartProps = useChartProps({ ...defaultChartProps, data, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Value" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args}>
        <ChartInspect>{dialogContent}</ChartInspect>
      </Line>
    </Chart>
  );
};

export const Dashboard = bindWithProps(DashboardStory);
Dashboard.args = { animations: true, chartCount: 20, seriesPerChart: 10, pointsPerSeries: 10 };

export const LargeDataset = bindWithProps(LargeDatasetStory);
LargeDataset.args = { ...defaultArgs, seriesPerChart: 100, pointsPerSeries: 10 };
(LargeDataset as unknown as { argTypes: Record<string, { table: { disable: true } }> }).argTypes = {
  chartCount: { table: { disable: true } },
};
