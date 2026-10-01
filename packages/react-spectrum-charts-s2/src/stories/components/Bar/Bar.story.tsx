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
import { acquisitionChannelData, monthlySignupsData } from '../../../storyShared/components/Bar/data';
import { BarStory, defaultProps } from './barStoryTemplates';
import { bindStory } from './storyUtils';

export default {
  title: 'React Spectrum Charts 2/Bar/Features',
  component: Bar,
};

const MonthlyBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: monthlySignupsData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline labelFormat="time" granularity="month" title="Month" />
      <Axis position="left" grid title="Sign-ups" />
      <Bar {...args} />
      <Legend title="Metric" />
    </Chart>
  );
};

const ChartInspectStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: acquisitionChannelData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Acquisition channel" />
      <Axis position="left" grid title="Sign-ups" />
      <Bar {...args}>
        <ChartInspect>
          {(datum) => (
            <div>
              {datum.channel}: {Number(datum.signups).toLocaleString()} sign-ups
            </div>
          )}
        </ChartInspect>
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

const Basic = bindStory(BarStory);
Basic.args = { ...defaultProps };
Basic.parameters = { controls: { include: ['dimension', 'metric', 'color'] } };

const Orientation = bindStory(BarStory);
Orientation.args = { ...defaultProps, orientation: 'horizontal' };
Orientation.parameters = { controls: { include: ['orientation'] } };

const DimensionDataType = bindStory(MonthlyBarStory);
DimensionDataType.args = { ...defaultProps, dimension: 'month', dimensionDataType: 'time' };
DimensionDataType.parameters = { controls: { include: ['dimensionDataType'] } };

// Hovering a bar or its axis label highlights the bar and shows the tooltip.
const ChartInspectOnBar = bindStory(ChartInspectStory);
ChartInspectOnBar.args = { ...defaultProps };
ChartInspectOnBar.parameters = { controls: { include: [] } };

export { Basic, Orientation, DimensionDataType, ChartInspectOnBar as ChartInspect };
