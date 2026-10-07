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
import { Axis, ChartInspect, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import {
  conversionRateData,
  downloadsAndConversionData,
  paidSearchVisitsData,
  visitsByChannelData,
  weeklyActiveUsersData,
} from '../lineData';
import { setArgTypes, setControls } from '../lineStoryUtils';
import { VisitsStory, visitsProps } from './lineStoryTemplates';

export default {
  title: 'React Spectrum Charts 2/Line/Features',
  component: Line,
};

const VisitsWithInspectStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data: visitsByChannelData, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Visits" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args}>
        <ChartInspect>
          {(datum) => (
            <div>
              <div>{new Date(datum.datetime as number).toLocaleDateString()}</div>
              <div>{datum.channel}</div>
              <div>Visits: {Number(datum.visits).toLocaleString()}</div>
            </div>
          )}
        </ChartInspect>
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const PaidSearchVisitsStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data: paidSearchVisitsData, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Visits" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight />
    </Chart>
  );
};

const WeeklyActiveUsersStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data: weeklyActiveUsersData, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Weekly active users" />
      <Axis position="bottom" baseline ticks title="Week of quarter" />
      <Line {...args} />
      <Legend highlight title="Plan" />
    </Chart>
  );
};

// dualMetricAxis currently throws on a non-interactive line, so this story includes a tooltip.
const DualMetricAxisStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data: downloadsAndConversionData, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Downloads" />
      <Axis position="right" title="Conversion rate (%)" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args}>
        <ChartInspect>
          {(datum) => (
            <div>
              <div>{new Date(datum.datetime as number).toLocaleDateString()}</div>
              <div>
                {datum.metric}: {Number(datum.value).toLocaleString()}
              </div>
            </div>
          )}
        </ChartInspect>
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const SparklineStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data: conversionRateData, width: 300, height: 180 });
  return (
    <Chart {...chartProps}>
      <Line {...args} />
      <Legend />
    </Chart>
  );
};

const Basic = bindWithProps(VisitsWithInspectStory);
Basic.args = { ...visitsProps };
setControls(Basic, ['dimension', 'metric', 'color']);

const Interpolate = bindWithProps(PaidSearchVisitsStory);
Interpolate.args = { ...visitsProps, interpolate: 'step-after' };
setControls(Interpolate, ['interpolate']);

// Gradients only render when the chart has a single series.
const Gradient = bindWithProps(PaidSearchVisitsStory);
Gradient.args = { ...visitsProps, gradient: true };
setControls(Gradient, ['gradient']);

const Padding = bindWithProps(VisitsStory);
Padding.args = { ...visitsProps, padding: 48 };
setControls(Padding, ['padding']);

const ScaleType = bindWithProps(WeeklyActiveUsersStory);
ScaleType.args = { dimension: 'week', metric: 'users', color: 'plan', scaleType: 'point' };
setControls(ScaleType, ['scaleType']);
setArgTypes(ScaleType, { scaleType: { control: 'inline-radio', options: ['point', 'linear'] } });

const DualMetricAxis = bindWithProps(DualMetricAxisStory);
DualMetricAxis.args = { dimension: 'datetime', metric: 'value', color: 'metric', dualMetricAxis: true };
setControls(DualMetricAxis, ['dualMetricAxis']);

const IsSparkline = bindWithProps(SparklineStory);
IsSparkline.args = {
  dimension: 'day',
  metric: 'rate',
  color: 'metric',
  scaleType: 'linear',
  staticPoint: 'isPeak',
  isSparkline: true,
};
setControls(IsSparkline, ['isSparkline']);

const IsMethodLast = bindWithProps(SparklineStory);
IsMethodLast.args = {
  dimension: 'day',
  metric: 'rate',
  color: 'metric',
  scaleType: 'linear',
  isSparkline: true,
  isMethodLast: true,
};
setControls(IsMethodLast, ['isMethodLast']);

const InteractionMode = bindWithProps(VisitsWithInspectStory);
InteractionMode.args = { ...visitsProps, interactionMode: 'item' };
setControls(InteractionMode, ['interactionMode']);
setArgTypes(InteractionMode, { interactionMode: { control: 'inline-radio', options: ['nearest', 'item'] } });

export { Basic, Interpolate, Gradient, Padding, ScaleType, DualMetricAxis, IsSparkline, IsMethodLast, InteractionMode };
