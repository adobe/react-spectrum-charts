/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ReactElement, useState } from 'react';

import { action } from '@storybook/addon-actions';
import { StoryFn } from '@storybook/react';

import { Datum } from '@spectrum-charts/vega-spec-builder';

import { Chart } from '../../../Chart';
import { Axis, ChartPopover, ChartTooltip, Legend, Line, ReferenceLine } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import {
  simpleSparklineData,
  workspaceTrendsData,
  workspaceTrendsDataWithVisiblePoints,
  workspaceTrendsDataWithGaps,
} from '../../../stories/data/data';
import { formatTimestamp } from '../../../stories/storyUtils';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'RSC/Line',
  component: Line,
};

const historicalCompareData = [
  { datetime: 1667890800000, users: 147, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1667890800000, users: 477, series: 'Add Fallout', period: 'Current' },
  { datetime: 1667977200000, users: 148, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1667977200000, users: 481, series: 'Add Fallout', period: 'Current' },
  { datetime: 1668063600000, users: 148, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1668063600000, users: 483, series: 'Add Fallout', period: 'Current' },
  { datetime: 1668150000000, users: 131, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1668150000000, users: 310, series: 'Add Fallout', period: 'Current' },
  { datetime: 1668236400000, users: 11, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1668236400000, users: 18, series: 'Add Fallout', period: 'Current' },
  { datetime: 1668322800000, users: 17, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1668322800000, users: 70, series: 'Add Fallout', period: 'Current' },
  { datetime: 1668409200000, users: 143, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1668409200000, users: 438, series: 'Add Fallout', period: 'Current' },
  { datetime: 1667890800000, users: 1525, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1667890800000, users: 5253, series: 'Add Freeform table', period: 'Current' },
  { datetime: 1667977200000, users: 1510, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1667977200000, users: 5103, series: 'Add Freeform table', period: 'Current' },
  { datetime: 1668063600000, users: 1504, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1668063600000, users: 5047, series: 'Add Freeform table', period: 'Current' },
  { datetime: 1668150000000, users: 1338, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1668150000000, users: 3386, series: 'Add Freeform table', period: 'Current' },
  { datetime: 1668236400000, users: 120, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1668236400000, users: 205, series: 'Add Freeform table', period: 'Current' },
  { datetime: 1668322800000, users: 179, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1668322800000, users: 790, series: 'Add Freeform table', period: 'Current' },
  { datetime: 1668409200000, users: 1491, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1668409200000, users: 4913, series: 'Add Freeform table', period: 'Current' },
];

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const sparklineChartProps: ChartProps = { data: simpleSparklineData, minWidth: 50, maxWidth: 200, height: 50 };

const BasicLineStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Line {...args} />
      <Legend lineWidth={{ value: 0 }} />
    </Chart>
  );
};
const LinearStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="linear" baseline ticks>
        <ReferenceLine value={13} />
      </Axis>
      <Line {...args} />
    </Chart>
  );
};

const LineStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight />
    </Chart>
  );
};

const LineStoryWithUTCData: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({
    ...defaultChartProps,
    data: workspaceTrendsData.map((d) => ({ ...d, datetime: new Date(d.datetime).toISOString() })),
  });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight />
    </Chart>
  );
};

const HistoricalCompareStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({
    ...defaultChartProps,
    data: historicalCompareData,
    width: 600,
    opacities: [0.5, 1],
    lineTypes: ['dotted', 'solid'],
  });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight opacity="period" />
    </Chart>
  );
};

const LineWithVisiblePointsStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: workspaceTrendsDataWithVisiblePoints });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight />
    </Chart>
  );
};

const PlainLineStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(sparklineChartProps);
  return (
    <Chart {...chartProps}>
      <Line {...args} />
    </Chart>
  );
};

const WithGapsInDataStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: workspaceTrendsDataWithGaps });
  return (
    <Chart {...chartProps}>
       <Axis position="left" grid title="Users" />
       <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight />
    </Chart>
  );
};

const defaultArgs = {
  color: 'series',
  name: 'line0',
  onClick: undefined,
  onMouseOver: undefined,
  onMouseOut: undefined,
};

const Basic = bindWithProps(BasicLineStory);
Basic.args = {
  ...defaultArgs,
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
};

const LineWithAxisAndLegend = bindWithProps(LineStory);
LineWithAxisAndLegend.args = {
  ...defaultArgs,
  dimension: 'datetime',
  metric: 'users',
  scaleType: 'time',
};

const LineWithUTCDatetimeFormat = bindWithProps(LineStoryWithUTCData);
LineWithUTCDatetimeFormat.args = {
  ...defaultArgs,
  dimension: 'datetime',
  metric: 'users',
  scaleType: 'time',
};

const LineType = bindWithProps(BasicLineStory);
LineType.args = {
  ...defaultArgs,
  lineType: 'series',
};

const Opacity = bindWithProps(BasicLineStory);
Opacity.args = {
  ...defaultArgs,
  opacity: { value: 0.6 },
};

const TrendScale = bindWithProps(LineStory);
TrendScale.args = {
  ...defaultArgs,
  scaleType: 'point',
};

const LinearTrendScale = bindWithProps(LinearStory);
LinearTrendScale.args = {
  ...defaultArgs,
  dimension: 'point',
  scaleType: 'linear',
};

const HistoricalCompare = bindWithProps(HistoricalCompareStory);
HistoricalCompare.args = {
  ...defaultArgs,
  dimension: 'datetime',
  lineType: 'period',
  metric: 'users',
  scaleType: 'time',
};

const Tooltip = bindWithProps(BasicLineStory);
Tooltip.args = {
  ...defaultArgs,
  children: (
    <ChartTooltip>
      {(datum) => (
        <div className="bar-tooltip">
          <div>{formatTimestamp(datum.datetime as number)}</div>
          <div>Event: {datum.series}</div>
          <div>Users: {Number(datum.value).toLocaleString()}</div>
        </div>
      )}
    </ChartTooltip>
  ),
};

const ItemTooltip = bindWithProps(BasicLineStory);
ItemTooltip.args = {
  ...Tooltip.args,
  interactionMode: 'item',
};

const WithStaticPoints = bindWithProps(LineWithVisiblePointsStory);
WithStaticPoints.args = {
  ...defaultArgs,
  dimension: 'datetime',
  metric: 'value',
  staticPoint: 'staticPoint',
};

/** Generates identical return callbacks but each has a custom Storybook Action Name for a better dev experience. */
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

const WithStaticPointsAndDialogs = bindWithProps(LineWithVisiblePointsStory);
WithStaticPointsAndDialogs.args = {
  ...defaultArgs,
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  staticPoint: 'staticPoint',
  children: [
    <ChartTooltip key={0}>{generateCallback('tooltip')}</ChartTooltip>,
    <ChartPopover width="auto" key={1}>
      {generateCallback('popover')}
    </ChartPopover>,
  ],
};

const BasicSparkline = bindWithProps(PlainLineStory);
BasicSparkline.args = {
  ...defaultArgs,
  metric: 'y',
  dimension: 'x',
  staticPoint: 'staticPoint',
  scaleType: 'linear',
  isSparkline: true,
};

const SparklineWithStaticPoint = bindWithProps(PlainLineStory);
SparklineWithStaticPoint.args = {
  ...defaultArgs,
  metric: 'y',
  dimension: 'x',
  staticPoint: 'staticPoint',
  scaleType: 'linear',
  isSparkline: true,
  isMethodLast: true,
};

const OnClick = bindWithProps(BasicLineStory);
OnClick.args = {
  ...defaultArgs,
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  onClick: action('onClick'),
};

const OnClickWithTooltip = bindWithProps(BasicLineStory);
OnClickWithTooltip.args = {
  ...Tooltip.args,
  ...OnClick.args,
};

const WithGapsInData = bindWithProps(WithGapsInDataStory);
WithGapsInData.args = {
  ...defaultArgs,
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  onMouseOver: () => {},
  onMouseOut: () => {},
  children: (
    <ChartTooltip>
      {(datum) => (
        <div className="line-tooltip">
          <div>{formatTimestamp(datum.datetime as number)}</div>
          <div>Event: {datum.series}</div>
          <div>Users: {Number(datum.value).toLocaleString()}</div>
        </div>
      )}
    </ChartTooltip>
  ),
  interactionMode: 'item',
};

const OnMouseInputsStory: StoryFn<typeof Line> = (args): ReactElement => {
  const [hoveredData, setHoveredData] = useState<Datum | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const controlledMouseOver = (datum: Datum) => {
    if (!isHovering) {
      setHoveredData(datum);
      setIsHovering(true);
    }
  };
  const controlledMouseOut = () => {
    if (isHovering) {
      setIsHovering(false);
    }
  };

  const chartProps = useChartProps(defaultChartProps);
  return (
    <div>
      <div data-testid="hover-info" style={{ width: '800px', height: '100px' }}>
          {isHovering && hoveredData ? (
            <div data-testid="hover-data">{JSON.stringify(hoveredData, null, 2)}</div>
          ) : (
            <div data-testid="no-hover">No point hovered</div>
          )}
      </div>
        <Chart {...chartProps}>
          <Axis position="left" grid title="Users" />
          <Axis position="bottom" labelFormat="time" baseline ticks />
          <Line {...args} onMouseOver={controlledMouseOver} onMouseOut={controlledMouseOut} />
          <Legend highlight />
        </Chart>
    </div>
  );
};

const OnMouseInputs = bindWithProps(OnMouseInputsStory);
OnMouseInputs.args = {
  ...defaultArgs,
  dimension: 'datetime',
  metric: 'users',
  scaleType: 'time',
};

export {
  Basic,
  HistoricalCompare,
  LineType,
  LineWithAxisAndLegend,
  LineWithUTCDatetimeFormat,
  LinearTrendScale,
  Opacity,
  Tooltip,
  ItemTooltip,
  TrendScale,
  WithStaticPoints,
  WithStaticPointsAndDialogs,
  BasicSparkline,
  SparklineWithStaticPoint,
  OnClick,
  OnClickWithTooltip,
  OnMouseInputs,
  WithGapsInData,
};
