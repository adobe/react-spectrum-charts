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

import { DEFAULT_LABEL_FONT_WEIGHT, DEFAULT_LABEL_ORIENTATION } from '@spectrum-charts/constants';

import { Axis, Bar } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Chart } from '../../../index';
import { bindWithProps } from '../../../test-utils';

export default {
  title: 'RSC/Axis/Labels',
  component: Axis,
  argTypes: {
    hasTooltip: { control: 'boolean' },
  },
};

const data = [
  { x: 0, y: 0, series: 0 },
  { x: 1, y: 1, series: 0 },
];

const AxisLabelStory: StoryFn<typeof Axis> = (args): ReactElement => {
  const chartProps = useChartProps({ data, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis {...args}></Axis>
    </Chart>
  );
};

const Basic = bindWithProps(AxisLabelStory);
Basic.args = {
  labelAlign: 'center',
  labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
  labelFormat: 'linear',
  labelOrientation: DEFAULT_LABEL_ORIENTATION,
  position: 'bottom',
  ticks: true,
  baseline: true,
};

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
      <Bar dimension="browser" metric="downloads" />
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

export { Basic, LabelAlign, LabelOrientation, LabelLimit };
