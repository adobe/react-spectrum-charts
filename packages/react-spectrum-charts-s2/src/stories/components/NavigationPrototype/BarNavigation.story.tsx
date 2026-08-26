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

import { SpectrumColor } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, ChartPopover, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { barSeriesData } from '../Bar/data';

export default {
  title: 'React Spectrum Charts 2/NavigationPrototype/Features/Bar Navigation',
};

/**
 * Stacked bar navigation. With `accessibleNavigation`, the data-navigator exposes an "Enter navigation
 * area" affordance (Tab to it, press Enter), then ← / → move between bars/segments. Each focused
 * bar draws a focus ring via the Vega canvas; keyboard focus also drives the same `FOCUSED_ITEM` /
 * `FOCUSED_DIMENSION` / `FOCUSED_SERIES` signals that mouse hover does.
 */
const BarNavigationStory: StoryFn = (): ReactElement => {
  const chartProps = useChartProps({
    data: barSeriesData,
    width: 800,
    height: 600,
    accessibleNavigation: true,
  });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Downloads" />
      <Bar dimension="browser" order="order" color="operatingSystem">
        <ChartInspect>
          {(datum) => (
            <div>
              Operating system: {datum.operatingSystem}
              <br />
              Browser: {datum.browser}
              <br />
              Downloads: {datum.value}
            </div>
          )}
        </ChartInspect>
        <ChartPopover width={200}>
          {(datum) => (
            <div>
              Operating system: {datum.operatingSystem}
              <br />
              Browser: {datum.browser}
              <br />
              Downloads: {datum.value}
            </div>
          )}
        </ChartPopover>
      </Bar>
      <Legend title="Operating system" color="operatingSystem" highlight />
    </Chart>
  );
};

export const BarNavigation = BarNavigationStory.bind({});
