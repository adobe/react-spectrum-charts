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

import { Chart } from '../../../../Chart';
import { Axis, Bar, Line } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { Combo } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps, ComboProps } from '../../../../types';
import { peopleTotalComboData } from '../../../data/data';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Combo/Features/DualAxis',
  component: Combo,
};

const defaultChartProps: ChartProps = {
  data: peopleTotalComboData,
  minWidth: 400,
  maxWidth: 800,
  height: 400,
};

// each mark targets its own named axis via metricAxis, rather than sharing one y-scale
const DualAxisStory: StoryFn<ComboProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" name="people" title="People" grid />
      <Axis position="right" name="total" title="Total" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Combo {...args}>
        <Bar metric="people" metricAxis="people" />
        <Line metric="total" metricAxis="total" color={{ value: 'categorical-200' }} scaleType="point" />
      </Combo>
    </Chart>
  );
};

const DualAxis = bindWithProps(DualAxisStory);
DualAxis.args = {
  name: 'combo0',
  dimension: 'datetime',
};

export { DualAxis };
