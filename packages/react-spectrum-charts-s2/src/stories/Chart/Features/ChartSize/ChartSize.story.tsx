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

import { CHART_SIZE_BREAKPOINTS } from '@spectrum-charts/constants';

import { Chart } from '../../../../Chart';
import { Axis, Line } from '../../../../components';
import { workspaceTrendsData } from '../../../../stories/data/data';
import { CHART_SIZE_THRESHOLDS, ResizableChart } from '../../../../stories/storyUtils';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

export default {
  title: 'React Spectrum Charts 2/Chart/Features/ChartSize',
  component: Chart,
};

const defaultArgs: ChartProps = { data: workspaceTrendsData, width: 600, height: 300 };

const AutoDetectStory = (): ReactElement => (
  <ResizableChart
    thresholds={CHART_SIZE_THRESHOLDS}
    renderLabel={(width) => {
      let currentSize = 'L';
      if (width < CHART_SIZE_BREAKPOINTS.M) currentSize = 'S';
      else if (width < CHART_SIZE_BREAKPOINTS.L) currentSize = 'M';
      return <>Width: <strong>{Math.round(width)}px</strong> — Size tier: <strong>{currentSize}</strong></>;
    }}
  >
    <Chart data={workspaceTrendsData} width="auto" height={300}>
      <Axis position="bottom" baseline ticks labelFormat="time" />
      <Axis position="left" grid />
      <Line dimension="datetime" metric="value" color="series" scaleType="time" />
    </Chart>
  </ResizableChart>
);

const FixedSizeStory: StoryFn<typeof Chart> = (args): ReactElement => (
  <Chart {...args}>
    <Axis position="bottom" baseline ticks labelFormat="time" />
    <Axis position="left" grid />
    <Line dimension="datetime" metric="value" color="series" scaleType="time" />
  </Chart>
);

export const AutoDetect = AutoDetectStory;

const SizeS = bindWithProps(FixedSizeStory);
SizeS.args = {
  ...defaultArgs,
  width: 300,
};

const SizeM = bindWithProps(FixedSizeStory);
SizeM.args = {
  ...defaultArgs,
  width: 600,
};

const SizeL = bindWithProps(FixedSizeStory);
SizeL.args = {
  ...defaultArgs,
  width: 900,
};

export { SizeS, SizeM, SizeL };
