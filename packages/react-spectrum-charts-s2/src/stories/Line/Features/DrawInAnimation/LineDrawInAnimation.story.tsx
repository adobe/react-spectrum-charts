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
import { Axis, Legend, Line } from '../../../../components';
import useChartProps from '../../../../hooks/useChartProps';
import { workspaceTrendsData } from '../../../../stories/data/data';
import { bindWithProps } from '../../../../test-utils';
import { ChartProps } from '../../../../types';


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