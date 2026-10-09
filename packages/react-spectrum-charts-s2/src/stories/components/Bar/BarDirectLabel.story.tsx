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
import { Axis, Bar, BarDirectLabel, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { newSubscribersData } from '../../../storyShared/components/Bar/data.js';
import { BarDirectLabelProps } from '../../../types/index.js';
import { bindStory } from './storyUtils.js';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Direct Label',
  component: BarDirectLabel,
};

const calloutData = newSubscribersData.map((datum) => ({ ...datum, callout: datum.channel === 'Social' }));

const BarDirectLabelStory: StoryFn<BarDirectLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: calloutData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Acquisition channel" />
      <Axis position="left" grid title="Subscribers" />
      <Bar dimension="channel" metric="subscribers" color="series">
        <BarDirectLabel {...args} />
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

const Basic = bindStory(BarDirectLabelStory);
Basic.args = {};
Basic.parameters = { controls: { include: [] } };

const Position = bindStory(BarDirectLabelStory);
Position.args = { position: 'end' };
Position.parameters = {
  controls: { include: ['position'] },
};
Position.argTypes = {
  position: { control: 'select', options: ['start', 'middle', 'end', 'end-outside'] },
};

const Format = bindStory(BarDirectLabelStory);
Format.args = { format: '.2~s' };
Format.parameters = { controls: { include: ['format'] } };
Format.argTypes = {
  format: { control: 'select', options: ['.2~s', 'standardNumber', ',.0f', 'currency'] },
};

// Narrow chart so the smaller bars are too short to hold their labels.
const OverflowStory: StoryFn<BarDirectLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: calloutData, width: 320, height: 240 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline />
      <Axis position="bottom" grid />
      <Bar dimension="channel" metric="subscribers" orientation="horizontal">
        <BarDirectLabel {...args} />
      </Bar>
    </Chart>
  );
};

const Overflow = bindStory(OverflowStory);
Overflow.args = { position: 'end', overflow: 'spill' };
Overflow.parameters = { controls: { include: ['position', 'overflow'] } };
Overflow.argTypes = {
  position: { control: 'select', options: ['start', 'middle', 'end'] },
  overflow: { control: 'select', options: ['hide', 'spill'] },
};

const DataKey = bindStory(BarDirectLabelStory);
DataKey.args = { dataKey: 'callout' };
DataKey.parameters = { controls: { include: ['position'] } };
DataKey.argTypes = {
  position: { control: 'select', options: ['start', 'middle', 'end', 'end-outside'] },
};

export { Basic, Position, Format, Overflow, DataKey };
