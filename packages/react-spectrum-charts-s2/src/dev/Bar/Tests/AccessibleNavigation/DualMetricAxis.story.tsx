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

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, ChartPopover, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { barDataTwoSeries } from '../Bar/data';

export default {
  title: 'React Spectrum Charts 2/Accessible Navigation/Bar Navigation',
  component: Bar,
};

const dialogContent = (datum) => (
  <div>
    <div>Operating system: {datum.operatingSystem}</div>
    <div>Browser: {datum.browser}</div>
    <div>Users: {datum.value}</div>
  </div>
);

const AccessibleNavigationStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataTwoSeries, width: 800, height: 600, accessibleNavigation: true });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" ticks tickMinStep={1} title="Windows Downloads" />
      <Axis position="right" ticks tickMinStep={1} title="Mac Downloads" />
      <Bar {...args}>
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover width={200}>{dialogContent}</ChartPopover>
      </Bar>
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

export const DualMetricAxisBarNavigation = bindWithProps(AccessibleNavigationStory);
DualMetricAxisBarNavigation.args = {
  dualMetricAxis: true,
  type: 'dodged',
  dimension: 'browser',
  order: 'order',
  color: 'operatingSystem',
} satisfies BarProps;
