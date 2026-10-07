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
import { Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Donut, DonutSummary } from '../../../pre-alpha';
import { basicDonutData } from '../../../storyShared/Donut/data';
import { bindWithProps } from '../../../test-utils';
import { DonutProps, LegendProps } from '../../../types';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Regressions/Side Legend',
  component: Donut,
};

type SideLegendArgs = DonutProps & { legendPosition: LegendProps['position']; width: number };

// the chart is much wider than tall, so the donut and legend should stay together in the middle
const SideLegendStory: StoryFn<SideLegendArgs> = (storyArgs): ReactElement => {
  const { legendPosition, width, ...args } = storyArgs;
  const chartProps = useChartProps({ data: basicDonutData, width, height: 300 });
  return (
    <Chart {...chartProps}>
      <Donut {...args}>
        <DonutSummary label="Visitors" />
      </Donut>
      <Legend position={legendPosition} title="Browser" />
    </Chart>
  );
};

const LegendRight = bindWithProps(SideLegendStory);
LegendRight.args = { metric: 'count', color: 'browser', legendPosition: 'right', width: 1000 };

const LegendLeft = bindWithProps(SideLegendStory);
LegendLeft.args = { ...LegendRight.args, legendPosition: 'left' };

const regression = {
  description:
    'When a donut chart grew wider than it was tall, a left or right legend drifted toward the chart edge, leaving a growing gap between it and the donut.',
};
LegendRight.parameters = { ...LegendRight.parameters, regression };
LegendLeft.parameters = { ...LegendLeft.parameters, regression };

export { LegendRight, LegendLeft };
