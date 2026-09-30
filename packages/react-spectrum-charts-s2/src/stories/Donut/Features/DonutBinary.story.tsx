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
import { Donut, DonutSummary } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, DonutProps } from '../../../types';

type BinaryMode = 'completion' | 'at-risk' | 'satisfaction';
type BinaryStoryProps = DonutProps & { mode?: BinaryMode };

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Features',
  component: Donut,
  parameters: {
    controls: {
      include: ['isBoolean', 'mode'],
    },
  },
  argTypes: {
    mode: { control: 'select', options: ['completion', 'at-risk', 'satisfaction'] },
  },
};

const modeConfig: Record<BinaryMode, { data: ChartProps['data']; colors: string[]; label: string }> = {
  completion: {
    data: [
      { id: 'Complete', value: 0.68 },
      { id: 'Remaining', value: 0.32 },
    ],
    colors: ['green-800'],
    label: 'Completion',
  },
  'at-risk': {
    data: [
      { id: 'At risk', value: 0.32 },
      { id: 'On track', value: 0.68 },
    ],
    colors: ['red-800'],
    label: 'At risk',
  },
  satisfaction: {
    data: [
      { id: 'Satisfied', value: 0.883 },
      { id: 'Unsatisfied', value: 0.117 },
    ],
    colors: ['categorical-600'],
    label: 'Satisfied',
  },
};

const BinaryStory: StoryFn<BinaryStoryProps> = (args): ReactElement => {
  const { mode = 'completion', ...donutProps } = args;
  const config = modeConfig[mode];
  const chartProps = useChartProps({ data: config.data, width: 390, height: 300, colors: config.colors });
  return (
    <Chart {...chartProps}>
      <Donut {...donutProps}>
        <DonutSummary label={config.label} />
      </Donut>
      <Legend title="Status" position="right" />
    </Chart>
  );
};

const BinaryBoolean = bindWithProps(BinaryStory);
BinaryBoolean.args = { metric: 'value', color: 'id', isBoolean: true, mode: 'completion' };

export { BinaryBoolean };
