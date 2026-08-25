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
import { Axis, Bar, ChartInspect } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { barData, barDataLongLabels, barDataWithUTC } from '../Bar/data';

export default {
  title: 'React Spectrum Charts 2/Axis/Features/Focus Ring',
  component: Axis,
};

/**
 * Axis label focus ring. With `accessibleNavigation`, the data-navigator exposes an "Enter navigation
 * area" affordance (Tab to it, press Enter), then ← / → move through the bottom axis labels. Each
 * focused label draws the spec's `axisFocusRing` around its REAL rendered bounds (primary + sublabel
 * unioned), read from the scenegraph — so rotation/multiline/overlap are handled: overlap-hidden labels
 * simply aren't navigable.
 */
interface AxisFocusStoryArgs {
  data: typeof barData;
  width: number;
  labelFormat?: 'time';
  granularity?: 'day' | 'month';
}

const AxisFocusRingStory: StoryFn<AxisFocusStoryArgs> = (args): ReactElement => {
  const chartProps = useChartProps({ data: args.data, width: args.width, height: 400, accessibleNavigation: true });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline labelFormat={args.labelFormat} granularity={args.granularity} title="Browser" />
      <Axis position="left" grid title="Downloads" />
      {/* ChartInspect makes the bars interactive so hovering an axis label highlights the matching bar. */}
      <Bar dimension="browser" metric="downloads">
        <ChartInspect>{(datum) => <div>{`${datum.browser}: ${datum.downloads}`}</div>}</ChartInspect>
      </Bar>
    </Chart>
  );
};

// Long labels + a narrow width force Vega to overlap-hide some labels — those aren't navigable.
export const CategoricalOverlap = AxisFocusRingStory.bind({});
(CategoricalOverlap as { args?: AxisFocusStoryArgs }).args = { data: barDataLongLabels, width: 380 };

// Roomy: every label visible.
export const Categorical = AxisFocusRingStory.bind({});
(Categorical as { args?: AxisFocusStoryArgs }).args = { data: barData, width: 600 };

// Time axis with sublabels — a primary label + its sublabel share one focus ring (unioned bounds).
export const TimeWithSublabels = AxisFocusRingStory.bind({});
(TimeWithSublabels as { args?: AxisFocusStoryArgs }).args = {
  data: barDataWithUTC,
  width: 600,
  labelFormat: 'time',
  granularity: 'month',
};
