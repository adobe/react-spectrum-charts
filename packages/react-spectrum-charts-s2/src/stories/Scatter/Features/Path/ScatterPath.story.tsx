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

import { Chart } from '../../../../Chart';
import { Axis, Legend, Title } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { Scatter, ScatterPath } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';
import { characterData } from '../../../data/marioKartData';

export default {
  title: 'React Spectrum Charts 2/Scatter/Features/Path',
  component: ScatterPath,
};

const defaultChartProps: ChartProps = { data: characterData, height: 500, width: 500 };

const ScatterPathStory: StoryFn<typeof ScatterPath> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter dimension="speedNormal" metric="handlingNormal" color="weightClass">
        <ScatterPath {...args} />
      </Scatter>
      <Legend highlight position="right" title="Weight class" />
      <Title text="Mario Kart 8 Character Data" />
    </Chart>
  );
};

const Basic = bindWithProps(ScatterPathStory);
Basic.args = { groupBy: ['weightClass'] };

const Color = bindWithProps(ScatterPathStory);
Color.args = { groupBy: ['weightClass'], color: 'gray-900' };

export { Basic, Color };
