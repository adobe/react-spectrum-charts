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
import { ChartData } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { ChartInspect, Donut, DonutSummary, SegmentLabel } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { generateLargeData } from '../../../storyShared/storyUtils.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { ChartProps } from '../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Donut/Performance/Animation',
  tags: ['alpha'],
  component: Donut,
  argTypes: {
    animations: {
      control: 'boolean',
      description: 'Chart-level master kill switch for all animations.',
    },
    animationTypes: {
      control: { type: 'check' },
      options: ['hover', 'drawIn'],
      description: 'Which animation types are enabled.',
    },
    renderer: {
      control: { type: 'inline-radio' },
      options: ['svg', 'canvas'],
      description: 'Vega renderer used by every chart in the dashboard.',
    },
    chartCount: {
      control: { type: 'number', min: 1, max: 40, step: 1 },
      description: 'Number of independent donut charts to render in the dashboard grid.',
    },
    segmentsPerChart: {
      control: { type: 'number', min: 1, max: 50, step: 1 },
      description: 'Number of segments generated per donut.',
    },
  },
};

type DashboardArgs = {
  animations?: boolean;
  animationTypes?: AnimationType[];
  renderer?: NonNullable<ChartProps['renderer']>;
  chartCount: number;
  segmentsPerChart: number;
};

const CHART_HEIGHT = 260;

/**
 * Generates seeded donut data with one row per segment.
 * @param segmentCount - number of segments
 * @param seed - random seed
 * @returns ChartData[]
 */
const generateDonutData = (segmentCount: number, seed: number): ChartData[] =>
  generateLargeData(segmentCount, 1, seed).map(({ series, value }) => ({ series, value: Math.round(value) }));

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
        <Donut metric="value" color="series">
          <DonutSummary label="Total" numberFormat="shortNumber" />
          <SegmentLabel percent />
          <ChartInspect />
        </Donut>
      </Chart>
    </div>
  );
};

/** Performance stress test — a dashboard of `chartCount` independently-animating donut charts. */
const DashboardStory: StoryFn<DashboardArgs> = ({
  animations,
  animationTypes,
  renderer,
  chartCount,
  segmentsPerChart,
}): ReactElement => {
  const chartData = useMemo(
    () =>
      Array.from({ length: chartCount }, (_, i) => ({
        id: `chart-${i}`,
        data: generateDonutData(segmentsPerChart, i),
      })),
    [chartCount, segmentsPerChart]
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
  animationTypes: ['hover', 'drawIn'],
  chartCount: 20,
  segmentsPerChart: 6,
};
