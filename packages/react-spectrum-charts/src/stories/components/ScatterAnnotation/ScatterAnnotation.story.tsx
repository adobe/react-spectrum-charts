/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ReactElement, ReactNode } from 'react';

import { StoryFn } from '@storybook/react';

import { Content, Flex } from '@adobe/react-spectrum';
import { Datum } from '@spectrum-charts/vega-spec-builder';

import { Chart } from '../../../Chart';
import { Axis, ChartTooltip, Legend, Scatter, ScatterAnnotation, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { characterData } from '../../../stories/data/marioKartData';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'RSC/Scatter/ScatterAnnotation',
  component: ScatterAnnotation,
};

const defaultChartProps: ChartProps = { data: characterData, height: 500, width: 600 };

const ScatterAnnotationStory: StoryFn<typeof ScatterAnnotation> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);

  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter dimension="speedNormal" metric="handlingNormal" color="weightClass">
        <ScatterAnnotation {...args} />
      </Scatter>
      <Legend highlight position="right" title="Weight class" />
      <Title text="Mario Kart 8 Character Data" />
    </Chart>
  );
};

const ScatterAnnotationWithTooltipStory: StoryFn<typeof ScatterAnnotation> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);

  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid ticks baseline title="Speed (normal)" />
      <Axis position="left" grid ticks baseline title="Handling (normal)" />
      <Scatter dimension="speedNormal" metric="handlingNormal" color="weightClass">
        <ScatterAnnotation {...args} />
        <ChartTooltip>{dialog}</ChartTooltip>
      </Scatter>
      <Legend highlight position="right" title="Weight class" />
      <Title text="Mario Kart 8 Character Data" />
    </Chart>
  );
};

const dialog = (item: Datum): ReactNode => {
  return (
    <Content>
      <Flex direction="column">
        <div style={{ fontWeight: 'bold' }}>{(item.character as string[]).join(', ')}</div>
        <div>Speed (normal): {item.speedNormal}</div>
        <div>Handling (normal): {item.handlingNormal}</div>
      </Flex>
    </Content>
  );
};

// TODO: add component props and additional stories here
const Basic = bindWithProps(ScatterAnnotationStory);
Basic.args = {
  textKey: 'firstCharacter',
};

const WithTooltip = bindWithProps(ScatterAnnotationWithTooltipStory);
WithTooltip.args = {
  textKey: 'firstCharacter',
};

export { Basic, WithTooltip };
