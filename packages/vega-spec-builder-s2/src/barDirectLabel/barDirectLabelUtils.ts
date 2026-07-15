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
import { getColorProductionRule, getMarkOpacity } from '../marks/markUtils';
import { getTextNumberFormat } from '../textUtils';
import { BarDirectLabelOptions, BarDirectLabelPositionType, BarDirectLabelSpecOptions, BarSpecOptions } from '../types';

// Pixel gap between the bar tip and the label (end-outside, when the label doesn't fit inside the bar)
const VERTICAL_LABEL_OFFSET = 6;
const HORIZONTAL_LABEL_OFFSET = 8;
// Pixel gap between the label and the bar edge for inside positions (start, end, middle, and end-outside when it fits)
const INSIDE_LABEL_OFFSET = 8;
// Extra clearance required on either side of the label for it to be considered "fits inside the bar"
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

  if (position === 'end-outside') {
    return getAdaptiveEndPositionEncodings(isVertical, metric, metricScaleKey, fillEncoding, textSignal);
  }

  // 'end' reverses offset direction and baseline/align relative to 'end-outside' and 'start'
  const isEndInside = position === 'end';
  const directionMultiplier = isEndInside ? -1 : 1;

  // 'start' anchors to the bar baseline (0), 'end' anchors to the bar tip (metric)
  const anchor = position === 'start' ? { value: 0 } : { field: metric };

  const [negBaseline, posBaseline] = isEndInside
    ? ['bottom' as const, 'top' as const]
    : ['top' as const, 'bottom' as const];

  const [negAlign, posAlign] = isEndInside
    ? ['left' as const, 'right' as const]
    : ['right' as const, 'left' as const];

  return {
    metricAxisEncoding: isVertical
      ? [
          { test: `datum["${metric}"] < 0`, scale: metricScaleKey, ...anchor, offset: directionMultiplier * INSIDE_LABEL_OFFSET },
          { scale: metricScaleKey, ...anchor, offset: -directionMultiplier * INSIDE_LABEL_OFFSET },
        ]
      : [
          { test: `datum["${metric}"] < 0`, scale: metricScaleKey, ...anchor, offset: -directionMultiplier * INSIDE_LABEL_OFFSET },
          { scale: metricScaleKey, ...anchor, offset: directionMultiplier * INSIDE_LABEL_OFFSET },
        ],
    verticalBaseline: [
      { test: `datum["${metric}"] < 0`, value: negBaseline },
      { value: posBaseline },
    ],
    horizontalAlign: [
      { test: `datum["${metric}"] < 0`, value: negAlign },
      { value: posAlign },
    ],
    seriesFill: { signal: BACKGROUND_COLOR },
    isInsideTest: undefined as string | undefined,
  };
};

/**
 * 'end-outside' placement is adaptive: when a bar is long enough to fit the label, the label
 * renders inside, anchored near the *baseline* (zero) edge — the same spot 'start' anchors to —
 * with a background-color fill so it reads against the bar's own color. When the bar is too
 * short, the label falls back to sitting outside the tip in the series color, anchored at the
 * bar's far end, exactly like the previous always-outside behavior.
 *
 * Anchor position (baseline vs. tip) depends on fit, but text alignment and baseline only depend
 * on sign — 'start' and 'end-outside' already share the same align/baseline convention, so no
 * extra branching is needed there.
 *
 * "Fits" is evaluated per-datum against the bar's actual rendered length, since bar length varies
 * row to row. Vertical bars approximate the label's footprint with font size (text isn't rotated,
 * so its height along the bar is roughly one line); horizontal bars measure the real text width via
 * the `getLabelWidth` expression function (same helper `barAnnotationUtils` uses for annotations).
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
        // fits inside: anchor at the zero baseline, nudged toward the bar's interior
        { test: negativeAndFits, scale: metricScaleKey, value: 0, offset: INSIDE_LABEL_OFFSET },
        // doesn't fit: anchor at the tip, nudged away from the bar (outside)
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
  const {
    barName,
    color,
    colorOverride,
    colorScheme,
    dimension,
    index,
    metric,
    metricAxis,
    numberFormat,
    orientation,
    position,
  } = labelOptions;

  const { metricScaleKey, dimensionScaleKey } = getOrientationProperties(orientation, metricAxis);
  const isVertical = orientation === 'vertical';

  const fillEncoding = colorOverride
    ? { signal: `datum[${JSON.stringify(colorOverride)}]` }
    : getColorProductionRule(color, colorScheme);

  // Label text: a Vega production rule (conditional on isNumber) built from the requested format.
  // Reuse the same helper Axis/Bullet/DonutSummary use so numberFormat behaves identically everywhere.
  const textRule = getTextNumberFormat(numberFormat, metric);
  // A single representative signal for the "does it fit inside the bar" width measurement below —
  // the last rule is always the unconditional fallback, so it's a safe stand-in for any format.
  const textSignal = (textRule[textRule.length - 1] as { signal: string }).signal;

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
        text: textRule,
        fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
      }
    : {
        y: dimensionBandCenter,
        x: metricAxisEncoding,
        baseline: { value: 'middle' as const },
        align: horizontalAlign,
        text: textRule,
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
        // when the label sits inside the bar, its fill already contrasts against the bar's own
        // color, so the halo would just be visual noise — only render it for outside placements
        strokeWidth: isInsideTest
          ? [{ test: isInsideTest, value: 0 }, { value: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH }]
          : { value: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH },
        fill: { value: 'transparent' },
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
      },
    },
  };

  return position === 'end-outside' ? [backgroundMark, mainMark] : [mainMark];
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
  index,
  metric: barOptions.metric,
  metricAxis: barOptions.metricAxis,
  numberFormat: labelOptions.numberFormat ?? DEFAULT_NUMBER_FORMAT,
  orientation: barOptions.orientation,
  position: labelOptions.position ?? 'end-outside',
});
