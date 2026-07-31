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
import { Axis, Bar, BarDirectLabel, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { divergingConversionRateData } from './data';

export default {
  title: 'React Spectrum Charts 2/Bar/Examples',
  component: Bar,
};

/**
 * Diverging conversion-rate chart from the Figma reference (node 3876-58702) — the frame to validate
 * spacing against. `<Bar diverging>` moves the dimension axis to the zero baseline and flips each
 * label to the side opposite its bar. Single-bar-mark only.
 */
const DivergingBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingConversionRateData, width: 700, height: 500 });
  return (
    <Chart {...chartProps}>
      <Title text="Instagram improved, Facebook Reels did worse" fontSize={22} />
      <Axis position="left" baseline />
      <Axis position="bottom" grid labelFormat="percentage" title="Conversion rate change, month over month" />
      <Bar {...args} diverging>
        <BarDirectLabel />
      </Bar>
    </Chart>
  );
};

const defaultProps: BarProps = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'horizontal',
  colorOverride: 'barColor',
};

const DivergingConversionRates = bindWithProps(DivergingBarStory);
DivergingConversionRates.args = {
  ...defaultProps,
};

export { DivergingConversionRates };
