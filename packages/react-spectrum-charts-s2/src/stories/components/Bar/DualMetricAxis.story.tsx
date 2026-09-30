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
import { Axis, Bar, ChartInspect, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { sessionsAndOrdersData } from './data';
import { bindStory } from './storyUtils';

export default {
  title: 'React Spectrum Charts 2/Bar/Features',
  component: Bar,
};

const DualMetricAxisStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: sessionsAndOrdersData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Acquisition channel" />
      <Axis position="left" grid ticks title="Total sessions" />
      <Axis position="right" ticks title="Total orders" />
      <Bar {...args}>
        <ChartInspect>
          {(datum) => (
            <div>
              {datum.channel} {String(datum.series).toLowerCase()}: {Number(datum.value).toLocaleString()}
            </div>
          )}
        </ChartInspect>
      </Bar>
      <Legend title="Metric" highlight />
    </Chart>
  );
};

// The last series (Orders) is scaled against the right-hand axis.
const DualMetricAxis = bindStory(DualMetricAxisStory);
DualMetricAxis.args = {
  type: 'dodged',
  dimension: 'channel',
  metric: 'value',
  color: 'series',
  order: 'order',
  dualMetricAxis: true,
};
DualMetricAxis.parameters = { controls: { include: ['dualMetricAxis'] } };

export { DualMetricAxis };
