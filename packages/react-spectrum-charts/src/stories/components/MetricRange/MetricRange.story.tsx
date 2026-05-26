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
import React, { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import { Content } from '@adobe/react-spectrum';

import { Chart } from '../../../Chart';
import { Axis, ChartPopover, ChartTooltip, Legend, Line, MetricRange, Trendline } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';
import { workspaceTrendsDataWithAnomalies, workspaceTrendsDataWithBoundaryMetricRange, workspaceTrendsDataWithExtremeMetricRange, workspaceTrendsDataWithForecast, workspaceTrendsDataWithNullsInMetricRange, workspaceTrendsDataWithOutOfDomainMetricRange } from '../../data/data';

export default {
  title: 'RSC/MetricRange',
  component: MetricRange,
};

const defaultChartProps: ChartProps = {
  data: workspaceTrendsDataWithAnomalies,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
};

const MetricRangeStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <MetricRange {...args} />
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const MetricRangeWithStaticPointsStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series" staticPoint="staticPoint">
        <MetricRange {...args} />
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const MetricRangeWithPopoverStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <MetricRange {...args} />
        <ChartTooltip>{dialogContent}</ChartTooltip>
        <ChartPopover width={200}>{dialogContent}</ChartPopover>
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const MetricRangeWithHoverPointsStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: workspaceTrendsDataWithForecast });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <MetricRange {...args} />
        <ChartTooltip>{dialogContent}</ChartTooltip>
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const MetricRangeScaleAxisToFitStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps({
    ...defaultChartProps,
    data: workspaceTrendsDataWithExtremeMetricRange,
  });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <MetricRange {...args} />
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const LineOpacityByKeyStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps({
    ...defaultChartProps,
    opacities: [0.5, 1],
  });
  
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <MetricRange {...args} />
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight opacity="series" />
    </Chart>
  );
};

const MetricRangeWithHoverPointsOutsideDomainStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: workspaceTrendsDataWithOutOfDomainMetricRange });
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <MetricRange {...args} />
        <ChartTooltip>{dialogContent}</ChartTooltip>
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const MetricRangeWithHoverPointsAtDomainBoundaryStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: workspaceTrendsDataWithBoundaryMetricRange });
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <MetricRange {...args} />
        <ChartTooltip>{dialogContent}</ChartTooltip>
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const MetricRangeWithBreaksStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps({
    ...defaultChartProps,
    data: workspaceTrendsDataWithNullsInMetricRange,
  });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Value" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <MetricRange {...args} />
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const dialogContent = (datum) => (
  <Content>
    <div>Operating system: {datum.series}</div>
    {datum.category && <div>Browser: {datum.category}</div>}
    <div>Users: {datum.value ?? datum.metric}</div>
  </Content>
);

const MetricRangeWithTooltipDimensionStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series" interactionMode="dimension">
        <MetricRange {...args} />
        <ChartTooltip>{dialogContent}</ChartTooltip>
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const MetricRangeWithControlledHighlightStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, highlightedSeries: 'Add Fallout' });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series">
        <MetricRange {...args} />
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const MetricRangeWithTrendlineAndDimensionStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line color="series" interactionMode="dimension">
        <MetricRange {...args} />
        <ChartTooltip>{dialogContent}</ChartTooltip>
        <Trendline method="linear" lineType="dashed" lineWidth="S">
          <ChartTooltip>{dialogContent}</ChartTooltip>
        </Trendline>
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const MetricRangeLinearScaleWithTrendlineStory: StoryFn<typeof MetricRange> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="linear" baseline ticks />
      <Line color="series" scaleType="linear" dimension="point">
        <MetricRange {...args} />
        <ChartTooltip>{dialogContent}</ChartTooltip>
        <Trendline method="linear" lineType="dashed" lineWidth="S">
          <ChartTooltip>{dialogContent}</ChartTooltip>
        </Trendline>
      </Line>
      <Legend lineWidth={{ value: 0 }} highlight />
    </Chart>
  );
};

const Basic = bindWithProps(MetricRangeStory);
Basic.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
};

const DisplayOnHover = bindWithProps(MetricRangeStory);
DisplayOnHover.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  displayOnHover: true,
};

const DisplayOnHoverDimension = bindWithProps(MetricRangeWithTooltipDimensionStory);
DisplayOnHoverDimension.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  displayOnHover: true,
};

const DisplayOnHoverTrendlineDimension = bindWithProps(MetricRangeWithTrendlineAndDimensionStory);
DisplayOnHoverTrendlineDimension.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  displayOnHover: true,
};

const DisplayOnHoverControlled = bindWithProps(MetricRangeWithControlledHighlightStory);
DisplayOnHoverControlled.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  displayOnHover: true,
};

const WithStaticPoints = bindWithProps(MetricRangeWithStaticPointsStory);
WithStaticPoints.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  displayOnHover: true,
};

const WithPopover = bindWithProps(MetricRangeWithPopoverStory);
WithPopover.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  displayOnHover: true,
};

const ScaleAxisToFit = bindWithProps(MetricRangeScaleAxisToFitStory);
ScaleAxisToFit.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  scaleAxisToFit: true,
};

const LineOpacity = bindWithProps(MetricRangeStory);
LineOpacity.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  lineOpacity: { value: 0.5 },
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
};

const LineOpacityByKey = bindWithProps(LineOpacityByKeyStory);
LineOpacityByKey.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  lineOpacity: 'series',
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
};

const WithBreaks = bindWithProps(MetricRangeWithBreaksStory);
WithBreaks.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
};

const DisplayOnHoverLinearWithTrendline = bindWithProps(MetricRangeLinearScaleWithTrendlineStory);
DisplayOnHoverLinearWithTrendline.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  displayOnHover: true,
  hoverPoint: true,
};

const WithHoverPoints = bindWithProps(MetricRangeWithHoverPointsStory);
WithHoverPoints.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  hoverPoint: true,
};

// Forecast metric at the first forecast row (3738) equals exactly the max historical value,
// placing the hover point at the very top boundary of the y domain. Verifies that clip: true
// does not clip points sitting exactly on the domain edge — they should be fully visible.
const WithHoverPointsAtDomainBoundary = bindWithProps(MetricRangeWithHoverPointsAtDomainBoundaryStory);
WithHoverPointsAtDomainBoundary.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  hoverPoint: true,
  scaleAxisToFit: false,
};

// Hover points on forecast rows whose metric values (5000–9500) exceed the y domain (~200–3738).
// Toggle scaleAxisToFit to expand the y domain to include metric range values.
// Without clip:true on the hover point marks, points render above the chart and cause flickering.
const WithHoverPointsOutsideDomain = bindWithProps(MetricRangeWithHoverPointsOutsideDomainStory);
WithHoverPointsOutsideDomain.args = {
  lineType: 'shortDash',
  lineWidth: 'S',
  rangeOpacity: 0.2,
  metricEnd: 'metricEnd',
  metricStart: 'metricStart',
  metric: 'metric',
  hoverPoint: true,
  scaleAxisToFit: false,
};

export {
  Basic,
  DisplayOnHover,
  DisplayOnHoverDimension,
  DisplayOnHoverTrendlineDimension,
  DisplayOnHoverLinearWithTrendline,
  DisplayOnHoverControlled,
  WithStaticPoints,
  WithPopover,
  ScaleAxisToFit,
  LineOpacity,
  LineOpacityByKey,
  WithBreaks,
  WithHoverPoints,
  WithHoverPointsAtDomainBoundary,
  WithHoverPointsOutsideDomain,
};
