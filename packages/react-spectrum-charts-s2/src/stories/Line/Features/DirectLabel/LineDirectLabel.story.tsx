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

import { Chart } from '../../../../Chart';
import { Axis, ChartTooltip, Legend, Line, LineDirectLabel } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../../stories/data/data';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Direct Label',
  component: LineDirectLabel,
  argTypes: {
    value: {
      control: { type: 'select' },
      options: ['last', 'average', 'series'],
    },
    position: {
      control: { type: 'select' },
      options: ['start', 'end'],
    },
  },
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400, backgroundColor: 'gray-50' };

const twoSeriesData = workspaceTrendsData
  .filter((d) => d.series === 'Add Freeform table' || d.series === 'Add Fallout')
  .map((d) => (d.series === 'Add Fallout' ? { ...d, users: d.users + 4000 } : d));

const LineDirectLabelStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const LineDirectLabelWithTooltipStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
        <ChartTooltip>{(datum: Record<string, string>) => <div>{datum.users}</div>}</ChartTooltip>
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const LineDirectLabelTwoSeriesStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: twoSeriesData });
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const DirectLabelDefault = bindWithProps(LineDirectLabelStory);
DirectLabelDefault.args = { value: 'series' };

const DirectLabelValueLast = bindWithProps(LineDirectLabelStory);
DirectLabelValueLast.args = { value: 'last' };

const DirectLabelValueAverage = bindWithProps(LineDirectLabelStory);
DirectLabelValueAverage.args = { value: 'average' };

const DirectLabelWithTooltip = bindWithProps(LineDirectLabelWithTooltipStory);
DirectLabelWithTooltip.args = { value: 'last' };

const DirectLabelTwoSeries = bindWithProps(LineDirectLabelTwoSeriesStory);
DirectLabelTwoSeries.args = { value: 'last' };

const DirectLabelPositionStart = bindWithProps(LineDirectLabelStory);
DirectLabelPositionStart.args = { value: 'series', position: 'start' };

export { DirectLabelDefault, DirectLabelValueLast, DirectLabelValueAverage, DirectLabelWithTooltip, DirectLabelTwoSeries, DirectLabelPositionStart };
