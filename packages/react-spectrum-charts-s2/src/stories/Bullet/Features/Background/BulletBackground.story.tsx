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
import useChartProps from '../../../../hooks/useChartProps';
import { Bullet } from '../../../../pre-alpha';
import { bindWithProps } from '../../../../test-utils';
import { BulletProps, ChartProps } from '../../../../types';
import { basicBulletData, basicThresholdsData, coloredThresholdsData } from '../../../data/bulletData';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Bullet/Features/Background',
  component: Bullet,
};

const defaultChartProps: ChartProps = { data: basicBulletData, width: 350, height: 350 };
const defaultArgs: Partial<BulletProps> = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  direction: 'column',
  labelPosition: 'top',
};

const BulletStory: StoryFn<BulletProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Bullet {...args} />
    </Chart>
  );
};

// thresholds render as background bands behind the metric bar
const Thresholds = bindWithProps(BulletStory);
Thresholds.args = { ...defaultArgs, thresholds: basicThresholdsData };

// thresholdBarColor colors the metric bar itself based on which threshold band it falls in
const ColoredMetric = bindWithProps(BulletStory);
ColoredMetric.args = { ...defaultArgs, thresholds: coloredThresholdsData, thresholdBarColor: true };

// track renders a flat background region instead of thresholds
const Track = bindWithProps(BulletStory);
Track.args = { ...defaultArgs, track: true };

export { Thresholds, ColoredMetric, Track };
