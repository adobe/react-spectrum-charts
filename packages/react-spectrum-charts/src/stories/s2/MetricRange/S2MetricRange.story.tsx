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
import { Axis, Legend, Line, MetricRange } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsDataWithAnomalies } from '../../data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'RSC/Chart/S2/MetricRange',
  component: MetricRange,
};

const defaultChartProps: ChartProps = {
  data: workspaceTrendsDataWithAnomalies,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
  s2: true,
};

const S2MetricRangeStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
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

const S2MetricRange = bindWithProps(S2MetricRangeStory);
S2MetricRange.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
};

export { S2MetricRange };
