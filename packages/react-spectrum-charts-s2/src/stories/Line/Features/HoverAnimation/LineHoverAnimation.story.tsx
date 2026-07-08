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
import { Axis, ChartInspect, ChartPopover, Legend, Line } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../../stories/data/data';
import { formatTimestamp } from '../../../../stories/storyUtils';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';

// ┌─────────────────────┬──────────────────────────────────────────────────────────┬───────────────────────────────────────────────┐
// │        Story        │                         Trigger                          │                  Match rule                   │
// ├─────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │ PointHover          │ <ChartInspect> — hover a data point                      │ hoveredMatch                                  │
// ├─────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │ LegendHover         │ <Legend highlight /> — hover a legend entry              │ injected legendHoverMatch                     │
// ├─────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │ GroupedLegendHover  │ <Legend keys={['category']} highlight /> on grouped data │ grouped legend hover (hoverGroupFractionData) │
// ├─────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │ PopoverSelection    │ <ChartPopover> — click a point to select                 │ popoverMatch                                  │
// ├─────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │ ControlledHighlight │ highlightedSeries chart prop                             │ controlledSeriesMatch                         │
// ├─────────────────────┼──────────────────────────────────────────────────────────┼───────────────────────────────────────────────┤
// │ OnClick             │ onClick handler makes the line interactive               │ hoveredMatch (interactive-via-click)          │
// └─────────────────────┴──────────────────────────────────────────────────────────┴───────────────────────────────────────────────┘

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
      description:
        'Chart-level toggle: when on, hover/highlight use the animated system; when off, the original instant production-rule highlight.',
    },
  },
  args: { animations: true },
};

/** Story args are the Line's props plus the chart-level `animations` toggle. */
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
 * Deterministic PRNG (mulberry32) — used instead of Math.random() so stress-test data is
 * reproducible across story reloads and doesn't trip "insecure randomness" lint rules that
 * assume Math.random() output could be used for something security-sensitive.
 */
const createSeededRandom = (seed: number): (() => number) => {
  let state = seed;
  return () => {
    state = Math.trunc(state + 0x6d2b79f5);
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Stress test data — 100,000 rows across 20 series (5,000 points each), generated rather than
 * hand-authored, to exercise the hover-animation system at scale.
 */
const generateLargeData = (
  seriesCount = 20,
  pointsPerSeries = 5_000
): { datetime: number; value: number; series: string }[] => {
  const START = new Date('2023-01-01T00:00:00Z').getTime();
  const STEP_MS = 60 * 60 * 1000; // one point per hour
  const random = createSeededRandom(42);
  const data: { datetime: number; value: number; series: string }[] = [];
  for (let s = 0; s < seriesCount; s++) {
    const series = `Series ${String(s + 1).padStart(2, '0')}`;
    const base = 1_000 + s * 250;
    for (let p = 0; p < pointsPerSeries; p++) {
      data.push({
        datetime: START + p * STEP_MS,
        value: Math.max(0, base + Math.sin(p / 40 + s) * 400 + (random() - 0.5) * 200),
        series,
      });
    }
  }
  return data;
};

const largeData = generateLargeData(); // 20 series × 5,000 points = 100,000 rows

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
 * Performance stress test — 100,000 rows across 20 series. Hover a legend entry or a data point to
 * watch the hover-animation system fade/emphasize at scale (toggle `animations` to compare).
 */
const LargeDatasetStory: StoryFn<HoverAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: largeData, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Value" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args}>
        <ChartInspect>{dialogContent}</ChartInspect>
      </Line>
      <Legend highlight />
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

export const OnClick = bindWithProps(OnClickStory);
OnClick.args = { ...defaultArgs };

export const LargeDataset = bindWithProps(LargeDatasetStory);
LargeDataset.args = { ...defaultArgs };
