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
import { Axis, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsDataWithVisiblePoints } from '../../../stories/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features',
  component: Line,
};

const defaultChartProps: ChartProps = {
  data: workspaceTrendsDataWithVisiblePoints,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
};

const StaticPointShapeStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line {...args} />
      <Legend lineWidth={{ value: 0 }} />
    </Chart>
  );
};

export const StaticPointShape = bindWithProps(StaticPointShapeStory);
StaticPointShape.args = {
  color: 'series',
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  staticPoint: 'staticPoint',
  staticPointShape: 'M0,-1L0.951,-0.309L0.588,0.809L-0.588,0.809L-0.951,-0.309Z',
};
