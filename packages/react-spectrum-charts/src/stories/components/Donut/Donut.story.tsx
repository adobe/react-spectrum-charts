/*
 * Copyright 2023 Adobe. All rights reserved.
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

import { Content } from '@adobe/react-spectrum';
import { Datum } from '@spectrum-charts/vega-spec-builder';

import { Chart } from '../../../Chart';
import { ChartPopover, ChartTooltip, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Donut, DonutSummary } from '../../../rc';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, DonutProps } from '../../../types';
import { basicDonutData, booleanDonutData } from './data';

export default {
  title: 'RSC/Donut',
  component: Donut,
};

const defaultChartProps: ChartProps = {
  data: basicDonutData,
  width: 350,
  height: 350,
};

const DonutStory: StoryFn<DonutProps & { width?: number; height?: number }> = (args): ReactElement => {
  const { width, height, ...donutProps } = args;
  const chartProps = useChartProps({ ...defaultChartProps, width: width ?? 350, height: height ?? 350 });
  return (
    <Chart {...chartProps}>
      <Donut {...donutProps} />
    </Chart>
  );
};

const DonutLegendStory: StoryFn<typeof Donut> = (args): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, width: 400 });
  return (
    <Chart {...chartProps}>
      <Donut {...args} />
      <Legend title="Browsers" position={'right'} highlight isToggleable />
    </Chart>
  );
};

const BooleanStory: StoryFn<typeof Donut> = (args): ReactElement => {
  const positiveBooleanProps = useChartProps({
    ...defaultChartProps,
    data: booleanDonutData,
    colors: ['static-green-800', 'gray-200'],
  });
  const negativeBooleanProps = useChartProps({
    ...defaultChartProps,
    data: [...booleanDonutData].reverse(),
    colors: ['static-red-800', 'gray-200'],
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '30px' }}>
      <Chart {...positiveBooleanProps}>
        <Donut {...args}>
          <DonutSummary label="Success rate" />
        </Donut>
      </Chart>

      <Chart {...negativeBooleanProps}>
        <Donut {...args}>
          <DonutSummary label="Success rate" />
        </Donut>
      </Chart>
    </div>
  );
};

// content for tooltip and popover
const dialogContent = (datum: Datum) => {
  return (
    <Content>
      <div>Browser: {datum.browser}</div>
      <div>Visitors: {datum.count}</div>
    </Content>
  );
};

// tooltip and popover
const interactiveChildren = [
  <ChartTooltip key={0}>{dialogContent}</ChartTooltip>,
  <ChartPopover width="auto" key={1}>
    {dialogContent}
  </ChartPopover>,
];

const Basic = bindWithProps(DonutStory);
Basic.args = {
  metric: 'count',
  color: 'browser',
};

const WithPopover = bindWithProps(DonutStory);
WithPopover.args = {
  metric: 'count',
  color: 'browser',
  children: interactiveChildren,
};

const WithLegend = bindWithProps(DonutLegendStory);
WithLegend.args = {
  metric: 'count',
  color: 'browser',
};

const BooleanDonut = bindWithProps(BooleanStory);
BooleanDonut.args = {
  metric: 'value',
  color: 'id',
  isBoolean: true,
};

const Supreme = bindWithProps(DonutLegendStory);
Supreme.args = {
  metric: 'count',
  color: 'browser',
  holeRatio: 0.8,
  children: [...interactiveChildren, <DonutSummary label="Visitors" key={0} />],
};

export { Basic, BooleanDonut, Supreme, WithLegend, WithPopover };
