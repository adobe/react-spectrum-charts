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
import { action } from 'storybook/actions';

import { Chart } from '../../../Chart';
import { Axis, ChartInspect, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { LineProps } from '../../../types';
import {
  conversionRateData,
  downloadsAndConversionData,
  paidSearchVisitsData,
  searchVisitsData,
  visitsByChannelData,
  visitsBySixChannelsData,
  weeklyActiveUsersData,
} from '../lineData';
import { setArgTypes, setControls } from '../lineStoryUtils';

export default {
  title: 'React Spectrum Charts 2/Line/Features',
  component: Line,
};

const VisitsStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data: visitsByChannelData, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Visits" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight />
    </Chart>
  );
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

const SearchVisitsStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data: searchVisitsData, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Visits" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
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

const visitsProps: LineProps = { dimension: 'datetime', metric: 'visits', color: 'channel' };

const Basic = bindWithProps(VisitsWithInspectStory);
Basic.args = { ...visitsProps };
setControls(Basic, ['dimension', 'metric', 'color']);

const LineType = bindWithProps(VisitsStory);
LineType.args = { ...visitsProps, lineType: 'channel' };
setControls(LineType, ['lineType']);

const Opacity = bindWithProps(VisitsStory);
Opacity.args = { ...visitsProps, opacity: { value: 0.6 } };
setControls(Opacity, ['opacity']);

const Interpolate = bindWithProps(PaidSearchVisitsStory);
Interpolate.args = { ...visitsProps, interpolate: 'step-after' };
setControls(Interpolate, ['interpolate']);

// A dotted line makes the cap shape visible on every dot.
const LineCap = bindWithProps(SearchVisitsStory);
LineCap.args = { ...visitsProps, lineType: { value: 'dotted' }, lineCap: 'square' };
setControls(LineCap, ['lineCap']);

// Gradients only render when the chart has a single series.
const Gradient = bindWithProps(PaidSearchVisitsStory);
Gradient.args = { ...visitsProps, gradient: true };
setControls(Gradient, ['gradient']);

const StaticPoint = bindWithProps(VisitsStory);
StaticPoint.args = { ...visitsProps, staticPoint: 'hasEvent' };
setControls(StaticPoint, ['staticPoint']);

const PointSize = bindWithProps(VisitsStory);
PointSize.args = { ...visitsProps, staticPoint: 'hasEvent', pointSize: 144 };
setControls(PointSize, ['pointSize']);

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

const PrimarySeries = bindWithProps(SixChannelVisitsStory);
PrimarySeries.args = { ...visitsProps, primarySeries: ['Paid search', 'Email'] };
setControls(PrimarySeries, ['primarySeries']);

const OtherSeriesColor = bindWithProps(SixChannelVisitsStory);
OtherSeriesColor.args = { ...visitsProps, primarySeries: 1, otherSeriesColor: 'gray-200' };
setControls(OtherSeriesColor, ['otherSeriesColor']);

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

const OnClick = bindWithProps(VisitsStory);
OnClick.args = { ...visitsProps, onClick: action('onClick') };
setControls(OnClick, []);

const OnContextMenu = bindWithProps(VisitsStory);
OnContextMenu.args = { ...visitsProps, onContextMenu: action('onContextMenu') };
setControls(OnContextMenu, []);

export {
  Basic,
  LineType,
  Opacity,
  Interpolate,
  LineCap,
  Gradient,
  StaticPoint,
  PointSize,
  Padding,
  ScaleType,
  DualMetricAxis,
  PrimarySeries,
  OtherSeriesColor,
  IsSparkline,
  IsMethodLast,
  InteractionMode,
  OnClick,
  OnContextMenu,
};
