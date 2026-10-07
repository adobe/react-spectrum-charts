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

import { Chart } from '../../../Chart';
import { Axis, ChartInspect, Legend, Line, LineDirectLabel } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../storyShared/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

const labelCollisionData = workspaceTrendsData.map((d) =>
  d.series === 'Add Line viz' && d.datetime === 1668409200000 ? { ...d, users: 3500 } : d
);

export default {
  title: 'React Spectrum Charts 2/Line/Regressions/Direct Label',
  component: LineDirectLabel,
};

const defaultChartProps: ChartProps = {
  data: workspaceTrendsData,
  minWidth: 100,
  maxWidth: 1000,
  height: 400,
  backgroundColor: 'gray-50',
};

const LineDirectLabelLabelCollisionStory: StoryFn<typeof LineDirectLabel> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: labelCollisionData });
  return (
    <Chart {...chartProps} debug>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time">
        <LineDirectLabel {...args} />
        <ChartInspect>{(datum: Record<string, string>) => <div>{datum.users}</div>}</ChartInspect>
      </Line>
      <Legend highlight />
    </Chart>
  );
};

const DirectLabelLabelCollision = bindWithProps(LineDirectLabelLabelCollisionStory);
DirectLabelLabelCollision.args = { value: 'series', excludeSeries: ['Add Line viz'] };

DirectLabelLabelCollision.parameters = {
  ...DirectLabelLabelCollision.parameters,
  regression: {
    description:
      'Hovering a series faded direct label background halos and drew the hovered line beneath overlapping labels of other series.',
    pr: 817,
  },
};

export { DirectLabelLabelCollision };
