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

import { Chart } from '../../../Chart.js';
import { Axis, Legend, Line } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { revenueByRegionAndPeriodData, trafficBySourceData } from './legendStoryData.js';

export const controls = (...include: string[]) => ({ parameters: { controls: { include } } });

export const TrafficStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data: trafficBySourceData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Sessions" numberFormat="shortNumber" />
      <Axis position="bottom" baseline labelFormat="time" granularity="month" title="Month" />
      <Line dimension="datetime" metric="sessions" color="source" scaleType="time" />
      <Legend {...args} />
    </Chart>
  );
};

export const RevenueStory: StoryFn<typeof Legend> = (args): ReactElement => {
  const chartProps = useChartProps({ data: revenueByRegionAndPeriodData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Revenue" numberFormat="shortCurrency" />
      <Axis position="bottom" baseline labelFormat="time" granularity="month" title="Month" />
      <Line dimension="datetime" metric="revenue" color="region" lineType="period" scaleType="time" />
      <Legend {...args} />
    </Chart>
  );
};
