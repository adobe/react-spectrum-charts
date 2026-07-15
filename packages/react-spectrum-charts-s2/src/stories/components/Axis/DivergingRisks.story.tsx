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
import { Axis, AxisThumbnail, Bar, Legend, Title } from '../../../components';
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
  trellisDivergingData,
} from '../Bar/data';

export default {
  title: 'React Spectrum Charts 2/Axis/Features/Diverging',
  component: Axis,
};

/**
 * Control — a single bar mark, single series per category. `diverging` works as intended here;
 * compare against the risk stories below.
 */
const WorkingStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingConversionRateData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Working: single bar mark, single series per category" fontSize={16} />
      <Axis position="left" baseline diverging />
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} />
    </Chart>
  );
};

const defaultProps: BarProps = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'horizontal',
  colorOverride: 'barColor',
};

const Working = bindWithProps(WorkingStory);
Working.args = {
  ...defaultProps,
};

/**
 * Verification gap — every other vertical-orientation story in this file (`StackedCohortFallback`)
 * is a *decline* case. No single-series vertical bar chart has ever had `diverging` actually
 * active and rendered in a browser — only verified at the spec level (offset + baseline/dy flip
 * present, same data as `Working` just with dimension on the bottom axis instead of the left).
 * This story closes that gap.
 */
const WorkingVerticalStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingConversionRateData, width: 500, height: 500 });
  return (
    <Chart {...chartProps}>
      <Title text="Working (vertical): single bar mark, single series per category" fontSize={16} />
      <Axis position="bottom" baseline diverging />
      <Axis position="left" grid labelFormat="percentage" />
      <Bar {...args} />
    </Chart>
  );
};

const WorkingVertical = bindWithProps(WorkingVerticalStory);
WorkingVertical.args = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'vertical',
  colorOverride: 'barColor',
} satisfies BarProps;

/**
 * FIXED — `labelFormat="time"` takes a structurally different code path (`getTimeAxes`, producing
 * a primary+secondary axis pair) that had never had `diverging` exercised against it. No crash
 * (unlike the sub-label case), but a real bug: the primary (year) row separates from the secondary
 * (month) row via a static `enter.dy: 20`, and Vega's `update` always supersedes `enter` for the
 * same property — so diverging's own `update.dy` was silently erasing that separation. Simply
 * *adding* the static offset back in wasn't right either: once a row flips, "further out" points
 * the opposite direction, so the offset must flip sign in lockstep with the flip test, not stay
 * constant, or the flipped year row ends up on the *wrong side* of the month row (verified: the
 * naive add gave the flipped row only 4px separation instead of correctly stacking 36px further
 * out). `getDivergingLabelEncode` now takes an `extraOutwardOffset` and bakes the sign-aware math
 * into its own per-branch computation.
 */
const WorkingTimeAxisStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: timeAxisDivergingData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Working: labelFormat=time + diverging (primary/secondary axis pair)" fontSize={16} />
      <Axis position="bottom" baseline diverging labelFormat="time" granularity="month" />
      <Axis position="left" grid labelFormat="percentage" />
      <Bar {...args} />
    </Chart>
  );
};

const WorkingTimeAxis = bindWithProps(WorkingTimeAxisStory);
WorkingTimeAxis.args = {
  dimension: 'day',
  metric: 'changeRate',
  orientation: 'vertical',
  dimensionDataType: 'time',
} satisfies BarProps;

/**
 * FIXED — two bugs, found in sequence. (1) `divergingContext`/`opposingScaleName` were only
 * threaded into `addAxes` (called directly from `addAxis`), never into `addAxesMarks` — and
 * `addAxesToTrellisGroup`'s recursive `addAxes([], {...options})` call gets its `options` from
 * `addAxesMarks`, so those fields were missing by construction. The top-level "root" axis got
 * `diverging` applied, but the trellis *panel* axes — the ones that actually render each region's
 * bars — got neither `offset` nor the label-flip encode: a dead no-op for any trellised chart.
 * (2) Fixing the plumbing naively (applying diverging to the root axis too) crashed in the real
 * browser (`Cannot read properties of undefined (reading 'changeRate')`) — confirmed via a full
 * `vega-embed` + `jsdom` reproduction that the raw `vega.parse`/`run` path alone didn't catch,
 * since it skips real label-layout text measurement without a working `canvas` install. The root
 * axis's own scale doesn't correspond to per-panel data the way the sign lookup assumes, so
 * `diverging` is now suppressed on the root axis whenever its position will be duplicated per
 * panel, and applied to the panel axes instead — scoped to each panel's own facet dataset (e.g.
 * `bar0_trellis`) rather than the global table, so a repeated category name (the same channel in
 * every region) is looked up within the right panel.
 */
const TrellisDivergingStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: trellisDivergingData, width: 700, height: 500 });
  return (
    <Chart {...chartProps}>
      <Title text="Fixed: diverging now correctly applies per trellis panel" fontSize={16} />
      <Axis position="left" baseline diverging />
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} />
    </Chart>
  );
};

const TrellisDiverging = bindWithProps(TrellisDivergingStory);
TrellisDiverging.args = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'horizontal',
  trellis: 'region',
  trellisOrientation: 'vertical',
} satisfies BarProps;

/**
 * Same as `Working`, but with long category names — checking whether `diverging`'s repositioned
 * (interior, data-dependent) axis position causes long labels to clip/collide near the chart edge,
 * since there's no margin reserved for them the way there would be at the default edge position.
 */
const LongLabelsStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingConversionRateDataLongLabels, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Long labels: same data as Working, longer category names" fontSize={16} />
      <Axis position="left" baseline diverging />
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} />
    </Chart>
  );
};

const LongLabels = bindWithProps(LongLabelsStory);
LongLabels.args = {
  ...defaultProps,
};

/**
 * FIXED (regression guard) — `diverging` used to only count `<Bar>` *marks*, not series. A single
 * dodged `<Bar color="series">` is still one mark, so it used to NOT fall back and would silently
 * use whichever series came first per category ("New") to decide every label's side, mislabeling
 * the rest. `getDivergingBarContext` now also checks rows-per-category and declines here — the
 * axis stays at the default edge position, same as if `diverging` were never set. This is the
 * "Diverging Signals" (two bars, one category) case from the ticket.
 */
const DodgedTwoSeriesStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: dualSeriesDivergingData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Fixed: dodged two-series bar — diverging safely declines" fontSize={16} />
      <Axis position="left" baseline diverging />
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} />
      <Legend title="Series" />
    </Chart>
  );
};

const DodgedTwoSeriesFallback = bindWithProps(DodgedTwoSeriesStory);
DodgedTwoSeriesFallback.args = {
  dimension: 'channel',
  metric: 'changeRate',
  orientation: 'horizontal',
  type: 'dodged',
  color: 'series',
} satisfies BarProps;

/**
 * FIXED (guard refinement) — a year-over-year revenue-change comparison, dodged by "This Year" vs
 * "Last Year." Two rows per category, same shape as `DodgedTwoSeriesFallback` above, but here
 * every category's rows *agree* in sign (Product A/B grew both years, Product C/D declined both
 * years) — unlike the population-pyramid case, there's no real ambiguity: the empty side of zero
 * for each category is genuinely empty regardless of which row the lookup finds first.
 *
 * `getDivergingBarContext` used to decline here too (blanket "more than one row per category"),
 * which was over-conservative. It now checks for actual sign *disagreement* within a category
 * instead of raw row count, so this chart correctly activates `diverging` — while
 * `DodgedTwoSeriesFallback`/`StackedCohortFallback`/`LikertSurveyFallback` (which do have
 * conflicting signs within a category) still correctly decline.
 */
const SameSignDodgedStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: sameSignDodgedData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Fixed: same-signed dodged bars — diverging now correctly activates" fontSize={16} />
      <Axis position="left" baseline diverging />
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} />
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
 * FIXED (regression guard) — a real-world "monthly growth cohorts" chart: a stacked vertical bar
 * with New/Retained/Returned stacked above zero and Churned below, per month. Every month has
 * multiple rows (one per series), so `getDivergingBarContext` declines here too — the month axis
 * stays at the bottom edge and only a zero-gridline (plain `baseline`) runs through the middle,
 * matching the expected convention for this chart shape rather than moving the axis itself.
 */
const StackedCohortStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: stackedCohortData, width: 700, height: 450 });
  return (
    <Chart {...chartProps}>
      <Title text="Fixed: stacked multi-series cohort chart — diverging safely declines" fontSize={16} />
      <Axis position="bottom" baseline diverging />
      <Axis position="left" grid title="Users" />
      <Bar {...args} />
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

/**
 * FIXED (regression guard) — a Likert-scale survey results chart: a horizontal stacked bar per
 * concept, with "Strongly Negative"/"Negative" stacked left of zero and "Neutral"/"Positive"/
 * "Strongly Positive" stacked right of it. Same mixed-sign-rows-per-category shape as the cohort
 * chart above (just horizontal, with two negative-going series instead of one) —
 * `getDivergingBarContext` declines here too, so the concept axis stays at the left edge rather
 * than jumping to wherever zero lands for each row (which would vary per concept and look broken).
 */
const LikertSurveyStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: likertSurveyData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Fixed: Likert survey chart — diverging safely declines" fontSize={16} />
      <Axis position="left" baseline diverging />
      <Axis position="bottom" grid />
      <Bar {...args} />
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

/**
 * PARTIALLY FIXED — the crash is fixed, but a more severe positioning bug remains (worse than
 * originally characterized here — this isn't just "spacing looks slightly off for flipped
 * labels"). `diverging`'s gap-compensation and `AxisThumbnail`'s make-room-for-the-image offset
 * both wrote a `{test, value}` rule array to the same `encode.labels.update.dx` channel, and
 * `deepmerge` concatenated the two 2-entry arrays into one 4-entry array — stranding `diverging`'s
 * untested fallback rule (valid only as the *last* entry in its own array) in the *middle* of the
 * combined array, which is invalid Vega and crashed the parser (`Illegal callee type: Literal`).
 * Fixed by additively composing the two offsets into a single signal.
 *
 * NOT FIXED — the thumbnail *image* mark itself (`getAxisThumbnailPosition`) is a separate,
 * top-level mark, not nested inside the axis's own group, and its position is a fixed formula
 * (e.g. `-4 - thumbnailSize`) relative to the chart's true edge — completely independent of the
 * axis's `offset` signal. `diverging` moves the axis (and every label) to the zero line, but never
 * moves the thumbnail images, which stay put at the original edge. For any chart with a real
 * positive/negative split — not just flipped rows — the thumbnails end up visually disconnected
 * from their labels, since the labels moved and the thumbnails didn't.
 */
const thumbnailUrls = ['/chrome.png', '/firefox.png', '/safari.png', '/edge.png', '/explorer.png', '/chrome.png'];
const divergingDataWithThumbnails = divergingConversionRateData.map((datum, index) => ({
  ...datum,
  thumbnail: thumbnailUrls[index],
}));

const ThumbnailConflictStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingDataWithThumbnails, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Partially fixed: crash resolved, thumbnails still disconnected from labels" fontSize={16} />
      <Axis position="left" baseline diverging>
        <AxisThumbnail urlKey="thumbnail" />
      </Axis>
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} />
    </Chart>
  );
};

const WithThumbnailConflict = bindWithProps(ThumbnailConflictStory);
WithThumbnailConflict.args = {
  ...defaultProps,
};

/**
 * FIXED — `subLabels` renders on a *second*, separate native Axis object (`getSubLabelAxis`) with
 * its own, larger `labelPadding` (24-32px vs. the main axis's 8px default). `diverging`'s
 * offset/encode logic now applies to every axis in the group, using each axis's own effective
 * `labelPadding` for the gap compensation, so the sub-label row moves and flips together with the
 * main label row instead of staying pinned at the edge.
 *
 * This also uncovered and fixed a second crash: the sub-label axis already has its own controlled
 * per-value `align` rule (from the `subLabels` array), and `deepmerge`-concatenating that with
 * diverging's flip rule hit the exact same "untested rule stranded mid-array" crash as the
 * `AxisThumbnail` case (`Illegal callee type: Literal`) — fixed with a priority-merge
 * (`getPriorityMergedSignal`): an explicit per-value override wins when present, otherwise
 * diverging's sign-based flip decides.
 */
const SubLabelsStory: StoryFn<typeof Bar> = (args): ReactElement => {
  const chartProps = useChartProps({ data: divergingConversionRateData, width: 700, height: 400 });
  return (
    <Chart {...chartProps}>
      <Title text="Fixed: diverging + subLabels — both axes move and flip together" fontSize={16} />
      <Axis
        position="left"
        baseline
        diverging
        subLabels={[
          { value: 'IG Stories', subLabel: 'Instagram' },
          { value: 'IG Reels', subLabel: 'Instagram' },
          { value: 'FB Stories', subLabel: 'Facebook' },
          { value: 'FB Video', subLabel: 'Facebook' },
          { value: 'FB Post', subLabel: 'Facebook' },
          { value: 'FB Reels', subLabel: 'Facebook' },
        ]}
      />
      <Axis position="bottom" grid labelFormat="percentage" />
      <Bar {...args} />
    </Chart>
  );
};

const WithSubLabelsFixed = bindWithProps(SubLabelsStory);
WithSubLabelsFixed.args = {
  ...defaultProps,
};

export {
  Working,
  WorkingVertical,
  WorkingTimeAxis,
  LongLabels,
  DodgedTwoSeriesFallback,
  SameSignDodged,
  StackedCohortFallback,
  LikertSurveyFallback,
  TrellisDiverging,
  WithThumbnailConflict,
  WithSubLabelsFixed,
};
