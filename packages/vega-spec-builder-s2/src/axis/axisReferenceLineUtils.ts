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
  DEFAULT_FONT_COLOR,
  REFERENCE_LINE_LABEL_BACKGROUND_STROKE,
  REFERENCE_LINE_END_CAP_PATH,
  REFERENCE_LINE_LABEL_BACKGROUND_STROKE_WIDTH,
  REFERENCE_LINE_LABEL_FONT_WEIGHT,
  REFERENCE_LINE_LABEL_OFFSET_FROM_LINE,
  REFERENCE_LINE_START_CAP_PATH,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { AxisSpecOptions, ReferenceLineOptions, ReferenceLineSpecOptions } from '../types';
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
      getReferenceLineStartCapMark(axisOptions, referenceLine, positionEncoding),
      getReferenceLineEndCapMark(axisOptions, referenceLine, positionEncoding),
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

/**
 * Horizontal rule line — spans from x: 5 to x2: width - 5 (aligned with caps).
 */
export const getReferenceLineRuleMark = (
  { colorScheme }: AxisSpecOptions,
  { name }: ReferenceLineSpecOptions,
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): RuleMark => {
  return {
    name,
    type: 'rule',
    interactive: false,
    encode: {
      enter: {
        stroke: { value: getS2ColorValue(DEFAULT_FONT_COLOR, colorScheme) },
        strokeWidth: { value: 2 },
        strokeCap: { value: 'round' },
        strokeJoin: { value: 'round' },
      },
      update: {
        x: { value: 10 },
        x2: { signal: 'width - 7' },
        y: positionEncoding as NumericValueRef,
      },
    },
  };
};

/**
 * Left-pointing arrow cap at the left edge of the chart area.
 */
export const getReferenceLineStartCapMark = (
  _axisOptions: AxisSpecOptions,
  { colorScheme, name }: ReferenceLineSpecOptions,
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): PathMark => ({
    name: `${name}_startCap`,
    type: 'path',
    interactive: false,
    encode: {
      enter: {
        path: { value: REFERENCE_LINE_START_CAP_PATH },
        fill: { value: getS2ColorValue(DEFAULT_FONT_COLOR, colorScheme) },
      },
      update: {
        x: { value: 5 },
        y: positionEncoding as NumericValueRef,
      },
    },
  });

/**
 * Right-pointing arrow cap at the right edge of the chart area.
 */
export const getReferenceLineEndCapMark = (
  _axisOptions: AxisSpecOptions,
  { colorScheme, name }: ReferenceLineSpecOptions,
  positionEncoding: ProductionRule<NumericValueRef> | SignalRef
): PathMark => ({
    name: `${name}_endCap`,
    type: 'path',
    interactive: false,
    encode: {
      enter: {
        path: { value: REFERENCE_LINE_END_CAP_PATH },
        fill: { value: getS2ColorValue(DEFAULT_FONT_COLOR, colorScheme) },
      },
      update: {
        x: { signal: 'width - 5' },
        y: positionEncoding as NumericValueRef,
      },
    },
  });

/**
 * Two text marks: background halo then foreground.
 * Label is below the line, right-aligned, with S2 typography.
 */
export const getReferenceLineTextMark = (
  { colorScheme, label, name }: ReferenceLineSpecOptions,
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
          fill: { value: getS2ColorValue(DEFAULT_FONT_COLOR, colorScheme) },
        },
        update: sharedUpdate,
      },
    },
  ];
};
