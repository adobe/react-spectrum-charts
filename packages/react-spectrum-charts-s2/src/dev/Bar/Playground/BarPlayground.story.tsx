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
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { barSeriesData } from '../../../stories/components/Bar/data';

export default { title: 'React Spectrum Charts 2/Bar/Playground', component: Bar };

const BarPlaygroundStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, height: 420, maxWidth: 720 });
  const isHorizontal = args.orientation === 'horizontal';
  return (
    <Chart {...chartProps}>
      <Axis position={isHorizontal ? 'left' : 'bottom'} baseline />
      <Axis position={isHorizontal ? 'bottom' : 'left'} grid />
      <Bar {...args} />
      <Legend color="operatingSystem" />
    </Chart>
  );
};

export const Playground = bindWithProps(BarPlaygroundStory);
Playground.args = { dimension: 'browser', metric: 'value', color: 'operatingSystem', order: 'order' } satisfies BarProps;
