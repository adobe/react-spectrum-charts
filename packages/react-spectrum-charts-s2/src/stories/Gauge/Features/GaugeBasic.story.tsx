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
import useChartProps from '../../../hooks/useChartProps';
import { Gauge } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, GaugeProps } from '../../../types';
import { basicGaugeData, seriesGaugeData } from '../../data/gaugeData';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Gauge/Features',
  component: Gauge,
};

const defaultChartProps: ChartProps = { data: basicGaugeData, width: 250, height: 250 };
const defaultArgs: Partial<GaugeProps> = { label: 'Revenue' };

const GaugeStory: StoryFn<GaugeProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Gauge {...args} />
    </Chart>
  );
};

const Needle = bindWithProps(GaugeStory);
Needle.args = { ...defaultArgs };

const Fill = bindWithProps(GaugeStory);
Fill.args = { ...defaultArgs, showNeedle: false };

// method: 'avg' aggregates all rows in seriesGaugeData instead of using only the last one
const GaugeSeriesStory: StoryFn<GaugeProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: seriesGaugeData });
  return (
    <Chart {...chartProps}>
      <Gauge {...args} />
    </Chart>
  );
};

const Aggregation = bindWithProps(GaugeSeriesStory);
Aggregation.args = { ...defaultArgs, method: 'avg' };

// there is no size prop - typography/needle proportions scale dynamically from however big the
// chart actually renders, so a smaller/larger container is all that's needed to demonstrate it
const GaugeSmallStory: StoryFn<GaugeProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, width: 110, height: 110 });
  return (
    <Chart {...chartProps}>
      <Gauge {...args} />
    </Chart>
  );
};

const GaugeLargeStory: StoryFn<GaugeProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, width: 350, height: 350 });
  return (
    <Chart {...chartProps}>
      <Gauge {...args} />
    </Chart>
  );
};

const SmallContainer = bindWithProps(GaugeSmallStory);
SmallContainer.args = { ...defaultArgs };

const LargeContainer = bindWithProps(GaugeLargeStory);
LargeContainer.args = { ...defaultArgs };

export { Aggregation, Fill, LargeContainer, Needle, SmallContainer };
