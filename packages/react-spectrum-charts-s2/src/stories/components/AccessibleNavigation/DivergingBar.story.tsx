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
import { Axis, Bar, ChartInspect, ChartPopover } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { divergingConversionRateData } from '../Bar/data';

export default {
  title: 'React Spectrum Charts 2/Accessible Navigation/Bar Navigation',
  component: Bar,
};

const dialogContent = (datum) => (
  <div>
    <div>Channel: {datum.channel}</div>
    <div>Change rate: {datum.changeRate}</div>
  </div>
);

const AccessibleNavigationStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingConversionRateData, width: 700, height: 400, accessibleNavigation: true });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline title="Channel" />
      <Axis position="bottom" grid labelFormat="percentage" title="Change rate" />
      <Bar {...args} diverging>
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover width={200}>{dialogContent}</ChartPopover>
      </Bar>
    </Chart>
  );
};

export const DivergingBarNavigation = bindWithProps(AccessibleNavigationStory);
DivergingBarNavigation.args = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'horizontal',
  colorOverride: 'barColor',
} satisfies BarProps;
