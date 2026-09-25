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
import { Axis, Mark, Scale, ScaleType, SignalRef } from 'vega';

import { FILTERED_TABLE } from '@spectrum-charts/constants';

import { AxisSpecOptions, DivergingBarMark, Granularity, Orientation, Position } from '../types';
import {
  getAxisLabelTooltipRule,
  getAxisLabelsEncoding,
  getLabelAnchorValues,
  getLabelAngle,
  getLabelFormat,
  getLabelOffset,
} from './axisLabelUtils';
import { getCombinedTimeLabelFormat, getTimeLabelFormats } from './timeAxisConfig';
import { TemporalScaleType, TimeAxisLabelLevel, isTemporalScale } from './timeAxisTickUtils';

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
    name,
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
    tickCount: getTickCount(position, grid),
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
          ...(hasTooltip ? { tooltip: getAxisLabelTooltipRule(name) } : {}),
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
  return [
    getSecondaryTimeAxis(scaleName, axisOptions),
    ...(axisOptions.ticks && axisOptions.granularity !== 'quarter' && isTemporalScale(axisOptions.scaleType)
      ? [getMinorTimeAxis(scaleName, axisOptions)]
      : []),
    ...getPrimaryTimeAxis(scaleName, axisOptions),
  ];
};

/**
 * Gets a signal that calls a time axis expression function with the rendered axis range.
 * @param expressionName
 * @param scaleName
 * @param position
 * @param granularity
 * @param scaleType
 * @param level
 * @returns signal ref
 */
const getTimeAxisSignal = (
  expressionName: string,
  scaleName: string,
  position: Position,
  granularity: Granularity,
  scaleType: TemporalScaleType,
  level?: TimeAxisLabelLevel
): SignalRef => {
  const range = ['top', 'bottom'].includes(position) ? 'rscContainerWidth(width)' : 'height';
  const levelArgument = level ? `, '${level}'` : '';
  return {
    signal: `${expressionName}(domain('${scaleName}'), ${range}, '${granularity}', '${scaleType}'${levelArgument})`,
  };
};

const getTimeAxisValues = (
  expressionName: string,
  scaleName: string,
  position: Position,
  granularity: Granularity,
  scaleType: ScaleType
): SignalRef | undefined => {
  if (!isTemporalScale(scaleType)) return undefined;
  return getTimeAxisSignal(expressionName, scaleName, position, granularity, scaleType);
};

const getTimeAxisLabelFormat = (
  scaleName: string,
  position: Position,
  granularity: Granularity,
  scaleType: ScaleType,
  level: TimeAxisLabelLevel
): SignalRef | string => {
  if (!isTemporalScale(scaleType)) {
    const { primaryLabelFormat, secondaryLabelFormat } = getTimeLabelFormats(granularity);
    if (level === 'primary') return primaryLabelFormat;
    if (level === 'secondary') return secondaryLabelFormat;
    return getCombinedTimeLabelFormat(granularity);
  }
  return getTimeAxisSignal('getTimeAxisLabelFormat', scaleName, position, granularity, scaleType, level);
};

const getTimeAxisPrimaryLabelFormat = (
  scaleName: string,
  position: Position,
  granularity: Granularity,
  scaleType: ScaleType
): SignalRef | string => {
  if (!isTemporalScale(scaleType)) return getTimeLabelFormats(granularity).primaryLabelFormat;
  return getTimeAxisSignal('getTimeAxisPrimaryLabelFormat', scaleName, position, granularity, scaleType);
};

/**
 * Generates the secondary time axis.
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
    scaleType,
    ticks,
    title,
    vegaLabelAlign,
    vegaLabelBaseline,
  }: AxisSpecOptions
): Axis => {
  return {
    scale: scaleName,
    orient: position,
    grid,
    ticks,
    values: getTimeAxisValues('getTimeAxisMajorTicks', scaleName, position, granularity, scaleType),
    title,
    formatType: scaleType === 'utc' ? 'utc' : 'time',
    labelAngle: getLabelAngle(labelOrientation),
    labelSeparation: 12,
    ...getSecondaryTimeAxisLabelFormatting(scaleName, granularity, position, scaleType),
    ...getLabelAnchorValues(position, labelOrientation, labelAlign, vegaLabelAlign, vegaLabelBaseline),
  };
};

const getMinorTimeAxis = (scaleName: string, { granularity, position, scaleType }: AxisSpecOptions): Axis => ({
  scale: scaleName,
  orient: position,
  domain: false,
  grid: false,
  labels: false,
  ticks: true,
  values: getTimeAxisValues('getTimeAxisMinorTicks', scaleName, position, granularity, scaleType),
});

const getSecondaryTimeAxisLabelFormatting = (
  scaleName: string,
  granularity: Granularity,
  position: Position,
  scaleType: ScaleType
): Partial<Axis> => {
  const isVerticalAxis = ['left', 'right'].includes(position);
  if (isVerticalAxis) {
    return {
      format: getTimeAxisLabelFormat(scaleName, position, granularity, scaleType, 'combined'),
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
    format: getTimeAxisLabelFormat(scaleName, position, granularity, scaleType, 'secondary'),
  };
};

/**
 * Generates the horizontal primary time axis.
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
    scaleType,
    ticks,
    vegaLabelAlign,
    vegaLabelBaseline,
  }: AxisSpecOptions
): Axis[] => {
  if (['left', 'right'].includes(position) || granularity === 'year') {
    return [];
  }
  const labelAnchorValues = getLabelAnchorValues(
    position,
    labelOrientation,
    labelAlign,
    vegaLabelAlign,
    vegaLabelBaseline
  );
  return [
    {
      scale: scaleName,
      orient: position,
      domain: false,
      format: getTimeAxisPrimaryLabelFormat(scaleName, position, granularity, scaleType),
      grid: false,
      ticks: false,
      values: getTimeAxisValues('getTimeAxisPrimaryTicks', scaleName, position, granularity, scaleType),
      formatType: scaleType === 'utc' ? 'utc' : 'time',
      labelFontWeight,
      labelAngle: getLabelAngle(labelOrientation),
      ...labelAnchorValues,
      encode: {
        labels: {
          interactive: false,
          enter: {
            dy: { value: (ticks ? 28 : 20) * (position === 'top' ? -1 : 1) }, // account for tick height
          },
          update: {
            ...(!isTemporalScale(scaleType) && {
              text: { signal: 'formatHorizontalTimeAxisLabels(datum)' },
            }),
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

/** Gets the name of the opposing scale (the scale for the perpendicular axis); mirrors `getOpposingScaleType`. */
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
 * Finds the `usermeta.divergingBarMarks` entry for this axis's dimension field, mirroring
 * {@link getMatchingInteractiveBarDimensionFields}. `addBar` only ever adds an entry for a
 * single-series bar (see `addBar`), so at most one match is expected.
 */
export const getDivergingBarContext = (
  scaleField: string | undefined,
  divergingBarMarks: DivergingBarMark[] = []
): DivergingBarContext | undefined => {
  const match = divergingBarMarks.find((mark) => mark.dimension === scaleField);
  if (!match) return undefined;
  return { dataName: FILTERED_TABLE, dimension: match.dimension, metric: match.metric };
};

/** Vega axis `offset` signal moving a categorical axis to its opposing scale's zero line; negative because `offset` moves outward from the edge. */
export const getDivergingAxisOffset = (position: Position, opposingScaleName: string): SignalRef => {
  if (position === 'left' || position === 'top') {
    return { signal: `-scale('${opposingScaleName}', 0)` };
  }
  const rangeSizeSignal = position === 'right' ? 'width' : 'height';
  return { signal: `scale('${opposingScaleName}', 0) - ${rangeSizeSignal}` };
};

/** Vega expression, true when the bar paired with an axis tick is negative; assumes one resolvable sign per category. */
export const getDivergingTickIsNegativeTest = ({ dataName, dimension, metric }: DivergingBarContext): string =>
  `data('${dataName}')[indexof(pluck(data('${dataName}'), '${dimension}'), datum.value)]['${metric}'] < 0`;

// spectrum2Theme's default axis `labelPadding`; the sub-label axis sets a larger value and must pass its own in.
const DEFAULT_AXIS_LABEL_PADDING = 8;

/** Axis label encode that flips each tick's align/baseline to the opposite side of its bar's sign, offsetting by `2 * labelPadding` since Vega doesn't recompute the anchor on override; `extraOutwardOffset` is a static push (e.g. a time axis's `dy`) that flips sign with the test instead of adding as a constant. */
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
        align: [{ test: isNegativeTest, value: 'left' as const }, { value: 'right' as const }],
        dx:
          position === 'left'
            ? [{ test: isNegativeTest, value: flippedOffset - extraOutwardOffset }, { value: extraOutwardOffset }]
            : [{ test: isNegativeTest, value: extraOutwardOffset }, { value: flippedOffset - extraOutwardOffset }],
      },
    };
  }

  const flippedOffset = position === 'top' ? gapCompensation : -gapCompensation;
  return {
    update: {
      baseline: [{ test: isNegativeTest, value: 'bottom' as const }, { value: 'top' as const }],
      dy:
        position === 'top'
          ? [{ test: isNegativeTest, value: extraOutwardOffset }, { value: flippedOffset - extraOutwardOffset }]
          : [{ test: isNegativeTest, value: flippedOffset - extraOutwardOffset }, { value: extraOutwardOffset }],
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

/** Flattens a Vega ProductionRule into one expression string; array-concatenating two rules instead strands an untested fallback mid-array and crashes the parser. */
export const productionRuleToExpr = (rule: unknown): string => {
  if (!Array.isArray(rule)) return ruleEntryToExpr(rule);
  const [head, ...rest] = rule;
  if (!isRuleEntry(head) || !head.test || rest.length === 0) return ruleEntryToExpr(head);
  return `(${head.test} ? (${ruleEntryToExpr(head)}) : (${productionRuleToExpr(rest)}))`;
};

/** Merges two ProductionRules by priority (`priorityRule`'s tested entries first) into one `{signal}`, so `deepmerge` replaces rather than array-concatenates and crashes the parser. */
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
 * @param position The position of the axis
 * @param grid Whether grid lines are enabled
 * @returns tickCount production rule for Vega
 */
export const getTickCount = (position: Position, grid?: boolean): SignalRef | undefined => {
  const range = ['top', 'bottom'].includes(position) ? 'width' : 'height';

  if (grid) {
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
