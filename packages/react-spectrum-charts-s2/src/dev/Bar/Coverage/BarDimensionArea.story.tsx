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

import { GROUP_DATA, MARK_ID } from '@spectrum-charts/core-s2/constants';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { Axis, Bar, ChartInspect, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { barDataWithSeries, barSeriesData } from '../../../storyShared/components/Bar/data.js';
import { bindWithProps } from '../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Bar/Coverage/Dimension Area',
  component: Bar,
};

const groupedDialogContent = (datum: Datum): ReactElement => (
  <>
    <div>Operating system: {datum.operatingSystem}</div>
    <div>Browser: {datum.browser}</div>
    <div>Downloads: {datum.value}</div>
  </>
);

const BasicDimensionAreaStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataWithSeries, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartInspect targets={['item', 'dimensionArea']}>
          {(datum) => {
            const d = datum[GROUP_DATA]?.[0] ?? datum;
            return (
              <div>
                {d.browser}: {d.downloads}
              </div>
            );
          }}
        </ChartInspect>
      </Bar>
      <Legend title="Metric" />
    </Chart>
  );
};

const GroupedDimensionAreaStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barSeriesData, width: 800, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartInspect>{groupedDialogContent}</ChartInspect>
        <ChartInspect targets={['dimensionArea']}>
          {(datum) => (
            <>
              <div style={{ fontWeight: 'bold' }}>{datum.browser} Downloads</div>
              {datum[GROUP_DATA]?.map((d) => (
                <div key={d[MARK_ID]}>
                  {d.operatingSystem}: {d.value}
                </div>
              ))}
            </>
          )}
        </ChartInspect>
      </Bar>
      <Legend title="Operating system" highlight />
    </Chart>
  );
};

export const BasicInspectOnDimensionArea = bindWithProps(BasicDimensionAreaStory);
BasicInspectOnDimensionArea.args = { dimension: 'browser', metric: 'downloads', color: 'series' };

export const DodgedInspectOnDimensionArea = bindWithProps(GroupedDimensionAreaStory);
DodgedInspectOnDimensionArea.args = { type: 'dodged', dimension: 'browser', color: 'operatingSystem' };

export const StackedInspectOnDimensionArea = bindWithProps(GroupedDimensionAreaStory);
StackedInspectOnDimensionArea.args = { dimension: 'browser', order: 'order', color: 'operatingSystem' };
