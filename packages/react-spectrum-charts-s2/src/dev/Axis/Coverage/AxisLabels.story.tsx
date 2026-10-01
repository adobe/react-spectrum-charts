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

import { DEFAULT_LABEL_FONT_WEIGHT, DEFAULT_LABEL_ORIENTATION } from '@spectrum-charts/constants';

import { Axis, Bar, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Chart } from '../../../index';
import { barDataLongLabels } from '../../../storyShared/components/Bar/data';
import { bindWithProps } from '../../../test-utils';

export default {
  title: 'React Spectrum Charts 2/Axis/Coverage/Labels',
  component: Axis,
  argTypes: {
    hasTooltip: { control: 'boolean' },
  },
};

const data = [
  { x: 0, y: 0, series: 'Desktop conversion' },
  { x: 1, y: 1, series: 'Desktop conversion' },
];

const labelDemoData = [
  { week: 1, conversionRate: 0.38, channel: 'Paid search' },
  { week: 2, conversionRate: 0.44, channel: 'Paid search' },
  { week: 3, conversionRate: 0.47, channel: 'Paid search' },
  { week: 4, conversionRate: 0.52, channel: 'Paid search' },
  { week: 1, conversionRate: 0.28, channel: 'Email' },
  { week: 2, conversionRate: 0.33, channel: 'Email' },
  { week: 3, conversionRate: 0.37, channel: 'Email' },
  { week: 4, conversionRate: 0.41, channel: 'Email' },
];

const AxisLabelStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis {...args}></Axis>
    </Chart>
  );
};

const AxisLabelDemoStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data: labelDemoData, width: 700 });
  return (
    <Chart {...chartProps}>
      <Axis {...args}></Axis>
      <Axis position="left" grid title="Conversion rate" />
      <Line color="channel" dimension="week" metric="conversionRate" scaleType="linear" />
      <Legend />
    </Chart>
  );
};

const Basic = bindWithProps(AxisLabelDemoStory);
Basic.args = {
  labelAlign: 'center',
  labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
  labelFormat: 'linear',
  labelOrientation: DEFAULT_LABEL_ORIENTATION,
  position: 'bottom',
  ticks: true,
  baseline: true,
};
Object.assign(Basic, {
  parameters: {
    controls: { include: ['labelAlign', 'labelFontWeight', 'labelFormat', 'labelOrientation', 'hasTooltip'] },
  },
});

const LabelAlign = bindWithProps(AxisLabelStory);
LabelAlign.args = {
  labelAlign: 'start',
  labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
  labelFormat: 'linear',
  labelOrientation: 'horizontal',
  position: 'bottom',
  ticks: true,
  baseline: true,
};

const LabelOrientation = bindWithProps(AxisLabelStory);
LabelOrientation.args = {
  labelOrientation: 'vertical',
  labelAlign: 'center',
  labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
  labelFormat: 'linear',
  position: 'bottom',
  ticks: true,
  baseline: true,
};

const LabelWithTooltip = bindWithProps(AxisLabelStory);
LabelWithTooltip.args = {
  labelAlign: 'center',
  labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
  labelFormat: 'linear',
  labelOrientation: DEFAULT_LABEL_ORIENTATION,
  position: 'bottom',
  ticks: true,
  baseline: true,
  hasTooltip: true,
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

// Truncated so the tooltip's full text differs visibly from what's shown.
const TruncatedLabelWithTooltip = bindWithProps(TruncatedLabelStory);
TruncatedLabelWithTooltip.args = {
  truncateLabels: true,
  position: 'bottom',
  baseline: true,
  title: 'Browser',
  hasTooltip: true,
};

// Per-value overrides: custom text, suppressed, and default.
const CustomTooltipText = bindWithProps(TruncatedLabelStory);
CustomTooltipText.args = {
  truncateLabels: true,
  position: 'bottom',
  baseline: true,
  title: 'Browser',
  hasTooltip: true,
  tooltipText: [
    { value: 'Microsoft Explorer', text: 'Microsoft Explorer is the most widely used browser' },
    { value: 'Mozilla Firefox', text: null },
    { value: 'Google Chrome', text: 'Chrome is the most popular browser' },
  ],
};
CustomTooltipText.storyName = 'Truncated labels with tooltips';
Object.assign(CustomTooltipText, {
  parameters: {
    controls: { include: ['truncateLabels', 'hasTooltip', 'tooltipText', 'labelLimit', 'title'] },
  },
});

const LabelLimitStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const longLabelData = [
    { browser: 'Chrome with Very Long Browser Name That Exceeds Normal Limits', downloads: 100 },
    { browser: 'Firefox Extended Name Version', downloads: 80 },
    { browser: 'Safari Browser', downloads: 60 },
  ];
  const chartProps = useChartProps({ data: longLabelData, width: 600, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis {...args} />
      <Axis position="left" grid title="Downloads" />
      <Bar dimension="browser" metric="downloads" color="browser" />
      <Legend />
    </Chart>
  );
};

const LabelLimit = bindWithProps(LabelLimitStory);
LabelLimit.args = {
  position: 'bottom',
  baseline: true,
  title: 'Browser',
  labelLimit: 60,
};

export {
  Basic,
  LabelAlign,
  LabelOrientation,
  LabelLimit,
  LabelWithTooltip,
  TruncatedLabelWithTooltip,
  CustomTooltipText,
};
