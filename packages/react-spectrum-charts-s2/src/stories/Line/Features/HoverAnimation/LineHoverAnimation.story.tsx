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

/* eslint-disable react/prop-types -- story args are typed via StoryFn generics, not React propTypes */
import { ComponentProps, ReactElement } from 'react';

import { action } from '@storybook/addon-actions';
import { StoryFn } from '@storybook/react';

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../../Chart';
import { Axis, ChartInspect, ChartPopover, Legend, Line, LineDirectLabel } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsData, workspaceTrendsDataWithVisiblePoints } from '../../../../stories/data/data';
import { formatTimestamp } from '../../../../stories/storyUtils';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

// ┌─────────────────────────┬──────────────────────────────────────────────────────────┬───────────────────────────────────────────────┐
// │          Story          │                         Trigger                          │                   Match rule                  │
// ├─────────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │        PointHover       │           <ChartInspect> — hover a data point            │                  hoveredMatch                 │
// ├─────────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │       LegendHover       │       <Legend highlight /> — hover a legend entry        │           injected legendHoverMatch           │
// ├─────────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │    GroupedLegendHover   │ <Legend keys={['category']} highlight /> on grouped data │ grouped legend hover (hoverGroupFractionData) │
// ├─────────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │     PopoverSelection    │         <ChartPopover> — click a point to select         │                  popoverMatch                 │
// ├─────────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │   ControlledHighlight   │               highlightedSeries chart prop               │             controlledSeriesMatch             │
// ├─────────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │ ControlledHighlightItem │                highlightedItem chart prop                │              controlledTableMatch             │
// ├─────────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │         OnClick         │        onClick handler makes the line interactive        │      hoveredMatch (interactive-via-click)     │
// ├─────────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │     StaticPointHover    │    <ChartInspect> + staticPoint — hover a data point     │   hoveredMatch (getLineStaticPoint consumer)  │
// ├─────────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │     DirectLabelHover    │ <ChartInspect> + <LineDirectLabel> — hover a data point  │    hoveredMatch (directLabelUtils consumer)   │
// ├─────────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │       HiddenSeries      │  <Legend highlight isToggleable defaultHiddenSeries />   │      demo — see AN-460581, may misbehave      │
// └─────────────────────────┴──────────────────────────────────────────────────────────┴───────────────────────────────────────────────┘

/**
 * Showcases the line hover-animation system across every interaction that can emphasize a series.
 * In each story the emphasized series smoothly grows its stroke width while the others fade their
 * opacity; on un-hover everything animates back.
 */
export default {
  title: 'React Spectrum Charts 2/Line/Features/HoverAnimation',
  component: Line,
  argTypes: {
    animations: {
      control: 'boolean',
      description: 'Chart-level toggle for the animated hover/highlight system.',
    },
  },
  args: { animations: true },
};

type HoverAnimationArgs = ComponentProps<typeof Line> & { animations?: boolean };

const defaultChartProps: ChartProps = { data: workspaceTrendsData, minWidth: 400, maxWidth: 800, height: 400 };

const defaultArgs = {
  color: 'series',
  dimension: 'datetime',
  metric: 'value',
  scaleType: 'time' as const,
  name: 'line0',
};

const dialogContent = (datum: Datum): ReactElement => (
  <div>
    <div>{formatTimestamp(datum.datetime as number)}</div>
    <div>Event: {datum.series}</div>
    <div>Users: {Number(datum.value).toLocaleString()}</div>
  </div>
);

/**
 * Groups the trend series into two categories so a grouped legend can be demonstrated. Category must be
 * constant per series (color facet) — otherwise faceting by [series, category] shatters each line.
 */
const seriesCategory: Record<string, string> = {
  'Add Fallout': 'Analyze',
  'Add Freeform table': 'Analyze',
  'Add Line viz': 'Visualize',
  'Add Bar viz': 'Visualize',
};
const groupedData = workspaceTrendsData.map((d) => ({ ...d, category: seriesCategory[d.series] }));

/**
 * Point hover — hovering a data point emphasizes that point's series (the `hoveredMatch` rule).
 * ChartInspect makes the line interactive, which is what creates the hover-animation data.
 */
const PointHoverStory: StoryFn<HoverAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args}>
        <ChartInspect>{dialogContent}</ChartInspect>
      </Line>
      <Legend />
    </Chart>
  );
};

/** Legend hover — hovering a legend entry emphasizes that series (the injected `legendHoverMatch` rule). */
const LegendHoverStory: StoryFn<HoverAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend highlight />
    </Chart>
  );
};

/** Grouped legend hover — hovering a grouped legend entry emphasizes every series in that group. */
const GroupedLegendHoverStory: StoryFn<HoverAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: groupedData, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} lineType="category" />
      <Legend keys={['category']} highlight />
    </Chart>
  );
};

/** Popover selection — clicking a point selects its series (the `popoverMatch` rule) and keeps it emphasized. */
const PopoverSelectionStory: StoryFn<HoverAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args}>
        <ChartPopover width="auto">{dialogContent}</ChartPopover>
      </Line>
      <Legend />
    </Chart>
  );
};

/** Controlled highlight — an external `highlightedSeries` chart prop emphasizes a series (the `controlledSeriesMatch` rule). */
const ControlledHighlightStory: StoryFn<HoverAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, highlightedSeries: 'Add Freeform table', animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend />
    </Chart>
  );
};

/** Controlled highlight — an external `highlightedItem` chart prop emphasizes the row's series (the `controlledTableMatch` rule). */
const ControlledHighlightItemStory: StoryFn<HoverAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, highlightedItem: 0, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend />
    </Chart>
  );
};

/** onClick — an onClick handler makes the line interactive, so hovering points animates the emphasis. */
const OnClickStory: StoryFn<HoverAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} onClick={action('onClick')} />
      <Legend />
    </Chart>
  );
};

/**
 * Static point hover — hovering a data point (`ChartInspect`) fades the always-visible static point
 * markers for deemphasized series along with the line itself, demonstrating `getLineStaticPoint`'s
 * wiring into the same animated fraction as `getLineOpacity`.
 */
const StaticPointHoverStory: StoryFn<HoverAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: workspaceTrendsDataWithVisiblePoints, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args}>
        <ChartInspect>{dialogContent}</ChartInspect>
      </Line>
      <Legend highlight />
    </Chart>
  );
};

/**
 * Direct label hover — hovering a data point (`ChartInspect`) fades the end-of-line direct labels
 * for deemphasized series along with the line itself. The label's background halo stays fully
 * opaque throughout — only the foreground text fades.
 */
const DirectLabelHoverStory: StoryFn<HoverAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args}>
        <LineDirectLabel value="series" />
        <ChartInspect>{dialogContent}</ChartInspect>
      </Line>
      <Legend highlight />
    </Chart>
  );
};

/** Hidden Series - combines Legend `defaultHiddenSeries`/`isToggleable` with the hover-animation */
const HiddenSeriesStory: StoryFn<HoverAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args}>
        <ChartInspect>{dialogContent}</ChartInspect>
      </Line>
      <Legend highlight isToggleable defaultHiddenSeries={['Add Bar viz']} />
    </Chart>
  );
};

export const PointHover = bindWithProps(PointHoverStory);
PointHover.args = { ...defaultArgs };

export const LegendHover = bindWithProps(LegendHoverStory);
LegendHover.args = { ...defaultArgs };

export const GroupedLegendHover = bindWithProps(GroupedLegendHoverStory);
GroupedLegendHover.args = { ...defaultArgs };

export const PopoverSelection = bindWithProps(PopoverSelectionStory);
PopoverSelection.args = { ...defaultArgs };

export const ControlledHighlight = bindWithProps(ControlledHighlightStory);
ControlledHighlight.args = { ...defaultArgs };

export const ControlledHighlightItem = bindWithProps(ControlledHighlightItemStory);
ControlledHighlightItem.args = { ...defaultArgs };

export const OnClick = bindWithProps(OnClickStory);
OnClick.args = { ...defaultArgs };

export const StaticPointHover = bindWithProps(StaticPointHoverStory);
StaticPointHover.args = { ...defaultArgs, staticPoint: 'staticPoint' };

export const DirectLabelHover = bindWithProps(DirectLabelHoverStory);
DirectLabelHover.args = { ...defaultArgs };

export const HiddenSeries = bindWithProps(HiddenSeriesStory);
HiddenSeries.args = { ...defaultArgs };