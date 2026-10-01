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

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, ChartPopover, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { browserData as data } from '../../../storyShared/data/data';
import { bindWithProps } from '../../../test-utils';
import { ChartProps } from '../../../types';
import { ChartPopoverProps } from '../../../types/dialogs/chartPopover.types';

interface ChartPopoverStoryArgs extends ChartPopoverProps {
  renderer?: ChartProps['renderer'];
  type?: 'stacked' | 'dodged';
}

export default {
  title: 'React Spectrum Charts 2/Chart Popover/Tests',
  component: ChartPopover,
};

const dialogContent = (datum: Datum) => (
  <div>
    <div>Operating system: {datum.series}</div>
    <div>Browser: {datum.category}</div>
    <div>Users: {datum.value}</div>
  </div>
);

const BarPopoverStory: StoryFn<ChartPopoverStoryArgs> = (args): ReactElement => {
  const { renderer = 'svg', type = 'stacked', ...popoverArgs } = args;
  const chartProps = useChartProps({ data, renderer, width: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Users" />
      <Bar color="series" type={type}>
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover {...popoverArgs} />
      </Bar>
      <Legend highlight />
    </Chart>
  );
};

const Renderer = bindWithProps(BarPopoverStory);
Renderer.args = { children: dialogContent, width: 'auto', renderer: 'canvas' };

const DodgedBar = bindWithProps(BarPopoverStory);
DodgedBar.args = { children: dialogContent, width: 'auto', type: 'dodged' };

// UNSAFE_highlightBy dimension selects every bar in the clicked browser group.
const DodgedBarHighlightByDimension = bindWithProps(BarPopoverStory);
DodgedBarHighlightByDimension.args = {
  children: dialogContent,
  width: 'auto',
  type: 'dodged',
  UNSAFE_highlightBy: 'dimension',
};

export { Renderer, DodgedBar, DodgedBarHighlightByDimension };
