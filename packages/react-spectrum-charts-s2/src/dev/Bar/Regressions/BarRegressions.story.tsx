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

import { s2Categorical6 } from '@spectrum-charts/themes';
import { Datum, SpectrumColor } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, ChartPopover, Legend, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import {
  barSeriesData,
  barSubSeriesData,
  timeAxisDivergingData,
} from '../../../stories/components/Bar/data';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Bar/Regressions/Bar',
  component: Bar,
};

const colors: SpectrumColor[] = ['categorical-100', 'categorical-200', 'categorical-300', 'categorical-400'];

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

const DodgedBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const { color } = args;
  const storyColors = Array.isArray(color)
    ? [
        ['categorical-700', 'categorical-1000'],
        ['categorical-400', 'categorical-500'],
        ['categorical-300', 'categorical-1100'],
      ]
    : s2Categorical6;
  const data = Array.isArray(color) ? barSubSeriesData : barSeriesData;
  const chartProps = useChartProps({ data, width: 800, height: 600, colors: storyColors });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

const dodgedDialogContent = (datum: Datum): ReactElement => (
  <div>
    <div>Operating system: {datum.operatingSystem}</div>
    <div>Browser: {datum.browser}</div>
    <div>Users: {datum.value}</div>
  </div>
);

const DodgedBarPopoverStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, width: 800, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartInspect>{dodgedDialogContent}</ChartInspect>
        <ChartPopover width={200}>{dodgedDialogContent}</ChartPopover>
      </Bar>
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

const StackedBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, colors, width: 800, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Operating system" />
    </Chart>
  );
};

const stackedDialogContent = (datum: Datum): ReactElement => (
  <div>
    <div>Operating system: {datum.operatingSystem}</div>
    <div>Browser: {datum.browser}</div>
    <div>Downloads: {datum.value}</div>
  </div>
);

const StackedBarPopoverStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, colors, width: 800, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartInspect>{stackedDialogContent}</ChartInspect>
        <ChartPopover width={200}>{stackedDialogContent}</ChartPopover>
      </Bar>
      <Legend title="Operating system" />
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

const dodgedDefaultProps: BarProps = {
  type: 'dodged',
  dimension: 'browser',
  onClick: undefined,
};

const DodgedPopover = bindWithProps(DodgedBarPopoverStory);
DodgedPopover.args = {
  ...dodgedDefaultProps,
  order: 'order',
  color: 'operatingSystem',
};

const DodgedStackedWithLabels = bindWithProps(DodgedBarStory);
DodgedStackedWithLabels.args = {
  ...dodgedDefaultProps,
  color: ['operatingSystem', 'version'],
  paddingRatio: 0.1,
};

const DodgedAxisLabelHighlight = bindWithProps(DodgedBarPopoverStory);
DodgedAxisLabelHighlight.args = {
  ...dodgedDefaultProps,
  color: 'operatingSystem',
};

const stackedDefaultProps: BarProps = {
  dimension: 'browser',
  order: 'order',
  color: 'operatingSystem',
  onClick: undefined,
};

const StackedPopover = bindWithProps(StackedBarPopoverStory);
StackedPopover.args = {
  ...stackedDefaultProps,
};

const StackedWithBarLabels = bindWithProps(StackedBarStory);
StackedWithBarLabels.args = {
  ...stackedDefaultProps,
};

const StackedAxisLabelHighlight = bindWithProps(StackedBarPopoverStory);
StackedAxisLabelHighlight.args = {
  ...stackedDefaultProps,
};

export {
  TimeAxis,
  DodgedStackedWithLabels,
  DodgedAxisLabelHighlight,
  DodgedPopover,
  StackedWithBarLabels,
  StackedAxisLabelHighlight,
  StackedPopover,
};
