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

import { Datum, SpectrumColor } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, ChartPopover, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { generateMockDataForTrellis } from './data';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Trellis',
  component: Bar,
  parameters: {
    controls: {
      include: ['orientation', 'trellisOrientation', 'trellisPadding', 'type'],
    },
  },
};

const colors: SpectrumColor[] = [
  'categorical-100',
  'categorical-200',
  'categorical-300',
  'categorical-400',
  'categorical-500',
  'categorical-600',
  'categorical-700',
];

const BarStory: StoryFn<typeof Bar> = (args: BarProps): ReactElement => {
  const chartProps = useChartProps({
    data: generateMockDataForTrellis({
      property1: ['All users', 'Roku', 'Chromecast', 'Apple TV'],
      property2: ['Sign up', 'Watch video', 'Add to list'],
      property3: ['1-5 times', '6-10 times', '11-15 times', '16+ times'],
      propertyNames: ['segment', 'event', 'bucket'],
      randomizeSteps: false,
      orderBy: 'bucket',
    }),
    colors,
    width: 780,
    height: 620,
  });

  const dialog = (item: Datum) => {
    return (
      <div>
        <div>{item.event}</div>
        <div>{item.segment}</div>
        <div>
          {item.bucket}: {Number(item.value).toLocaleString()} users
        </div>
      </div>
    );
  };

  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} title="Users, Count" grid />
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} title="Platform" baseline />
      <Bar {...args}>
        <ChartInspect>{dialog}</ChartInspect>
        <ChartPopover>{dialog}</ChartPopover>
      </Bar>
      <Legend title="Usage frequency" />
    </Chart>
  );
};

const Basic = bindWithProps<BarProps>(BarStory);
Basic.args = {
  type: 'stacked',
  trellis: 'event',
  dimension: 'segment',
  onClick: undefined,
  color: 'bucket',
  order: 'order',
  orientation: 'horizontal',
  trellisOrientation: 'horizontal',
};

export { Basic };
