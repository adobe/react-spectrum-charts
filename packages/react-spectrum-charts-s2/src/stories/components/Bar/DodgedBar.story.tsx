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

import { s2Categorical6 } from '@spectrum-charts/themes';

import { Chart } from '../../../Chart';
import { Axis, Bar, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { barSeriesData, barSubSeriesData } from './data';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Dodged Bar',
  component: Bar,
  parameters: {
    controls: {
      include: ['orientation', 'paddingRatio'],
    },
  },
};

const DodgedBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const { color } = args;
  const colors = Array.isArray(color)
    ? [
        ['categorical-700', 'categorical-1000'],
        ['categorical-400', 'categorical-500'],
        ['categorical-300', 'categorical-1100'],
      ]
    : s2Categorical6;
  const data = Array.isArray(color) ? barSubSeriesData : barSeriesData;
  const chartProps = useChartProps({ data, width: 720, height: 460, colors });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

const defaultProps: BarProps = {
  type: 'dodged',
  dimension: 'browser',
  order: 'order',
  color: 'operatingSystem',
  onClick: undefined,
};

const Basic = bindWithProps(DodgedBarStory);
Basic.args = {
  ...defaultProps,
};

const DodgedStacked = bindWithProps(DodgedBarStory);
DodgedStacked.args = {
  ...defaultProps,
  color: ['operatingSystem', 'version'],
};

export { Basic, DodgedStacked };
