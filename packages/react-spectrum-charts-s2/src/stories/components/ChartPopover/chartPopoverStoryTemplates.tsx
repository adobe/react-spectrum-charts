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

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, ChartPopover, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { ChartProps } from '../../../types';
import { ChartPopoverProps } from '../../../types/dialogs/chartPopover.types';
import { browserData as data } from '../../data/data';

export type StoryWithParameters = { parameters?: { controls: { include: string[] } } };

export const setControlInclude = (story: StoryWithParameters, include: string[]) => {
  story.parameters = { controls: { include } };
};

export const dialogContent = (datum: Datum) => (
  <div>
    <div>Operating system: {datum.series}</div>
    <div>Browser: {datum.category}</div>
    <div>Users: {datum.value}</div>
  </div>
);

export const defaultChartProps: ChartProps = { data, renderer: 'svg', width: 600 };

export const BarPopoverStory: StoryFn<ChartPopoverProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Users" />
      <Bar color="series">
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover {...args} />
      </Bar>
      <Legend highlight />
    </Chart>
  );
};
