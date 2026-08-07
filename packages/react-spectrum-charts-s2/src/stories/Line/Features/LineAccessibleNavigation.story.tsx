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
import { Axis, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsData, workspaceTrendsSixSeriesData } from '../../../stories/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features',
  component: Line,
};

// Tab into the chart to enter data-navigator keyboard navigation; Left/Right move between points, Escape exits.
const AccessibleNavigationStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps: ChartProps = {
    data: workspaceTrendsData,
    minWidth: 400,
    maxWidth: 800,
    height: 400,
    accessibleNavigation: true,
  };
  const props = useChartProps(chartProps);
  return (
    <Chart {...props}>
      <Axis position="bottom" labelFormat="time" />
      <Axis position="left" grid />
      <Line {...args} />
    </Chart>
  );
};

// Left/Right move between lines at the top level; Enter drills into a line so Left/Right then step through its points.
const AccessibleNavigationMultiSeriesStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps: ChartProps = {
    data: workspaceTrendsSixSeriesData,
    minWidth: 400,
    maxWidth: 800,
    height: 400,
    accessibleNavigation: true,
  };
  const props = useChartProps(chartProps);
  return (
    <Chart {...props}>
      <Axis position="bottom" labelFormat="time" />
      <Axis position="left" grid />
      <Line {...args} />
      <Legend lineWidth={{ value: 0 }} />
    </Chart>
  );
};

const AccessibleNavigation = bindWithProps(AccessibleNavigationStory);
AccessibleNavigation.args = {
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
};

const AccessibleNavigationMultiSeries = bindWithProps(AccessibleNavigationMultiSeriesStory);
AccessibleNavigationMultiSeries.args = {
  color: 'series',
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
};

export { AccessibleNavigation, AccessibleNavigationMultiSeries };
