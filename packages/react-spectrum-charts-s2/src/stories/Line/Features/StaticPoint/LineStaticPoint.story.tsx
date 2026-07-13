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

import { CHART_SIZE_BREAKPOINTS, CHART_SIZE_POINT_SIZES } from '@spectrum-charts/constants';

import { Chart } from '../../../../Chart';
import { Axis, ChartInspect, Legend, Line } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsDataWithVisiblePoints } from '../../../../stories/data/data';
import { CHART_SIZE_THRESHOLDS, ResizableChart, formatTimestamp } from '../../../../stories/storyUtils';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features/StaticPoint',
  component: Line,
};

const defaultChartProps: ChartProps = {
  data: workspaceTrendsDataWithVisiblePoints,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
};

const LineWithStaticPointStory: StoryFn<typeof Line> = (args): ReactElement => {
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

/**
 * S2 static points render as a solid filled circle (series color) with a background-colored
 * halo ring behind it. The halo uses BACKGROUND_COLOR so it tracks the chart's backgroundColor
 * prop at runtime.
 */
const StaticPointSolidFill = bindWithProps(LineWithStaticPointStory);
StaticPointSolidFill.args = {
  color: 'series',
  name: 'line0',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time',
  staticPoint: 'staticPoint',
};

const POINT_DIAMETERS: Record<string, string> = {
  S: `${Math.sqrt(CHART_SIZE_POINT_SIZES.S)}px`,
  M: `${Math.sqrt(CHART_SIZE_POINT_SIZES.M)}px`,
  L: `${Math.sqrt(CHART_SIZE_POINT_SIZES.L)}px`,
};

const StaticPointSizeAutoDetectStory = (): ReactElement => (
  <ResizableChart
    thresholds={CHART_SIZE_THRESHOLDS}
    renderLabel={(width) => {
      let currentSize = 'L';
      if (width < CHART_SIZE_BREAKPOINTS.M) currentSize = 'S';
      else if (width < CHART_SIZE_BREAKPOINTS.L) currentSize = 'M';
      return (
        <>
          Width: <strong>{Math.round(width)}px</strong> — Size tier: <strong>{currentSize}</strong> — Point diameter:{' '}
          <strong>{POINT_DIAMETERS[currentSize]}</strong>
        </>
      );
    }}
  >
    <Chart data={workspaceTrendsDataWithVisiblePoints} width="auto" height={300}>
      <Axis position="bottom" baseline ticks labelFormat="time" />
      <Axis position="left" grid />
      <Line dimension="datetime" metric="value" color="series" scaleType="time" staticPoint="staticPoint">
        <ChartInspect>
          {(datum) => (
            <div>
              <div>{formatTimestamp(datum.datetime as number)}</div>
              <div>Event: {datum.series as string}</div>
              <div>Users: {Number(datum.value).toLocaleString()}</div>
            </div>
          )}
        </ChartInspect>
      </Line>
    </Chart>
  </ResizableChart>
);

export const StaticPointSizeAutoDetect = StaticPointSizeAutoDetectStory;

export { StaticPointSolidFill };
