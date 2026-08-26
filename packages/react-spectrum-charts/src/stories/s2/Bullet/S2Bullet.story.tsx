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
import { Bullet } from '../../../alpha';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BulletProps, ChartProps } from '../../../types';
import { basicBulletData } from '../../components/Bullet/data';

export default {
  title: 'RSC/Chart/S2/Bullet',
  component: Bullet,
};

const defaultChartProps: ChartProps = {
  data: basicBulletData,
  width: 350,
  height: 350,
  s2: true,
};

const S2BulletStory: StoryFn<BulletProps> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Bullet {...args} />
    </Chart>
  );
};

const S2Bullet = bindWithProps(S2BulletStory);
S2Bullet.args = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  color: 'blue-900',
  direction: 'column',
  numberFormat: '$,.2f',
  showTarget: true,
  showTargetValue: false,
  labelPosition: 'top',
  scaleType: 'normal',
  maxScaleValue: 100,
  track: false,
  thresholdBarColor: false,
  metricAxis: false,
};

export { S2Bullet };
