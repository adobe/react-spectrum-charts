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
import { Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Bullet } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { BulletProps, ChartProps } from '../../../types';
import { basicBulletData, basicThresholdsData, coloredThresholdsData } from '../../data/bulletData';

export default {
  title: 'React Spectrum Charts 2/Bullet/Features',
  component: Bullet,
};

const defaultChartProps: ChartProps = { data: basicBulletData, width: 350, height: 350 };
const defaultArgs: Partial<BulletProps> = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  numberFormat: '$,.2f',
};

const BulletStory: StoryFn<BulletProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Bullet {...args} />
    </Chart>
  );
};

const Basic = bindWithProps(BulletStory);
Basic.args = { ...defaultArgs, direction: 'column', labelPosition: 'top' };

// direction: 'row' lays bullet groups out side by side instead of stacked
const RowMode = bindWithProps(BulletStory);
RowMode.args = {
  ...defaultArgs,
  direction: 'row',
  labelPosition: 'top',
  thresholds: coloredThresholdsData,
  thresholdBarColor: true,
};

// scaleType: 'fixed' pins the x-scale max to maxScaleValue instead of deriving it from the data
const FixedScale = bindWithProps(BulletStory);
FixedScale.args = {
  ...defaultArgs,
  direction: 'column',
  scaleType: 'fixed',
  maxScaleValue: 250,
  thresholds: basicThresholdsData,
};

// metricAxis adds a bottom axis that follows the shared max scale value
const MetricAxis = bindWithProps(BulletStory);
MetricAxis.args = { ...defaultArgs, direction: 'column', maxScaleValue: 250, metricAxis: true };

const BulletTitleStory: StoryFn<BulletProps> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, width: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Title Bullet" position="start" orient="top" />
      <Bullet {...args} />
    </Chart>
  );
};

const WithTitle = bindWithProps(BulletTitleStory);
WithTitle.args = { ...defaultArgs, direction: 'column' };

export { Basic, RowMode, FixedScale, MetricAxis, WithTitle };
