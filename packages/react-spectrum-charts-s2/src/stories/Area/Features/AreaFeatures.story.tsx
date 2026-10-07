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

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { Axis, ChartInspect, ChartPopover, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Area } from '../../../pre-alpha/index.js';
import { formatTimestamp } from '../../../storyShared/storyUtils.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { AreaProps, ChartProps } from '../../../types/index.js';
import { dailyTemperatureData, installsSinceLaunchData, sessionsByChannelData } from '../areaData.js';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Area/Features',
  component: Area,
};

const defaultChartProps: ChartProps = { data: sessionsByChannelData, minWidth: 400, maxWidth: 800, height: 400 };
const defaultArgs: AreaProps = { metric: 'sessions', color: 'channel' };

const sessionsTooltip = (datum: Datum) => (
  <div>
    <div>Week of {formatTimestamp(datum.datetime as number)}</div>
    <div>{datum.channel as string}</div>
    <div>Sessions: {(datum.sessions as number).toLocaleString()}</div>
  </div>
);

const AreaStory: StoryFn<AreaProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Axis position="left" title="Sessions" numberFormat="shortNumber" grid />
      <Area {...args} />
      <Legend title="Channel" highlight />
    </Chart>
  );
};

const TemperatureStory: StoryFn<AreaProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: dailyTemperatureData });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Axis position="left" title="Temperature (°F)" grid />
      <Area {...args} />
      <Legend title="Temperature" />
    </Chart>
  );
};

const InstallsStory: StoryFn<AreaProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: installsSinceLaunchData });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" title="Days since launch" baseline ticks />
      <Axis position="left" title="Installs" numberFormat="shortNumber" grid />
      <Area {...args} />
      <Legend title="Platform" highlight />
    </Chart>
  );
};

const Basic = bindWithProps(AreaStory);
Basic.args = { ...defaultArgs };
Object.assign(Basic, { parameters: { controls: { include: [] } } });

// the band is drawn between two data fields instead of stacking from zero
const MetricStartAndEnd = bindWithProps(TemperatureStory);
MetricStartAndEnd.args = { metricStart: 'low', metricEnd: 'high', color: 'series' };
Object.assign(MetricStartAndEnd, { parameters: { controls: { include: ['metricStart', 'metricEnd'] } } });

const Opacity = bindWithProps(AreaStory);
Opacity.args = { ...defaultArgs, opacity: 0.4 };
Object.assign(Opacity, { parameters: { controls: { include: ['opacity'] } } });

// stackOrder places the spiky email channel on top so it doesn't ripple the other bands
const Order = bindWithProps(AreaStory);
Order.args = { ...defaultArgs, order: 'stackOrder' };
Object.assign(Order, { parameters: { controls: { include: ['order'] } } });

const Padding = bindWithProps(AreaStory);
Padding.args = { ...defaultArgs, padding: 32 };
Object.assign(Padding, { parameters: { controls: { include: ['padding'] } } });

// installs are sampled at uneven intervals: linear keeps true spacing, point spaces samples evenly
const ScaleType = bindWithProps(InstallsStory);
ScaleType.args = { dimension: 'daysSinceLaunch', metric: 'installs', color: 'platform', scaleType: 'linear' };
Object.assign(ScaleType, { parameters: { controls: { include: ['scaleType'] } } });
Object.assign(ScaleType, { argTypes: { scaleType: { control: 'inline-radio', options: ['linear', 'point'] } } });

const ChartInspectStory = bindWithProps(AreaStory);
ChartInspectStory.args = { ...defaultArgs, children: <ChartInspect>{sessionsTooltip}</ChartInspect> };
Object.assign(ChartInspectStory, { parameters: { controls: { include: [] } } });

const ChartPopoverStory = bindWithProps(AreaStory);
ChartPopoverStory.args = { ...defaultArgs, children: <ChartPopover width="auto">{sessionsTooltip}</ChartPopover> };
Object.assign(ChartPopoverStory, { parameters: { controls: { include: [] } } });

export {
  Basic,
  MetricStartAndEnd,
  Opacity,
  Order,
  Padding,
  ScaleType,
  ChartInspectStory as ChartInspect,
  ChartPopoverStory as ChartPopover,
};
