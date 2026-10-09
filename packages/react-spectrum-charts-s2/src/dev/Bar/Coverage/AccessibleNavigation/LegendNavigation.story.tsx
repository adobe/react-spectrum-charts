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

import { Orientation } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../Chart.js';
import { Axis, Bar, ChartInspect, ChartPopover, Legend } from '../../../../components/index.js';
import useChartProps from '../../../../hooks/useChartProps.js';
import { bindWithProps } from '../../../../test-utils/index.js';

export default {
  title: 'React Spectrum Charts 2/Bar/Coverage/Accessible Navigation',
  argTypes: {
    position: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    type: { control: 'inline-radio', options: ['stacked', 'dodged'] },
    width: { control: { type: 'range', min: 300, max: 1000, step: 50 } },
    height: { control: { type: 'range', min: 200, max: 700, step: 50 } },
  },
};

const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
const operatingSystems = ['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'ChromeOS', 'FreeBSD', 'Other'];

const legendNavigationData = browsers.flatMap((browser, browserIndex) =>
  operatingSystems.map((operatingSystem, osIndex) => ({
    browser,
    operatingSystem,
    downloads: ((browserIndex + 2) * (osIndex + 3)) % 11 + 1,
  }))
);

// Dual metric axis puts the last series on its own right-hand axis, so it's shown with just two series.
const dualMetricAxisData = legendNavigationData.filter((datum) => ['Windows', 'macOS'].includes(datum.operatingSystem));

const barDialogContent = (datum) => (
  <div>
    <div>Browser: {datum.browser}</div>
    <div>Operating system: {datum.operatingSystem}</div>
    <div>Downloads: {datum.downloads}</div>
  </div>
);

const descriptions = operatingSystems.map((seriesName) => ({ seriesName, description: `${seriesName} downloads` }));

export interface LegendNavigationArgs {
  position: 'top' | 'bottom' | 'left' | 'right';
  orientation: Orientation;
  type: 'stacked' | 'dodged';
  highlight: boolean;
  isToggleable: boolean;
  width: number;
  height: number;
  /** Adds a legend ChartPopover and per-series descriptions (tooltip on focus). */
  withPopover?: boolean;
  /** Adds a ChartInspect tooltip and ChartPopover to the bars. */
  interactiveBars?: boolean;
  /** Dodged bars with the second series on its own right-hand axis. */
  dualMetricAxis?: boolean;
}

/** Tab in, move to the legend region, then Enter for its series and Enter again for that series' bars. Narrow the width to make the legend wrap. */
const LegendNavigationStory: StoryFn<LegendNavigationArgs> = (args): ReactElement => {
  const { position, orientation, type, highlight, isToggleable, width, height, withPopover, interactiveBars, dualMetricAxis } =
    args;
  const isHorizontal = orientation === 'horizontal';
  const data = dualMetricAxis ? dualMetricAxisData : legendNavigationData;
  const chartProps = useChartProps({ data, width, height, accessibleNavigation: true });
  return (
    <Chart {...chartProps}>
      <Axis position={isHorizontal ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={isHorizontal ? 'bottom' : 'left'} grid title={dualMetricAxis ? 'Windows downloads' : 'Downloads'} />
      {dualMetricAxis && <Axis position={isHorizontal ? 'top' : 'right'} title="macOS downloads" />}
      <Bar
        dimension="browser"
        metric="downloads"
        color="operatingSystem"
        orientation={orientation}
        type={dualMetricAxis ? 'dodged' : type}
        dualMetricAxis={dualMetricAxis}
      >
        {interactiveBars && <ChartInspect>{barDialogContent}</ChartInspect>}
        {interactiveBars && <ChartPopover width={200}>{barDialogContent}</ChartPopover>}
      </Bar>
      <Legend
        title="Operating system"
        position={position}
        highlight={highlight}
        isToggleable={isToggleable}
        descriptions={withPopover ? descriptions : undefined}
      >
        {withPopover && <ChartPopover width="auto">{(datum) => <div>Series: {datum.value}</div>}</ChartPopover>}
      </Legend>
    </Chart>
  );
};

export const LegendNavigation = bindWithProps(LegendNavigationStory);
LegendNavigation.args = {
  position: 'bottom',
  orientation: 'vertical',
  type: 'stacked',
  highlight: true,
  isToggleable: true,
  width: 700,
  height: 500,
  withPopover: false,
  interactiveBars: true,
  dualMetricAxis: false,
};

export const HorizontalStacked = bindWithProps(LegendNavigationStory);
HorizontalStacked.args = { ...LegendNavigation.args, orientation: 'horizontal' };

export const Dodged = bindWithProps(LegendNavigationStory);
Dodged.args = { ...LegendNavigation.args, type: 'dodged' };

/** Horizontal dodged bars: bar-level arrows swap with orientation. */
export const HorizontalDodged = bindWithProps(LegendNavigationStory);
HorizontalDodged.args = { ...LegendNavigation.args, orientation: 'horizontal', type: 'dodged' };

export const DualMetricAxis = bindWithProps(LegendNavigationStory);
DualMetricAxis.args = { ...LegendNavigation.args, dualMetricAxis: true };

/** Narrow chart: the bottom legend wraps into rows, so Up/Down move between rows. */
export const WrappedRows = bindWithProps(LegendNavigationStory);
WrappedRows.args = { ...LegendNavigation.args, width: 400 };

/** Short chart: the right legend wraps into columns, so Left/Right move between columns. */
export const WrappedColumns = bindWithProps(LegendNavigationStory);
WrappedColumns.args = { ...LegendNavigation.args, position: 'right', height: 250 };

export const TopLegend = bindWithProps(LegendNavigationStory);
TopLegend.args = { ...LegendNavigation.args, position: 'top' };

export const LeftLegend = bindWithProps(LegendNavigationStory);
LeftLegend.args = { ...LegendNavigation.args, position: 'left' };

/** Space opens the legend popover (instead of toggling); focusing a series shows its description tooltip. */
export const WithPopoverAndDescriptions = bindWithProps(LegendNavigationStory);
WithPopoverAndDescriptions.args = { ...LegendNavigation.args, withPopover: true };

/** No highlight, toggle or bar tooltips/popovers: rings only, Space does nothing. */
export const NonInteractiveLegend = bindWithProps(LegendNavigationStory);
NonInteractiveLegend.args = { ...LegendNavigation.args, highlight: false, isToggleable: false, interactiveBars: false };

/** Controlled legend: the consumer drives `highlightedSeries` from onMouseOver/onMouseOut and `hiddenSeries` from onClick. */
const ControlledLegendStory: StoryFn<LegendNavigationArgs> = (args): ReactElement => {
  const { width, height } = args;
  const [highlightedSeries, setHighlightedSeries] = useState<string | undefined>();
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  const chartProps = useChartProps({ data: legendNavigationData, width, height, accessibleNavigation: true });
  const toggle = (series: string) =>
    setHiddenSeries((hidden) => (hidden.includes(series) ? hidden.filter((value) => value !== series) : [...hidden, series]));
  return (
    <Chart {...chartProps} highlightedSeries={highlightedSeries} hiddenSeries={hiddenSeries}>
      <Axis position="bottom" baseline title="Browser" />
      <Axis position="left" grid title="Downloads" />
      <Bar dimension="browser" metric="downloads" color="operatingSystem" />
      <Legend
        title="Operating system"
        descriptions={descriptions}
        onMouseOver={setHighlightedSeries}
        onMouseOut={() => setHighlightedSeries(undefined)}
        onClick={toggle}
      />
    </Chart>
  );
};

export const ControlledLegend = bindWithProps(ControlledLegendStory);
ControlledLegend.args = { ...LegendNavigation.args };
