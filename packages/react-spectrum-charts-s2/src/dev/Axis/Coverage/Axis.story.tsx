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
import React, { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';
import { action } from 'storybook/actions';

import { DEFAULT_GRANULARITY } from '@spectrum-charts/core-s2/constants';

import useChartProps from '../../../hooks/useChartProps.js';
import { Axis, Bar, Chart, ChartInspect, Legend, Line } from '../../../index.js';
import { barData, barDataLongLabels } from '../../../storyShared/components/Bar/data.js';
import { stockPriceData, workspaceTrendsData } from '../../../storyShared/data/data.js';
import { bindWithProps } from '../../../test-utils/index.js';
import timeData from './timeData.json' with { type: 'json' };

export default {
  title: 'React Spectrum Charts 2/Axis/Coverage/Axis',
  component: Axis,
  argTypes: {
    lineType: {
      control: 'select',
      options: ['solid', 'dashed', 'dotted', 'dotDash', 'shortDash', 'longDash', 'twoDash'],
    },
    lineWidth: {
      control: 'inline-radio',
      options: ['XS', 'S', 'M', 'L', 'XL'],
    },
    numberFormat: {
      control: 'select',
      options: ['currency', 'shortCurrency', 'shortNumber', 'standardNumber', '$,.2f', ',.2%', '.3s'],
    },
  },
};

const data = [
  { x: 0, y: 0, series: 'Desktop conversion' },
  { x: 1, y: 1, series: 'Desktop conversion' },
];

const conversionTrendData = [
  { week: 1, conversionRate: 0.38, channel: 'Paid search' },
  { week: 2, conversionRate: 0.44, channel: 'Paid search' },
  { week: 3, conversionRate: 0.47, channel: 'Paid search' },
  { week: 4, conversionRate: 0.52, channel: 'Paid search' },
  { week: 1, conversionRate: 0.28, channel: 'Email' },
  { week: 2, conversionRate: 0.33, channel: 'Email' },
  { week: 3, conversionRate: 0.37, channel: 'Email' },
  { week: 4, conversionRate: 0.41, channel: 'Email' },
];

const revenueTrendData = [
  { week: 1, revenue: 420000, channel: 'Paid search' },
  { week: 2, revenue: 760000, channel: 'Paid search' },
  { week: 3, revenue: 1180000, channel: 'Paid search' },
  { week: 4, revenue: 1640000, channel: 'Paid search' },
  { week: 1, revenue: 260000, channel: 'Email' },
  { week: 2, revenue: 520000, channel: 'Email' },
  { week: 3, revenue: 910000, channel: 'Email' },
  { week: 4, revenue: 1320000, channel: 'Email' },
];

const durationTrendData = [
  { datetime: 1780293600000, seconds: 0, workflow: 'Checkout' },
  { datetime: 1780380000000, seconds: 2200, workflow: 'Checkout' },
  { datetime: 1780466400000, seconds: 5000, workflow: 'Checkout' },
  { datetime: 1780552800000, seconds: 7800, workflow: 'Checkout' },
  { datetime: 1780639200000, seconds: 10000, workflow: 'Checkout' },
  { datetime: 1780293600000, seconds: 0, workflow: 'Documentation' },
  { datetime: 1780380000000, seconds: 1800, workflow: 'Documentation' },
  { datetime: 1780466400000, seconds: 4100, workflow: 'Documentation' },
  { datetime: 1780552800000, seconds: 6200, workflow: 'Documentation' },
  { datetime: 1780639200000, seconds: 8400, workflow: 'Documentation' },
];

const rangeDemoData = [
  { point: 0, users: 2200, cohort: 'Trial accounts' },
  { point: 5, users: 3100, cohort: 'Trial accounts' },
  { point: 10, users: 4300, cohort: 'Trial accounts' },
  { point: 15, users: 5200, cohort: 'Trial accounts' },
  { point: 20, users: 6100, cohort: 'Trial accounts' },
  { point: 25, users: 7200, cohort: 'Trial accounts' },
  { point: 0, users: 1800, cohort: 'Paid accounts' },
  { point: 5, users: 2600, cohort: 'Paid accounts' },
  { point: 10, users: 3400, cohort: 'Paid accounts' },
  { point: 15, users: 4600, cohort: 'Paid accounts' },
  { point: 20, users: 5800, cohort: 'Paid accounts' },
  { point: 25, users: 6900, cohort: 'Paid accounts' },
];

const AxisStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
    </Chart>
  );
};

const AxisDemoStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: conversionTrendData, width: 700 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="bottom" baseline title="Week" />
      <Line color="channel" dimension="week" metric="conversionRate" scaleType="linear" />
      <Legend />
    </Chart>
  );
};

const RevenueAxisDemoStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: revenueTrendData, width: 700 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="bottom" baseline title="Week" />
      <Line color="channel" dimension="week" metric="revenue" scaleType="linear" />
      <Legend />
    </Chart>
  );
};

const TimeAxisStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: timeData[args.granularity ?? DEFAULT_GRANULARITY], width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="left" grid title="Downloads" />
      <Line color="series" />
      <Legend />
    </Chart>
  );
};

const VerticalTimeAxisStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: timeData[args.granularity ?? DEFAULT_GRANULARITY],
    width: 600,
  });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="bottom" grid title="Downloads" />
      <Bar orientation="horizontal" dimension="datetime" color="series" />
      <Legend />
    </Chart>
  );
};

const TimeAxisBarStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: timeData[args.granularity ?? DEFAULT_GRANULARITY],
    width: 600,
  });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="left" grid title="Downloads" />
      <Bar orientation="vertical" dimension="datetime" color="series" />
      <Legend />
    </Chart>
  );
};

const SubLabelStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Bar dimension="browser" metric="downloads" />
    </Chart>
  );
};

const TruncatedLabelStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataLongLabels, width: 450 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="left" grid title="Downloads" />
      <Bar dimension="browser" metric="downloads" color="browser" />
      <Legend />
    </Chart>
  );
};

const LinearAxisStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: workspaceTrendsData, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis {...args} />
      <Line color="series" dimension="point" scaleType="linear" />
      <Legend />
    </Chart>
  );
};

const LinearYAxisStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: workspaceTrendsData, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" grid baseline ticks tickMinStep={5} baselineOffset={args?.range?.[0]} title="Users" />
      <Axis {...args} />
      <Line color="series" dimension="point" scaleType="linear" />
      <Legend />
    </Chart>
  );
};

const DurationStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: durationTrendData, width: 700 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="bottom" labelFormat="time" title="Day" />
      <Line color="workflow" dimension="datetime" metric="seconds" scaleType="time" />
      <Legend />
    </Chart>
  );
};

const RangeDemoStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: rangeDemoData, width: 700 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis {...args} />
      <Line color="cohort" dimension="point" metric="users" scaleType="linear" />
      <Legend />
    </Chart>
  );
};

const NonLinearAxisStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: workspaceTrendsData, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" ticks baseline labelFormat="time" />
      <Axis {...args} />
      <Line color="series" lineType="period" scaleType="time" />
      <Legend />
    </Chart>
  );
};

const SparkLineStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: stockPriceData, width: 200, height: 100 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Line dimension="timestamp" metric="price" scaleType="point" padding={0}>
        <ChartInspect>
          {(item) => (
            <>
              <div>{item.stock}</div>
              <div style={{ fontWeight: 'bold', fontSize: 24 }}>${(item.price as number).toFixed(2)}</div>
              <div>{item.date}</div>
            </>
          )}
        </ChartInspect>
      </Line>
      <Legend color="stock" />
    </Chart>
  );
};

const Basic = bindWithProps(AxisStory);
Basic.args = {
  position: 'left',
  baseline: true,
  grid: true,
  labelFormat: 'percentage',
  ticks: true,
  title: 'Conversion Rate',
};
Object.assign(Basic, {
  parameters: { controls: { include: ['position', 'baseline', 'grid', 'labelFormat', 'ticks', 'title'] } },
});

const ScaleBasics = bindWithProps(AxisDemoStory);
ScaleBasics.args = { ...Basic.args };
ScaleBasics.storyName = 'Scale basics';
Object.assign(ScaleBasics, {
  parameters: { controls: { include: ['position', 'baseline', 'grid', 'labelFormat', 'ticks', 'title'] } },
});

const MultilineTitle = bindWithProps(AxisStory);
MultilineTitle.args = {
  position: 'left',
  baseline: true,
  grid: true,
  labelFormat: 'percentage',
  ticks: true,
  title: ['Conversion Rate', '(converted users / total active users)'],
};

const DurationLabelFormat = bindWithProps(DurationStory);
DurationLabelFormat.args = {
  position: 'left',
  grid: true,
  labelFormat: 'duration',
  title: 'Time spent',
};
Object.assign(DurationLabelFormat, {
  parameters: { controls: { include: ['labelFormat', 'title', 'position', 'grid'] } },
});

const Time = bindWithProps(TimeAxisStory);
Time.args = {
  granularity: 'day',
  position: 'bottom',
  baseline: true,
  labelFormat: 'time',
  ticks: true,
  labelAlign: 'center',
};
Object.assign(Time, {
  parameters: { controls: { include: ['granularity', 'position', 'labelFormat', 'ticks', 'labelAlign'] } },
});

const SecondGranularity = bindWithProps(TimeAxisBarStory);
SecondGranularity.args = {
  granularity: 'second',
  position: 'bottom',
  baseline: true,
  labelFormat: 'time',
  ticks: true,
  labelAlign: 'center',
};

const SecondGranularityLine = bindWithProps(TimeAxisStory);
SecondGranularityLine.args = {
  granularity: 'second',
  position: 'bottom',
  baseline: true,
  labelFormat: 'time',
  ticks: true,
  labelAlign: 'center',
};

const SubLabels = bindWithProps(SubLabelStory);
SubLabels.args = {
  position: 'bottom',
  baseline: true,
  title: 'Browser',
  subLabels: [
    { value: 'Chrome', subLabel: '80.1+' },
    { value: 'Firefox', subLabel: '70.0+' },
    { value: 'Safari', subLabel: '10.13 (High Sierra)+' },
  ],
  labelAlign: 'start',
};

const TruncateLabels = bindWithProps(TruncatedLabelStory);
TruncateLabels.args = {
  truncateLabels: true,
  position: 'bottom',
  baseline: true,
  title: 'Browser',
};

const OnClick = bindWithProps(SubLabelStory);
OnClick.args = {
  position: 'bottom',
  baseline: true,
  title: 'Browser',
  onClick: action('onClick'),
};
Object.assign(OnClick, { parameters: { controls: { include: ['onClick', 'position', 'title'] } } });

const TickMinStep = bindWithProps(LinearAxisStory);
TickMinStep.args = {
  position: 'bottom',
  baseline: true,
  labelFormat: 'linear',
  ticks: true,
  tickMinStep: 4,
};

const NonLinearAxis = bindWithProps(NonLinearAxisStory);
NonLinearAxis.args = {
  position: 'left',
  tickMinStep: 5,
  title: 'Events',
  grid: true,
};

const NumberFormat = bindWithProps(AxisStory);
NumberFormat.args = {
  numberFormat: 'shortCurrency',
  position: 'left',
  baseline: true,
  grid: true,
  labelFormat: 'linear',
  ticks: true,
  title: 'Price',
  range: [0, 2000000],
};
Object.assign(NumberFormat, {
  parameters: { controls: { include: ['numberFormat', 'currencyCode', 'currencyLocale', 'range'] } },
});

const NumberFormatting = bindWithProps(RevenueAxisDemoStory);
NumberFormatting.args = { ...NumberFormat.args, title: 'Revenue' };
Object.assign(NumberFormatting, {
  parameters: { controls: { include: ['numberFormat', 'currencyCode', 'currencyLocale', 'range'] } },
});

const CustomXRange = bindWithProps(RangeDemoStory);
CustomXRange.args = {
  position: 'bottom',
  baseline: true,
  labelFormat: 'linear',
  ticks: true,
  tickMinStep: 5,
  range: [-5, 30],
};
CustomXRange.storyName = 'Ranges and tick spacing';
Object.assign(CustomXRange, {
  parameters: { controls: { include: ['range', 'tickMinStep', 'ticks', 'labelFormat'] } },
});

const CustomYRange = bindWithProps(LinearYAxisStory);
CustomYRange.args = {
  position: 'left',
  baseline: true,
  grid: true,
  labelFormat: 'linear',
  ticks: true,
  tickMinStep: 5,
  range: [0, 9000],
};

const ControlledLabels = bindWithProps(SparkLineStory);
ControlledLabels.args = {
  position: 'bottom',
  labels: [
    { value: 1685577600000, label: 'Jun 1', align: 'start' },
    { value: 1687996800000, label: 'Jun 29', align: 'end' },
  ],
};

const VerticalTimeAxis = bindWithProps(VerticalTimeAxisStory);
VerticalTimeAxis.args = {
  granularity: 'day',
  position: 'left',
  baseline: true,
  labelFormat: 'time',
  ticks: true,
  labelAlign: 'center',
};

const YearGranularity = bindWithProps(TimeAxisBarStory);
YearGranularity.args = {
  granularity: 'year',
  position: 'bottom',
  baseline: true,
  labelFormat: 'time',
  ticks: true,
  labelAlign: 'center',
};

const CurrencyLocale = bindWithProps(AxisStory);
CurrencyLocale.args = {
  position: 'left',
  baseline: true,
  grid: true,
  currencyCode: 'EUR',
  currencyLocale: 'en-US',
  numberFormat: 'currency',
  ticks: true,
  title: 'Conversion Rate',
};

const CurrencyFormatSpecifier = bindWithProps(AxisStory);
CurrencyFormatSpecifier.args = {
  position: 'left',
  baseline: true,
  grid: true,
  currencyCode: 'EUR',
  currencyLocale: 'en-US',
  numberFormat: ',.6f',
  ticks: true,
  title: 'Conversion Rate',
};

const TickCountMinimum = bindWithProps(LinearYAxisStory);
TickCountMinimum.args = {
  position: 'left',
  baseline: true,
  grid: true,
  labelFormat: 'linear',
  ticks: true,
  tickCountMinimum: 3,
};

const TickCountLimit = bindWithProps(TimeAxisBarStory);
TickCountLimit.args = {
  position: 'right',
  tickCountLimit: 5,
  ticks: true,
  title: 'Y-Axis with Limited Ticks',
};

const VerticalSecondGranularity = bindWithProps(VerticalTimeAxisStory);
VerticalSecondGranularity.args = {
  granularity: 'second',
  position: 'left',
  baseline: true,
  labelFormat: 'time',
  ticks: true,
  labelAlign: 'center',
};

export {
  ScaleBasics,
  NumberFormatting,
  Basic,
  ControlledLabels,
  CustomXRange,
  CustomYRange,
  DurationLabelFormat,
  MultilineTitle,
  NonLinearAxis,
  NumberFormat,
  OnClick,
  SecondGranularity,
  SecondGranularityLine,
  SubLabels,
  TickMinStep,
  Time,
  VerticalSecondGranularity,
  VerticalTimeAxis,
  YearGranularity,
  TruncateLabels,
  CurrencyLocale,
  CurrencyFormatSpecifier,
  TickCountLimit,
  TickCountMinimum,
};
