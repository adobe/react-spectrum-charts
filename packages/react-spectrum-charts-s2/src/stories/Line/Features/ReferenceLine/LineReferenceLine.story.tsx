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

import { CHART_SIZE_BREAKPOINTS } from '@spectrum-charts/constants';

import { Chart } from '../../../../Chart';
import { Axis, Legend, Line, ReferenceLine } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../../stories/data/data';
import { CHART_SIZE_THRESHOLDS, ResizableChart } from '../../../../stories/storyUtils';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

export default {
  title: 'React Spectrum Charts 2/Line/Features/Reference Line',
  component: ReferenceLine,
};

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

// A Y value (users count) that falls within the workspaceTrendsData range
const referenceValue = 5000;

const ReferenceLineStory: StoryFn<typeof ReferenceLine> = (args): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users">
        <ReferenceLine {...args} />
      </Axis>
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time" />
      <Legend highlight />
    </Chart>
  );
};

const Basic = bindWithProps(ReferenceLineStory);
Basic.args = {
  value: referenceValue,
};

const Label = bindWithProps(ReferenceLineStory);
Label.args = {
  label: 'Campaign start',
  value: referenceValue,
};

const WithSize = bindWithProps(ReferenceLineStory);
WithSize.args = {
  label: 'Target',
  value: referenceValue,
  size: 'L',
};

const AutoDetectSizeStory = (): ReactElement => (
  <ResizableChart
    chartHeight={400}
    thresholds={CHART_SIZE_THRESHOLDS}
    renderLabel={(width) => {
      let currentSize = 'L';
      if (width < CHART_SIZE_BREAKPOINTS.M) currentSize = 'S';
      else if (width < CHART_SIZE_BREAKPOINTS.L) currentSize = 'M';
      return <>Width: <strong>{Math.round(width)}px</strong> — Reference line size tier: <strong>{currentSize}</strong></>;
    }}
  >
    <Chart data={workspaceTrendsData} width="auto" height={400}>
      <Axis position="left" grid title="Users">
        <ReferenceLine value={referenceValue} label="Target" />
      </Axis>
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time" />
      <Legend highlight />
    </Chart>
  </ResizableChart>
);

const SecondaryBasic = bindWithProps(ReferenceLineStory);
SecondaryBasic.args = {
  value: referenceValue,
  secondary: true,
};

const WithSecondary = bindWithProps(ReferenceLineStory);
WithSecondary.args = {
  label: 'Minimum',
  value: referenceValue,
  secondary: true,
};

const PrimaryAndSecondaryStory: StoryFn<typeof ReferenceLine> = (): ReactElement => {
  const chartProps = useChartProps(defaultChartProps);
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users">
        <ReferenceLine value={referenceValue} label="Target" />
        <ReferenceLine value={Math.round(referenceValue * 0.7)} label="Minimum" secondary />
      </Axis>
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line dimension="datetime" metric="users" color="series" scaleType="time" />
      <Legend highlight />
    </Chart>
  );
};

const PrimaryAndSecondary = PrimaryAndSecondaryStory;

export const AutoDetectSize = AutoDetectSizeStory;

export { Basic, Label, PrimaryAndSecondary, SecondaryBasic, WithSecondary, WithSize };
