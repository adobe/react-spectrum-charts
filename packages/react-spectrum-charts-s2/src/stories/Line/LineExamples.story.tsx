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

import { Chart } from '../../Chart';
import { Axis, Legend, Line, Title } from '../../components';
import useChartProps from '../../hooks/useChartProps';
import { bindWithProps } from '../../test-utils';
import { ChartProps } from '../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Examples',
  component: Line,
};

// User retention by cohort — all cohorts start at 100% (1.0) at week 0.
// Values are 0–1 so labelFormat="percentage" renders 0%, 50%, 100%.
// X-axis: weeks since first seen (0–12), matching the Figma design.
// Values sampled directly from the Figma bezier control points at sub-week intervals (0.25, 0.5,
// 0.75) for weeks 0–1 to reproduce the steep initial drop each cohort exhibits. Without sub-week
// samples, monotone cubic interpolation through weekly points produces a visually flatter early
// descent that doesn't match the Figma design.
const userRetentionByCohortData = [
  { week: 0,    retentionRate: 1.000, cohort: 'Power' },
  { week: 0.25, retentionRate: 0.920, cohort: 'Power' },
  { week: 0.5,  retentionRate: 0.855, cohort: 'Power' },
  { week: 0.75, retentionRate: 0.800, cohort: 'Power' },
  { week: 1,    retentionRate: 0.753, cohort: 'Power' },
  { week: 2,    retentionRate: 0.611, cohort: 'Power' },
  { week: 3,    retentionRate: 0.515, cohort: 'Power' },
  { week: 4,    retentionRate: 0.447, cohort: 'Power' },
  { week: 5,    retentionRate: 0.397, cohort: 'Power' },
  { week: 6,    retentionRate: 0.359, cohort: 'Power' },
  { week: 7,    retentionRate: 0.331, cohort: 'Power' },
  { week: 8,    retentionRate: 0.311, cohort: 'Power' },
  { week: 9,    retentionRate: 0.297, cohort: 'Power' },
  { week: 10,   retentionRate: 0.287, cohort: 'Power' },
  { week: 11,   retentionRate: 0.282, cohort: 'Power' },
  { week: 12,   retentionRate: 0.281, cohort: 'Power' },
  { week: 0,    retentionRate: 1.000, cohort: 'Regular' },
  { week: 0.25, retentionRate: 0.881, cohort: 'Regular' },
  { week: 0.5,  retentionRate: 0.791, cohort: 'Regular' },
  { week: 0.75, retentionRate: 0.719, cohort: 'Regular' },
  { week: 1,    retentionRate: 0.658, cohort: 'Regular' },
  { week: 2,    retentionRate: 0.484, cohort: 'Regular' },
  { week: 3,    retentionRate: 0.370, cohort: 'Regular' },
  { week: 4,    retentionRate: 0.288, cohort: 'Regular' },
  { week: 5,    retentionRate: 0.228, cohort: 'Regular' },
  { week: 6,    retentionRate: 0.183, cohort: 'Regular' },
  { week: 7,    retentionRate: 0.150, cohort: 'Regular' },
  { week: 8,    retentionRate: 0.125, cohort: 'Regular' },
  { week: 9,    retentionRate: 0.108, cohort: 'Regular' },
  { week: 10,   retentionRate: 0.096, cohort: 'Regular' },
  { week: 11,   retentionRate: 0.090, cohort: 'Regular' },
  { week: 12,   retentionRate: 0.088, cohort: 'Regular' },
  { week: 0,    retentionRate: 1.000, cohort: 'Casual' },
  { week: 0.25, retentionRate: 0.834, cohort: 'Casual' },
  { week: 0.5,  retentionRate: 0.672, cohort: 'Casual' },
  { week: 0.75, retentionRate: 0.574, cohort: 'Casual' },
  { week: 1,    retentionRate: 0.506, cohort: 'Casual' },
  { week: 2,    retentionRate: 0.344, cohort: 'Casual' },
  { week: 3,    retentionRate: 0.252, cohort: 'Casual' },
  { week: 4,    retentionRate: 0.189, cohort: 'Casual' },
  { week: 5,    retentionRate: 0.144, cohort: 'Casual' },
  { week: 6,    retentionRate: 0.111, cohort: 'Casual' },
  { week: 7,    retentionRate: 0.087, cohort: 'Casual' },
  { week: 8,    retentionRate: 0.069, cohort: 'Casual' },
  { week: 9,    retentionRate: 0.056, cohort: 'Casual' },
  { week: 10,   retentionRate: 0.048, cohort: 'Casual' },
  { week: 11,   retentionRate: 0.044, cohort: 'Casual' },
  { week: 12,   retentionRate: 0.042, cohort: 'Casual' },
  { week: 0,    retentionRate: 1.000, cohort: 'Trial' },
  { week: 0.25, retentionRate: 0.738, cohort: 'Trial' },
  { week: 0.5,  retentionRate: 0.529, cohort: 'Trial' },
  { week: 0.75, retentionRate: 0.422, cohort: 'Trial' },
  { week: 1,    retentionRate: 0.356, cohort: 'Trial' },
  { week: 2,    retentionRate: 0.222, cohort: 'Trial' },
  { week: 3,    retentionRate: 0.157, cohort: 'Trial' },
  { week: 4,    retentionRate: 0.117, cohort: 'Trial' },
  { week: 5,    retentionRate: 0.091, cohort: 'Trial' },
  { week: 6,    retentionRate: 0.072, cohort: 'Trial' },
  { week: 7,    retentionRate: 0.059, cohort: 'Trial' },
  { week: 8,    retentionRate: 0.050, cohort: 'Trial' },
  { week: 9,    retentionRate: 0.044, cohort: 'Trial' },
  { week: 10,   retentionRate: 0.040, cohort: 'Trial' },
  { week: 11,   retentionRate: 0.038, cohort: 'Trial' },
  { week: 12,   retentionRate: 0.038, cohort: 'Trial' },
];

const chartProps: ChartProps = {
  data: userRetentionByCohortData,
  width: 573,
  height: 394,
};

const UserRetentionCohortStory: StoryFn<typeof Line> = (args): ReactElement => {
  const props = useChartProps(chartProps);
  return (
    <Chart {...props}>
      <Title text="User retention by cohort" fontSize={22} />
      <Legend position="top" highlight labelLimit={60} />
      <Axis position="left" grid labelFormat="percentage" tickMinStep={0.5} />
      <Axis position="bottom" title="Weeks since first seen" baseline ticks tickMinStep={1} />
      <Line {...args} />
    </Chart>
  );
};

export const UserRetentionCohort = bindWithProps(UserRetentionCohortStory);
UserRetentionCohort.args = {
  color: 'cohort',
  name: 'line0',
  dimension: 'week',
  metric: 'retentionRate',
  scaleType: 'linear',
  interpolate: 'monotone',
};
