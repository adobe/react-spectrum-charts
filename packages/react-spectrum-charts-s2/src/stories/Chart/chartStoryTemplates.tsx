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

import useChartProps from '../../hooks/useChartProps.js';
import { Axis, Bar, Chart, ChartInspect, Legend, Line } from '../../index.js';

export type StoryWithParameters = { parameters?: { controls: { include: string[] } } };

export const setControlInclude = (story: StoryWithParameters, include: string[]) => {
  story.parameters = { controls: { include } };
};

export const ChartLineStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline title="Month" />
      <Axis position="left" grid title="Accounts" />
      <Line dimension="x" metric="y" color="series" scaleType="point" />
      <Legend highlight />
    </Chart>
  );
};

export const ChartBarStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline title="Month" />
      <Axis position="left" grid title="Accounts" />
      <Bar dimension="x" metric="y" color="series" />
      <Legend highlight />
    </Chart>
  );
};

export const ChartBarInspectStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const props = useChartProps(args);
  return (
    <Chart {...props}>
      <Axis position="bottom" baseline title="Month" />
      <Axis position="left" grid title="Accounts" />
      <Bar dimension="x" metric="y" color="series">
        <ChartInspect>
          {(datum) => (
            <div className="bar-tooltip">
              <div>Month: {datum.x}</div>
              <div>Segment: {datum.series}</div>
              <div>Accounts: {datum.y}</div>
            </div>
          )}
        </ChartInspect>
      </Bar>
      <Legend highlight />
    </Chart>
  );
};
