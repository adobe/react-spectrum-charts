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

import { Chart } from '../../../Chart.js';
import { Legend, Title } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Donut, DonutSummary } from '../../../pre-alpha/index.js';
import { basicDonutData } from '../../../storyShared/Donut/data.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { DonutProps, LegendProps, TitleProps } from '../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Pre-Alpha/Donut/Regressions/Side Legend',
  component: Donut,
  argTypes: {
    legendPosition: { control: 'inline-radio', options: ['left', 'right'] },
    titlePosition: { control: 'inline-radio', options: ['start', 'middle', 'end'] },
  },
};

type SideLegendArgs = DonutProps & {
  legendPosition: LegendProps['position'];
  legendTitle?: string;
  chartTitle?: string;
  titlePosition?: NonNullable<TitleProps['position']>;
  width: number | string;
};

// the chart is much wider than tall, so the donut and legend should stay together in the middle
const SideLegendStory: StoryFn<SideLegendArgs> = (storyArgs): ReactElement => {
  const { legendPosition, legendTitle = 'Browser', chartTitle, titlePosition, width, ...args } = storyArgs;
  const chartProps = useChartProps({ data: basicDonutData, width, height: 300 });
  return (
    <Chart {...chartProps}>
      {chartTitle && <Title text={chartTitle} position={titlePosition} />}
      <Donut {...args}>
        <DonutSummary label="Visitors" />
      </Donut>
      <Legend position={legendPosition} title={legendTitle} />
    </Chart>
  );
};

const LegendRight = bindWithProps(SideLegendStory);
LegendRight.args = { metric: 'count', color: 'browser', legendPosition: 'right', width: 1000 };

const LegendLeft = bindWithProps(SideLegendStory);
LegendLeft.args = { ...LegendRight.args, legendPosition: 'left' };

// resize the window to check the donut and legend stay together as the chart width changes
const Responsive = bindWithProps(SideLegendStory);
Responsive.args = { ...LegendRight.args, width: '100%' };

// the title is wider than every label, so it sets the legend width
const LongTitle = bindWithProps(SideLegendStory);
LongTitle.args = { ...LegendRight.args, legendTitle: 'Browser share of visitors' };

// a start-aligned chart title stays at the chart's left edge, not the donut's
const ChartTitleLeftLegend = bindWithProps(SideLegendStory);
ChartTitleLeftLegend.args = { ...LegendLeft.args, chartTitle: 'Visitors by browser', titlePosition: 'start' };

// a centered chart title centers over the donut and legend together
const ChartTitleCentered = bindWithProps(SideLegendStory);
ChartTitleCentered.args = { ...ChartTitleLeftLegend.args, titlePosition: 'middle' };

const regression = {
  description:
    'When a donut chart grew wider than it was tall, a left or right legend drifted toward the chart edge, leaving a growing gap between it and the donut.',
  pr: 974,
};
LegendRight.parameters = { ...LegendRight.parameters, regression };
LegendLeft.parameters = { ...LegendLeft.parameters, regression };
Responsive.parameters = { ...Responsive.parameters, regression };
LongTitle.parameters = { ...LongTitle.parameters, regression };
ChartTitleLeftLegend.parameters = { ...ChartTitleLeftLegend.parameters, regression };
ChartTitleCentered.parameters = { ...ChartTitleCentered.parameters, regression };

export { LegendRight, LegendLeft, Responsive, LongTitle, ChartTitleLeftLegend, ChartTitleCentered };
