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
import { Axis, Bar, Legend, Line, ReferenceLine } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { channelPerformanceData, downloadsByBrowserData } from './axisStoryData';

export default {
  title: 'React Spectrum Charts 2/Axis/Features/Reference Line',
  component: ReferenceLine,
  argTypes: {
    size: { control: 'inline-radio', options: ['XS', 'S', 'M', 'L'] },
    position: { control: 'inline-radio', options: ['before', 'center', 'after'] },
  },
};

const controls = (...include: string[]) => ({ parameters: { controls: { include } } });

const ConversionTargetStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps({ data: channelPerformanceData, width: 700, height: 360 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Conversion rate" labelFormat="percentage">
        <ReferenceLine {...args} />
      </Axis>
      <Axis position="bottom" labelFormat="time" granularity="month" baseline />
      <Line dimension="datetime" metric="conversionRate" color="channel" scaleType="time" />
      <Legend />
    </Chart>
  );
};

const PrimaryAndSecondaryStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps({ data: channelPerformanceData, width: 700, height: 360 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Conversion rate" labelFormat="percentage">
        <ReferenceLine value={0.05} label="Target" />
        <ReferenceLine {...args} />
      </Axis>
      <Axis position="bottom" labelFormat="time" granularity="month" baseline />
      <Line dimension="datetime" metric="conversionRate" color="channel" scaleType="time" />
      <Legend />
    </Chart>
  );
};

// Reference lines are horizontal, so on a band scale they need categories on the left axis.
const HorizontalBarStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps({ data: downloadsByBrowserData, width: 700, height: 360 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline title="Browser">
        <ReferenceLine {...args} />
      </Axis>
      <Axis position="bottom" grid title="Downloads" numberFormat="shortNumber" />
      <Bar orientation="horizontal" dimension="browser" metric="downloads" color="os" />
      <Legend />
    </Chart>
  );
};

const Basic = bindWithProps(ConversionTargetStory);
Basic.args = { value: 0.04 };
Object.assign(Basic, controls('value'));

const Label = bindWithProps(ConversionTargetStory);
Label.args = { value: 0.04, label: 'Target' };
Object.assign(Label, controls('label'));

const Size = bindWithProps(ConversionTargetStory);
Size.args = { value: 0.04, label: 'Target', size: 'L' };
Object.assign(Size, controls('size'));

const Secondary = bindWithProps(PrimaryAndSecondaryStory);
Secondary.args = { value: 0.035, label: 'Last year', secondary: true };
Object.assign(Secondary, controls('secondary'));

const Position = bindWithProps(HorizontalBarStory);
Position.args = { value: 'Safari', label: 'Top 2', position: 'after' };
Object.assign(Position, controls('position'));

export { Basic, Label, Size, Secondary, Position };
