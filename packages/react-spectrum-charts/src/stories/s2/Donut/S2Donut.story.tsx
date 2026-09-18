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
import useChartProps from '../../../hooks/useChartProps';
import { Donut } from '../../../rc';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, DonutProps } from '../../../types';
import { basicDonutData } from '../../components/Donut/data';

export default {
  title: 'RSC/Chart/S2/Donut',
  component: Donut,
};

const defaultChartProps: ChartProps = {
  data: basicDonutData,
  width: 350,
  height: 350,
};

const S2DonutStory: StoryFn<DonutProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, s2: true });
  return (
    <Chart {...chartProps}>
      <Donut {...args} />
    </Chart>
  );
};

const S2Donut = bindWithProps(S2DonutStory);
S2Donut.args = {
  metric: 'count',
  color: 'browser',
};

export { S2Donut };
