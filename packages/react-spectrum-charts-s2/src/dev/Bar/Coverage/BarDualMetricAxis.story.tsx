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
import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { Axis, Bar, ChartInspect, ChartPopover, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { barDataTwoSeries, barSeriesData } from '../../../storyShared/components/Bar/data.js';
import { bindWithProps } from '../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Bar/Coverage/Dual Metric Axis',
  component: Bar,
};

const dualAxisDialogContent = (datum: Datum): ReactElement => (
  <div>
    <div>Operating system: {datum.operatingSystem}</div>
    <div>Browser: {datum.browser}</div>
    <div>Users: {datum.value}</div>
  </div>
);

const DualMetricAxisWithSublabelsStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataTwoSeries, width: 720, height: 460 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis
        position={args.orientation === 'horizontal' ? 'bottom' : 'left'}
        ticks
        tickMinStep={1}
        title="Downloads"
        subLabels={[
          { value: '1', subLabel: 'Low' },
          { value: '2', subLabel: 'Medium' },
          { value: '5', subLabel: 'High' },
        ]}
      />
      <Axis
        position={args.orientation === 'horizontal' ? 'bottom' : 'right'}
        ticks
        tickMinStep={1}
        title="Mac Downloads"
        subLabels={[
          { value: '1', subLabel: 'Low' },
          { value: '2', subLabel: 'Medium' },
          { value: '3', subLabel: 'High' },
        ]}
      />
      <Bar {...args}>
        <ChartInspect>{dualAxisDialogContent}</ChartInspect>
        <ChartPopover width={200}>{dualAxisDialogContent}</ChartPopover>
      </Bar>
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

const DualMetricAxisWithThreeSeriesStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, width: 720, height: 460 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} ticks tickMinStep={1} title="Downloads" />
      <Axis
        position={args.orientation === 'horizontal' ? 'bottom' : 'right'}
        ticks
        tickMinStep={1}
        title="Other Downloads"
      />
      <Bar {...args}>
        <ChartInspect>{dualAxisDialogContent}</ChartInspect>
        <ChartPopover width={200}>{dualAxisDialogContent}</ChartPopover>
      </Bar>
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

export const DualMetricAxisWithSublabels = bindWithProps(DualMetricAxisWithSublabelsStory);
DualMetricAxisWithSublabels.args = {
  dualMetricAxis: true,
  type: 'dodged',
  dimension: 'browser',
  order: 'order',
  color: 'operatingSystem',
};

export const DualMetricAxisWithThreeSeries = bindWithProps(DualMetricAxisWithThreeSeriesStory);
DualMetricAxisWithThreeSeries.args = {
  dualMetricAxis: true,
  type: 'dodged',
  dimension: 'browser',
  order: 'order',
  color: 'operatingSystem',
};
