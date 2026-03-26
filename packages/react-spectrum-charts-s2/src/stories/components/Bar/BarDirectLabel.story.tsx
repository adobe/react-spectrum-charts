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
import { Axis, Bar, BarDirectLabel } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { barData, mixedBarData } from './data';

export default {
  title: 'RSC/Bar/BarDirectLabel',
  component: Bar,
};

const BarDirectLabelStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <BarDirectLabel />
      </Bar>
    </Chart>
  );
};

const NegativeBarDirectLabelStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: mixedBarData, width: 600, height: 400 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <BarDirectLabel />
      </Bar>
    </Chart>
  );
};

const defaultProps: BarProps = {
  dimension: 'browser',
  metric: 'downloads',
};

const Default = bindWithProps(BarDirectLabelStory);
Default.args = {
  ...defaultProps,
};

const Horizontal = bindWithProps(BarDirectLabelStory);
Horizontal.args = {
  ...defaultProps,
  orientation: 'horizontal',
};

const MixedValues = bindWithProps(NegativeBarDirectLabelStory);
MixedValues.args = {
  ...defaultProps,
};

const MixedValuesHorizontal = bindWithProps(NegativeBarDirectLabelStory);
MixedValuesHorizontal.args = {
  ...defaultProps,
  orientation: 'horizontal',
};

export { Default, Horizontal, MixedValues, MixedValuesHorizontal };
