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
import { ReactElement, useState } from 'react';

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartPopover, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import {
  FunnelConversion,
  FunnelTimeComparison as FunnelTimeComparisonExample,
  TrendsTimeComparisonBar,
  TrendsTimeComparisonStackedBar,
  UserGrowthTimeComparisonBarGrowth,
} from '../../ChartExamples.story';

export default {
  title: 'React Spectrum Charts 2/Accessible Navigation/Multi-Field Series',
};

/** Renders a Chart Examples story with keyboard navigation on. */
const withNavigation = (Example: StoryFn<typeof Chart>) => {
  const story = bindWithProps<typeof Chart>((args, context) => Example(args, context));
  story.args = { ...Example.args, accessibleNavigation: true } as typeof story.args;
  return story;
};

/** Dodged by `series`, with `period` as a string opacity/lineType: legend entries read "series | period". */
export const TimeComparisonBar = withNavigation(TrendsTimeComparisonBar);

/** Stacked by `series`, dodged by `period` (a two-field opacity array). */
export const TimeComparisonStackedBar = withNavigation(TrendsTimeComparisonStackedBar);

/** Stacked by `series`, dodged by `period`, with negative values. */
export const UserGrowthTimeComparison = withNavigation(UserGrowthTimeComparisonBarGrowth);

/** Dodged by `series`, stacked by `subSeries` (a two-field color array), with hidden legend entries. */
export const FunnelDodgedAndStacked = withNavigation(FunnelConversion);

/** Dodged by `series` and `period`, stacked by `subSeries`. */
export const FunnelTimeComparison = withNavigation(FunnelTimeComparisonExample);

const contextMenuData = ['Chrome', 'Firefox', 'Safari'].flatMap((browser, browserIndex) =>
  ['Windows', 'macOS', 'Linux'].map((operatingSystem, osIndex) => ({
    browser,
    operatingSystem,
    downloads: ((browserIndex + 2) * (osIndex + 3)) % 11 + 1,
  }))
);

interface ContextMenuArgs {
  width: number;
  height: number;
}

/** Shift+F10 (or the ContextMenu key) on a legend series or a bar opens its right-click popover; bars also log `onContextMenu`. */
const ContextMenuStory: StoryFn<ContextMenuArgs> = (args): ReactElement => {
  const { width, height } = args;
  const [lastContextMenu, setLastContextMenu] = useState('none');
  const chartProps = useChartProps({ data: contextMenuData, width, height, accessibleNavigation: true });
  return (
    <>
      <Chart {...chartProps}>
        <Axis position="bottom" baseline title="Browser" />
        <Axis position="left" grid title="Downloads" />
        <Bar
          dimension="browser"
          metric="downloads"
          color="operatingSystem"
          onContextMenu={(event, datum) =>
            setLastContextMenu(`${datum.browser} / ${datum.operatingSystem} at (${Math.round(event.clientX)}, ${Math.round(event.clientY)})`)
          }
        >
          <ChartPopover rightClick width={200}>
            {(datum) => (
              <div>
                Bar menu: {datum.browser} / {datum.operatingSystem}
              </div>
            )}
          </ChartPopover>
        </Bar>
        <Legend title="Operating system">
          <ChartPopover rightClick width="auto">
            {(datum) => <div>Legend menu: {datum.value}</div>}
          </ChartPopover>
        </Legend>
      </Chart>
      <div data-testid="last-context-menu">Last onContextMenu: {lastContextMenu}</div>
    </>
  );
};

export const KeyboardContextMenu = bindWithProps(ContextMenuStory);
KeyboardContextMenu.args = { width: 700, height: 450 };
