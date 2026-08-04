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
import { ColorValueRef, Mark, TextMark } from 'vega';

import {
  BACKGROUND_COLOR,
  DEFAULT_FONT_SIZE,
  DIRECT_LABEL_BACKGROUND_STROKE_WIDTH,
  DIRECT_LABEL_FONT_WEIGHT,
  FILTERED_TABLE,
} from '@spectrum-charts/constants';

import { getOrientationProperties } from '../bar/barUtils';
import { getColorProductionRule, getDirectLabelFontSizeProductionRule, getMarkOpacity } from '../marks/markUtils';
import { escapeD3FormatSpecifier, getD3FormatSpecifierFromNumberFormat } from '../specUtils';
import { BarDirectLabelOptions, BarDirectLabelPositionType, BarDirectLabelSpecOptions, BarSpecOptions } from '../types';

// Gap between the bar tip and an outside label
const VERTICAL_LABEL_OFFSET = 6;
const HORIZONTAL_LABEL_OFFSET = 8;
// Gap between an inside label and the bar edge
const INSIDE_LABEL_OFFSET = 8;
// Clearance each side of the label needed to count as "fits inside"
const FIT_PADDING = 2 * INSIDE_LABEL_OFFSET;
const DEFAULT_NUMBER_FORMAT = ',.2~f';

/**
 * Returns position-specific Vega encoding values for a bar direct label.
 * @param position - where to place the label relative to the bar
 * @param isVertical - whether the bar is vertically oriented
 * @param metric - the metric field name
 * @param metricScaleKey - the Vega scale name for the metric axis
 * @param fillEncoding - the series color encoding used for labels placed outside the bar
 * @param textSignal - the Vega signal expression that produces the label's text
 */
export const getBarDirectLabelPositionEncodings = (
  position: BarDirectLabelPositionType,
  isVertical: boolean,
  metric: string,
  metricScaleKey: string,
  fillEncoding: ColorValueRef,
  textSignal: string
) => {
  if (position === 'middle') {
    const midSignal = `(scale('${metricScaleKey}', 0) + scale('${metricScaleKey}', datum['${metric}'])) / 2`;
    return {
      metricAxisEncoding: { signal: midSignal },
      verticalBaseline: { value: 'middle' as const },
      horizontalAlign: { value: 'center' as const },
      seriesFill: { signal: BACKGROUND_COLOR },
      isInsideTest: undefined as string | undefined,
    };
  }

  if (position === 'start') {
    // opt-in adaptive inside: near the baseline when the label fits, spilling outside the tip otherwise
    return getAdaptiveEndPositionEncodings(isVertical, metric, metricScaleKey, fillEncoding, textSignal);
  }

  // 'end' (inside) and 'end-outside' (always outside) both anchor at the bar tip
  const isEndInside = position === 'end';
  const isEndOutside = position === 'end-outside';
  const directionMultiplier = isEndInside ? -1 : 1;
  const verticalOffset = isEndOutside ? VERTICAL_LABEL_OFFSET : INSIDE_LABEL_OFFSET;
  const horizontalOffset = isEndOutside ? HORIZONTAL_LABEL_OFFSET : INSIDE_LABEL_OFFSET;
  const anchor = { field: metric };

  const [negBaseline, posBaseline] = isEndInside
    ? ['bottom' as const, 'top' as const]
    : ['top' as const, 'bottom' as const];

  const [negAlign, posAlign] = isEndInside
    ? ['left' as const, 'right' as const]
    : ['right' as const, 'left' as const];

  return {
    metricAxisEncoding: isVertical
      ? [
          { test: `datum["${metric}"] < 0`, scale: metricScaleKey, ...anchor, offset: directionMultiplier * verticalOffset },
          { scale: metricScaleKey, ...anchor, offset: -directionMultiplier * verticalOffset },
        ]
      : [
          { test: `datum["${metric}"] < 0`, scale: metricScaleKey, ...anchor, offset: -directionMultiplier * horizontalOffset },
          { scale: metricScaleKey, ...anchor, offset: directionMultiplier * horizontalOffset },
        ],
    verticalBaseline: [
      { test: `datum["${metric}"] < 0`, value: negBaseline },
      { value: posBaseline },
    ],
    horizontalAlign: [
      { test: `datum["${metric}"] < 0`, value: negAlign },
      { value: posAlign },
    ],
    seriesFill: isEndOutside ? fillEncoding : { signal: BACKGROUND_COLOR },
    isInsideTest: undefined as string | undefined,
  };
};

/**
 * Adaptive inside placement (the `start` position): if the bar fits the label, place it inside near
 * the zero baseline (background fill); otherwise spill it outside the tip (series color). Fit is
 * measured per-datum — horizontal via `getLabelWidth`, vertical approximated by font size.
 */
const getAdaptiveEndPositionEncodings = (
  isVertical: boolean,
  metric: string,
  metricScaleKey: string,
  fillEncoding: ColorValueRef,
  textSignal: string
) => {
  const barLength = `abs(scale('${metricScaleKey}', datum["${metric}"]) - scale('${metricScaleKey}', 0))`;
  const requiredSpace = isVertical
    ? `${DEFAULT_FONT_SIZE + FIT_PADDING}`
    : `(getLabelWidth(${textSignal}, ${DIRECT_LABEL_FONT_WEIGHT}, ${DEFAULT_FONT_SIZE}) + ${FIT_PADDING})`;
  const fitsInside = `${barLength} > ${requiredSpace}`;
  const negativeAndFits = `datum["${metric}"] < 0 && ${fitsInside}`;
  const negative = `datum["${metric}"] < 0`;

  const seriesFill = [{ test: fitsInside, signal: BACKGROUND_COLOR }, fillEncoding];

  if (isVertical) {
    return {
      metricAxisEncoding: [
        // fits: inside at the baseline
        { test: negativeAndFits, scale: metricScaleKey, value: 0, offset: INSIDE_LABEL_OFFSET },
        // doesn't fit: outside at the tip
        { test: negative, scale: metricScaleKey, field: metric, offset: VERTICAL_LABEL_OFFSET },
        { test: fitsInside, scale: metricScaleKey, value: 0, offset: -INSIDE_LABEL_OFFSET },
        { scale: metricScaleKey, field: metric, offset: -VERTICAL_LABEL_OFFSET },
      ],
      verticalBaseline: [
        { test: negative, value: 'top' as const },
        { value: 'bottom' as const },
      ],
      horizontalAlign: { value: 'center' as const },
      seriesFill,
      isInsideTest: fitsInside,
    };
  }

  return {
    metricAxisEncoding: [
      { test: negativeAndFits, scale: metricScaleKey, value: 0, offset: -INSIDE_LABEL_OFFSET },
      { test: negative, scale: metricScaleKey, field: metric, offset: -HORIZONTAL_LABEL_OFFSET },
      { test: fitsInside, scale: metricScaleKey, value: 0, offset: INSIDE_LABEL_OFFSET },
      { scale: metricScaleKey, field: metric, offset: HORIZONTAL_LABEL_OFFSET },
    ],
    verticalBaseline: { value: 'middle' as const },
    horizontalAlign: [
      { test: negative, value: 'right' as const },
      { value: 'left' as const },
    ],
    seriesFill,
    isInsideTest: fitsInside,
  };
};

/**
 * Text marks: background stroke halo + foreground fill, placed outside the tip of each bar.
 * Vertical bars: label above (positive) or below (negative) the bar, horizontally centered.
 * Horizontal bars: label to the right (positive) or left (negative) of the bar, vertically centered.
 *
 * No separate data source is needed — each row in FILTERED_TABLE is already one bar.
 */
export const getBarDirectLabelMarks = (labelOptions: BarDirectLabelSpecOptions, barOptions: BarSpecOptions): Mark[] => {
  const { barName, color, colorOverride, colorScheme, dimension, format, index, metric, metricAxis, orientation, position } =
    labelOptions;

  const { metricScaleKey, dimensionScaleKey } = getOrientationProperties(orientation, metricAxis);
  const isVertical = orientation === 'vertical';

  const fillEncoding = colorOverride
    ? { signal: `datum[${JSON.stringify(colorOverride)}]` }
    : getColorProductionRule(color, colorScheme);

  const fontSizeEncoding = getDirectLabelFontSizeProductionRule();

  // Label text computed inline — no derived dataset needed
  const resolvedFormat = format || DEFAULT_NUMBER_FORMAT;
  const d3Spec = getD3FormatSpecifierFromNumberFormat(resolvedFormat);
  const textSignal = `format(datum["${metric}"], "${escapeD3FormatSpecifier(d3Spec)}")`;

  // Dimension axis: center of the bar's band
  const dimensionBandCenter = { scale: dimensionScaleKey, field: dimension, band: 0.5 };

  const { metricAxisEncoding, verticalBaseline, horizontalAlign, seriesFill, isInsideTest } =
    getBarDirectLabelPositionEncodings(position, isVertical, metric, metricScaleKey, fillEncoding, textSignal);

  const baseEnter = isVertical
    ? {
        x: dimensionBandCenter,
        y: metricAxisEncoding,
        align: { value: 'center' as const },
        baseline: verticalBaseline,
        text: { signal: textSignal },
        fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
      }
    : {
        y: dimensionBandCenter,
        x: metricAxisEncoding,
        baseline: { value: 'middle' as const },
        align: horizontalAlign,
        text: { signal: textSignal },
        fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
      };

  const backgroundMark: TextMark = {
    name: `${barName}DirectLabel${index}_bg`,
    type: 'text',
    from: { data: FILTERED_TABLE },
    interactive: false,
    encode: {
      enter: {
        ...baseEnter,
        stroke: { signal: BACKGROUND_COLOR },
        // inside labels already contrast against the bar, so only halo the outside ones
        strokeWidth: isInsideTest
          ? [{ test: isInsideTest, value: 0 }, { value: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH }]
          : { value: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH },
        fill: { value: 'transparent' },
      },
      update: {
        fontSize: fontSizeEncoding,
      },
    },
  };

  const mainMark: TextMark = {
    name: `${barName}DirectLabel${index}`,
    type: 'text',
    from: { data: FILTERED_TABLE },
    interactive: false,
    encode: {
      enter: {
        ...baseEnter,
        fill: seriesFill,
      },
      update: {
        opacity: getMarkOpacity(barOptions),
        fontSize: fontSizeEncoding,
      },
    },
  };

  // the background halo is only needed where a label can sit outside the bar: always-outside
  // ('end-outside') or the adaptive position when it spills out (`isInsideTest` set)
  const hasOutsideLabel = position === 'end-outside' || Boolean(isInsideTest);
  return hasOutsideLabel ? [backgroundMark, mainMark] : [mainMark];
};

/**
 * Applies defaults and inherits context from the parent bar, producing BarDirectLabelSpecOptions.
 */
export const getBarDirectLabelSpecOptions = (
  labelOptions: BarDirectLabelOptions,
  index: number,
  barOptions: BarSpecOptions
): BarDirectLabelSpecOptions => ({
  barName: barOptions.name,
  color: barOptions.color,
  colorOverride: barOptions.colorOverride,
  colorScheme: barOptions.colorScheme,
  dimension: barOptions.dimension,
  format: labelOptions.format ?? '',
  index,
  metric: barOptions.metric,
  metricAxis: barOptions.metricAxis,
  orientation: barOptions.orientation,
  position: labelOptions.position ?? 'end-outside',
});
