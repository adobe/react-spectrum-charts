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
import React, { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Axis, Legend, Line, ReferenceLine } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Axis/Features/Reference Line',
  component: ReferenceLine,
  excludeStories: ['Basic'],
};

const conversionData = [
  { week: 1, conversionRate: 0.39, channel: 'Paid search' },
  { week: 2, conversionRate: 0.43, channel: 'Paid search' },
  { week: 3, conversionRate: 0.47, channel: 'Paid search' },
  { week: 4, conversionRate: 0.51, channel: 'Paid search' },
  { week: 1, conversionRate: 0.31, channel: 'Email' },
  { week: 2, conversionRate: 0.34, channel: 'Email' },
  { week: 3, conversionRate: 0.38, channel: 'Email' },
  { week: 4, conversionRate: 0.42, channel: 'Email' },
];

const defaultChartProps: ChartProps = {
  data: conversionData,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
  backgroundColor: 'gray-50',
};

const ReferenceLineStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Conversion rate" labelFormat="percentage">
        <ReferenceLine {...args} />
      </Axis>
      <Axis position="bottom" baseline ticks title="Week" />
      <Line dimension="week" metric="conversionRate" color="channel" scaleType="linear" />
      <Legend />
    </Chart>
  );
};

const Basic = bindWithProps(ReferenceLineStory);
Basic.args = {
  value: 0.45,
};

const Label = bindWithProps(ReferenceLineStory);
Label.args = {
  label: 'Target',
  value: 0.45,
};
Label.storyName = 'Reference line';
Object.assign(Label, { parameters: { controls: { include: ['label', 'value'] } } });

export { Label, Basic };
