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
import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
// Gauge chart component from alpha export
import { Gauge } from '../../../alpha';
import { Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { GaugeProps, ChartProps } from '../../../types';
import { basicGaugeData, basicThresholdsData, coloredThresholdsData } from './data';

export default {
  title: 'RSC/Gauge (alpha)',
  component: Gauge,
};

// Default chart properties
const defaultChartProps: ChartProps = {
  data: basicGaugeData,
  width: 350,
  height: 350,
};

// Basic Gauge chart story
const GaugeStory: StoryFn<GaugeProps & { width?: number; height?: number }> = (args): ReactElement => {
  const { width, height, ...gaugeProps } = args;
  const chartProps = useChartProps({ ...defaultChartProps, width: width ?? 500, height: height ?? 500 });
  return (
    <Chart {...chartProps} debug>
      <Gauge {...gaugeProps} />
    </Chart>
  );
};

// Gauge with Title
const GaugeTitleStory: StoryFn<typeof Gauge> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, width: 400 });
  return (
    <Chart {...chartProps}>
      <Title text={'Title Gauge'} position={'start'} orient={'top'} />
      <Gauge {...args} />
    </Chart>
  );
};

// Basic Gauge chart story. All the ones below it are variations of the Gauge chart. 
const Basic = bindWithProps(GaugeStory);
Basic.args = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  color: 'blue-900',
  direction: 'column',
  numberFormat: '$,.2f',
  showTarget: true,
  showTargetValue: false,
  labelPosition: 'top',
  scaleType: 'normal',
  maxScaleValue: 100,
  track: false,
  thresholdBarColor: false,
  metricAxis: false,
};

const GaugeVariation2 = bindWithProps(GaugeStory);
GaugeVariation2.args = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  color: 'red-900',
  direction: 'column',
  numberFormat: '$,.2f',
  showTarget: true,
  showTargetValue: false,
  labelPosition: 'top',
  scaleType: 'normal',
  maxScaleValue: 100,
  thresholds: basicThresholdsData,
  thresholdBarColor: false,
  track: false,
  metricAxis: false,
};

const GaugeVariation3 = bindWithProps(GaugeStory);
GaugeVariation3.args = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  color: 'fuchsia-900',
  direction: 'column',
  numberFormat: '$,.2f',
  showTarget: true,
  showTargetValue: false,
  labelPosition: 'top',
  scaleType: 'normal',
  maxScaleValue: 100,
  track: false,
  thresholdBarColor: true,
  thresholds: coloredThresholdsData,
  metricAxis: false,
};

// const Track = bindWithProps(GaugeStory);
// Track.args = {
//   metric: 'currentAmount',
//   dimension: 'graphLabel',
//   target: 'target',
//   color: 'blue-900',
//   direction: 'column',
//   numberFormat: '$,.2f',
//   showTarget: true,
//   showTargetValue: false,
//   labelPosition: 'top',
//   scaleType: 'normal',
//   maxScaleValue: 100,
//   track: true,
//   metricAxis: false,
// };

// const RowMode = bindWithProps(GaugeStory);
// RowMode.args = {
//   metric: 'currentAmount',
//   dimension: 'graphLabel',
//   target: 'target',
//   color: 'blue-900',
//   direction: 'row',
//   numberFormat: '$,.2f',
//   showTarget: true,
//   showTargetValue: false,
//   labelPosition: 'top',
//   scaleType: 'normal',
//   maxScaleValue: 100,
//   thresholds: coloredThresholdsData,
//   thresholdBarColor: true,
//   track: false,
//   metricAxis: false,
// };

// const WithTitle = bindWithProps(GaugeTitleStory);
// WithTitle.args = {
//   metric: 'currentAmount',
//   dimension: 'graphLabel',
//   target: 'target',
//   color: 'blue-900',
//   numberFormat: '$,.2f',
//   labelPosition: 'top',
//   scaleType: 'normal',
//   maxScaleValue: 100,
//   track: false,
//   direction: 'column',
//   metricAxis: false,
// };

// const FixedScale = bindWithProps(GaugeStory);
// FixedScale.args = {
//   metric: 'currentAmount',
//   dimension: 'graphLabel',
//   target: 'target',
//   color: 'blue-900',
//   direction: 'column',
//   numberFormat: '$,.2f',
//   showTarget: true,
//   showTargetValue: false,
//   labelPosition: 'top',
//   scaleType: 'fixed',
//   maxScaleValue: 250,
//   thresholds: basicThresholdsData,
//   track: false,
//   metricAxis: false,
// };

// const MetricAxis = bindWithProps(GaugeStory);
// MetricAxis.args = {
//   metric: 'currentAmount',
//   dimension: 'graphLabel',
//   target: 'target',
//   color: 'blue-900',
//   direction: 'column',
//   numberFormat: '$,.2f',
//   showTarget: true,
//   showTargetValue: false,
//   labelPosition: 'top',
//   scaleType: 'normal',
//   maxScaleValue: 250,
//   track: false,
//   metricAxis: true,
// };

export { Basic, GaugeVariation2, GaugeVariation3 };
// export { Basic, GaugeVariation2, GaugeVariation3, Track, RowMode, WithTitle, FixedScale, MetricAxis };
