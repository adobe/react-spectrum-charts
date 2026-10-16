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
import { ReactElement, useMemo } from 'react';

import { StoryFn } from '@storybook/react';

import { AnimationType } from '@spectrum-charts/core-s2/constants';
import { ChartData, Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../Chart.js';
import { Axis, Bar, ChartInspect } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { generateLargeData } from '../../../../storyShared/storyUtils.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { ChartProps } from '../../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Bar/Performance/Hover Animation',
  tags: ['alpha'],
  component: Bar,
  argTypes: {
    animations: {
      control: 'boolean',
      description: 'Chart-level master kill switch for all animations.',
    },
    animationTypes: {
      control: { type: 'check' },
      options: ['hover'],
      description: "Which animation types are enabled (only 'hover' is relevant to this story group).",
    },
    renderer: {
      control: { type: 'inline-radio' },
      options: ['svg', 'canvas'],
      description: 'Vega renderer used by every chart in the dashboard.',
    },
    chartCount: {
      control: { type: 'number', min: 1, max: 40, step: 1 },
      description: 'Number of independent bar charts to render in the dashboard grid.',
    },
    seriesPerChart: {
      control: { type: 'number', min: 1, max: 20, step: 1 },
      description: 'Number of stacked series generated per chart.',
    },
    barsPerChart: {
      control: { type: 'number', min: 1, max: 100, step: 1 },
      description: 'Number of dimension values (stacks) generated per chart.',
    },
  },
};

type DashboardArgs = {
  animations?: boolean;
  animationTypes?: AnimationType[];
  renderer?: NonNullable<ChartProps['renderer']>;
  chartCount: number;
  seriesPerChart: number;
  barsPerChart: number;
};

const CHART_HEIGHT = 260;

const dialogContent = (datum: Datum): ReactElement => (
  <div>
    <div>Category: {datum.category}</div>
    <div>Series: {datum.series}</div>
    <div>Value: {Math.round(Number(datum.value)).toLocaleString()}</div>
  </div>
);

/**
 * Generates seeded stacked-bar data with one category per generated time step.
 * @param seriesCount - number of stacked series
 * @param barCount - number of dimension values
 * @param seed - random seed
 * @returns ChartData[]
 */
const generateBarData = (seriesCount: number, barCount: number, seed: number): ChartData[] =>
  generateLargeData(seriesCount, barCount, seed).map(({ datetime, series, value }, i) => ({
    category: `C${String((i % barCount) + 1).padStart(2, '0')}`,
    series,
    value,
    datetime,
  }));

type DashboardChartProps = {
  data: ChartData[];
  animations?: boolean;
  animationTypes?: AnimationType[];
  renderer?: NonNullable<ChartProps['renderer']>;
};

/** A single dashboard tile — its own Chart, sized to fill its grid cell. */
const DashboardChart = ({ data, animations, animationTypes, renderer }: DashboardChartProps): ReactElement => {
  const chartProps: ChartProps = useChartProps({ data, animations, animationTypes, renderer, width: 'auto', height: '100%' });
  return (
    <div style={{ height: CHART_HEIGHT, overflow: 'hidden', border: '1px solid var(--spectrum-gray-300)' }}>
      <Chart {...chartProps}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline />
        <Bar dimension="category" metric="value" color="series">
          <ChartInspect>{dialogContent}</ChartInspect>
        </Bar>
      </Chart>
    </div>
  );
};

/** Performance stress test — a dashboard of `chartCount` independently-hovering stacked bar charts. */
const DashboardStory: StoryFn<DashboardArgs> = ({
  animations,
  animationTypes,
  renderer,
  chartCount,
  seriesPerChart,
  barsPerChart,
}): ReactElement => {
  const chartData = useMemo(
    () =>
      Array.from({ length: chartCount }, (_, i) => ({
        id: `chart-${i}`,
        data: generateBarData(seriesPerChart, barsPerChart, i),
      })),
    [chartCount, seriesPerChart, barsPerChart]
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
        <DashboardChart
          key={id}
          data={data}
          animations={animations}
          animationTypes={animationTypes}
          renderer={renderer}
        />
      ))}
    </div>
  );
};

export const Dashboard = bindWithProps(DashboardStory);
Dashboard.args = {
  animations: true,
  animationTypes: ['hover'],
  chartCount: 20,
  seriesPerChart: 5,
  barsPerChart: 12,
};
