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
import { basicBulletData } from '../../../storyShared/data/bulletData';
import { bindWithProps } from '../../../test-utils';
import { BulletProps, ChartProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Bullet/Coverage/Title',
  component: Bullet,
};

const defaultChartProps: ChartProps = { data: basicBulletData, width: 350, height: 350 };
const defaultArgs: Partial<BulletProps> = {
  metric: 'currentAmount',
  dimension: 'graphLabel',
  target: 'target',
  numberFormat: '$,.2f',
};

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

export { WithTitle };
