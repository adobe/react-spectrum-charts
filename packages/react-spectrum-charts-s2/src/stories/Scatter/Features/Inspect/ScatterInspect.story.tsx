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

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../Chart';
import { Axis, ChartInspect, ChartPopover, Legend, Title } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { Scatter } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps, ScatterProps } from '../../../../types';
import { characterData } from '../../../data/marioKartData';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Scatter/Features/Inspect',
  component: Scatter,
};

const defaultChartProps: ChartProps = { data: characterData, height: 500, width: 500 };
const defaultArgs: Partial<ScatterProps> = { dimension: 'speedNormal', metric: 'handlingNormal', color: 'weightClass' };

const ScatterStory: StoryFn<ScatterProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter {...args} />
      <Legend highlight position="right" title="Weight class" />
      <Title text="Mario Kart 8 Character Data" />
    </Chart>
  );
};

const dialogContent = (datum: Datum) => (
  <div>
    <div>{(datum.character as string[]).join(', ')}</div>
    <div>Speed (normal): {datum.speedNormal}</div>
    <div>Handling (normal): {datum.handlingNormal}</div>
  </div>
);

const Inspect = bindWithProps(ScatterStory);
Inspect.args = {
  ...defaultArgs,
  children: <ChartInspect>{dialogContent}</ChartInspect>,
};

const Popover = bindWithProps(ScatterStory);
Popover.args = {
  ...defaultArgs,
  children: (
    <ChartPopover width="auto" key={0}>
      {dialogContent}
    </ChartPopover>
  ),
};

export { Inspect, Popover };
