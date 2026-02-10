/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import React, { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Content } from '@adobe/react-spectrum';

import { Chart } from '../../../Chart';
import { Axis, ChartPopover, ChartTooltip, Legend, Line, MetricRange } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';
import { workspaceTrendsDataWithAnomalies, workspaceTrendsDataWithExtremeMetricRange } from '../../data/data';

export default {
  title: 'RSC/MetricRange',
  component: MetricRange,
};

const defaultChartProps: ChartProps = {
  data: workspaceTrendsDataWithAnomalies,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
  debug: true,
};

const MetricRangeStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <MetricRange {...args} />
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const MetricRangeWithStaticPointsStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series" staticPoint="staticPoint">
        <MetricRange {...args} />
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const MetricRangeWithPopoverStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <MetricRange {...args} />
        <ChartTooltip>{dialogContent}</ChartTooltip>
        <ChartPopover width={200}>{dialogContent}</ChartPopover>
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const MetricRangeScaleAxisToFitStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps({
    ...defaultChartProps,
    data: workspaceTrendsDataWithExtremeMetricRange,
  });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <MetricRange {...args} />
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const dialogContent = (datum) => (
  <Content>
    <div>Operating system: {datum.series}</div>
    <div>Browser: {datum.category}</div>
    <div>Users: {datum.value}</div>
  </Content>
);

const Basic = bindWithProps(MetricRangeStory);
Basic.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
};

const DisplayOnHover = bindWithProps(MetricRangeStory);
DisplayOnHover.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  displayOnHover: true,
};

const WithStaticPoints = bindWithProps(MetricRangeWithStaticPointsStory);
WithStaticPoints.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  displayOnHover: true,
};

const WithPopover = bindWithProps(MetricRangeWithPopoverStory);
WithPopover.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  displayOnHover: true,
};

const ScaleAxisToFit = bindWithProps(MetricRangeScaleAxisToFitStory);
ScaleAxisToFit.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  scaleAxisToFit: true,
};

export { Basic, DisplayOnHover, WithStaticPoints, WithPopover, ScaleAxisToFit };
