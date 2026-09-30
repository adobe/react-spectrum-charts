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
import { BulletProps } from '../../../../types';
import { kmbtBulletData, kmbtThresholdsData } from '../../../data/bulletData';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Bullet/Features/NumberFormat',
  component: Bullet,
  parameters: {
    controls: {
      include: ['numberFormat'],
    },
  },
  argTypes: {
    numberFormat: {
      control: 'select',
      options: ['shortNumber', 'shortCurrency', 'currency', ',.1f', '.0%'],
    },
  },
};

// K/M/B/T-range data, to demonstrate the abbreviation cutovers
const KmbtStory: StoryFn<BulletProps> = (args): ReactElement => {
  const chartProps = useChartProps({ data: kmbtBulletData, width: 620, height: 270 });
  return (
    <Chart {...chartProps}>
      <Bullet {...args} />
    </Chart>
  );
};

const sharedArgs: Partial<BulletProps> = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  direction: 'column',
  labelPosition: 'top',
  showTarget: true,
  showTargetValue: true,
};

const NumberFormat = bindWithProps(KmbtStory);
NumberFormat.args = {
  ...sharedArgs,
  thresholds: kmbtThresholdsData,
  thresholdBarColor: true,
  numberFormat: 'shortNumber',
};
export { NumberFormat };
