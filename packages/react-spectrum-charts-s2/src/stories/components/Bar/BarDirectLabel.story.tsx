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
import { Axis, Bar, BarDirectLabel, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { BarDirectLabelProps } from '../../../types';
import { newSubscribersData } from './data';
import { bindStory } from './storyUtils';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Direct Label',
  component: BarDirectLabel,
};

const BarDirectLabelStory: StoryFn<BarDirectLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: newSubscribersData, width: 640, height: 400 });
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

export { Basic, Position, Format };
