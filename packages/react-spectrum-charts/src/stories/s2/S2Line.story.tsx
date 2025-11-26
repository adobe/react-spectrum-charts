/*
 * Copyright 2025 Adobe. All rights reserved.
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

import { Chart } from '../../Chart';
import { Axis, Legend, Line, Title } from '../../components';
import useChartProps from '../../hooks/useChartProps';
import { bindWithProps } from '../../test-utils';
import { ChartProps } from '../../types';
import { workspaceTrendsData } from '../data/data';

export default {
  title: 'RSC/Chart/S2',
  component: Line,
};

const defaultChartProps: ChartProps = {
  data: workspaceTrendsData,
  s2: true,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
};

const LineStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Title text="Workspace Trends" />
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight title="Events" />
    </Chart>
  );
};

const S2Line = bindWithProps(LineStory);
S2Line.args = {
  color: 'series',
  name: 'line0',
  onClick: undefined,
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
};

export { S2Line };
