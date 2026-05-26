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
import { Axis, Line, LineForecast } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features/LineForecast',
  component: Line,
};

const forecastData = [
  { datetime: 1704067200000, value: 100, forecastValue: null, series: 'Visitors' },
  { datetime: 1706745600000, value: 110, forecastValue: null, series: 'Visitors' },
  { datetime: 1709251200000, value: 105, forecastValue: null, series: 'Visitors' },
  { datetime: 1711929600000, value: 120, forecastValue: null, series: 'Visitors' },
  { datetime: 1714521600000, value: 130, forecastValue: null, series: 'Visitors' },
  { datetime: 1717200000000, value: 125, forecastValue: null, series: 'Visitors' },
  { datetime: 1719792000000, value: 135, forecastValue: null, series: 'Visitors' },
  { datetime: 1722470400000, value: 140, forecastValue: null, series: 'Visitors' },
  { datetime: 1725148800000, value: null, forecastValue: 148, series: 'Visitors' },
  { datetime: 1727740800000, value: null, forecastValue: 155, series: 'Visitors' },
  { datetime: 1730419200000, value: null, forecastValue: 162, series: 'Visitors' },
  { datetime: 1733011200000, value: null, forecastValue: 158, series: 'Visitors' },
];

// Forecast starts near the end — only 2 forecast points
const forecastDataNearEnd = [
  { datetime: 1704067200000, value: 100, forecastValue: null, series: 'Visitors' },
  { datetime: 1706745600000, value: 110, forecastValue: null, series: 'Visitors' },
  { datetime: 1709251200000, value: 105, forecastValue: null, series: 'Visitors' },
  { datetime: 1711929600000, value: 120, forecastValue: null, series: 'Visitors' },
  { datetime: 1714521600000, value: 130, forecastValue: null, series: 'Visitors' },
  { datetime: 1717200000000, value: 125, forecastValue: null, series: 'Visitors' },
  { datetime: 1719792000000, value: 135, forecastValue: null, series: 'Visitors' },
  { datetime: 1722470400000, value: 140, forecastValue: null, series: 'Visitors' },
  { datetime: 1725148800000, value: 145, forecastValue: null, series: 'Visitors' },
  { datetime: 1727740800000, value: 150, forecastValue: null, series: 'Visitors' },
  { datetime: 1730419200000, value: null, forecastValue: 158, series: 'Visitors' },
  { datetime: 1733011200000, value: null, forecastValue: 162, series: 'Visitors' },
];

// Forecast starts near the beginning — only 2 historical points
const forecastDataEarly = [
  { datetime: 1704067200000, value: 100, forecastValue: null, series: 'Visitors' },
  { datetime: 1706745600000, value: 110, forecastValue: null, series: 'Visitors' },
  { datetime: 1709251200000, value: null, forecastValue: 108, series: 'Visitors' },
  { datetime: 1711929600000, value: null, forecastValue: 120, series: 'Visitors' },
  { datetime: 1714521600000, value: null, forecastValue: 132, series: 'Visitors' },
  { datetime: 1717200000000, value: null, forecastValue: 128, series: 'Visitors' },
  { datetime: 1719792000000, value: null, forecastValue: 138, series: 'Visitors' },
  { datetime: 1722470400000, value: null, forecastValue: 142, series: 'Visitors' },
  { datetime: 1725148800000, value: null, forecastValue: 148, series: 'Visitors' },
  { datetime: 1727740800000, value: null, forecastValue: 155, series: 'Visitors' },
  { datetime: 1730419200000, value: null, forecastValue: 162, series: 'Visitors' },
  { datetime: 1733011200000, value: null, forecastValue: 158, series: 'Visitors' },
];

const defaultChartProps: ChartProps = { data: forecastData, minWidth: 400, maxWidth: 800, height: 400 };

const ForecastStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line {...args}>
        <LineForecast metric="forecastValue" start={1725148800000} label="Forecast" />
      </Line>
    </Chart>
  );
};

const WithForecast = bindWithProps(ForecastStory);
WithForecast.args = {
  color: 'series',
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
};

const WithForecastAndGradient = bindWithProps(ForecastStory);
WithForecastAndGradient.args = {
  color: 'series',
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  gradient: true,
  opacity: { value: 0.5 },
};

const ForecastNearEndStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: forecastDataNearEnd });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line {...args}>
        <LineForecast metric="forecastValue" start={1730419200000} label="Forecast" />
      </Line>
    </Chart>
  );
};

const WithForecastNearEnd = bindWithProps(ForecastNearEndStory);
WithForecastNearEnd.args = {
  color: 'series',
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
};

const ForecastEarlyStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: forecastDataEarly });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line {...args}>
        <LineForecast metric="forecastValue" start={1709251200000} label="Forecast" />
      </Line>
    </Chart>
  );
};

const WithForecastEarly = bindWithProps(ForecastEarlyStory);
WithForecastEarly.args = {
  color: 'series',
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
};

const forecastDataMultiSeries = [
  { datetime: 1704067200000, value: 100, forecastValue: null, series: 'Visitors' },
  { datetime: 1706745600000, value: 110, forecastValue: null, series: 'Visitors' },
  { datetime: 1709251200000, value: 105, forecastValue: null, series: 'Visitors' },
  { datetime: 1711929600000, value: 120, forecastValue: null, series: 'Visitors' },
  { datetime: 1714521600000, value: 130, forecastValue: null, series: 'Visitors' },
  { datetime: 1717200000000, value: 125, forecastValue: null, series: 'Visitors' },
  { datetime: 1719792000000, value: 135, forecastValue: null, series: 'Visitors' },
  { datetime: 1722470400000, value: 140, forecastValue: null, series: 'Visitors' },
  { datetime: 1725148800000, value: null, forecastValue: 148, series: 'Visitors' },
  { datetime: 1727740800000, value: null, forecastValue: 155, series: 'Visitors' },
  { datetime: 1730419200000, value: null, forecastValue: 162, series: 'Visitors' },
  { datetime: 1733011200000, value: null, forecastValue: 158, series: 'Visitors' },
  { datetime: 1704067200000, value: 80,  forecastValue: null, series: 'Pageviews' },
  { datetime: 1706745600000, value: 88,  forecastValue: null, series: 'Pageviews' },
  { datetime: 1709251200000, value: 84,  forecastValue: null, series: 'Pageviews' },
  { datetime: 1711929600000, value: 95,  forecastValue: null, series: 'Pageviews' },
  { datetime: 1714521600000, value: 102, forecastValue: null, series: 'Pageviews' },
  { datetime: 1717200000000, value: 98,  forecastValue: null, series: 'Pageviews' },
  { datetime: 1719792000000, value: 108, forecastValue: null, series: 'Pageviews' },
  { datetime: 1722470400000, value: 112, forecastValue: null, series: 'Pageviews' },
  { datetime: 1725148800000, value: null, forecastValue: 118, series: 'Pageviews' },
  { datetime: 1727740800000, value: null, forecastValue: 124, series: 'Pageviews' },
  { datetime: 1730419200000, value: null, forecastValue: 130, series: 'Pageviews' },
  { datetime: 1733011200000, value: null, forecastValue: 126, series: 'Pageviews' },
];

const ForecastMultiSeriesStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: forecastDataMultiSeries });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line {...args}>
        <LineForecast metric="forecastValue" start={1725148800000} label="Forecast" />
      </Line>
    </Chart>
  );
};

const WithForecastMultiSeries = bindWithProps(ForecastMultiSeriesStory);
WithForecastMultiSeries.args = {
  color: 'series',
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
};

const ForecastCustomLabelStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line {...args}>
        <LineForecast metric="forecastValue" start={1725148800000} label="Projected" />
      </Line>
    </Chart>
  );
};

const WithForecastCustomLabel = bindWithProps(ForecastCustomLabelStory);
WithForecastCustomLabel.args = {
  color: 'series',
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
};

export { WithForecast, WithForecastAndGradient, WithForecastMultiSeries, WithForecastNearEnd, WithForecastEarly, WithForecastCustomLabel };
