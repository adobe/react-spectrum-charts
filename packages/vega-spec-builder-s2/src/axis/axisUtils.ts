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
import { Axis, Mark, Scale, SignalRef } from 'vega';

import { AxisSpecOptions, Granularity, Orientation, Position } from '../types';
import {
  getAxisLabelsEncoding,
  getLabelAnchorValues,
  getLabelAngle,
  getLabelFormat,
  getLabelOffset,
  getTimeLabelFormats,
} from './axisLabelUtils';

/**
 * Generates a default vega axis from the axis options
 * @param axisOptions
 * @param scaleName
 * @returns axis
 */
export const getDefaultAxis = (axisOptions: AxisSpecOptions, scaleName: string): Axis => {
  const {
    grid,
    hideDefaultLabels,
    labelAlign,
    labelFontWeight,
    labelLimit,
    labelOrientation,
    tickCountLimit,
    tickCountMinimum,
    position,
    scaleType,
    ticks,
    tickMinStep,
    title,
    vegaLabelAlign,
    vegaLabelBaseline,
    vegaLabelOffset,
    vegaLabelPadding,
    hasTooltip,
  } = axisOptions;
  return {
    scale: scaleName,
    orient: position,
    grid,
    ticks,
    tickCount: getTickCount(position, tickCountMinimum, tickCountLimit, grid),
    tickMinStep: scaleType !== 'linear' ? undefined : tickMinStep, //only supported for linear scales
    title,
    labelAngle: getLabelAngle(labelOrientation),
    labelFontWeight,
    ...(labelLimit !== undefined && { labelLimit }),
    labelOffset: getLabelOffset(labelAlign, scaleName, vegaLabelOffset),
    labelPadding: vegaLabelPadding,
    labels: !hideDefaultLabels,
    ...getLabelAnchorValues(position, labelOrientation, labelAlign, vegaLabelAlign, vegaLabelBaseline),
    encode: {
      labels: {
        interactive: Boolean(hasTooltip),
        update: {
          text: getLabelFormat(axisOptions, scaleName),
          ...(hasTooltip ? { tooltip: { signal: 'datum.value' } } : {}),
        },
      },
    },
  };
};

/**
 * Generates the time axes for a time scale from the axis options
 * @param scaleName
 * @param axisOptions
 * @returns axes
 */
export const getTimeAxes = (scaleName: string, axisOptions: AxisSpecOptions): Axis[] => {
  return [getSecondaryTimeAxis(scaleName, axisOptions), ...getPrimaryTimeAxis(scaleName, axisOptions)];
};

/**
 * Generates the secondary time axis from the axis options
 * This is the axis that shows the smaller granularity
 * If this is a vertical axis, it will also show the larger granularity and will hide repeats of the larger granularity
 * @param scaleName
 * @param axisOptions
 * @returns axis
 */
const getSecondaryTimeAxis = (
  scaleName: string,
  {
    granularity,
    grid,
    labelAlign,
    labelOrientation,
    position,
    tickCountLimit,
    tickCountMinimum,
    ticks,
    title,
    vegaLabelAlign,
    vegaLabelBaseline,
  }: AxisSpecOptions
): Axis => {
  const { tickCount } = getTimeLabelFormats(granularity);
  const resolvedTickCount =
    tickCountLimit !== undefined || tickCountMinimum !== undefined
      ? getTickCount(position, tickCountMinimum, tickCountLimit, grid)
      : tickCount;

  return {
    scale: scaleName,
    orient: position,
    grid,
    ticks,
    tickCount: scaleName.includes('Time') ? resolvedTickCount : undefined,
    title,
    formatType: 'time',
    labelAngle: getLabelAngle(labelOrientation),
    labelSeparation: 12,
    ...getSecondaryTimeAxisLabelFormatting(granularity, position),
    ...getLabelAnchorValues(position, labelOrientation, labelAlign, vegaLabelAlign, vegaLabelBaseline),
  };
};

const getSecondaryTimeAxisLabelFormatting = (granularity: Granularity, position: Position): Partial<Axis> => {
  const { secondaryLabelFormat, primaryLabelFormat } = getTimeLabelFormats(granularity);
  const isVerticalAxis = ['left', 'right'].includes(position);
  if (isVerticalAxis) {
    return {
      format: `${primaryLabelFormat}\u2000${secondaryLabelFormat}`,
      encode: {
        labels: {
          interactive: false,
          update: {
            text: { signal: 'formatVerticalAxisTimeLabels(datum)' },
          },
        },
      },
    };
  }

  return {
    format: secondaryLabelFormat,
  };
};

/**
 * Generates the primary time axis from the axis options
 * This is the axis that shows the larger granularity and hides duplicate labels
 * Only returns an axis for horizontal axes
 * @param scaleName
 * @param axisOptions
 * @returns axis
 */
const getPrimaryTimeAxis = (
  scaleName: string,
  {
    granularity,
    labelAlign,
    labelOrientation,
    labelFontWeight,
    position,
    tickCountLimit,
    tickCountMinimum,
    ticks,
    vegaLabelAlign,
    vegaLabelBaseline,
  }: AxisSpecOptions
): Axis[] => {
  if (['left', 'right'].includes(position)) {
    return [];
  }
  const { primaryLabelFormat, tickCount } = getTimeLabelFormats(granularity);
  const resolvedTickCount =
    tickCountLimit !== undefined || tickCountMinimum !== undefined
      ? getTickCount(position, tickCountMinimum, tickCountLimit)
      : tickCount;
  return [
    {
      scale: scaleName,
      orient: position,
      format: primaryLabelFormat,
      tickCount: scaleName.includes('Time') ? resolvedTickCount : undefined,
      formatType: 'time',
      labelOverlap: 'greedy',
      labelFontWeight,
      labelAngle: getLabelAngle(labelOrientation),
      ...getLabelAnchorValues(position, labelOrientation, labelAlign, vegaLabelAlign, vegaLabelBaseline),
      encode: {
        labels: {
          interactive: false,
          enter: {
            dy: { value: (ticks ? 28 : 20) * (position === 'top' ? -1 : 1) }, // account for tick height
          },
          update: {
            text: { signal: 'formatHorizontalTimeAxisLabels(datum)' },
          },
        },
      },
    },
  ];
};

/**
 * Generates an axis for sub labels from the axis options
 * @param axisOptions
 * @param scaleName
 * @returns axis
 */
export const getSubLabelAxis = (axisOptions: AxisSpecOptions, scaleName: string): Axis => {
  const { labelAlign, labelFontWeight, labelOrientation, name, position, ticks } = axisOptions;
  const subLabels = axisOptions.subLabels;
  const signalName = `${name}_subLabels`;
  const subLabelValues = subLabels.map((label) => label.value);

  let subLabelAxis = getDefaultAxis(axisOptions, scaleName);
  subLabelAxis = {
    ...subLabelAxis,
    domain: false,
    domainWidth: undefined,
    grid: false,
    labelPadding: ticks ? 32 : 24,
    ticks: false,
    title: undefined,
    values: subLabelValues.length ? subLabelValues : undefined,
    encode: {
      labels: {
        interactive: false,
        ...getAxisLabelsEncoding(labelAlign, labelFontWeight, 'subLabel', labelOrientation, position, signalName),
      },
    },
  };
  return subLabelAxis;
};

/**
 * Finds and returns the scale that this axis is for
 * If the scale does not exist, it will create a new one
 * @param scales
 * @param position
 * @returns scale
 */
export const getScale = (scales: Scale[], position: Position) => {
  const applicableScales = scales.filter((s) => 'range' in s && s.range === getRange(position));
  let scale: Scale | undefined;

  if (applicableScales.length > 1) {
    // Is there a better way to find the trellis scale?
    scale = scales.find((s) => s.name.includes('Trellis')) ?? applicableScales[0];
  } else {
    scale = applicableScales[0];
  }

  if (scale) {
    return scale;
  }

  scale = {
    name: getDefaultScaleNameFromPosition(position),
    type: 'linear',
    range: getRange(position),
    zero: true,
  };
  scales.push(scale);
  return scale;
};

/**
 * Gets the scale range from the position
 * @param position
 * @returns range
 */
export const getRange = (position: Position): 'width' | 'height' => {
  if (position === 'left' || position === 'right') {
    return 'height';
  }
  return 'width';
};

/**
 * Gets the scale type of the opposing scale.
 * For example, if this is an x-axis, it will return the y-scale type
 * @param scales
 * @param position
 * @returns scaleType
 */
export const getOpposingScaleType = (scales: Scale[], position: Position) => {
  let scale = scales.find((s) => 'range' in s && s.range === getOpposingRange(position));
  if (scale) {
    return scale.type;
  }
  scale = {
    name: getDefaultOpposingScaleNameFromPosition(position),
    type: 'linear',
    range: getOpposingRange(position),
  };
  scales.push(scale);
  return scale.type;
};

/**
 * Gets the scale range for the opposing scale
 * @param position
 * @returns
 */
export const getOpposingRange = (position: Position): 'width' | 'height' => {
  if (position === 'left' || position === 'right') {
    return 'width';
  }
  return 'height';
};

/**
 * Gets the name of the opposing scale (the scale for the perpendicular axis).
 * Mirrors getOpposingScaleType, but returns the scale's name instead of its type.
 * @param scales
 * @param position
 * @returns scaleName
 */
export const getOpposingScaleName = (scales: Scale[], position: Position): string => {
  const scale = scales.find((s) => 'range' in s && s.range === getOpposingRange(position));
  return scale?.name ?? getDefaultOpposingScaleNameFromPosition(position);
};

/** Context needed to look up the sign of the bar paired with a diverging axis tick. */
export interface DivergingBarContext {
  dataName: string;
  dimension: string;
  metric: string;
}

/**
 * Gets the signal expression for the Vega axis `offset` property that repositions a categorical
 * axis from the chart edge to the zero baseline of its (linear, diverging) opposing scale.
 *
 * Verified empirically against a live Vega spec: `offset` always moves an axis *away* from the
 * plot for a positive value, regardless of orientation — so reaching the zero line, which sits
 * *inside* the plot, always requires a negative offset relative to the axis's default edge
 * position (0 for 'left'/'top', the range size for 'right'/'bottom').
 * @param position
 * @param opposingScaleName
 * @returns offset signal
 */
export const getDivergingAxisOffset = (position: Position, opposingScaleName: string): SignalRef => {
  if (position === 'left' || position === 'top') {
    return { signal: `-scale('${opposingScaleName}', 0)` };
  }
  const rangeSizeSignal = position === 'right' ? 'width' : 'height';
  return { signal: `scale('${opposingScaleName}', 0) - ${rangeSizeSignal}` };
};

/**
 * Gets the Vega expression that looks up the sign of the bar value paired with a given axis tick,
 * by joining back to the bar's own data source on the dimension field.
 *
 * Only correct when there's a single bar (or bar stack) per category — a category with two bars
 * diverging in opposite directions has no single sign to test, and isn't supported here.
 * @param context
 * @returns boolean expression string, true when the paired bar value is negative
 */
export const getDivergingTickIsNegativeTest = ({ dataName, dimension, metric }: DivergingBarContext): string =>
  `data('${dataName}')[indexof(pluck(data('${dataName}'), '${dimension}'), datum.value)]['${metric}'] < 0`;

// Vega's own default axis `labelPadding` (from spectrum2Theme's `axis.labelPadding`), used when an
// axis doesn't set its own explicit `labelPadding` (e.g. the main axis, unless `vegaLabelPadding`
// is set). The sub-label axis (`getSubLabelAxis`) always sets its own explicit, larger padding
// (24-32px) — that must be passed in rather than assumed, or the compensation below is wrong.
const DEFAULT_AXIS_LABEL_PADDING = 8;

/**
 * Gets the axis label `encode.labels` block that flips each tick's alignment (for a 'left'/'right'
 * axis) or baseline (for a 'top'/'bottom' axis) to the side opposite its paired bar's sign, and
 * compensates the anchor offset so the flipped label lands the same distance from the zero line
 * as an un-flipped one would.
 *
 * The compensation is `2 * labelPadding`: Vega computes each label's default perpendicular offset
 * (x for left/right axes, y for top/bottom) from the *position's own natural* align/baseline
 * resolution, scaled directly by that axis's `labelPadding` — flipping align/baseline via an
 * encode override does not recompute that offset, so a flipped label keeps its un-flipped anchor
 * and overlaps the bar instead of mirroring to the empty side. `labelPadding` must be the *actual*
 * value this specific axis will render with (its own explicit override, or `DEFAULT_AXIS_LABEL_PADDING`
 * if it doesn't set one) — verified empirically that the default anchor scales linearly with it,
 * so passing the wrong value silently reproduces the same overlap bug this is meant to fix.
 *
 * `extraOutwardOffset` accounts for axes that already push their label further out with a static
 * offset independent of diverging — e.g. the primary time axis's `enter.dy: 20`, which stacks the
 * year row below the secondary month/day row. Simply *adding* that constant (what a first pass at
 * this did) is wrong: once a row flips, "further out" points the opposite direction, so the extra
 * offset must flip sign in lockstep with the test, not stay constant — otherwise the flipped row's
 * separation shrinks instead of growing, and it lands overlapping (or hidden behind) the row it was
 * supposed to stack outside of. Passing `0` (the default) reduces to the exact original formula.
 *
 * Verified empirically against a live Vega spec for all four positions.
 * @param position
 * @param isNegativeTest
 * @param labelPadding the axis's actual (effective) labelPadding — defaults to
 * `DEFAULT_AXIS_LABEL_PADDING` to match Vega's own theme default
 * @param extraOutwardOffset a pre-existing static "push further out" offset (in the *unflipped*
 * direction) this axis already has, e.g. from `enter.dy`/`enter.dx` — defaults to 0 (no adjustment)
 * @returns AxisEncode['labels']
 */
export const getDivergingLabelEncode = (
  position: Position,
  isNegativeTest: string,
  labelPadding: number = DEFAULT_AXIS_LABEL_PADDING,
  extraOutwardOffset = 0
) => {
  const gapCompensation = 2 * labelPadding;

  if (isVerticalAxis(position)) {
    const flippedOffset = position === 'left' ? gapCompensation : -gapCompensation;
    return {
      update: {
        align: [
          { test: isNegativeTest, value: 'left' as const },
          { value: 'right' as const },
        ],
        dx:
          position === 'left'
            ? [
                { test: isNegativeTest, value: flippedOffset - extraOutwardOffset },
                { value: extraOutwardOffset },
              ]
            : [
                { test: isNegativeTest, value: extraOutwardOffset },
                { value: flippedOffset - extraOutwardOffset },
              ],
      },
    };
  }

  const flippedOffset = position === 'top' ? gapCompensation : -gapCompensation;
  return {
    update: {
      baseline: [
        { test: isNegativeTest, value: 'bottom' as const },
        { value: 'top' as const },
      ],
      dy:
        position === 'top'
          ? [
              { test: isNegativeTest, value: extraOutwardOffset },
              { value: flippedOffset - extraOutwardOffset },
            ]
          : [
              { test: isNegativeTest, value: flippedOffset - extraOutwardOffset },
              { value: extraOutwardOffset },
            ],
    },
  };
};

interface RuleEntry {
  test?: string;
  value?: unknown;
  signal?: string;
}

const isRuleEntry = (entry: unknown): entry is RuleEntry => typeof entry === 'object' && entry !== null;

const ruleEntryToExpr = (entry: unknown): string => {
  if (!isRuleEntry(entry)) return JSON.stringify(entry);
  return entry.signal !== undefined ? entry.signal : JSON.stringify(entry.value);
};

/**
 * Converts a Vega ProductionRule — a single `{value}`/`{signal}`, or a conditional array of
 * `{test, value|signal}` rules — into one equivalent expression string.
 *
 * This exists so two independent ProductionRules targeting the *same* encode channel (e.g. two
 * axis features both writing conditional `dx` rules) can be combined arithmetically (summed) into
 * a single signal, instead of naively concatenating the two rule arrays. Concatenation is invalid
 * Vega: only the *last* entry in a rule array may omit `test`, and concatenating two independently
 * "complete" arrays strands the first array's untested fallback in the middle of the combined one,
 * which crashes at parse time (confirmed: `Illegal callee type: Literal`).
 *
 * Accepts `unknown` rather than a precise Vega type because it's meant to work structurally with
 * any `{test?, value?, signal?}`-shaped rule, and Vega's own `ProductionRule<T>` types are broader
 * unions (covering scale-transform shapes like `{exponent, mult, ...}`) that don't apply here.
 * @param rule
 * @returns expression string
 */
export const productionRuleToExpr = (rule: unknown): string => {
  if (!Array.isArray(rule)) return ruleEntryToExpr(rule);
  const [head, ...rest] = rule;
  if (!isRuleEntry(head) || !head.test || rest.length === 0) return ruleEntryToExpr(head);
  return `(${head.test} ? (${ruleEntryToExpr(head)}) : (${productionRuleToExpr(rest)}))`;
};

/**
 * Merges two ProductionRules by priority — `priorityRule`'s tested conditions win when they
 * match, otherwise `fallbackRule` decides — and returns the result as a single `{signal}` value.
 *
 * This is for string-valued channels (`align`, `baseline`) where `productionRuleToExpr`'s
 * arithmetic-sum composition (used for `dx`/`dy`) doesn't apply — you can't add two alignment
 * strings together, you need a priority chain instead. Concatenating the two rule arrays directly
 * (what `deepmerge` does) is invalid for the same reason `dx`/`dy` concatenation is: it strands
 * `priorityRule`'s untested fallback entry (valid only as *its own* array's last entry) in the
 * middle of the combined array, which crashes Vega's parser. This builds one well-formed array
 * instead — `priorityRule`'s tested entries first, then all of `fallbackRule` — and converts it to
 * an expression, so the result is a `{signal}` object that `deepmerge` will cleanly replace rather
 * than concatenate.
 * @param priorityRule wins when its own test(s) match (e.g. an explicit per-value `labels` override)
 * @param fallbackRule decides otherwise (e.g. `diverging`'s sign-based flip)
 * @returns a signal ref equivalent to "priorityRule's matching rule, else fallbackRule"
 */
export const getPriorityMergedSignal = (priorityRule: unknown, fallbackRule: unknown): SignalRef => {
  const priorityEntries = (Array.isArray(priorityRule) ? priorityRule : [priorityRule]).filter(
    (entry): entry is RuleEntry => isRuleEntry(entry) && Boolean(entry.test)
  );
  const fallbackEntries = Array.isArray(fallbackRule) ? fallbackRule : [fallbackRule];
  return { signal: productionRuleToExpr([...priorityEntries, ...fallbackEntries]) };
};

/**
 * Returns whether the axis is vertical.
 * @param position
 * @returns boolean
 */
export const isVerticalAxis = (position: Position): boolean => {
  return ['left', 'right'].includes(position);
};

/**
 * Gets the default scale name based on the position
 * @param position
 * @returns scaleName
 */
const getDefaultScaleNameFromPosition = (position: Position) => {
  return isVerticalAxis(position) ? 'yLinear' : 'xLinear';
};

/**
 * Gets the default opposing scale name based on the position
 * @param position
 * @returns scaleName
 */
const getDefaultOpposingScaleNameFromPosition = (position: Position) => {
  return isVerticalAxis(position) ? 'xLinear' : 'yLinear';
};

/**
 * Determines tick count based on axis type and available space.
 * Uses Vega's tickCount parameter which is treated as a suggestion rather than a strict limit.
 * The final number of ticks may vary as Vega optimizes for visually pleasing values and intervals.
 *
 * @param position The position of the axis
 * @param tickCountMinimum The minimum number of ticks
 * @param tickCountLimit The upper limit for the number of ticks
 * @param grid Whether grid lines are enabled
 * @returns tickCount production rule for Vega
 */
export const getTickCount = (position: Position, tickCountMinimum?: number, tickCountLimit?: number, grid?: boolean): SignalRef | undefined => {
  const range = ['top', 'bottom'].includes(position) ? 'width' : 'height';

  // 0 is a valid tickCountLimit value.
  if (tickCountLimit !== undefined) {
    // both min and max are provided
    if (tickCountMinimum !== undefined) {
      return {
        signal: `clamp(ceil(${range}/100), ${tickCountMinimum}, ${tickCountLimit})`,
      };
    }
    // divide the range by 100 to get the ideal number of ticks (grid lines)
    return {
      signal: `clamp(ceil(${range}/100), 2, ${tickCountLimit})`,
    };
  } else if (tickCountMinimum !== undefined) {
    return {
      signal: `clamp(ceil(${range}/100), ${tickCountMinimum}, 10)`,
    };
  } else if (grid) {
    // divide the range by 100 to get the ideal number of ticks (grid lines)
    return {
      signal: `clamp(ceil(${range}/100), 2, 10)`,
    };
  }
  return undefined;
};

/**
 * Gets the baseline rule mark
 * @param baselineOffset
 * @param position
 * @returns baselineMark
 */
export const getBaselineRule = (baselineOffset: number, position: Position): Mark => {
  const orientation = isVerticalAxis(position) ? 'y' : 'x';

  const positionOptions = {
    x: {
      x: { value: 0 },
      x2: { signal: 'width' },
      y: { scale: 'yLinear', value: baselineOffset },
    },
    y: {
      x: { scale: 'xLinear', value: baselineOffset },
      y: { value: 0 },
      y2: { signal: 'height' },
    },
  };

  return {
    name: `${orientation}Baseline`,
    description: `${orientation}Baseline`,
    type: 'rule',
    interactive: false,
    encode: {
      update: {
        ...positionOptions[orientation],
      },
    },
  };
};

export const hasSubLabels = ({ subLabels, labelOrientation }: AxisSpecOptions) => {
  // subLabels are only supported for horizontal axis labels
  return Boolean(subLabels.length && labelOrientation === 'horizontal');
};

/**
 * Determines if an axis is a metric axis based on its position and chart orientation
 * @param position The position of the axis
 * @param chartOrientation The orientation of the chart
 * @returns Whether the axis is a metric axis
 */
export function getIsMetricAxis(position: Position, chartOrientation: Orientation): boolean {
  if (chartOrientation === 'vertical') {
    return isVerticalAxis(position);
  }
  return !isVerticalAxis(position);
}
