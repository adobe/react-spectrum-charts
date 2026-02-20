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

import { action } from '@storybook/addon-actions';
import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Axis, ChartPopover, ChartTooltip, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../stories/data/data';
import { formatTimestamp } from '../../../stories/storyUtils';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'RSC/Line/Gradient',
  component: Line,
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const defaultArgs = {
  color: 'series',
  name: 'line0',
  onClick: undefined,
};

const generateCallback = (variant: 'popover' | 'tooltip') => {
  const actionName = {
    popover: 'ChartPopover',
    tooltip: 'ChartTooltip',
  };

  const callback = (datum) => {
    action(`${actionName[variant]}:callback`)(datum);
    return (
      <div className="bar-tooltip">
        <div>{formatTimestamp(datum.datetime as number)}</div>
        <div>Event: {datum.series}</div>
        <div>Users: {Number(datum.value).toLocaleString()}</div>
      </div>
    );
  };
  return callback;
};

const MultiSeriesStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight />
    </Chart>
  );
};

const MultiSeries = bindWithProps(MultiSeriesStory);
MultiSeries.args = {
  ...defaultArgs,
  dimension: 'datetime',
  metric: 'users',
  scaleType: 'time',
  gradient: true,
};

const SingleSeriesStory: StoryFn<typeof Line> = (args): ReactElement => {
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

const SingleSeries = bindWithProps(SingleSeriesStory);
SingleSeries.args = {
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  color: { value: 'categorical-100' },
  gradient: true,
};

const WithDialogs = bindWithProps(SingleSeriesStory);
WithDialogs.args = {
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  color: { value: 'categorical-100' },
  gradient: true,
  children: [
    <ChartTooltip key={0}>{generateCallback('tooltip')}</ChartTooltip>,
    <ChartPopover key={1}>
      {generateCallback('popover')}
    </ChartPopover>,
  ],
};

const StaticOpacity = bindWithProps(SingleSeriesStory);
StaticOpacity.args = {
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  color: { value: 'categorical-100' },
  gradient: true,
  opacity: { value: 0.6 },
};

const MultiLineType = bindWithProps(MultiSeriesStory);
MultiLineType.args = {
  name: 'line0',
  dimension: 'datetime',
  metric: 'users',
  scaleType: 'time',
  color: { value: 'categorical-100' },
  lineType: 'series',
  gradient: true,
};

export { MultiSeries, SingleSeries, WithDialogs, StaticOpacity, MultiLineType };
