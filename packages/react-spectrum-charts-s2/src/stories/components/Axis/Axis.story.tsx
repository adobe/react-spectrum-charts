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
import { action } from 'storybook/actions';

import { Chart } from '../../../Chart';
import { Axis, Bar, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import {
  brandHealthData,
  campaignConversionsData,
  channelPerformanceData,
  cohortRetentionData,
  downloadsByBrowserData,
  getDownloadsByGranularity,
} from './axisStoryData';

export default {
  title: 'React Spectrum Charts 2/Axis/Features',
  component: Axis,
  argTypes: {
    position: { control: 'inline-radio', options: ['left', 'right'] },
    granularity: {
      control: 'select',
      options: ['second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'],
    },
    labelAlign: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    labelFontWeight: { control: 'inline-radio', options: ['normal', 'bold', 'lighter'] },
    labelFormat: { control: 'inline-radio', options: ['linear', 'percentage', 'duration'] },
    labelOrientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    numberFormat: {
      control: 'select',
      options: ['currency', 'shortCurrency', 'shortNumber', 'standardNumber', '$,.2f', '.3s'],
    },
  },
};

const controls = (...include: string[]) => ({ parameters: { controls: { include } } });

const CHART_SIZE = { width: 700, height: 360 };

const MONTH = (month: number) => new Date(2025, month, 1).getTime();

// Featured axis is the left (value) axis of a monthly sessions trend.
const SessionsStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: channelPerformanceData, ...CHART_SIZE });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="bottom" labelFormat="time" granularity="month" baseline />
      <Line dimension="datetime" metric="sessions" color="channel" scaleType="time" />
      <Legend />
    </Chart>
  );
};

const CompactSessionsStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: channelPerformanceData, width: 700, height: 200 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="bottom" labelFormat="time" granularity="month" baseline />
      <Line dimension="datetime" metric="sessions" color="channel" scaleType="time" />
      <Legend />
    </Chart>
  );
};

// Featured axis is the bottom (time) axis of a monthly sessions trend.
const TimeAxisStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: channelPerformanceData, ...CHART_SIZE });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Sessions" numberFormat="shortNumber" />
      <Axis {...args} />
      <Line dimension="datetime" metric="sessions" color="channel" scaleType="time" />
      <Legend />
    </Chart>
  );
};

const ConversionRateStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: channelPerformanceData, ...CHART_SIZE });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="bottom" labelFormat="time" granularity="month" baseline />
      <Line dimension="datetime" metric="conversionRate" color="channel" scaleType="time" />
      <Legend />
    </Chart>
  );
};

const RevenueStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: channelPerformanceData, ...CHART_SIZE });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="bottom" labelFormat="time" granularity="month" baseline />
      <Line dimension="datetime" metric="revenue" color="channel" scaleType="time" />
      <Legend />
    </Chart>
  );
};

const LABEL_FORMAT_METRICS = {
  duration: { metric: 'avgSessionSeconds', title: 'Avg. session duration' },
  linear: { metric: 'sessions', title: 'Sessions' },
  percentage: { metric: 'conversionRate', title: 'Conversion rate' },
  time: { metric: 'sessions', title: 'Sessions' },
};

// The plotted metric follows the selected labelFormat so each format is shown on data it suits.
const LabelFormatStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: channelPerformanceData, ...CHART_SIZE });
  const { metric, title } = LABEL_FORMAT_METRICS[args.labelFormat ?? 'linear'];
  return (
    <Chart {...chartProps}>
      <Axis {...args} title={title} />
      <Axis position="bottom" labelFormat="time" granularity="month" baseline />
      <Line dimension="datetime" metric={metric} color="channel" scaleType="time" />
      <Legend />
    </Chart>
  );
};

const GranularityStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: getDownloadsByGranularity(args.granularity), ...CHART_SIZE });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Downloads" numberFormat="shortNumber" />
      <Axis {...args} />
      <Line dimension="datetime" metric="downloads" color="platform" scaleType="time" />
      <Legend />
    </Chart>
  );
};

// Featured axis is the bottom (category) axis of a stacked bar chart.
const BrowserBarStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: downloadsByBrowserData, ...CHART_SIZE });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Downloads" numberFormat="shortNumber" />
      <Axis {...args} />
      <Bar dimension="browser" metric="downloads" color="os" />
      <Legend />
    </Chart>
  );
};

const CampaignBarStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: campaignConversionsData, width: 640, height: args.labelOrientation === 'vertical' ? 480 : 380 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Conversions" numberFormat="shortNumber" />
      <Axis {...args} />
      <Bar dimension="campaign" metric="conversions" color="customer" />
      <Legend />
    </Chart>
  );
};

const BrandHealthStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: brandHealthData, ...CHART_SIZE });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Brand health index" range={[85, 120]} />
      <Axis {...args} />
      <Line dimension="datetime" metric="index" color="brand" scaleType="time" />
      <Legend />
    </Chart>
  );
};

const RetentionStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: cohortRetentionData, ...CHART_SIZE });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Active users" labelFormat="percentage" />
      <Axis {...args} />
      <Line dimension="week" metric="retention" color="cohort" scaleType="linear" />
      <Legend />
    </Chart>
  );
};

const Basic = bindWithProps(SessionsStory);
Basic.args = { position: 'left', grid: true, title: 'Sessions', numberFormat: 'shortNumber' };
Object.assign(Basic, controls());

const Position = bindWithProps(SessionsStory);
Position.args = { position: 'right', grid: true, title: 'Sessions', numberFormat: 'shortNumber' };
Object.assign(Position, controls('position'));

const Title = bindWithProps(ConversionRateStory);
Title.args = {
  position: 'left',
  grid: true,
  labelFormat: 'percentage',
  title: ['Conversion rate', '(orders ÷ sessions)'],
};
Object.assign(Title, controls('title'));

const Grid = bindWithProps(SessionsStory);
Grid.args = { position: 'left', grid: true, title: 'Sessions', numberFormat: 'shortNumber' };
Object.assign(Grid, controls('grid'));

const Baseline = bindWithProps(BrowserBarStory);
Baseline.args = { position: 'bottom', baseline: true, title: 'Browser' };
Object.assign(Baseline, controls('baseline'));

// Draws the bottom baseline at the benchmark value of 100 instead of at the bottom of the chart.
const BaselineOffset = bindWithProps(BrandHealthStory);
BaselineOffset.args = {
  position: 'bottom',
  baseline: true,
  baselineOffset: 100,
  labelFormat: 'time',
  granularity: 'month',
};
Object.assign(BaselineOffset, controls('baselineOffset'));

const Ticks = bindWithProps(TimeAxisStory);
Ticks.args = { position: 'bottom', baseline: true, ticks: true, labelFormat: 'time', granularity: 'month' };
Object.assign(Ticks, controls('ticks'));

const Range = bindWithProps(ConversionRateStory);
Range.args = { position: 'left', grid: true, labelFormat: 'percentage', title: 'Conversion rate', range: [0, 0.08] };
Object.assign(Range, controls('range'));

// Without tickMinStep, this narrow week range would get half-week ticks.
const TickMinStep = bindWithProps(RetentionStory);
TickMinStep.args = { position: 'bottom', baseline: true, ticks: true, title: 'Weeks since sign-up', tickMinStep: 1 };
Object.assign(TickMinStep, controls('tickMinStep'));

const TickCountLimit = bindWithProps(SessionsStory);
TickCountLimit.args = { position: 'left', grid: true, title: 'Sessions', numberFormat: 'shortNumber', tickCountLimit: 3 };
Object.assign(TickCountLimit, controls('tickCountLimit'));

const TickCountMinimum = bindWithProps(CompactSessionsStory);
TickCountMinimum.args = {
  position: 'left',
  grid: true,
  title: 'Sessions',
  numberFormat: 'shortNumber',
  tickCountMinimum: 4,
};
Object.assign(TickCountMinimum, controls('tickCountMinimum'));

const LabelFormat = bindWithProps(LabelFormatStory);
LabelFormat.args = { position: 'left', grid: true, labelFormat: 'percentage' };
Object.assign(LabelFormat, controls('labelFormat'));

const NumberFormat = bindWithProps(RevenueStory);
NumberFormat.args = { position: 'left', grid: true, title: 'Revenue', numberFormat: 'shortCurrency' };
Object.assign(NumberFormat, controls('numberFormat'));

// currencyCode and currencyLocale only take effect together.
const CurrencyCode = bindWithProps(RevenueStory);
CurrencyCode.args = {
  position: 'left',
  grid: true,
  title: 'Revenue',
  numberFormat: 'currency',
  currencyCode: 'EUR',
  currencyLocale: 'de-DE',
};
Object.assign(CurrencyCode, controls('currencyCode', 'currencyLocale'));

const Granularity = bindWithProps(GranularityStory);
Granularity.args = { position: 'bottom', baseline: true, ticks: true, labelFormat: 'time', granularity: 'week' };
Object.assign(Granularity, controls('granularity'));

const Labels = bindWithProps(TimeAxisStory);
Labels.args = {
  position: 'bottom',
  baseline: true,
  ticks: true,
  labels: [
    { value: MONTH(0), label: 'Q1 FY25', align: 'start' },
    { value: MONTH(3), label: 'Q2 FY25', align: 'start' },
    { value: MONTH(6), label: 'Q3 FY25', align: 'start' },
    { value: MONTH(9), label: 'Q4 FY25', align: 'start' },
  ],
};
Object.assign(Labels, controls('labels'));

// Grid lines stay, but the value labels are hidden to focus on the trend.
const HideDefaultLabels = bindWithProps(SessionsStory);
HideDefaultLabels.args = { position: 'left', grid: true, title: 'Sessions', hideDefaultLabels: true };
Object.assign(HideDefaultLabels, controls('hideDefaultLabels'));

const SubLabels = bindWithProps(BrowserBarStory);
SubLabels.args = {
  position: 'bottom',
  baseline: true,
  title: 'Browser',
  subLabels: [
    { value: 'Chrome', subLabel: '48% share' },
    { value: 'Safari', subLabel: '19% share' },
    { value: 'Edge', subLabel: '16% share' },
    { value: 'Firefox', subLabel: '12% share' },
    { value: 'Opera', subLabel: '4% share' },
  ],
};
Object.assign(SubLabels, controls('subLabels'));

const LabelAlign = bindWithProps(TimeAxisStory);
LabelAlign.args = { position: 'bottom', baseline: true, ticks: true, labelFormat: 'time', granularity: 'month', labelAlign: 'start' };
Object.assign(LabelAlign, controls('labelAlign'));

const LabelFontWeight = bindWithProps(BrowserBarStory);
LabelFontWeight.args = { position: 'bottom', baseline: true, title: 'Browser', labelFontWeight: 'bold' };
Object.assign(LabelFontWeight, controls('labelFontWeight'));

const LabelOrientation = bindWithProps(CampaignBarStory);
LabelOrientation.args = { position: 'bottom', baseline: true, labelOrientation: 'vertical' };
Object.assign(LabelOrientation, controls('labelOrientation'));

const LabelLimit = bindWithProps(CampaignBarStory);
LabelLimit.args = { position: 'bottom', baseline: true, labelOrientation: 'vertical', labelLimit: 120 };
Object.assign(LabelLimit, controls('labelLimit'));

const TruncateLabels = bindWithProps(CampaignBarStory);
TruncateLabels.args = { position: 'bottom', baseline: true, title: 'Campaign', truncateLabels: true };
Object.assign(TruncateLabels, controls('truncateLabels'));

// Hover a truncated campaign name to see its full text.
const HasTooltip = bindWithProps(CampaignBarStory);
HasTooltip.args = { position: 'bottom', baseline: true, title: 'Campaign', truncateLabels: true, hasTooltip: true };
Object.assign(HasTooltip, controls('hasTooltip'));

// Hover campaign names: one shows custom text, one has its tooltip suppressed, the rest show the full name.
const TooltipText = bindWithProps(CampaignBarStory);
TooltipText.args = {
  position: 'bottom',
  baseline: true,
  title: 'Campaign',
  truncateLabels: true,
  hasTooltip: true,
  tooltipText: [
    { value: 'Holiday gift guide search ads', text: 'Holiday gift guide search ads — Nov 15 to Dec 24' },
    { value: 'Loyalty program launch', text: null },
  ],
};
Object.assign(TooltipText, controls('tooltipText'));

const OnClick = bindWithProps(BrowserBarStory);
OnClick.args = { position: 'bottom', baseline: true, title: 'Browser', onClick: action('onClick') };
Object.assign(OnClick, controls('onClick'));

export {
  Basic,
  Position,
  Title,
  Grid,
  Baseline,
  BaselineOffset,
  Ticks,
  Range,
  TickMinStep,
  TickCountLimit,
  TickCountMinimum,
  LabelFormat,
  NumberFormat,
  CurrencyCode,
  Granularity,
  Labels,
  HideDefaultLabels,
  SubLabels,
  LabelAlign,
  LabelFontWeight,
  LabelOrientation,
  LabelLimit,
  TruncateLabels,
  HasTooltip,
  TooltipText,
  OnClick,
};
