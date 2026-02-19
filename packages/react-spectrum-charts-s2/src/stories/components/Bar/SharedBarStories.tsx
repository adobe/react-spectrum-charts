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

import { GROUP_DATA, MARK_ID } from '@spectrum-charts/constants';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartTooltip, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { barSeriesData } from './data';

export const DimensionAreaStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, width: 800, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartTooltip>
          {(datum) => {
            return (
              <>
                <div>Operating system: {datum.operatingSystem}</div>
                <div>Browser: {datum.browser}</div>
                <div>Downloads: {datum.value}</div>
              </>
            );
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
