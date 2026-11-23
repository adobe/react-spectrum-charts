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
import { Donut, DonutSummary, SegmentLabel } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { basicDonutData } from '../../../storyShared/Donut/data.js';
import { bindWithProps } from '../../../test-utils/index.js';
import { ChartProps, DonutSummaryProps } from '../../../types/index.js';

export default {
  title: 'React Spectrum Charts 2/Donut/Coverage/DonutSummary Variants',
  tags: ['alpha'],
  component: DonutSummary,
};

const defaultChartProps: ChartProps = { data: basicDonutData, width: 350, height: 350 };

const DonutStory: StoryFn<DonutSummaryProps & { width?: number; height?: number }> = (args): ReactElement => {
  const { width, height, ...donutSummaryProps } = args;
  const chartProps = useChartProps({ ...defaultChartProps, width: width ?? 350, height: height ?? 350 });
  return (
    <Chart {...chartProps}>
      <Donut metric="count" color="browser">
        <DonutSummary {...donutSummaryProps} />
      </Donut>
    </Chart>
  );
};

const Basic = bindWithProps(DonutStory);
Basic.args = { label: 'Visitors', numberFormat: 'shortNumber' };

const NoLabel = bindWithProps(DonutStory);
NoLabel.args = {};

const NumberFormat = bindWithProps(DonutStory);
NumberFormat.args = { numberFormat: 'standardNumber', label: 'Visitors' };

const FittedValue = bindWithProps(DonutStory);
FittedValue.args = { width: 240, height: 130, valueText: '888,888,888' };

const CompactLabelsStory: StoryFn<DonutSummaryProps> = (args): ReactElement => {
  const chartProps = useChartProps({
    data: [
      { series: 'Alpha', value: 60, share: '60.0%' },
      { series: 'Beta', value: 40, share: '40.0%' },
    ],
    width: 274,
    height: 180,
  });
  return (
    <Chart {...chartProps}>
      <Donut labelSpaceRatio={0}>
        <DonutSummary {...args} />
        <SegmentLabel labelKey="share" value={false} percent={false} />
      </Donut>
    </Chart>
  );
};
const CompactLabels = bindWithProps(CompactLabelsStory);
CompactLabels.args = { valueText: '888,888,888' };

export { Basic, NoLabel, NumberFormat, FittedValue, CompactLabels };
