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
import { Orientation } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, ChartPopover, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { barData, barSeriesData } from '../Bar/data';

export default {
  title: 'React Spectrum Charts 2/Accessible Navigation/Bar Navigation',
  argTypes: {
    // Inline radio so a tester can flip orientation and confirm arrow keys follow the bars' layout.
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
  },
};

interface BarNavigationArgs {
  /** Toggles the chart between vertical and horizontal so arrow-key navigation can be tested in both. */
  orientation: Orientation;
}

/** Non-interactive bar (no popover/inspect/onClick) keyboard navigation: Tab to "Enter navigation area", then arrow keys move between bars. */
const NonInteractiveBarNavigationStory: StoryFn<BarNavigationArgs> = (args): ReactElement => {
  const { orientation } = args;
  const isHorizontal = orientation === 'horizontal';
  const chartProps = useChartProps({ data: barData, width: 600, height: 600, accessibleNavigation: true });
  return (
    <Chart {...chartProps}>
      <Axis position={isHorizontal ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={isHorizontal ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar dimension="browser" metric="downloads" orientation={orientation} />
    </Chart>
  );
};

/** Stacked bar keyboard navigation: Tab to "Enter navigation area", then arrow keys move between bars/segments. */
const StackedBarNavigationStory: StoryFn<BarNavigationArgs> = (args): ReactElement => {
  const { orientation } = args;
  const isHorizontal = orientation === 'horizontal';
  const chartProps = useChartProps({
    data: barSeriesData,
    width: 800,
    height: 600,
    accessibleNavigation: true,
    renderer: 'canvas',
  });
  return (
    <>
      {/* Real page elements before/after the chart, so Tab/Shift+Tab in and out of the widget is observable. */}
      <button type="button">Prev element</button>
      <Chart {...chartProps}>
        <Axis position={isHorizontal ? 'left' : 'bottom'} baseline title="Browser" />
        <Axis position={isHorizontal ? 'bottom' : 'left'} grid title="Downloads" />
        <Bar dimension="browser" order="order" color="operatingSystem" orientation={orientation}>
          <ChartInspect>
            {(datum) => (
              <div>
                Operating system: {datum.operatingSystem}
                <br />
                Browser: {datum.browser}
                <br />
                Downloads: {datum.value}
              </div>
            )}
          </ChartInspect>
          {/* Focusing a stack (not a segment) shows this, same as hovering the stack's padding area with a mouse. */}
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
          {/* Real buttons so focus entering the popover is testable — Safari's popover has none, for contrast. */}
          <ChartPopover width={200}>
            {(datum, close) => (
              <div>
                Operating system: {datum.operatingSystem}
                <br />
                Browser: {datum.browser}
                <br />
                Downloads: {datum.value}
                {datum.browser !== 'Safari' && (
                  <>
                    <br />
                    <button type="button">Action one</button>
                    <button type="button">Action two</button>
                    {close && (
                      <button type="button" onClick={close}>
                        Close
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </ChartPopover>
        </Bar>
        <Legend title="Operating system" color="operatingSystem" highlight />
      </Chart>
      <button type="button">Next element</button>
    </>
  );
};

export const NonInteractiveBarNavigation = NonInteractiveBarNavigationStory.bind({});
NonInteractiveBarNavigation.args = { orientation: 'vertical' };

export const StackedBarNavigation = StackedBarNavigationStory.bind({});
StackedBarNavigation.args = { orientation: 'vertical' };
