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
import { Axis, Scatter } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { characterData } from '../../data/marioKartData';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'RSC/Chart/S2/Scatter',
  component: Scatter,
};

const defaultChartProps: ChartProps = { data: characterData, height: 500, width: 500, s2: true };

const S2ScatterStory: StoryFn<typeof Scatter> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter {...args} />
    </Chart>
  );
};

const S2Scatter = bindWithProps(S2ScatterStory);
S2Scatter.args = {
  dimension: 'speedNormal',
  metric: 'handlingNormal',
};

export { S2Scatter };
