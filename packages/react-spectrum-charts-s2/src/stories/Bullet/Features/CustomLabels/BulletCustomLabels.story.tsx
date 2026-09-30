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
import { customLabelBulletData, customLabelThresholdsData } from '../../../data/bulletData';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Bullet/Features/CustomLabels',
  component: Bullet,
  parameters: {
    controls: {
      include: ['direction', 'labelPosition', 'showTargetValue'],
    },
  },
};

const defaultChartProps: ChartProps = { data: customLabelBulletData, width: 620, height: 240 };
const defaultArgs: Partial<BulletProps> = {
  metric: 'currentAmount',
  metricLabel: 'currentAmountLabel',
  dimension: 'graphLabel',
  target: 'target',
  targetLabel: 'targetLabel',
  direction: 'column',
  labelPosition: 'top',
  thresholds: customLabelThresholdsData,
  thresholdBarColor: true,
};

const BulletStory: StoryFn<BulletProps> = (args): ReactElement => {
  const rowDimensions = args.direction === 'row' ? { width: 760, height: 260 } : {};
  const chartProps = useChartProps({ ...defaultChartProps, ...rowDimensions });
  return (
    <Chart {...chartProps}>
      <Bullet {...args} />
    </Chart>
  );
};

const CustomLabels = bindWithProps(BulletStory);
CustomLabels.args = { ...defaultArgs };

export { CustomLabels };
