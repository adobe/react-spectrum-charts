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
/* eslint-disable react/prop-types -- story args are typed via StoryFn generics */
import { ComponentProps, ReactElement, useState } from 'react';

import { StoryFn } from '@storybook/react';

import { SpectrumColor } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { Axis, Bar, BarDirectLabel, ChartInspect, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import {
  channelDeviceData,
  channelDeviceVisitorData,
  divergingConversionRateDataWithDirection,
  frequencyOfUseData,
  negativeBarSeriesData,
  newSubscribersData,
} from '../../../storyShared/components/Bar/data.js';
import { BarDirectLabelProps, ChartProps } from '../../../types/index.js';
import { bindStory } from './storyUtils.js';

type DrawInArgs = ComponentProps<typeof Bar> &
  Pick<ChartProps, 'animations' | 'animationTypes'> & {
    data: ChartProps['data'];
    colors?: SpectrumColor[][];
    labelPosition?: NonNullable<BarDirectLabelProps['position']>;
  };

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Draw In Animation',
  component: Bar,
  argTypes: {
    animations: { control: 'boolean' },
    animationTypes: { control: { type: 'check' }, options: ['hover', 'drawIn'] },
    data: { control: false },
    colors: { control: false },
  },
  args: { animations: true, animationTypes: ['hover', 'drawIn'] },
};

const DrawInStory: StoryFn<DrawInArgs> = ({
  animations,
  animationTypes,
  data,
  colors,
  labelPosition,
  ...args
}): ReactElement => {
  const [replay, setReplay] = useState(0);
  const chartProps = useChartProps({ data, colors, width: 640, height: 400 });
  const isHorizontal = args.orientation === 'horizontal';
  return (
    <div>
      <button onClick={() => setReplay((count) => count + 1)}>Replay</button>
      <Chart key={replay} {...chartProps} animations={animations} animationTypes={animationTypes}>
        <Axis position={isHorizontal ? 'left' : 'bottom'} baseline />
        <Axis position={isHorizontal ? 'bottom' : 'left'} grid />
        <Bar {...args}>
          <ChartInspect />
          {labelPosition ? <BarDirectLabel position={labelPosition} /> : null}
        </Bar>
        {args.color ? <Legend highlight /> : null}
      </Chart>
    </div>
  );
};

const stackedArgs = { data: channelDeviceData, dimension: 'channel', metric: 'signups', color: 'device', order: 'order' };

const Stacked = bindStory(DrawInStory);
Stacked.args = { ...stackedArgs };

const Horizontal = bindStory(DrawInStory);
Horizontal.args = { ...stackedArgs, orientation: 'horizontal' };

const Dodged = bindStory(DrawInStory);
Dodged.args = { ...stackedArgs, type: 'dodged' };

const DodgedStacked = bindStory(DrawInStory);
DodgedStacked.args = {
  data: channelDeviceVisitorData,
  colors: [
    ['blue-900', 'blue-500'],
    ['fuchsia-900', 'fuchsia-500'],
  ],
  type: 'dodged',
  dimension: 'channel',
  metric: 'sessions',
  color: ['device', 'visitor'],
};

// Negative stacks grow downward from the baseline.
const NegativeValues = bindStory(DrawInStory);
NegativeValues.args = { data: negativeBarSeriesData, dimension: 'browser', color: 'operatingSystem', order: 'order' };

const Diverging = bindStory(DrawInStory);
Diverging.args = {
  data: divergingConversionRateDataWithDirection,
  dimension: 'channel',
  metric: 'changeRate',
  color: 'changeDirection',
  orientation: 'horizontal',
  diverging: true,
};

const Trellis = bindStory(DrawInStory);
Trellis.args = {
  data: frequencyOfUseData,
  dimension: 'segment',
  color: 'bucket',
  order: 'order',
  trellis: 'event',
  orientation: 'horizontal',
};

// Labels fade in as the bars reach them.
const WithDirectLabels = bindStory(DrawInStory);
WithDirectLabels.args = {
  data: newSubscribersData,
  dimension: 'channel',
  metric: 'subscribers',
  color: 'series',
  labelPosition: 'end-outside',
};
WithDirectLabels.argTypes = {
  labelPosition: { control: 'select', options: ['start', 'middle', 'end', 'end-outside'] },
};

export { Stacked, Horizontal, Dodged, DodgedStacked, NegativeValues, Diverging, Trellis, WithDirectLabels };
