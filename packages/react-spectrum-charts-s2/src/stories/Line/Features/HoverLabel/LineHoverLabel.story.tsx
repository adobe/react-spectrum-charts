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
import { Axis, Legend, Line } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../data/data';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

const DATETIMES = [1667890800000, 1667977200000, 1668063600000, 1668150000000, 1668236400000, 1668322800000, 1668409200000];
const manySeriesData = Array.from({ length: 25 }, (_, i) =>
  DATETIMES.map((datetime, j) => ({
    datetime,
    series: `Series ${i + 1}`,
    value: Math.round(1000 + Math.sin((i + j) * 0.8) * 800 + Math.cos(i * 0.5) * 500 + j * 120),
  }))
).flat();

export default {
  title: 'React Spectrum Charts 2/Line/Features/HoverLabel',
  component: Line,
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const HoverLabelStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line {...args} />
      <Legend lineWidth={{ value: 0 }} />
    </Chart>
  );
};

export const WithHoverLabel = bindWithProps(HoverLabelStory);
WithHoverLabel.args = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  showHoverLabel: true,
};

export const WithoutHoverLabel = bindWithProps(HoverLabelStory);
WithoutHoverLabel.args = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  showHoverLabel: false,
};

export const DimensionHover = bindWithProps(HoverLabelStory);
DimensionHover.args = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  showHoverLabel: true,
  dimensionHover: true,
};

const ManySeriesStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps({ data: manySeriesData, minWidth: 400, maxWidth: 800, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" />
      <Line {...args} />
    </Chart>
  );
};

export const DimensionHoverManySeries = bindWithProps(ManySeriesStory);
DimensionHoverManySeries.args = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  showHoverLabel: true,
  dimensionHover: true,
};
