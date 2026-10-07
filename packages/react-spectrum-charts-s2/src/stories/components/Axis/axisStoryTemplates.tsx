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
import { Axis, Bar, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import {
  brandHealthData,
  campaignConversionsData,
  channelPerformanceData,
  downloadsByBrowserData,
  getDownloadsByGranularity,
  topBrowserDownloadsData,
} from './axisStoryData';

export const controls = (...include: string[]) => ({ parameters: { controls: { include } } });

export const verticalPositionArgType = { position: { control: 'inline-radio', options: ['left', 'right'] } };
export const horizontalPositionArgType = { position: { control: 'inline-radio', options: ['bottom', 'top'] } };

const CHART_SIZE = { width: 700, height: 360 };

// Featured axis is the left (value) axis of a monthly sessions trend.
export const SessionsStory: StoryFn<typeof Axis> = (args): ReactElement => {
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

// Featured axis is the bottom (time) axis of a monthly sessions trend.
export const TimeAxisStory: StoryFn<typeof Axis> = (args): ReactElement => {
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

export const ConversionRateStory: StoryFn<typeof Axis> = (args): ReactElement => {
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

export const RevenueStory: StoryFn<typeof Axis> = (args): ReactElement => {
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
};

const latestMonth = Math.max(...channelPerformanceData.map(({ datetime }) => datetime));
const latestChannelPerformanceData = channelPerformanceData.filter(({ datetime }) => datetime === latestMonth);

// Featured axis is the bottom axis: a date axis for 'time', otherwise the value axis of a horizontal bar.
export const LabelFormatStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const isTime = args.labelFormat === 'time';
  const chartProps = useChartProps({
    data: isTime ? channelPerformanceData : latestChannelPerformanceData,
    ...CHART_SIZE,
  });
  if (isTime) {
    return (
      <Chart {...chartProps}>
        <Axis position="left" grid title="Sessions" numberFormat="shortNumber" />
        <Axis {...args} granularity="month" />
        <Line dimension="datetime" metric="sessions" color="channel" scaleType="time" />
        <Legend />
      </Chart>
    );
  }
  const { metric, title } = LABEL_FORMAT_METRICS[(args.labelFormat ?? 'linear') as keyof typeof LABEL_FORMAT_METRICS];
  return (
    <Chart {...chartProps}>
      <Axis position="left" title="Channel" />
      <Axis {...args} grid title={title} />
      <Bar dimension="channel" metric={metric} color="channel" orientation="horizontal" />
    </Chart>
  );
};

export const GranularityStory: StoryFn<typeof Axis> = (args): ReactElement => {
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
export const BrowserBarStory: StoryFn<typeof Axis> = (args): ReactElement => {
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

// Three wide bars, for props whose effect is hard to see on narrow bars.
export const WideBrowserBarStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: topBrowserDownloadsData, ...CHART_SIZE });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Downloads" numberFormat="shortNumber" />
      <Axis {...args} />
      <Bar dimension="browser" metric="downloads" color="os" paddingRatio={0.2} />
      <Legend />
    </Chart>
  );
};

export const CampaignBarStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: campaignConversionsData,
    width: 640,
    height: args.labelOrientation === 'vertical' ? 480 : 380,
  });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Conversions" numberFormat="shortNumber" />
      <Axis {...args} />
      <Bar dimension="campaign" metric="conversions" color="customer" />
      <Legend />
    </Chart>
  );
};

// Featured axis is the left (category) axis of a horizontal bar chart.
export const HorizontalCampaignBarStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: campaignConversionsData, width: 700, height: 380 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="bottom" grid title="Conversions" numberFormat="shortNumber" />
      <Bar dimension="campaign" metric="conversions" color="customer" orientation="horizontal" />
      <Legend />
    </Chart>
  );
};

export const BrandHealthStory: StoryFn<typeof Axis> = (args): ReactElement => {
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
