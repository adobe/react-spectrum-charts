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
import { Area, Axis, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';

export default {
  title: 'RSC/Chart/S2/Area',
  component: Area,
};

const data = [
  { datetime: 1667890800000, maxTemperature: 73, minTemperature: 47, series: 'Add Fallout' },
  { datetime: 1667977200000, maxTemperature: 70, minTemperature: 48, series: 'Add Fallout' },
  { datetime: 1668063600000, maxTemperature: 73, minTemperature: 48, series: 'Add Fallout' },
  { datetime: 1668150000000, maxTemperature: 56, minTemperature: 31, series: 'Add Fallout' },
  { datetime: 1668236400000, maxTemperature: 41, minTemperature: 18, series: 'Add Fallout' },
  { datetime: 1668322800000, maxTemperature: 60, minTemperature: 45, series: 'Add Fallout' },
  { datetime: 1668409200000, maxTemperature: 64, minTemperature: 43, series: 'Add Fallout' },
];

const multiSeriesData = [
  { datetime: 1667890800000, value: 738, series: 'Add Fallout' },
  { datetime: 1667977200000, value: 704, series: 'Add Fallout' },
  { datetime: 1668063600000, value: 730, series: 'Add Fallout' },
  { datetime: 1668150000000, value: 465, series: 'Add Fallout' },
  { datetime: 1668236400000, value: 31, series: 'Add Fallout' },
  { datetime: 1668322800000, value: 108, series: 'Add Fallout' },
  { datetime: 1668409200000, value: 648, series: 'Add Fallout' },
  { datetime: 1667890800000, value: 1220, series: 'Add Freeform table' },
  { datetime: 1667977200000, value: 1130, series: 'Add Freeform table' },
  { datetime: 1668063600000, value: 1109, series: 'Add Freeform table' },
  { datetime: 1668150000000, value: 724, series: 'Add Freeform table' },
  { datetime: 1668236400000, value: 39, series: 'Add Freeform table' },
  { datetime: 1668322800000, value: 160, series: 'Add Freeform table' },
  { datetime: 1668409200000, value: 1093, series: 'Add Freeform table' },
];

const defaultChartProps: ChartProps = { data, minWidth: 400, maxWidth: 800, height: 400 };

const S2AreaStory: StoryFn<typeof Area> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, s2: true });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" baseline />
      <Axis position="left" title="Temperature (F)" grid />
      <Area {...args} />
    </Chart>
  );
};

const S2StackedAreaStory: StoryFn<typeof Area> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: multiSeriesData, s2: true });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" baseline />
      <Axis position="left" title="Users" grid />
      <Area {...args} />
      <Legend highlight />
    </Chart>
  );
};

const S2Area = bindWithProps(S2AreaStory);
S2Area.args = { metric: 'maxTemperature' };

const S2StackedArea = bindWithProps(S2StackedAreaStory);
S2StackedArea.args = { dimension: 'datetime', metric: 'value', color: 'series' };

export { S2Area, S2StackedArea };
