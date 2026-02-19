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
import React, { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Content } from '@adobe/react-spectrum';

import { Chart } from '../../../Chart';
import { Axis, ChartPopover, ChartTooltip, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { LineProps } from '../../../types';

export default {
  title: 'RSC/Line/Dual Metric Axis',
  component: Line,
};

// Sample data with two series: Downloads and Conversion Rate
// Downloads will be on the left axis (primary), Conversion Rate on the right axis (secondary)
const lineDualAxisData = [
  { datetime: 1667890800000, value: 4500, series: 'Downloads', order: 0 },
  { datetime: 1667977200000, value: 5200, series: 'Downloads', order: 0 },
  { datetime: 1668063600000, value: 4800, series: 'Downloads', order: 0 },
  { datetime: 1668150000000, value: 6100, series: 'Downloads', order: 0 },
  { datetime: 1668236400000, value: 5800, series: 'Downloads', order: 0 },
  { datetime: 1668322800000, value: 6500, series: 'Downloads', order: 0 },
  { datetime: 1668409200000, value: 7200, series: 'Downloads', order: 0 },
  { datetime: 1667890800000, value: 2.3, series: 'Conversion Rate (%)', order: 1 },
  { datetime: 1667977200000, value: 2.8, series: 'Conversion Rate (%)', order: 1 },
  { datetime: 1668063600000, value: 2.5, series: 'Conversion Rate (%)', order: 1 },
  { datetime: 1668150000000, value: 3.2, series: 'Conversion Rate (%)', order: 1 },
  { datetime: 1668236400000, value: 3.0, series: 'Conversion Rate (%)', order: 1 },
  { datetime: 1668322800000, value: 3.5, series: 'Conversion Rate (%)', order: 1 },
  { datetime: 1668409200000, value: 3.8, series: 'Conversion Rate (%)', order: 1 },
];

// Sample data with three series
const lineThreeSeriesData = [
  { datetime: 1667890800000, value: 4500, series: 'Downloads', order: 0 },
  { datetime: 1667977200000, value: 5200, series: 'Downloads', order: 0 },
  { datetime: 1668063600000, value: 4800, series: 'Downloads', order: 0 },
  { datetime: 1668150000000, value: 6100, series: 'Downloads', order: 0 },
  { datetime: 1668236400000, value: 5800, series: 'Downloads', order: 0 },
  { datetime: 1668322800000, value: 6500, series: 'Downloads', order: 0 },
  { datetime: 1668409200000, value: 7200, series: 'Downloads', order: 0 },
  { datetime: 1667890800000, value: 3200, series: 'Installs', order: 1 },
  { datetime: 1667977200000, value: 3800, series: 'Installs', order: 1 },
  { datetime: 1668063600000, value: 3500, series: 'Installs', order: 1 },
  { datetime: 1668150000000, value: 4400, series: 'Installs', order: 1 },
  { datetime: 1668236400000, value: 4100, series: 'Installs', order: 1 },
  { datetime: 1668322800000, value: 4700, series: 'Installs', order: 1 },
  { datetime: 1668409200000, value: 5200, series: 'Installs', order: 1 },
  { datetime: 1667890800000, value: 2.3, series: 'Conversion Rate (%)', order: 2 },
  { datetime: 1667977200000, value: 2.8, series: 'Conversion Rate (%)', order: 2 },
  { datetime: 1668063600000, value: 2.5, series: 'Conversion Rate (%)', order: 2 },
  { datetime: 1668150000000, value: 3.2, series: 'Conversion Rate (%)', order: 2 },
  { datetime: 1668236400000, value: 3.0, series: 'Conversion Rate (%)', order: 2 },
  { datetime: 1668322800000, value: 3.5, series: 'Conversion Rate (%)', order: 2 },
  { datetime: 1668409200000, value: 3.8, series: 'Conversion Rate (%)', order: 2 },
];

const dialogContent = (datum) => (
  <Content>
    <div>Date: {new Date(datum.datetime).toLocaleDateString()}</div>
    <div>Series: {datum.series}</div>
    <div>Value: {datum.value}</div>
  </Content>
);

const BasicStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data: lineDualAxisData, width: 800, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" baseline ticks title="Date" />
      <Axis position="left" grid ticks title="Downloads" />
      <Axis position="right" ticks title="Conversion Rate (%)" />
      <Line {...args}>
        <ChartTooltip>{dialogContent}</ChartTooltip>
        <ChartPopover width={200}>{dialogContent}</ChartPopover>
      </Line>
      <Legend title="Metrics" highlight />
    </Chart>
  );
};

const WithThreeSeriesStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data: lineThreeSeriesData, width: 800, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" baseline ticks title="Date" />
      <Axis position="left" grid ticks title="Count" />
      <Axis position="right" ticks title="Conversion Rate (%)" />
      <Line {...args}>
        <ChartTooltip>{dialogContent}</ChartTooltip>
        <ChartPopover width={200}>{dialogContent}</ChartPopover>
      </Line>
      <Legend title="Metrics" highlight />
    </Chart>
  );
};

const defaultProps: LineProps = {
  dualMetricAxis: true,
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  onClick: undefined,
};

const Basic = bindWithProps(BasicStory);
Basic.args = {
  ...defaultProps,
  color: 'series',
};

const WithThreeSeries = bindWithProps(WithThreeSeriesStory);
WithThreeSeries.args = {
  ...defaultProps,
  color: 'series',
};

const ItemTooltip = bindWithProps(BasicStory);
ItemTooltip.args = {
  ...defaultProps,
  color: 'series',
  interactionMode: 'item',
};

export { Basic, WithThreeSeries, ItemTooltip };

