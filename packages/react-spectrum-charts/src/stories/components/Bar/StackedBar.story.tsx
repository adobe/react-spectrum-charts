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
import React, { ReactElement, createElement } from 'react';

import { StoryFn } from '@storybook/react';

import { GROUP_DATA, MARK_ID } from '@spectrum-charts/constants';
import { SpectrumColor } from '@spectrum-charts/vega-spec-builder';

import { Chart } from '../../../Chart';
import { Annotation, Axis, Bar, ChartTooltip, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { barSeriesData, negativeBarSeriesData, stackedBarDataWithUTC } from './data';

export default {
  title: 'RSC/Bar/Stacked Bar',
  component: Bar,
};

const colors: SpectrumColor[] = [
  'divergent-orange-yellow-seafoam-1000',
  'divergent-orange-yellow-seafoam-1200',
  'divergent-orange-yellow-seafoam-1400',
  'divergent-orange-yellow-seafoam-600',
];

const StackedBarStoryWithUTCData: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: stackedBarDataWithUTC, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis
        position={args.orientation === 'horizontal' ? 'left' : 'bottom'}
        labelFormat="time"
        granularity="day"
        baseline
        title="Browser"
      />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
    </Chart>
  );
};

const BarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, colors, width: 800, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Operating system" />
    </Chart>
  );
};

const NegativeBarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: negativeBarSeriesData, width: 800, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Operating system" />
    </Chart>
  );
};

const DimensionAreaStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, width: 800, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartTooltip>
          {(datum) => {
            return <>
              <div>Operating system: {datum.operatingSystem}</div>
              <div>Browser: {datum.browser}</div>
              <div>Downloads: {datum.value}</div>
            </>
          }}
        </ChartTooltip>
        <ChartTooltip targets={['dimensionArea']}>
          {(datum) => {
            return (
              <>
                <div style={{ fontWeight: 'bold' }}>{datum.browser} Downloads</div>
                {datum[GROUP_DATA]?.map((d) => (
                  <div key={d[MARK_ID]}>
                    {d.operatingSystem}: {d.value}
                  </div>
                ))}
              </>
            );
          }}
        </ChartTooltip>
      </Bar>
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

const defaultProps: BarProps = {
  dimension: 'browser',
  order: 'order',
  color: 'operatingSystem',
  onClick: undefined,
};

const Basic = bindWithProps(BarStory);
Basic.args = {
  ...defaultProps,
};

const WithBarLabels = bindWithProps(BarStory);
WithBarLabels.args = {
  ...defaultProps,
  children: createElement(Annotation, { textKey: 'percentLabel' }),
};

const NegativeStack = bindWithProps(NegativeBarStory);
NegativeStack.args = {
  ...defaultProps,
};

const OnClick = bindWithProps(BarStory);
OnClick.args = {
  dimension: 'browser',
  order: 'order',
  color: 'operatingSystem',
  onClick: (datum) => {
    console.log('datum:', datum);
  },
};

const StackedBarWithUTCDatetimeFormat = bindWithProps(StackedBarStoryWithUTCData);
StackedBarWithUTCDatetimeFormat.args = {
  ...defaultProps,
  dimension: 'browser',
  metric: 'downloads',
  color: 'dataset_id',
  dimensionDataType: 'time',
};

const TooltipOnDimensionArea = bindWithProps(DimensionAreaStory);
TooltipOnDimensionArea.args = {
  ...defaultProps,
};

export { Basic, NegativeStack, WithBarLabels, OnClick, StackedBarWithUTCDatetimeFormat, TooltipOnDimensionArea };
