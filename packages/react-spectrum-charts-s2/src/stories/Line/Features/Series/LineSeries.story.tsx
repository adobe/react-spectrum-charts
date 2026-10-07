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

import { Chart } from '../../../../Chart.js';
import { Axis, Legend, Line } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../../test-utils/index.js';
import { visitsBySixChannelsData } from '../../lineData.js';
import { setControls } from '../../lineStoryUtils.js';
import { visitsProps } from '../lineStoryTemplates.js';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Series',
  component: Line,
};

const SixChannelVisitsStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data: visitsBySixChannelsData, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Visits" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight />
    </Chart>
  );
};

const PrimarySeries = bindWithProps(SixChannelVisitsStory);
PrimarySeries.args = { ...visitsProps, primarySeries: ['Paid search', 'Email'] };
setControls(PrimarySeries, ['primarySeries']);

const OtherSeriesColor = bindWithProps(SixChannelVisitsStory);
OtherSeriesColor.args = { ...visitsProps, primarySeries: 1, otherSeriesColor: 'gray-200' };
setControls(OtherSeriesColor, ['otherSeriesColor']);

export { PrimarySeries, OtherSeriesColor };
