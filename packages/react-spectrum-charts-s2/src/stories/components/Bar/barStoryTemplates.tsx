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
import { Axis, Bar, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { acquisitionChannelData } from '../../../storyShared/components/Bar/data.js';
import { BarProps } from '../../../types/index.js';

export const BarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const isHorizontal = args.orientation === 'horizontal';
  const chartProps = useChartProps({ data: acquisitionChannelData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position={isHorizontal ? 'left' : 'bottom'} baseline title="Acquisition channel" />
      <Axis position={isHorizontal ? 'bottom' : 'left'} grid title="Sign-ups" />
      <Bar {...args} />
      <Legend title="Metric" />
    </Chart>
  );
};

export const defaultProps: BarProps = {
  dimension: 'channel',
  metric: 'signups',
  color: 'series',
};
