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
import { Donut, DonutSummary } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, DonutProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Donut/Features',
  component: Donut,
};

const booleanDonutData = [
  { id: '1', value: 0.68 },
  { id: '2', value: 0.32 },
];

const defaultChartProps: ChartProps = { data: booleanDonutData, width: 350, height: 350 };

// only the primary segment's color is set - the secondary segment is always forced to secondary-gray
const BinaryStory: StoryFn<DonutProps> = (args): ReactElement => {
  const positiveChartProps = useChartProps({ ...defaultChartProps, colors: ['green-800'] });
  const negativeChartProps = useChartProps({
    ...defaultChartProps,
    data: [...booleanDonutData].reverse(),
    colors: ['red-800'],
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '30px' }}>
      <Chart {...positiveChartProps}>
        <Donut {...args}>
          <DonutSummary label="Success rate" />
        </Donut>
      </Chart>
      <Chart {...negativeChartProps}>
        <Donut {...args}>
          <DonutSummary label="Success rate" />
        </Donut>
      </Chart>
    </div>
  );
};

const Binary = bindWithProps(BinaryStory);
Binary.args = {
  metric: 'value',
  color: 'id',
  isBoolean: true,
};

export { Binary };
