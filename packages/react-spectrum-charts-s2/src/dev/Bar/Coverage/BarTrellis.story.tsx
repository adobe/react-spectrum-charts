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
import { generateMockDataForTrellis } from '../../../storyShared/components/Bar/data';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Bar/Coverage/Trellis',
  component: Bar,
};

const colors: SpectrumColor[] = ['categorical-100', 'categorical-200', 'categorical-300', 'categorical-400'];

const TrellisStory: StoryFn<typeof Bar> = (args: BarProps): ReactElement => {
  const chartProps = useChartProps({
    data: generateMockDataForTrellis({
      property1: ['All users', 'Roku', 'Chromecast', 'Amazon Fire', 'Apple TV'],
      property2: ['A. Sign up', 'B. Watch a video', 'C. Add to My List'],
      property3: ['1-5 times', '6-10 times', '11-15 times', '16-20 times', '21-25 times', '26+ times'],
      propertyNames: ['segment', 'event', 'bucket'],
      randomizeSteps: false,
      orderBy: 'bucket',
    }),
    colors,
    width: 800,
    height: 800,
  });

  const dialog = (item: Datum): ReactElement => (
    <div>
      <div>{item.event}</div>
      <div>{item.segment}</div>
      <div>
        {item.bucket}: {Number(item.value).toLocaleString()} users
      </div>
    </div>
  );

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

export const TrellisHorizontalHorizontal = bindWithProps<BarProps>(TrellisStory);
TrellisHorizontalHorizontal.args = {
  type: 'stacked',
  trellis: 'event',
  dimension: 'segment',
  color: 'bucket',
  order: 'order',
  orientation: 'horizontal',
  trellisOrientation: 'horizontal',
};

export const TrellisDodged = bindWithProps<BarProps>(TrellisStory);
TrellisDodged.args = {
  type: 'dodged',
  dimension: 'segment',
  onClick: undefined,
  order: 'order',
  color: 'bucket',
  trellis: 'event',
  trellisOrientation: 'horizontal',
  orientation: 'horizontal',
};

export const TrellisHorizontalVertical = bindWithProps<BarProps>(TrellisStory);
TrellisHorizontalVertical.args = { ...TrellisHorizontalHorizontal.args, trellisOrientation: 'vertical' };

export const TrellisVerticalHorizontal = bindWithProps<BarProps>(TrellisStory);
TrellisVerticalHorizontal.args = {
  ...TrellisHorizontalHorizontal.args,
  orientation: 'vertical',
  trellisOrientation: 'horizontal',
};

export const TrellisVerticalVertical = bindWithProps<BarProps>(TrellisStory);
TrellisVerticalVertical.args = {
  ...TrellisHorizontalVertical.args,
  orientation: 'vertical',
  trellisOrientation: 'vertical',
};

export const TrellisWithCustomPadding = bindWithProps<BarProps>(TrellisStory);
TrellisWithCustomPadding.args = { ...TrellisHorizontalVertical.args, orientation: 'vertical', trellisPadding: 0.33 };
