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
import { Axis, Bar, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { barDataWithUTCSeries, stackedBarDataWithUTCSeries } from '../../../storyShared/components/Bar/data';
import { bindWithProps } from '../../../test-utils';

export default {
  title: 'React Spectrum Charts 2/Bar/Coverage/UTC Datetime',
  component: Bar,
};

const BarStoryWithUTCData: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataWithUTCSeries, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis
        position={args.orientation === 'horizontal' ? 'left' : 'bottom'}
        labelFormat="time"
        granularity="day"
        baseline
        title="Date"
      />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Dataset" />
    </Chart>
  );
};

const StackedBarStoryWithUTCData: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: stackedBarDataWithUTCSeries, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis
        position={args.orientation === 'horizontal' ? 'left' : 'bottom'}
        labelFormat="time"
        granularity="day"
        baseline
        title="Date"
      />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
      <Legend title="Dataset" />
    </Chart>
  );
};

export const BarWithUTCDatetimeFormat = bindWithProps(BarStoryWithUTCData);
BarWithUTCDatetimeFormat.args = {
  dimension: 'browser',
  metric: 'downloads',
  color: 'datasetName',
  dimensionDataType: 'time',
};

export const StackedBarWithUTCDatetimeFormat = bindWithProps(StackedBarStoryWithUTCData);
StackedBarWithUTCDatetimeFormat.args = {
  dimension: 'browser',
  metric: 'downloads',
  color: 'datasetName',
  dimensionDataType: 'time',
};
