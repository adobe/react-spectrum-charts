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
import { Axis, Bar, BarDirectLabel, Legend, Title } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { bindWithProps } from '../../../test-utils';
import { BarProps } from '../../../types';
import {
  divergingConversionRateData,
  divergingConversionRateDataLongLabels,
  dualSeriesDivergingData,
  likertSurveyData,
  sameSignDodgedData,
  stackedCohortData,
  timeAxisDivergingData,
} from './data';

export default {
  title: 'React Spectrum Charts 2/Bar/Features/Diverging',
  component: Bar,
};

/** Canonical single-series horizontal diverging; value labels use the adaptive `end-outside` default. */
const HorizontalStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingConversionRateData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Single-series horizontal — axis at zero, labels flip opposite each bar" fontSize={16} />
      <Axis position="left" baseline />
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} diverging>
        <BarDirectLabel />
      </Bar>
    </Chart>
  );
};

const defaultProps: BarProps = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'horizontal',
  colorOverride: 'barColor',
};

const Horizontal = bindWithProps(HorizontalStory);
Horizontal.args = {
  ...defaultProps,
};

/** Single-series diverging, vertical — dimension on the bottom axis, so the baseline/dy flip applies (not align/dx). */
const VerticalStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingConversionRateData, width: 500, height: 500 });
  return (
    <Chart {...chartProps}>
      <Title text="Single-series vertical — axis at zero, labels flip opposite each bar" fontSize={16} />
      <Axis position="bottom" baseline />
      <Axis position="left" grid labelFormat="percentage" />
      <Bar {...args} diverging />
    </Chart>
  );
};

const Vertical = bindWithProps(VerticalStory);
Vertical.args = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'vertical',
  colorOverride: 'barColor',
} satisfies BarProps;

/**
 * `labelFormat="time"` makes a primary+secondary axis pair; diverging folds the primary row's static
 * `enter.dy` into `extraOutwardOffset` (flipping with the row) so both rows stay stacked.
 */
const TimeAxisStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: timeAxisDivergingData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Time axis (labelFormat=time) — primary/secondary rows both move and flip" fontSize={16} />
      <Axis position="bottom" baseline labelFormat="time" granularity="month" />
      <Axis position="left" grid labelFormat="percentage" />
      <Bar {...args} diverging />
    </Chart>
  );
};

const TimeAxis = bindWithProps(TimeAxisStory);
TimeAxis.args = {
  dimension: 'day',
  metric: 'changeRate',
  orientation: 'vertical',
  dimensionDataType: 'time',
} satisfies BarProps;

/** Same as `Horizontal` with long names — checks the interior (data-dependent) axis position doesn't clip long labels. */
const LongLabelsStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingConversionRateDataLongLabels, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Long labels: same data as Horizontal, longer category names" fontSize={16} />
      <Axis position="left" baseline />
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} diverging />
    </Chart>
  );
};

const LongLabels = bindWithProps(LongLabelsStory);
LongLabels.args = {
  ...defaultProps,
};

/**
 * ACTIVATES — population-pyramid dodged two-series (New +/Churned −); each label flips opposite its
 * own bar via the two-series opposite-sign exception (`isTwoSeriesOppositeSignDodged`).
 */
const DodgedTwoSeriesStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: dualSeriesDivergingData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Diverging signals: dodged two-series bar — axis moves to zero, labels flip per bar" fontSize={16} />
      <Axis position="left" baseline />
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} diverging />
      <Legend title="Series" />
    </Chart>
  );
};

const DodgedTwoSeries = bindWithProps(DodgedTwoSeriesStory);
DodgedTwoSeries.args = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'horizontal',
  type: 'dodged',
  color: 'series',
} satisfies BarProps;

/** ACTIVATES — dodged two rows per category that agree in sign (both grew, or both declined), so there's no ambiguity. */
const SameSignDodgedStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: sameSignDodgedData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Fixed: same-signed dodged bars — diverging now correctly activates" fontSize={16} />
      <Axis position="left" baseline />
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} diverging />
      <Legend title="Period" />
    </Chart>
  );
};

const SameSignDodged = bindWithProps(SameSignDodgedStory);
SameSignDodged.args = {
  dimension: 'product',
  metric: 'changeRate',
  orientation: 'horizontal',
  type: 'dodged',
  color: 'period',
} satisfies BarProps;

/**
 * DECLINES (guard) — stacked multi-series cohort with mixed-sign rows per month; the axis stays at
 * the edge with only a zero baseline, rather than moving to a per-row zero.
 */
const StackedCohortStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: stackedCohortData, width: 700, height: 450 });
  return (
    <Chart {...chartProps}>
      <Title text="Fixed: stacked multi-series cohort chart — diverging safely declines" fontSize={16} />
      <Axis position="bottom" baseline />
      <Axis position="left" grid title="Users" />
      <Bar {...args} diverging />
      <Legend title="Cohort" />
    </Chart>
  );
};

const StackedCohortFallback = bindWithProps(StackedCohortStory);
StackedCohortFallback.args = {
  dimension: 'month',
  metric: 'users',
  orientation: 'vertical',
  color: 'series',
} satisfies BarProps;

/** DECLINES (guard) — Likert stacked bar, mixed-sign rows per concept (same shape as the cohort chart); axis stays at the edge. */
const LikertSurveyStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: likertSurveyData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Fixed: Likert survey chart — diverging safely declines" fontSize={16} />
      <Axis position="left" baseline />
      <Axis position="bottom" grid />
      <Bar {...args} diverging />
      <Legend title="Response" />
    </Chart>
  );
};

const LikertSurveyFallback = bindWithProps(LikertSurveyStory);
LikertSurveyFallback.args = {
  dimension: 'concept',
  metric: 'value',
  orientation: 'horizontal',
  order: 'order',
  colorOverride: 'barColor',
} satisfies BarProps;

export {
  Horizontal,
  Vertical,
  TimeAxis,
  LongLabels,
  DodgedTwoSeries,
  SameSignDodged,
  StackedCohortFallback,
  LikertSurveyFallback,
};
