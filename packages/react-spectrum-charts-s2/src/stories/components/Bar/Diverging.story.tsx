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
import { Axis, Bar, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { divergingConversionRateDataWithDirection } from '../../../storyShared/components/Bar/data';
import { BarProps } from '../../../types';
import { bindStory } from './storyUtils';

export default {
  title: 'React Spectrum Charts 2/Bar/Features',
  component: Bar,
};

const DivergingStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const isHorizontal = args.orientation === 'horizontal';
  const chartProps = useChartProps({ data: divergingConversionRateDataWithDirection, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position={isHorizontal ? 'left' : 'bottom'} baseline title="Channel" />
      <Axis position={isHorizontal ? 'bottom' : 'left'} grid labelFormat="percentage" title="Conversion rate change" />
      <Bar {...args} />
      <Legend title="Change direction" />
    </Chart>
  );
};

const defaultProps: BarProps = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'horizontal',
  color: 'changeDirection',
};

// Category labels sit on the zero baseline, on the opposite side of each bar.
const Diverging = bindStory(DivergingStory);
Diverging.args = { ...defaultProps, diverging: true };
Diverging.parameters = { controls: { include: ['diverging'] } };

export { Diverging };
