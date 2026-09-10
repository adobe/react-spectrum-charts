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
import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Venn } from '../../../alpha';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, VennProps } from '../../../types';

export default {
  title: 'RSC/Chart/S2/Venn',
  component: Venn,
};

const { A, B } = { A: 'Instagram', B: 'TikTok' };

const basicData = [
  { sets: [A], size: 12, label: 'A' },
  { sets: [B], size: 12, label: 'B' },
  { sets: [A, B], size: 2, label: 'AnB' },
];

const defaultChartProps: ChartProps = {
  data: basicData,
  height: 350,
  width: 350,
  s2: true,
};

const S2VennStory: StoryFn<VennProps> = (args) => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps} config={{ autosize: { type: 'pad' } }}>
      <Venn {...args} />
    </Chart>
  );
};

const S2Venn = bindWithProps(S2VennStory);

export { S2Venn };
