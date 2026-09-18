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
import useChartProps from '../../../hooks/useChartProps';
import { BigNumber } from '../../../rc';
import { bindWithProps } from '../../../test-utils';
import { simpleSparklineData as data } from '../../data/data';

export default {
  title: 'RSC/Chart/S2/BigNumber',
  component: BigNumber,
};

const S2BigNumberStory: StoryFn<typeof BigNumber> = (args): ReactElement => {
  const chartProps = useChartProps({
    data,
    width: 500,
    height: 500,
    s2: true,
  });
  return (
    <Chart {...chartProps}>
      <BigNumber {...args} />
    </Chart>
  );
};

const S2BigNumber = bindWithProps(S2BigNumberStory);
S2BigNumber.args = {
  children: undefined,
  dataKey: 'x',
  orientation: 'horizontal',
  label: 'Visitors',
};

export { S2BigNumber };
