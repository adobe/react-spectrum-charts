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

import { s2Categorical6 } from '@spectrum-charts/core-s2/tokens';
import { Datum, SpectrumColor } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import {
  Axis,
  AxisThumbnail,
  Bar,
  BarDirectLabel,
  ChartInspect,
  ChartPopover,
  Legend,
  Title,
} from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import {
  barDataWithSeries,
  barSeriesData,
  barSubSeriesData,
  divergingConversionRateDataLongLabelsWithDirection,
  mixedAcquisitionData,
  negativeBarSeriesData,
  timeAxisDivergingData,
} from '../../../storyShared/components/Bar/data.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { BarDirectLabelProps, BarProps } from '../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Bar/Coverage/Bar Variants',
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

const AxisLabelHighlightStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataWithSeries, width: 640, height: 420 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartInspect>
          {(datum) => (
            <div>
              {datum.browser}: {datum.downloads}
            </div>
          )}
        </ChartInspect>
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

const HorizontalDirectLabelStory: StoryFn<BarDirectLabelProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: mixedAcquisitionData, width: 640, height: 420 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" baseline title="Acquisition channel" />
      <Axis position="bottom" grid title="Sign-ups" />
      <Bar dimension="channel" metric="signups" color="series" orientation="horizontal">
        <BarDirectLabel {...args} />
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

const thumbnails = ['/chrome.png', '/firefox.png', '/safari.png', '/edge.png', '/explorer.png'];

const divergingConversionRateDataWithThumbnails = divergingConversionRateDataLongLabelsWithDirection.map(
  (datum, index) => ({
    ...datum,
    thumbnail: thumbnails[index % thumbnails.length],
  })
);

const DivergingThumbnailStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const isHorizontal = args.orientation === 'horizontal';
  const chartProps = useChartProps({ data: divergingConversionRateDataWithThumbnails, width: 760, height: 440 });
  return (
    <Chart {...chartProps}>
      <Title text="Campaign conversion change with long labels and thumbnails" fontSize={16} />
      <Axis position={isHorizontal ? 'left' : 'bottom'} baseline title="Channel">
        <AxisThumbnail urlKey="thumbnail" />
      </Axis>
      <Axis position={isHorizontal ? 'bottom' : 'left'} grid labelFormat="percentage" title="Conversion rate change" />
      <Bar {...args} diverging />
      <Legend title="Change direction" />
    </Chart>
  );
};

const NegativeStackStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: negativeBarSeriesData, width: 720, height: 460 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Operating system" />
    </Chart>
  );
};

// Hovering an axis label highlights the matching bar, same as hovering the bar itself.
export const AxisLabelHighlight = bindWithProps(AxisLabelHighlightStory);
AxisLabelHighlight.args = { dimension: 'browser', metric: 'downloads', color: 'series' } as BarProps;

export const DirectLabelHorizontal = bindWithProps(HorizontalDirectLabelStory);
DirectLabelHorizontal.args = { position: 'end-outside' } as BarDirectLabelProps;

export const DivergingWithThumbnails = bindWithProps(DivergingThumbnailStory);
DivergingWithThumbnails.args = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'horizontal',
  color: 'changeDirection',
} as BarProps;

export const NegativeStack = bindWithProps(NegativeStackStory);
NegativeStack.args = { dimension: 'browser', order: 'order', color: 'operatingSystem' } as BarProps;
