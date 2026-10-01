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
import { Axis, Legend, Line, ReferenceLine } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { channelPerformanceData } from './axisStoryData';

export default {
  title: 'React Spectrum Charts 2/Axis/Features/Reference Line',
  component: ReferenceLine,
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

const Basic = bindWithProps(ConversionTargetStory);
Basic.args = { value: 0.04 };
Object.assign(Basic, controls('value'));

const Label = bindWithProps(ConversionTargetStory);
Label.args = { value: 0.04, label: 'Target' };
Object.assign(Label, controls('label'));

const Secondary = bindWithProps(PrimaryAndSecondaryStory);
Secondary.args = { value: 0.035, label: 'Last year', secondary: true };
Object.assign(Secondary, controls('secondary'));

export { Basic, Label, Secondary };
