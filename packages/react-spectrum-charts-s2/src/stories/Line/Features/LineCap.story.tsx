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
import { Axis, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../stories/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features',
  component: Line,
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const LineCapStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({
    ...defaultChartProps,
    data: workspaceTrendsData.filter((d) => d.series === 'Add Freeform table'),
  });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
    </Chart>
  );
};

const WithRoundLineCap = bindWithProps(LineCapStory);
WithRoundLineCap.args = {
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  color: { value: 'categorical-100' },
  lineCap: 'round',
};

const WithSquareLineCap = bindWithProps(LineCapStory);
WithSquareLineCap.args = {
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  color: { value: 'categorical-100' },
  lineCap: 'square',
};

// Inline time-series with null values at points 4–5 to show segment breaks with rounded caps
const lineBreaksData = [
  { datetime: 1667890800000, value: 3738, series: 'Add Freeform table' },
  { datetime: 1667977200000, value: 2704, series: 'Add Freeform table' },
  { datetime: 1668063600000, value: 1730, series: 'Add Freeform table' },
  { datetime: 1668150000000, value: null, series: 'Add Freeform table' }, // null — first break
  { datetime: 1668236400000, value: null, series: 'Add Freeform table' }, // null — second break
  { datetime: 1668322800000, value: 1606, series: 'Add Freeform table' },
  { datetime: 1668409200000, value: 10932, series: 'Add Freeform table' },
  { datetime: 1668495600000, value: 8420, series: 'Add Freeform table' },
  { datetime: 1668582000000, value: 9100, series: 'Add Freeform table' },
  { datetime: 1668668400000, value: 7243, series: 'Add Freeform table' },
];

const LineBreaksStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: lineBreaksData });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
    </Chart>
  );
};

const WithLineBreaks = bindWithProps(LineBreaksStory);
WithLineBreaks.args = {
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  color: { value: 'categorical-100' },
  lineCap: 'round',
};

// Inline data with null metric range bounds at point 4 to show band breaks with rounded caps
const metricRangeBreaksData = [
  { datetime: 1667890800000, value: 3738, series: 'Add Freeform table', metricEnd: 4200, metricStart: 3200, metric: 3700 },
  { datetime: 1667977200000, value: 2704, series: 'Add Freeform table', metricEnd: 3100, metricStart: 2100, metric: 2600 },
  { datetime: 1668063600000, value: 1730, series: 'Add Freeform table', metricEnd: 2200, metricStart: 1200, metric: 1700 },
  { datetime: 1668150000000, value: 465, series: 'Add Freeform table', metricEnd: null, metricStart: null, metric: null }, // null — band breaks here
  { datetime: 1668236400000, value: 600, series: 'Add Freeform table', metricEnd: 900, metricStart: 300, metric: 600 },
  { datetime: 1668322800000, value: 1606, series: 'Add Freeform table', metricEnd: 2000, metricStart: 1100, metric: 1550 },
  { datetime: 1668409200000, value: 10932, series: 'Add Freeform table', metricEnd: 11500, metricStart: 10300, metric: 10900 },
  { datetime: 1668495600000, value: 8420, series: 'Add Freeform table', metricEnd: 9000, metricStart: 7800, metric: 8400 },
  { datetime: 1668582000000, value: 9100, series: 'Add Freeform table', metricEnd: 9700, metricStart: 8500, metric: 9100 },
  { datetime: 1668668400000, value: 7243, series: 'Add Freeform table', metricEnd: 7800, metricStart: 6600, metric: 7200 },
];

const MetricRangeBreaksStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: metricRangeBreaksData });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
    </Chart>
  );
};

const WithMetricRangeLineBreaks = bindWithProps(MetricRangeBreaksStory);
WithMetricRangeLineBreaks.args = {
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  color: { value: 'categorical-100' },
  lineCap: 'round',
  metricRanges: [
    {
      metricEnd: 'metricEnd',
      metricStart: 'metricStart',
      metric: 'metric',
      lineType: 'shortDash',
      lineWidth: 'S',
      rangeOpacity: 0.2,
    },
  ],
};

export { WithRoundLineCap, WithSquareLineCap, WithLineBreaks, WithMetricRangeLineBreaks };
