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

import { action } from 'storybook/actions';
import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { BarProps } from '../../../types';
import { acquisitionChannelData, acquisitionGoalData, monthlySignupsData } from './data';
import { bindStory } from './storyUtils';

export default {
  title: 'React Spectrum Charts 2/Bar/Features',
  component: Bar,
};

const BarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const isHorizontal = args.orientation === 'horizontal';
  const chartProps = useChartProps({ data: acquisitionChannelData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position={isHorizontal ? 'left' : 'bottom'} baseline title="Acquisition channel" />
      <Axis position={isHorizontal ? 'bottom' : 'left'} grid title="Sign-ups" />
      <Bar {...args} />
      <Legend title="Metric" />
    </Chart>
  );
};

const ColorOverrideStory: StoryFn<typeof Bar> = (args): ReactElement => {
  // Chart colors mirror the data's statusColor values so the legend matches the overridden fills.
  const chartProps = useChartProps({
    data: acquisitionGoalData,
    colors: ['#0d7a55', '#d7373f'],
    width: 640,
    height: 400,
  });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Acquisition channel" />
      <Axis position="left" grid title="Sign-ups" />
      <Bar {...args} />
      <Legend title="Goal status" />
    </Chart>
  );
};

const MonthlyBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: monthlySignupsData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline labelFormat="time" granularity="month" title="Month" />
      <Axis position="left" grid title="Sign-ups" />
      <Bar {...args} />
      <Legend title="Metric" />
    </Chart>
  );
};

const ChartInspectStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: acquisitionChannelData, width: 640, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Acquisition channel" />
      <Axis position="left" grid title="Sign-ups" />
      <Bar {...args}>
        <ChartInspect>
          {(datum) => (
            <div>
              {datum.channel}: {Number(datum.signups).toLocaleString()} sign-ups
            </div>
          )}
        </ChartInspect>
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

const defaultProps: BarProps = {
  dimension: 'channel',
  metric: 'signups',
  color: 'series',
};

const Basic = bindStory(BarStory);
Basic.args = { ...defaultProps };
Basic.parameters = { controls: { include: ['dimension', 'metric', 'color'] } };

const Orientation = bindStory(BarStory);
Orientation.args = { ...defaultProps, orientation: 'horizontal' };
Orientation.parameters = { controls: { include: ['orientation'] } };

const HasSquareCorners = bindStory(BarStory);
HasSquareCorners.args = { ...defaultProps, hasSquareCorners: true };
HasSquareCorners.parameters = { controls: { include: ['hasSquareCorners'] } };

const PaddingRatio = bindStory(BarStory);
PaddingRatio.args = { ...defaultProps, paddingRatio: 0.1 };
PaddingRatio.parameters = { controls: { include: ['paddingRatio'] } };

const PaddingOuter = bindStory(BarStory);
PaddingOuter.args = { ...defaultProps, paddingOuter: 0.8 };
PaddingOuter.parameters = { controls: { include: ['paddingOuter'] } };

// Bar borders share the fill color, so a reduced opacity is needed to see the border style.
const LineType = bindStory(BarStory);
LineType.args = { ...defaultProps, lineType: { value: 'dashed' }, lineWidth: 2, opacity: { value: 0.5 } };
LineType.parameters = { controls: { include: ['lineType'] } };

// Bar borders share the fill color, so a reduced opacity is needed to see the border width.
const LineWidth = bindStory(BarStory);
LineWidth.args = { ...defaultProps, lineWidth: 4, opacity: { value: 0.5 } };
LineWidth.parameters = { controls: { include: ['lineWidth'] } };

const Opacity = bindStory(BarStory);
Opacity.args = { ...defaultProps, opacity: { value: 0.6 } };
Opacity.parameters = { controls: { include: ['opacity'] } };

const ColorOverride = bindStory(ColorOverrideStory);
ColorOverride.args = { ...defaultProps, color: 'status', colorOverride: 'statusColor' };
ColorOverride.parameters = { controls: { include: ['colorOverride'] } };

const DimensionDataType = bindStory(MonthlyBarStory);
DimensionDataType.args = { ...defaultProps, dimension: 'month', dimensionDataType: 'time' };
DimensionDataType.parameters = { controls: { include: ['dimensionDataType'] } };

const OnClick = bindStory(BarStory);
OnClick.args = { ...defaultProps, onClick: action('onClick') };
OnClick.parameters = { controls: { include: [] } };

const OnContextMenu = bindStory(BarStory);
OnContextMenu.args = { ...defaultProps, onContextMenu: action('onContextMenu') };
OnContextMenu.parameters = { controls: { include: [] } };

const OnMouseOver = bindStory(BarStory);
OnMouseOver.args = { ...defaultProps, onMouseOver: action('onMouseOver'), onMouseOut: action('onMouseOut') };
OnMouseOver.parameters = { controls: { include: [] } };

// Hovering a bar or its axis label highlights the bar and shows the tooltip.
const ChartInspectOnBar = bindStory(ChartInspectStory);
ChartInspectOnBar.args = { ...defaultProps };
ChartInspectOnBar.parameters = { controls: { include: [] } };

export {
  Basic,
  Orientation,
  HasSquareCorners,
  PaddingRatio,
  PaddingOuter,
  LineType,
  LineWidth,
  Opacity,
  ColorOverride,
  DimensionDataType,
  OnClick,
  OnContextMenu,
  OnMouseOver,
  ChartInspectOnBar as ChartInspect,
};
