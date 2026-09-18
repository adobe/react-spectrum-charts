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
import { Mark, NumericValueRef, PathMark, ProductionRule, RuleMark, ScaleType, SignalRef, TextMark } from 'vega';

import {
  CHART_SIZE_BREAKPOINTS,
  CHART_SIZE_FONT_SIZE,
  CHART_SIZE_STROKE_WIDTH,
  DEFAULT_FONT_COLOR,
  REFERENCE_LINE_AUTO_RULE_X2_OFFSET,
  REFERENCE_LINE_AUTO_RULE_X_START,
  REFERENCE_LINE_END_CAP_ANCHOR_OFFSET,
  REFERENCE_LINE_END_CAP_PATHS,
  REFERENCE_LINE_LABEL_BACKGROUND_STROKE,
  REFERENCE_LINE_LABEL_BACKGROUND_STROKE_WIDTH,
  REFERENCE_LINE_LABEL_FONT_WEIGHT,
  REFERENCE_LINE_LABEL_OFFSET_FROM_LINE,
  REFERENCE_LINE_RULE_X2_OFFSET,
  REFERENCE_LINE_RULE_X_START,
  REFERENCE_LINE_SECONDARY_COLORS,
  REFERENCE_LINE_SECONDARY_STROKE_WIDTH,
  REFERENCE_LINE_SIZE_STROKE_WIDTHS,
  REFERENCE_LINE_START_CAP_PATHS,
  ReferenceLineSize,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { AxisSpecOptions, ColorScheme, ReferenceLineOptions, ReferenceLineSpecOptions } from '../types';
import { isVerticalAxis } from './axisUtils';

export const getReferenceLines = (axisOptions: AxisSpecOptions): ReferenceLineSpecOptions[] => {
  return axisOptions.referenceLines.map((referenceLine, index) =>
    applyReferenceLineOptionDefaults(referenceLine, axisOptions, index)
  );
};

const applyReferenceLineOptionDefaults = (
  options: ReferenceLineOptions,
  axisOptions: AxisSpecOptions,
  index: number
): ReferenceLineSpecOptions => ({
  ...options,
  colorScheme: axisOptions.colorScheme,
  name: `${axisOptions.name}ReferenceLine${index}`,
});

export const scaleTypeSupportsReferenceLines = (scaleType: ScaleType | undefined): boolean => {
  const supportedScaleTypes: ScaleType[] = ['band', 'linear', 'point', 'time', 'utc'];
  return Boolean(scaleType && supportedScaleTypes.includes(scaleType));
};

/**
 * S2 reference lines are horizontal only — only emits marks for vertical axes (left/right).
 */
export const getReferenceLineMarks = (
  axisOptions: AxisSpecOptions,
  scaleName: string
): Mark[] => {
  if (!isVerticalAxis(axisOptions.position)) {
    return [];
  }

  const marks: Mark[] = [];
  for (const referenceLine of getReferenceLines(axisOptions)) {
    const positionEncoding = getPositionEncoding(axisOptions, referenceLine, scaleName);
    marks.push(
      getReferenceLineRuleMark(axisOptions, referenceLine, positionEncoding),
      ...getReferenceLineStartCapMark(axisOptions, referenceLine, positionEncoding),
      ...getReferenceLineEndCapMark(axisOptions, referenceLine, positionEncoding),
      ...getReferenceLineTextMark(referenceLine, positionEncoding)
    );
  }
  return marks;
};

export const getPositionEncoding = (
  { scaleType }: AxisSpecOptions,
  { value, position }: ReferenceLineSpecOptions,
  scaleName: string
): ProductionRule<NumericValueRef> | SignalRef => {
  const signalValue = typeof value === 'string' ? `'${value}'` : value;
  const halfInnerPaddingFormula = `paddingInner * bandwidth('${scaleName}') / (2 * (1 - paddingInner))`;
  const beforePositionSignal = `scale('${scaleName}', ${signalValue}) - ${halfInnerPaddingFormula}`;
  const centeredPositionSignal = `scale('${scaleName}', ${signalValue}) + bandwidth('${scaleName}') / 2`;
  const afterPositionSignal = `scale('${scaleName}', ${signalValue}) + bandwidth('${scaleName}') + ${halfInnerPaddingFormula}`;
  if (scaleType === 'band') {
    if (position === 'before') return { signal: beforePositionSignal };
    if (position === 'after') return { signal: afterPositionSignal };
    return { signal: centeredPositionSignal };
  }
  return { scale: scaleName, value };
};

const getRuleXStartSignal = (): string =>
  `rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.M} ? ${REFERENCE_LINE_AUTO_RULE_X_START.S} : rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.L} ? ${REFERENCE_LINE_AUTO_RULE_X_START.M} : ${REFERENCE_LINE_AUTO_RULE_X_START.L}`;

const getRuleX2Signal = (): string =>
  `rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.M} ? width - ${REFERENCE_LINE_AUTO_RULE_X2_OFFSET.S} : rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.L} ? width - ${REFERENCE_LINE_AUTO_RULE_X2_OFFSET.M} : width - ${REFERENCE_LINE_AUTO_RULE_X2_OFFSET.L}`;

const getCapTierOpacitySignal = (tier: 'S' | 'M' | 'L'): string => {
  if (tier === 'S') return `rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.M} ? 1 : 0`;
  if (tier === 'L') return `rscContainerWidth(width) >= ${CHART_SIZE_BREAKPOINTS.L} ? 1 : 0`;
  return `rscContainerWidth(width) >= ${CHART_SIZE_BREAKPOINTS.M} && rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.L} ? 1 : 0`;
};

// Returns the stroke color for a secondary reference line.
// Auto mode has no XS tier, so treat as M (gray-800). Explicit XS → gray-600.
const getSecondaryStrokeColor = (size: ReferenceLineSize | undefined, colorScheme: ColorScheme): string =>
  getS2ColorValue(REFERENCE_LINE_SECONDARY_COLORS[size ?? 'M'], colorScheme);

/**
 * Horizontal rule line — spans from caret tip to the right cap, with x-start adapting to caret size.
 * In auto mode (no explicit size) both stroke width and x-start react to chart width via signals.
 */
export const getReferenceLineRuleMark = (
  { colorScheme }: AxisSpecOptions,
  { name, secondary, size }: ReferenceLineSpecOptions,
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): RuleMark => {
  const stroke = secondary
    ? { value: getSecondaryStrokeColor(size, colorScheme) }
    : { value: getS2ColorValue(DEFAULT_FONT_COLOR, colorScheme) };
  const primaryStrokeWidth =
    size === undefined ? { signal: CHART_SIZE_STROKE_WIDTH } : { value: REFERENCE_LINE_SIZE_STROKE_WIDTHS[size] };
  const strokeWidth = secondary ? { value: REFERENCE_LINE_SECONDARY_STROKE_WIDTH } : primaryStrokeWidth;
  const primaryXStart =
    size === undefined ? { signal: getRuleXStartSignal() } : { value: REFERENCE_LINE_RULE_X_START[size] };
  const xStart = secondary ? { value: 0 } : primaryXStart;
  const primaryX2 =
    size === undefined ? { signal: getRuleX2Signal() } : { signal: `width - ${REFERENCE_LINE_RULE_X2_OFFSET[size]}` };
  const x2 = secondary ? { signal: 'width' } : primaryX2;
  return {
    name,
    type: 'rule',
    interactive: false,
    encode: {
      enter: {
        stroke,
        strokeWidth,
        strokeCap: { value: 'round' },
        strokeJoin: { value: 'round' },
      },
      update: {
        x: xStart,
        x2,
        y: positionEncoding as NumericValueRef,
      },
    },
  };
};

/**
 * Left-pointing arrow caps at the left edge of the chart area.
 * Explicit size: one mark with the size-specific path.
 * Auto mode: three marks (S/M/L) with reactive opacity, so the caret tier matches the chart width.
 */
export const getReferenceLineStartCapMark = (
  _axisOptions: AxisSpecOptions,
  { colorScheme, name, secondary, size }: ReferenceLineSpecOptions,
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): PathMark[] => {
  if (secondary) return [];
  const fill = { value: getS2ColorValue(DEFAULT_FONT_COLOR, colorScheme) };
  const sharedUpdate = { x: { value: 5 }, y: positionEncoding as NumericValueRef };

  if (size === undefined) {
    return (['S', 'M', 'L'] as const).map((tier) => ({
      name: `${name}_startCap_${tier}`,
      type: 'path' as const,
      interactive: false,
      encode: {
        enter: { path: { value: REFERENCE_LINE_START_CAP_PATHS[tier] }, fill },
        update: {
          ...sharedUpdate,
          opacity: { signal: getCapTierOpacitySignal(tier) },
        },
      },
    }));
  }

  return [{
    name: `${name}_startCap`,
    type: 'path',
    interactive: false,
    encode: {
      enter: { path: { value: REFERENCE_LINE_START_CAP_PATHS[size] }, fill },
      update: sharedUpdate,
    },
  }];
};

/**
 * Right-pointing arrow caps at the right edge of the chart area.
 * Explicit size: one mark. Auto mode: three marks (S/M/L) with reactive opacity.
 */
export const getReferenceLineEndCapMark = (
  _axisOptions: AxisSpecOptions,
  { colorScheme, name, secondary, size }: ReferenceLineSpecOptions,
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): PathMark[] => {
  if (secondary) return [];
  const fill = { value: getS2ColorValue(DEFAULT_FONT_COLOR, colorScheme) };

  if (size === undefined) {
    return (['S', 'M', 'L'] as const).map((tier) => ({
      name: `${name}_endCap_${tier}`,
      type: 'path' as const,
      interactive: false,
      encode: {
        enter: { path: { value: REFERENCE_LINE_END_CAP_PATHS[tier] }, fill },
        update: {
          x: { signal: `width - ${REFERENCE_LINE_END_CAP_ANCHOR_OFFSET[tier]}` },
          y: positionEncoding as NumericValueRef,
          opacity: { signal: getCapTierOpacitySignal(tier) },
        },
      },
    }));
  }

  return [{
    name: `${name}_endCap`,
    type: 'path',
    interactive: false,
    encode: {
      enter: { path: { value: REFERENCE_LINE_END_CAP_PATHS[size] }, fill },
      update: {
        x: { signal: `width - ${REFERENCE_LINE_END_CAP_ANCHOR_OFFSET[size]}` },
        y: positionEncoding as NumericValueRef,
      },
    },
  }];
};

/**
 * Two text marks: background halo then foreground.
 * Label is below the line, right-aligned, with S2 typography.
 */
export const getReferenceLineTextMark = (
  { colorScheme, label, name, secondary, size }: ReferenceLineSpecOptions,
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): TextMark[] => {
  if (!label) return [];

  const sharedEnter = {
    text: { value: label },
    x: { signal: 'width' },
    y: positionEncoding as NumericValueRef,
    dy: { value: REFERENCE_LINE_LABEL_OFFSET_FROM_LINE },
    baseline: { value: 'top' as const },
    align: { value: 'right' as const },
  };

  const sharedUpdate = {
    fontWeight: { value: REFERENCE_LINE_LABEL_FONT_WEIGHT },
    fontSize: { signal: CHART_SIZE_FONT_SIZE },
  };

  return [
    {
      name: `${name}_labelBackground`,
      type: 'text',
      interactive: false,
      encode: {
        enter: {
          ...sharedEnter,
          fill: { value: 'transparent' },
          stroke: { signal: REFERENCE_LINE_LABEL_BACKGROUND_STROKE },
          strokeWidth: { value: REFERENCE_LINE_LABEL_BACKGROUND_STROKE_WIDTH },
        },
        update: sharedUpdate,
      },
    },
    {
      name: `${name}_label`,
      type: 'text',
      interactive: false,
      encode: {
        enter: {
          ...sharedEnter,
          fill: { value: secondary ? getSecondaryStrokeColor(size, colorScheme) : getS2ColorValue(DEFAULT_FONT_COLOR, colorScheme) },
        },
        update: sharedUpdate,
      },
    },
  ];
};
