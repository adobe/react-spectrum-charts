/*
 * Copyright 2025 Adobe. All rights reserved.
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
import { Axis, Bar } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';
import { barData, barSeriesData } from '../../components/Bar/data';

export default {
  title: 'RSC/Chart/S2/Bar',
  component: Bar,
};

const defaultChartProps: ChartProps = {
  data: barData,
  width: 600,
  height: 400,
};

const S2BasicBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, s2: true });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Downloads" />
      <Bar {...args} />
    </Chart>
  );
};

const S2SeriesBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, width: 600, height: 400, s2: true });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Value" />
      <Bar {...args} />
    </Chart>
  );
};

const S2Bar = bindWithProps(S2BasicBarStory);
S2Bar.args = {
  dimension: 'browser',
  metric: 'downloads',
};

const S2StackedBar = bindWithProps(S2SeriesBarStory);
S2StackedBar.args = {
  dimension: 'browser',
  metric: 'value',
  color: 'operatingSystem',
  type: 'stacked',
};

const S2DodgedBar = bindWithProps(S2SeriesBarStory);
S2DodgedBar.args = {
  dimension: 'browser',
  metric: 'value',
  color: 'operatingSystem',
  type: 'dodged',
};

export { S2Bar, S2StackedBar, S2DodgedBar };

