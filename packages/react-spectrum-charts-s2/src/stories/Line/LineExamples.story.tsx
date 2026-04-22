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
import { Axis, Legend, Line, LineDirectLabel, ReferenceLine, Title } from '../../components';
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
  { week: 0,    retentionRate: 1,     cohort: 'Power' },
  { week: 0.25, retentionRate: 0.92,  cohort: 'Power' },
  { week: 0.5,  retentionRate: 0.855, cohort: 'Power' },
  { week: 0.75, retentionRate: 0.8,   cohort: 'Power' },
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
  { week: 0,    retentionRate: 1,     cohort: 'Regular' },
  { week: 0.25, retentionRate: 0.881, cohort: 'Regular' },
  { week: 0.5,  retentionRate: 0.791, cohort: 'Regular' },
  { week: 0.75, retentionRate: 0.719, cohort: 'Regular' },
  { week: 1,    retentionRate: 0.658, cohort: 'Regular' },
  { week: 2,    retentionRate: 0.484, cohort: 'Regular' },
  { week: 3,    retentionRate: 0.37,  cohort: 'Regular' },
  { week: 4,    retentionRate: 0.288, cohort: 'Regular' },
  { week: 5,    retentionRate: 0.228, cohort: 'Regular' },
  { week: 6,    retentionRate: 0.183, cohort: 'Regular' },
  { week: 7,    retentionRate: 0.15,  cohort: 'Regular' },
  { week: 8,    retentionRate: 0.125, cohort: 'Regular' },
  { week: 9,    retentionRate: 0.108, cohort: 'Regular' },
  { week: 10,   retentionRate: 0.096, cohort: 'Regular' },
  { week: 11,   retentionRate: 0.09,  cohort: 'Regular' },
  { week: 12,   retentionRate: 0.088, cohort: 'Regular' },
  { week: 0,    retentionRate: 1,     cohort: 'Casual' },
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
  { week: 0,    retentionRate: 1,     cohort: 'Trial' },
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
  { week: 8,    retentionRate: 0.05,  cohort: 'Trial' },
  { week: 9,    retentionRate: 0.044, cohort: 'Trial' },
  { week: 10,   retentionRate: 0.04,  cohort: 'Trial' },
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

// Total visits vs. target — single line showing % change from target over Jul–Dec 2024.
// Values are derived from Figma bezier endpoint y-coordinates mapped to the ±30% scale.
// Reference line at 0 marks the "Target" baseline; direct label shows the series name.
const totalVisitsData = [
  { datetime: 1719792000000, percentChange: -0.133, series: 'Total visits' },
  { datetime: 1721001600000, percentChange: -0.199, series: 'Total visits' },
  { datetime: 1722470400000, percentChange: -0.132, series: 'Total visits' },
  { datetime: 1723680000000, percentChange: -0.09,  series: 'Total visits' },
  { datetime: 1725148800000, percentChange: -0.162, series: 'Total visits' },
  { datetime: 1726358400000, percentChange: -0.051, series: 'Total visits' },
  { datetime: 1727740800000, percentChange:  0.027, series: 'Total visits' },
  { datetime: 1728950400000, percentChange:  0.138, series: 'Total visits' },
  { datetime: 1730419200000, percentChange:  0.099, series: 'Total visits' },
  { datetime: 1731628800000, percentChange:  0.028, series: 'Total visits' },
  { datetime: 1733011200000, percentChange:  0.138, series: 'Total visits' },
  { datetime: 1734220800000, percentChange:  0.17,  series: 'Total visits' },
];

const totalVisitsChartProps: ChartProps = {
  data: totalVisitsData,
  width: 900,
  height: 336,
};

const TotalVisitsLStory: StoryFn<typeof Line> = (args): ReactElement => {
  const props = useChartProps(totalVisitsChartProps);
  return (
    <Chart {...props} debug>
      <Title text="Total visits reached 18.9M in Dec 2024" />
      <Axis position="right" grid labelFormat="percentage" range={[-0.3, 0.3]} tickMinStep={0.3}>
        <ReferenceLine value={0} label="Target" />
      </Axis>
      <Axis position="bottom" labelFormat="time" granularity="month" baseline ticks />
      <Line {...args}>
        <LineDirectLabel value="series" />
      </Line>
    </Chart>
  );
};

export const TotalVisitsL = bindWithProps(TotalVisitsLStory);
TotalVisitsL.args = {
  color: 'series',
  dimension: 'datetime',
  metric: 'percentChange',
  scaleType: 'time',
};

// Paid media impact — single series showing how revenue grows as spend increases.
// Spend and revenue are stored as actual dollar amounts so shortCurrency formatting
// renders $100M, $200M, etc. Data points sampled from the Figma bezier path.
const paidMediaData = [
  { spend:           0, revenue:           0, series: 'Revenue' },
  { spend:   6_000_000, revenue:  68_000_000, series: 'Revenue' },
  { spend:  17_000_000, revenue: 137_000_000, series: 'Revenue' },
  { spend:  34_000_000, revenue: 211_000_000, series: 'Revenue' },
  { spend:  58_000_000, revenue: 285_000_000, series: 'Revenue' },
  { spend:  90_000_000, revenue: 358_000_000, series: 'Revenue' },
  { spend: 131_000_000, revenue: 425_000_000, series: 'Revenue' },
  { spend: 182_000_000, revenue: 483_000_000, series: 'Revenue' },
  { spend: 244_000_000, revenue: 528_000_000, series: 'Revenue' },
  { spend: 316_000_000, revenue: 558_000_000, series: 'Revenue' },
  { spend: 401_000_000, revenue: 568_000_000, series: 'Revenue' },
];

const paidMediaChartProps: ChartProps = {
  data: paidMediaData,
  width: 615,
  height: 370,
};

const PaidMediaImpactStory: StoryFn<typeof Line> = (args): ReactElement => {
  const props = useChartProps(paidMediaChartProps);
  return (
    <Chart {...props}>
      <Title text="Paid Media Impact: Revenue Outpaces Spend" fontSize={18} />
      <Axis position="left" grid title="Revenue" range={[0, 600_000_000]} labels={[{ value: 0, label: '0' }, { value: 300_000_000, label: '$300M' }, { value: 600_000_000, label: '$600M' }]} />
      <Axis position="bottom" title="Spend" baseline ticks range={[0, 400_000_000]} tickCountLimit={4} tickMinStep={100_000_000} numberFormat="shortCurrency" />
      <Line {...args} />
    </Chart>
  );
};

export const PaidMediaImpact = bindWithProps(PaidMediaImpactStory);
PaidMediaImpact.args = {
  color: 'series',
  dimension: 'spend',
  metric: 'revenue',
  scaleType: 'linear',
  interpolate: 'monotone',
};
