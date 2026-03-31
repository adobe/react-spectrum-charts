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
import { Axis, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features',
  component: Line,
};

const historicalCompareData = [
  { datetime: 1667890800000, users: 147, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1667890800000, users: 477, series: 'Add Fallout', period: 'Current' },
  { datetime: 1667977200000, users: 148, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1667977200000, users: 481, series: 'Add Fallout', period: 'Current' },
  { datetime: 1668063600000, users: 148, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1668063600000, users: 483, series: 'Add Fallout', period: 'Current' },
  { datetime: 1668150000000, users: 131, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1668150000000, users: 310, series: 'Add Fallout', period: 'Current' },
  { datetime: 1668236400000, users: 11, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1668236400000, users: 18, series: 'Add Fallout', period: 'Current' },
  { datetime: 1668322800000, users: 17, series: 'Add Fallout', period: 'Last month' },
  { datetime: 1668322800000, users: 70, series: 'Add Fallout', period: 'Current' },
  { datetime: 1668409200000, users: 143, series: 'Add Fallout', period: 'Current' },
  { datetime: 1667890800000, users: 1525, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1667890800000, users: 5253, series: 'Add Freeform table', period: 'Current' },
  { datetime: 1667977200000, users: 1510, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1667977200000, users: 5103, series: 'Add Freeform table', period: 'Current' },
  { datetime: 1668063600000, users: 1504, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1668063600000, users: 5047, series: 'Add Freeform table', period: 'Current' },
  { datetime: 1668150000000, users: 1338, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1668150000000, users: 3386, series: 'Add Freeform table', period: 'Current' },
  { datetime: 1668236400000, users: 120, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1668236400000, users: 205, series: 'Add Freeform table', period: 'Current' },
  { datetime: 1668322800000, users: 179, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1668322800000, users: 790, series: 'Add Freeform table', period: 'Current' },
  { datetime: 1668409200000, users: 1491, series: 'Add Freeform table', period: 'Last month' },
  { datetime: 1668409200000, users: 4913, series: 'Add Freeform table', period: 'Current' },
];

const defaultChartProps: ChartProps = {
  data: historicalCompareData,
  width: 600,
  height: 400,
  opacities: [0.5, 1],
  lineTypes: ['dotted', 'solid'],
};

const HistoricalCompareStory: StoryFn<typeof Line> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight opacity="period" />
    </Chart>
  );
};

const HistoricalCompare = bindWithProps(HistoricalCompareStory);
HistoricalCompare.args = {
  color: 'series',
  name: 'line0',
  dimension: 'datetime',
  lineType: 'period',
  metric: 'users',
  scaleType: 'time',
};

export { HistoricalCompare };
