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

import { StoryFn } from '@storybook/react';

import { Chart } from '../../../../Chart';
import { Axis, ChartInspect, Legend, Line, LineDirectLabel } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsData, workspaceTrendsDataWithVisiblePoints } from '../../../../stories/data/data';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';
import { formatTimestamp } from '../../../storyUtils';
import { Datum } from 'vega';


/**
 * Showcases the line draw-in animation across scale types and data shapes it does/doesn't support yet.
 * On mount, an animated line "draws in" left to right over its dimension domain.
 */
export default {
  title: 'React Spectrum Charts 2/Line/Features/DrawInAnimation',
  component: Line,
  argTypes: {
    animations: {
      control: 'boolean',
      description: 'Chart-level toggle for the animated draw-in/hover system.',
    },
  },
  args: { animations: true },
};

type DrawInAnimationArgs = ComponentProps<typeof Line> & { animations?: boolean };

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
 * Rows are interleaved out of chronological/series order (not the tidy per-series ascending blocks
 * `workspaceTrendsData` provides), and 'Add Bar viz' has a gap in the middle so its series is shorter
 * and less evenly spaced than the others.
 */
const funkyLineData = [...workspaceTrendsData]
  .filter((d) => !(d.series === 'Add Bar viz' && (d.datetime === 1668063600000 || d.datetime === 1668236400000)))
  .reverse();

  
/**
 * A genuinely categorical dimension (`quarter`, a string) on a point scale — unlike `PointScale`
 * below, which reuses `workspaceTrendsData`'s numeric `datetime` field and only *looks* like a
 * point-scale test. The draw-in cutoff/tween math (`getDrawInSortField`) needs its sort field to be
 * numeric, so this is the shape that would actually break if the scale-type gate didn't exist.
 */
const categoricalPointData = ['Add Fallout', 'Add Freeform table', 'Add Line viz', 'Add Bar viz'].flatMap(
  (series, seriesIndex) =>
    ['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, i) => ({
      quarter,
      value: 100 * (seriesIndex + 1) + i * 40 + (i % 2 === 0 ? 10 : -10),
      series,
    }))
);

const lineDualAxisData = [
  { datetime: 1667890800000, value: 4500, series: 'Downloads', order: 0 },
  { datetime: 1667977200000, value: 5200, series: 'Downloads', order: 0 },
  { datetime: 1668063600000, value: 4800, series: 'Downloads', order: 0 },
  { datetime: 1668150000000, value: 6100, series: 'Downloads', order: 0 },
  { datetime: 1668236400000, value: 5800, series: 'Downloads', order: 0 },
  { datetime: 1668322800000, value: 6500, series: 'Downloads', order: 0 },
  { datetime: 1668409200000, value: 7200, series: 'Downloads', order: 0 },
  { datetime: 1667890800000, value: 2.3, series: 'Conversion Rate (%)', order: 1 },
  { datetime: 1667977200000, value: 2.8, series: 'Conversion Rate (%)', order: 1 },
  { datetime: 1668063600000, value: 2.5, series: 'Conversion Rate (%)', order: 1 },
  { datetime: 1668150000000, value: 3.2, series: 'Conversion Rate (%)', order: 1 },
  { datetime: 1668236400000, value: 3, series: 'Conversion Rate (%)', order: 1 },
  { datetime: 1668322800000, value: 3.5, series: 'Conversion Rate (%)', order: 1 },
  { datetime: 1668409200000, value: 3.8, series: 'Conversion Rate (%)', order: 1 },
];

/** Baseline — a time-scale line, the only scale type draw-in currently animates. */
const TimeScaleStory: StoryFn<DrawInAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend />
    </Chart>
  );
};

/**
 * Point scale — not yet supported by draw-in (`isLineDrawInSupported` gates it off), so the line
 * should render at its normal, static position regardless of the `animations` toggle.
 */
const PointScaleStory: StoryFn<DrawInAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" baseline ticks />
      <Line {...args} />
      <Legend />
    </Chart>
  );
};

/** Linear scale — the other continuous scale type draw-in supports, using the numeric `point` field. */
const LinearScaleStory: StoryFn<DrawInAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="linear" baseline ticks />
      <Line {...args} />
      <Legend />
    </Chart>
  );
};

/** Funky data shape — unsorted, uneven-length series data, still on a time scale. */
const FunkyDataShapeStory: StoryFn<DrawInAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: funkyLineData, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend />
    </Chart>
  );
};

/**
 * Categorical point scale — a real string dimension (`quarter`), the shape the scale-type gate
 * actually protects against (unlike `PointScale`, whose numeric `datetime` field works whether or
 * not the gate is applied). Should render at normal static positions, no draw-in, no crash.
 */
const CategoricalPointScaleStory: StoryFn<DrawInAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: categoricalPointData, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Value" />
      <Axis position="bottom" baseline ticks />
      <Line {...args} />
      <Legend />
    </Chart>
  );
};

/** Using cardinal interpolation. */
const CardinalInterpStory: StoryFn<DrawInAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="left" grid title="Users" />
      <Axis position="bottom" labelFormat="time" baseline ticks />
      <Line {...args} />
      <Legend />
    </Chart>
  );
};

const DualMetrixAxisStory: StoryFn<DrawInAnimationArgs> = ({ animations, ...args }): ReactElement => {
  const chartProps = useChartProps({ ...defaultChartProps, data: lineDualAxisData, animations });
  return (
    <Chart {...chartProps}>
      <Axis position="bottom" labelFormat="time" baseline ticks title="Date" />
      <Axis position="left" grid ticks title="Downloads" />
      <Axis position="right" ticks title="Conversion Rate (%)" />
      <Line {...args}>
      </Line>
      <Legend title="Metrics" highlight />
    </Chart>
  );
};

/**
 * Static point hover — hovering a data point (`ChartInspect`) fades the always-visible static point
 * markers for deemphasized series along with the line itself, demonstrating `getLineStaticPoint`'s
 * wiring into the same animated fraction as `getLineOpacity`.
 */
const StaticPointStory: StoryFn<DrawInAnimationArgs> = ({ animations, ...args }): ReactElement => {
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
const DirectLabelStory: StoryFn<DrawInAnimationArgs> = ({ animations, ...args }): ReactElement => {
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
const HiddenSeriesStory: StoryFn<DrawInAnimationArgs> = ({ animations, ...args }): ReactElement => {
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

export const TimeScale = bindWithProps(TimeScaleStory);
TimeScale.args = { ...defaultArgs };

export const PointScale = bindWithProps(PointScaleStory);
PointScale.args = { ...defaultArgs, scaleType: 'point' };

export const LinearScale = bindWithProps(LinearScaleStory);
LinearScale.args = { ...defaultArgs, dimension: 'point', scaleType: 'linear' };

export const FunkyDataShape = bindWithProps(FunkyDataShapeStory);
FunkyDataShape.args = { ...defaultArgs };

export const CategoricalPointScale = bindWithProps(CategoricalPointScaleStory);
CategoricalPointScale.args = { ...defaultArgs, dimension: 'quarter', metric: 'value', scaleType: 'point' };

export const CardinalInterpolation = bindWithProps(CardinalInterpStory);
CardinalInterpolation.args = { ...defaultArgs, interpolate: 'cardinal' };

export const DualMetrixAxisDrawIn = bindWithProps(DualMetrixAxisStory);
DualMetrixAxisDrawIn.args = { ...defaultArgs, dualMetricAxis: true };

export const StaticPointDrawIn= bindWithProps(StaticPointStory);
StaticPointDrawIn.args = { ...defaultArgs, staticPoint: 'staticPoint' };

export const DirectLabelDrawIn = bindWithProps(DirectLabelStory);
DirectLabelDrawIn.args = { ...defaultArgs };

export const HiddenSeriesDrawIn = bindWithProps(HiddenSeriesStory);
HiddenSeriesDrawIn.args = { ...defaultArgs };