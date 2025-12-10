/*
 * Copyright 2023 Adobe. All rights reserved.
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

import { DEFAULT_GRANULARITY } from '@spectrum-charts/constants';

import useChartProps from '../../../hooks/useChartProps';
import { Axis, Bar, Chart, ChartTooltip, Line } from '../../../index';
import { bindWithProps } from '../../../test-utils';
import { stockPriceData, workspaceTrendsData } from '../../data/data';
import { barData, barDataLongLabels } from '../Bar/data';
import timeData from './timeData.json';

export default {
  title: 'RSC/Axis',
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
  { x: 0, y: 0, series: 0 },
  { x: 1, y: 1, series: 0 },
];

const AxisStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
    </Chart>
  );
};

const TimeAxisStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: timeData[args.granularity ?? DEFAULT_GRANULARITY], width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Line />
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
      <Bar orientation="horizontal" dimension="datetime" />
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
      <Bar orientation="vertical" dimension="datetime" />
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
      <Bar dimension="browser" metric="downloads" />
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
    </Chart>
  );
};

const DurationStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: workspaceTrendsData, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="bottom" labelFormat="time" />
      <Line color="series" dimension="datetime" scaleType="time" />
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
    </Chart>
  );
};

const SparkLineStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: stockPriceData, width: 200, height: 100 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Line dimension="timestamp" metric="price" scaleType="point" padding={0}>
        <ChartTooltip>
          {(item) => (
            <>
              <div>{item.stock}</div>
              <div style={{ fontWeight: 'bold', fontSize: 24 }}>${(item.price as number).toFixed(2)}</div>
              <div>{item.date}</div>
            </>
          )}
        </ChartTooltip>
      </Line>
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

const Time = bindWithProps(TimeAxisStory);
Time.args = {
  granularity: 'day',
  position: 'bottom',
  baseline: true,
  labelFormat: 'time',
  ticks: true,
  labelAlign: 'center',
};

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

const CustomXRange = bindWithProps(LinearAxisStory);
CustomXRange.args = {
  position: 'bottom',
  baseline: true,
  labelFormat: 'linear',
  ticks: true,
  tickMinStep: 5,
  range: [-5, 30],
};

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
  Basic,
  ControlledLabels,
  CustomXRange,
  CustomYRange,
  DurationLabelFormat,
  MultilineTitle,
  NonLinearAxis,
  NumberFormat,
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
