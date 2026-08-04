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
import { Axis, Bar, BarDirectLabel, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import {
  divergingConversionRateData,
  divergingConversionRateDataLongLabels,
  timeAxisDivergingData,
} from './data';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Diverging',
  component: Bar,
};

/** Canonical single-series horizontal diverging; value labels use adaptive `position="start"` — inside near the axis, spilling outside when they don't fit. */
const HorizontalStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingConversionRateData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Single-series horizontal — axis at zero, labels flip opposite each bar" fontSize={16} />
      <Axis position="left" baseline />
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} diverging>
        <BarDirectLabel position="start" format="percentage" />
      </Bar>
    </Chart>
  );
};

const defaultProps: BarProps = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'horizontal',
  colorOverride: 'barColor',
};

const Horizontal = bindWithProps(HorizontalStory);
Horizontal.args = {
  ...defaultProps,
};

/** Single-series diverging, vertical — dimension on the bottom axis (baseline/dy flip). Value labels forced outside via `position="end-outside"`. */
const VerticalStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingConversionRateData, width: 500, height: 500 });
  return (
    <Chart {...chartProps}>
      <Title text="Single-series vertical — axis at zero, labels flip opposite each bar" fontSize={16} />
      <Axis position="bottom" baseline />
      <Axis position="left" grid labelFormat="percentage" />
      <Bar {...args} diverging>
        <BarDirectLabel position="end-outside" format="percentage" />
      </Bar>
    </Chart>
  );
};

const Vertical = bindWithProps(VerticalStory);
Vertical.args = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'vertical',
  colorOverride: 'barColor',
} satisfies BarProps;

/** `labelFormat="time"` makes a primary+secondary axis pair; diverging flips both rows together via `extraOutwardOffset`. */
const TimeAxisStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: timeAxisDivergingData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Time axis (labelFormat=time) — primary/secondary rows both move and flip" fontSize={16} />
      <Axis position="bottom" baseline labelFormat="time" granularity="month" />
      <Axis position="left" grid labelFormat="percentage" />
      <Bar {...args} diverging />
    </Chart>
  );
};

const TimeAxis = bindWithProps(TimeAxisStory);
TimeAxis.args = {
  dimension: 'day',
  metric: 'changeRate',
  orientation: 'vertical',
  dimensionDataType: 'time',
} satisfies BarProps;

/** Same as `Horizontal` with long names — checks the interior (data-dependent) axis position doesn't clip long labels. */
const LongLabelsStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingConversionRateDataLongLabels, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Long labels: same data as Horizontal, longer category names" fontSize={16} />
      <Axis position="left" baseline />
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} diverging />
    </Chart>
  );
};

const LongLabels = bindWithProps(LongLabelsStory);
LongLabels.args = {
  ...defaultProps,
};

export {
  Horizontal,
  Vertical,
  TimeAxis,
  LongLabels,
};
