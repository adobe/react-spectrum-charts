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
import { Axis, Bar, Legend, Line } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Combo } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { ComboProps } from '../../../types';


const comboPlaygroundData = [
  { datetime: 1667890800000, orders: 42, visits: 58, series: 'Orders' },
  { datetime: 1667977200000, orders: 55, visits: 63, series: 'Orders' },
  { datetime: 1668063600000, orders: 61, visits: 70, series: 'Orders' },
  { datetime: 1668150000000, orders: 48, visits: 66, series: 'Orders' },
  { datetime: 1668236400000, orders: 70, visits: 82, series: 'Orders' },
];

export default { title: 'React Spectrum Charts 2/Pre-Alpha/Combo/Playground', component: Combo };

const ComboPlaygroundStory: StoryFn<typeof Combo> = (args): ReactElement => {
  const chartProps = useChartProps({ data: comboPlaygroundData, height: 360, maxWidth: 720 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" />
      <Axis position="left" grid />
      <Combo {...args}>
        <Bar metric="orders" />
        <Line metric="visits" color={{ value: 'categorical-200' }} scaleType="point" />
      </Combo>
      <Legend color="series" />
    </Chart>
  );
};

export const Playground = bindWithProps(ComboPlaygroundStory);
Playground.args = { dimension: 'datetime', name: 'combo0' } satisfies ComboProps;
