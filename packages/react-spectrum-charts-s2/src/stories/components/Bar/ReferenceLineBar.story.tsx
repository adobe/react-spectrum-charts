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
import { Axis, Bar, Legend } from '../../../components';
import { ReferenceLine } from '../../../components/ReferenceLine';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Reference Line',
  component: ReferenceLine,
  parameters: {
    controls: {
      include: ['value', 'label', 'position'],
    },
  },
};

// S2 reference lines are horizontal-only (left/right axes only).
const data = [
  { channel: 'Email', conversions: 2100, series: 'Conversions' },
  { channel: 'Search', conversions: 3400, series: 'Conversions' },
  { channel: 'Display', conversions: 1800, series: 'Conversions' },
  { channel: 'Social', conversions: 2900, series: 'Conversions' },
  { channel: 'Affiliate', conversions: 1200, series: 'Conversions' },
];

const ReferenceLineStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline ticks title="Conversions">
        <ReferenceLine {...args} />
      </Axis>
      <Axis position="bottom" baseline ticks title="Channel" />
      <Bar dimension="channel" metric="conversions" color="series" />
      <Legend title="Metric" />
    </Chart>
  );
};

const Basic = bindWithProps(ReferenceLineStory);
Basic.args = {
  value: 2500,
};

export { Basic };
