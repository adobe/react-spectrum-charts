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

import { Chart } from '../../../../Chart.js';
import { Axis, Legend } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { Scatter, ScatterSizeLegend } from '../../../../lab/index.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { ScatterSizeLegendProps } from '../../../../types/index.js';
import { characterData } from '../../../data/marioKartData.js';

export default {
  title: 'React Spectrum Charts 2/Lab/Scatter/Features/Scatter Size Legend',
  tags: ['lab'],
  component: ScatterSizeLegend,
};

const ScatterSizeLegendStory: StoryFn<ScatterSizeLegendProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: characterData, height: 450, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter dimension="speedNormal" metric="handlingNormal" color="weightClass" size="weight">
        <ScatterSizeLegend {...args} />
      </Scatter>
      <Legend highlight position="right" title="Weight class" />
    </Chart>
  );
};

const Basic = bindWithProps(ScatterSizeLegendStory);
Basic.args = { title: 'Weight' };
Object.assign(Basic, { parameters: { controls: { include: ['title'] } } });

const Position = bindWithProps(ScatterSizeLegendStory);
Position.args = { title: 'Weight', position: 'bottom' };
Object.assign(Position, { parameters: { controls: { include: ['position'] } } });
Object.assign(Position, {
  argTypes: { position: { control: 'inline-radio', options: ['left', 'right', 'top', 'bottom'] } },
});

const Direction = bindWithProps(ScatterSizeLegendStory);
Direction.args = { title: 'Weight', direction: 'horizontal' };
Object.assign(Direction, { parameters: { controls: { include: ['direction'] } } });
Object.assign(Direction, { argTypes: { direction: { control: 'inline-radio', options: ['horizontal', 'vertical'] } } });

export { Basic, Position, Direction };
