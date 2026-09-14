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
import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { barData, barDataLongLabels, barDataTwoSeries } from '../Bar/data';

export default {
  title: 'React Spectrum Charts 2/Accessible Navigation/Axis Navigation',
  component: Axis,
};

/**
 * Axis label focus ring. With `accessibleNavigation`, the data-navigator exposes an "Enter navigation
 * area" affordance (Tab to it, press Enter), then ← / → move through the bottom axis labels. Each
 * focused label draws a DOM overlay ring around its REAL rendered bounds (primary + sublabel unioned),
 * read from the scenegraph — so rotation/multiline/overlap are handled: overlap-hidden labels simply
 * aren't navigable.
 */
interface AxisFocusStoryArgs {
  data: SimpleData[];
  width: number;
  metric?: string;
  color?: string;
  subLabels?: { value: string; subLabel: string }[];
}

const AxisNavigationStory: StoryFn<AxisFocusStoryArgs> = (args): ReactElement => {
  const metric = args.metric ?? 'downloads';
  const chartProps = useChartProps({ data: args.data, width: args.width, height: 400, accessibleNavigation: true });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline subLabels={args.subLabels} title="Browser" />
      <Axis position="left" grid title="Downloads" />
      {/* ChartInspect makes the bars interactive so hovering an axis label highlights the matching bar/stack. */}
      <Bar dimension="browser" metric={metric} color={args.color}>
        <ChartInspect>{(datum) => <div>{`${datum.browser}: ${datum[metric]}`}</div>}</ChartInspect>
        {/* Focusing a whole stack (not a segment) shows this, same as hovering its exposed padding with a mouse. */}
        <ChartInspect targets={['dimensionArea']}>
          {(datum) => (
            <div>
              <div style={{ fontWeight: 'bold' }}>{datum.browser}</div>
              {datum[GROUP_DATA]?.map((d) => (
                <div key={d[MARK_ID]}>
                  {d.operatingSystem}: {d.value}
                </div>
              ))}
            </div>
          )}
        </ChartInspect>
      </Bar>
    </Chart>
  );
};

// Long labels + a narrow width force Vega to overlap-hide some labels — those aren't navigable.
export const CategoricalOverlap = AxisNavigationStory.bind({});
(CategoricalOverlap as { args?: AxisFocusStoryArgs }).args = { data: barDataLongLabels, width: 380 };

// Roomy, stacked (dimension + series): proves the axis root's dimension-only hover parity highlights
// the whole stack, not a single segment.
export const Categorical = AxisNavigationStory.bind({});
(Categorical as { args?: AxisFocusStoryArgs }).args = {
  data: barDataTwoSeries,
  width: 600,
  metric: 'value',
  color: 'operatingSystem',
};

// A primary label + its sublabel share one focus ring (unioned bounds).
export const WithSublabels = AxisNavigationStory.bind({});
(WithSublabels as { args?: AxisFocusStoryArgs }).args = {
  data: barData,
  width: 600,
  subLabels: [
    { value: 'Chrome', subLabel: '80.1+' },
    { value: 'Firefox', subLabel: '70.0+' },
    { value: 'Safari', subLabel: '10.13 (High Sierra)+' },
  ],
};
