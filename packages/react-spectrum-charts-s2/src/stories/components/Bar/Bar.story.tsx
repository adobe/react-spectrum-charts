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

import { action } from '@storybook/addon-actions';
import { StoryFn } from '@storybook/react';

import { GROUP_DATA } from '@spectrum-charts/constants';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartInspect, Legend } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import { barData, barDataWithUTC } from './data';

export default {
  title: 'React Spectrum Charts 2/Bar/Features',
  component: Bar,
};

const BarStoryWithUTCData: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barDataWithUTC, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis
        position={args.orientation === 'horizontal' ? 'left' : 'bottom'}
        labelFormat="time"
        granularity="day"
        baseline
        title="Browser"
      />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
    </Chart>
  );
};

const OnMouseInputsStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const [hoveredData, setHoveredData] = useState<Datum | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const controlledMouseOver = (datum: Datum) => {
    if (!isHovering) {
      setHoveredData(datum);
      setIsHovering(true);
    }
  };
  const controlledMouseOut = () => {
    if (isHovering) {
      setIsHovering(false);
    }
  };

  const chartProps = useChartProps({ data: barData, width: 600, height: 600 });
  return (
    <div>
      <div data-testid="hover-info">
        {isHovering && hoveredData ? (
          <div data-testid="hover-data">{JSON.stringify(hoveredData, null, 2)}</div>
        ) : (
          <div data-testid="no-hover">No bar hovered</div>
        )}
      </div>
      <Chart {...chartProps}>
        <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
        <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
        <Bar {...args} onMouseOver={controlledMouseOver} onMouseOut={controlledMouseOut} />
      </Chart>
    </div>
  );
};

const BarStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args} />
    </Chart>
  );
};

const AccessibleNavigationStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600, height: 600, accessibleNavigation: true });
  return (
    <Chart {...chartProps} debug>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} baseline grid title="Downloads" />
      {/* color-per-bar (not stacked) so the legend region has entries to test alongside the axis regions */}
      <Bar {...args} orientation='horizontal' color="browser" />
      {/* color must match the bar's own color field so keyboard focus can highlight the matching legend entry */}
      <Legend title="Browser" color="browser" />
    </Chart>
  );
};

// Side-by-side harness for legend parity: the button toggles `accessibleNavigation`, which swaps the
// built-in Vega legend (OLD) for the custom accessible-navigation legend (NEW). Both get the same rich
// set of legend props so each feature can be checked on both.
const legendLabels = [
  { seriesName: 'Chrome', label: 'Google Chrome' },
  { seriesName: 'Edge', label: 'Microsoft Edge' },
];
const legendDescriptions = [
  { seriesName: 'Chrome', description: 'Chromium-based browser by Google' },
  { seriesName: 'Firefox', description: 'Browser by Mozilla' },
];

// Legend props are exposed as Storybook controls so each can be toggled live and compared old vs new.
interface LegendControls {
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
  isToggleable?: boolean;
  align?: 'start' | 'middle' | 'end';
  labelLimit?: number;
  titleLimit?: number;
  useLegendLabels?: boolean;
  useDescriptions?: boolean;
  useHiddenEntries?: boolean;
}

const LegendComparisonStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const [useOldLegend, setUseOldLegend] = useState(false);
  const c = args as unknown as LegendControls;
  const chartProps = useChartProps({ data: barData, width: 600, height: 600, accessibleNavigation: !useOldLegend });
  return (
    <div>
      <button type="button" onClick={() => setUseOldLegend((v) => !v)} style={{ marginBottom: 12, padding: '6px 12px' }}>
        {useOldLegend ? 'Legend: OLD (built-in) — click for NEW' : 'Legend: NEW (custom) — click for OLD'}
      </button>
      {/* In NEW mode, Tab into the chart and use arrow keys to navigate the legend — focus rings appear. */}
      <Chart {...chartProps}>
        <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
        <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} baseline grid title="Downloads" />
        <Bar {...args} color="browser" />
        <Legend
          title="Browser"
          color="browser"
          position={c.legendPosition}
          highlight={c.highlight}
          isToggleable={c.isToggleable}
          align={c.align}
          labelLimit={c.labelLimit}
          titleLimit={c.titleLimit}
          legendLabels={c.useLegendLabels ? legendLabels : undefined}
          descriptions={c.useDescriptions ? legendDescriptions : undefined}
          hiddenEntries={c.useHiddenEntries ? ['Explorer'] : undefined}
        />
      </Chart>
    </div>
  );
};

const BarWithInspectStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600, height: 600 });
  return (
    <Chart {...chartProps}>
      <Axis position={args.orientation === 'horizontal' ? 'left' : 'bottom'} baseline title="Browser" />
      <Axis position={args.orientation === 'horizontal' ? 'bottom' : 'left'} grid title="Downloads" />
      <Bar {...args}>
        <ChartInspect>
          {(datum) => {
            return (
              <div>
                {datum.browser}: {datum.downloads}
              </div>
            );
          }}
        </ChartInspect>
      </Bar>
    </Chart>
  );
};

const BarDimensionAreaStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: barData, width: 600, height: 600 });
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
    </Chart>
  );
};

const defaultProps: BarProps = {
  dimension: 'browser',
  metric: 'downloads',
  onClick: undefined,
};

const Basic = bindWithProps(BarStory);
Basic.args = {
  ...defaultProps,
};

const Horizontal = bindWithProps(BarStory);
Horizontal.args = {
  ...defaultProps,
  orientation: 'horizontal',
};

const LineType = bindWithProps(BarStory);
LineType.args = {
  ...defaultProps,
  opacity: { value: 0.75 },
  lineType: { value: 'dashed' },
  lineWidth: 2,
};

const Opacity = bindWithProps(BarStory);
Opacity.args = {
  ...defaultProps,
  opacity: { value: 0.75 },
};

const PaddingRatio = bindWithProps(BarStory);
PaddingRatio.args = {
  ...defaultProps,
  paddingRatio: 0.2,
};

const HasSquareCorners = bindWithProps(BarStory);
HasSquareCorners.args = {
  ...defaultProps,
  hasSquareCorners: true,
};

const OnClick = bindWithProps(BarStory);
OnClick.args = {
  dimension: 'browser',
  metric: 'downloads',
  onClick: action('onClick'),
};

const OnMouseInputs = bindWithProps(OnMouseInputsStory);
OnMouseInputs.args = {
  dimension: 'browser',
  metric: 'downloads',
};

const BarWithUTCDatetimeFormat = bindWithProps(BarStoryWithUTCData);
BarWithUTCDatetimeFormat.args = {
  ...defaultProps,
  dimension: 'browser',
  metric: 'downloads',
  color: 'dataset_id',
  dimensionDataType: 'time',
};

const WithInspect = bindWithProps(BarWithInspectStory);
WithInspect.args = {
  ...defaultProps,
};

const InspectOnDimensionArea = bindWithProps(BarDimensionAreaStory);
InspectOnDimensionArea.args = {
  ...defaultProps,
};

// Hovering an axis label highlights the matching bar, same as hovering the bar itself.
const AxisLabelHighlight = bindWithProps(BarWithInspectStory);
AxisLabelHighlight.args = {
  ...defaultProps,
};

const AccessibleNavigation = bindWithProps(AccessibleNavigationStory);
AccessibleNavigation.args = {
  ...defaultProps,
};

// Toggle button swaps built-in (old) vs custom accessible-navigation (new) legend for parity testing.
// Legend props are Storybook controls so each can be toggled live on both legends.
const LegendComparison = bindWithProps(LegendComparisonStory);
LegendComparison.args = {
  ...defaultProps,
  orientation: 'horizontal',
  legendPosition: 'bottom',
  highlight: true,
  isToggleable: true,
  align: 'middle',
  labelLimit: 184,
  useLegendLabels: true,
  useDescriptions: true,
  useHiddenEntries: true,
} as unknown as typeof LegendComparison.args;
LegendComparison.argTypes = {
  legendPosition: { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
  align: { control: 'select', options: ['start', 'middle', 'end'] },
  labelLimit: { control: 'number' },
  titleLimit: { control: 'number' },
  highlight: { control: 'boolean' },
  isToggleable: { control: 'boolean' },
  useLegendLabels: { control: 'boolean', name: 'legendLabels' },
  useDescriptions: { control: 'boolean', name: 'descriptions' },
  useHiddenEntries: { control: 'boolean', name: 'hiddenEntries (Explorer)' },
} as unknown as typeof LegendComparison.argTypes;

export {
  AccessibleNavigation,
  LegendComparison,
  BarWithUTCDatetimeFormat,
  Basic,
  HasSquareCorners,
  Horizontal,
  LineType,
  OnClick,
  OnMouseInputs,
  Opacity,
  PaddingRatio,
  InspectOnDimensionArea,
  AxisLabelHighlight,
  WithInspect,
};
