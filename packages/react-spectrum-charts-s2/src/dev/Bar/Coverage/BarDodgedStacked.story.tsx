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
import { action } from 'storybook/actions';

import { s2Categorical6 } from '@spectrum-charts/core-s2/tokens';

import { Chart } from '../../../Chart.js';
import { Axis, Bar, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { barSeriesData, barSubSeriesData } from '../../../storyShared/components/Bar/data.js';
import { bindWithProps } from '../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Bar/Coverage/Dodged And Stacked',
  component: Bar,
};

const DodgedBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const { color } = args;
  const storyColors = Array.isArray(color)
    ? [
        ['categorical-700', 'categorical-1000'],
        ['categorical-400', 'categorical-500'],
        ['categorical-300', 'categorical-1100'],
      ]
    : s2Categorical6;
  const data = Array.isArray(color) ? barSubSeriesData : barSeriesData;
  const chartProps = useChartProps({ data, width: 800, height: 600, colors: storyColors });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

export const DodgedLineType = bindWithProps(DodgedBarStory);
DodgedLineType.args = {
  type: 'dodged',
  dimension: 'browser',
  order: 'order',
  lineType: 'operatingSystem',
  lineWidth: 2,
  opacity: { value: 0.2 },
};

export const DodgedOpacity = bindWithProps(DodgedBarStory);
DodgedOpacity.args = { type: 'dodged', dimension: 'browser', order: 'order', opacity: 'operatingSystem' };

export const DodgedOnClick = bindWithProps(DodgedBarStory);
DodgedOnClick.args = {
  type: 'dodged',
  dimension: 'browser',
  order: 'order',
  color: 'operatingSystem',
  onClick: action('onClick'),
};

export const StackedOnClick = bindWithProps(DodgedBarStory);
StackedOnClick.args = { dimension: 'browser', order: 'order', color: 'operatingSystem', onClick: action('onClick') };
