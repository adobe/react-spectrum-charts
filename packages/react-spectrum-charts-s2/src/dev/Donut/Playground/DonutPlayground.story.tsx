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
import { Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Donut } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { DonutProps } from '../../../types';
import { basicDonutData } from '../../../stories/components/Donut/data';

export default { title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Playground', component: Donut };

const DonutPlaygroundStory: StoryFn<typeof Donut> = (args): ReactElement => {
  const chartProps = useChartProps({ data: basicDonutData, height: 360, maxWidth: 480 });
  return (
    <Chart {...chartProps}>
      <Donut {...args} />
      <Legend color="browser" />
    </Chart>
  );
};

export const Playground = bindWithProps(DonutPlaygroundStory);
Playground.args = { color: 'browser', metric: 'count' } satisfies DonutProps;
