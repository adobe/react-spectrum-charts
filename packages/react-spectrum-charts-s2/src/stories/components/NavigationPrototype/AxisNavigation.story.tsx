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
import { barData, barDataWithUTC } from '../Bar/data';

export default {
  title: 'React Spectrum Charts 2/NavigationPrototype/Features/Axis Navigation',
};

/**
 * Axis navigation. With `accessibleNavigation`, the data-navigator exposes axis regions alongside
 * chart content. Tab into the chart, press Enter, then ← / → move through axis labels. Each focused
 * label draws the spec's `axisFocusRing` around its real rendered bounds (read from the scenegraph),
 * so rotation/multiline/overlap are handled. Focusing an axis label also highlights the matching bar,
 * same as mouse hover.
 */
const AxisNavigationStory: StoryFn = (): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600, height: 600, accessibleNavigation: true });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Downloads" />
      <Bar dimension="browser" metric="downloads">
        <ChartInspect>
          {(datum) => <div>{`${datum.browser}: ${datum.downloads}`}</div>}
        </ChartInspect>
      </Bar>
    </Chart>
  );
};

export const AxisNavigation = AxisNavigationStory.bind({});
AxisNavigation.args = {
  data: barData,
  width: 600,
};
