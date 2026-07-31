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
 * Vega axis `offset` signal moving a categorical axis from the chart edge to its opposing linear
 * scale's zero line. Positive `offset` moves outward, so reaching the interior zero needs a negative
 * offset from the default edge (0 for left/top, range size for right/bottom).
 */
export const getDivergingAxisOffset = (position: Position, opposingScaleName: string): SignalRef => {
  if (position === 'left' || position === 'top') {
    return { signal: `-scale('${opposingScaleName}', 0)` };
  }
  const rangeSizeSignal = position === 'right' ? 'width' : 'height';
  return { signal: `scale('${opposingScaleName}', 0) - ${rangeSizeSignal}` };
};

/**
 * Vega expression, true when the bar paired with an axis tick is negative — joins back to the bar's
 * data on the dimension field. Assumes one resolvable sign per category.
 */
export const getDivergingTickIsNegativeTest = ({ dataName, dimension, metric }: DivergingBarContext): string =>
  `data('${dataName}')[indexof(pluck(data('${dataName}'), '${dimension}'), datum.value)]['${metric}'] < 0`;

// spectrum2Theme's default axis `labelPadding`; the sub-label axis sets a larger value and must pass its own in.
const DEFAULT_AXIS_LABEL_PADDING = 8;

/**
 * Axis `encode.labels` that flips each tick's align (left/right axis) or baseline (top/bottom) to
 * the side opposite its bar's sign, with a `2 * labelPadding` offset so the flipped label mirrors to
 * the same distance from zero — Vega doesn't recompute the anchor when align/baseline is overridden,
 * so without it the label overlaps the bar. `labelPadding` must be the axis's effective value.
 * `extraOutwardOffset` (a static push, e.g. a time axis's `enter.dy`) flips sign with the test rather
 * than being added as a constant; 0 is the plain formula.
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
 * Flattens a Vega ProductionRule (single `{value}`/`{signal}` or a `{test, value|signal}[]` array)
 * into one expression string, so two rules on the same encode channel can be combined (summed for
 * `dx`/`dy`) instead of array-concatenated — concatenation strands an untested fallback mid-array
 * and crashes the parser (`Illegal callee type: Literal`). Takes `unknown` to match structurally.
 */
export const productionRuleToExpr = (rule: unknown): string => {
  if (!Array.isArray(rule)) return ruleEntryToExpr(rule);
  const [head, ...rest] = rule;
  if (!isRuleEntry(head) || !head.test || rest.length === 0) return ruleEntryToExpr(head);
  return `(${head.test} ? (${ruleEntryToExpr(head)}) : (${productionRuleToExpr(rest)}))`;
};

/**
 * Merges two ProductionRules by priority (`priorityRule`'s tested entries first, then `fallbackRule`)
 * into one `{signal}` — the string-channel (`align`/`baseline`) counterpart to `productionRuleToExpr`'s
 * sum, where you need a priority chain, not addition. Returning a `{signal}` lets `deepmerge` replace
 * rather than concatenate (which would strand an untested entry mid-array and crash the parser).
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
