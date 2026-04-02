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

import { BACKGROUND_COLOR, DIRECT_LABEL_BACKGROUND_STROKE_WIDTH, DIRECT_LABEL_FONT_WEIGHT, FILTERED_TABLE } from '@spectrum-charts/constants';

import { getOrientationProperties } from '../bar/barUtils';
import { getColorProductionRule, getMarkOpacity } from '../marks/markUtils';
import { BarDirectLabelOptions, BarDirectLabelPositionType, BarDirectLabelSpecOptions, BarSpecOptions } from '../types';

// Pixel gap between the bar tip and the label (end-outside)
const VERTICAL_LABEL_OFFSET = 6;
const HORIZONTAL_LABEL_OFFSET = 8;
// Pixel gap between the label and the bar edge for inside positions (start, end, middle)
const INSIDE_LABEL_OFFSET = 8;
const DEFAULT_NUMBER_FORMAT = ',.2~f';

/**
 * Returns position-specific Vega encoding values for a bar direct label.
 * @param position - where to place the label relative to the bar
 * @param isVertical - whether the bar is vertically oriented
 * @param metric - the metric field name
 * @param metricScaleKey - the Vega scale name for the metric axis
 * @param seriesFill - the series color encoding used for end-outside labels
 */
export const getBarDirectLabelPositionEncodings = (
  position: BarDirectLabelPositionType,
  isVertical: boolean,
  metric: string,
  metricScaleKey: string,
  seriesFill: ColorValueRef
) => {
  if (position === 'middle') {
    const midSignal = `(scale('${metricScaleKey}', 0) + scale('${metricScaleKey}', datum['${metric}'])) / 2`;
    return {
      metricAxisEncoding: { signal: midSignal },
      verticalBaseline: { value: 'middle' as const },
      horizontalAlign: { value: 'center' as const },
      seriesFill: { signal: BACKGROUND_COLOR },
    };
  }

  // 'end' reverses offset direction and baseline/align relative to 'end-outside' and 'start'
  const isEndInside = position === 'end';
  const isEndOutside = position === 'end-outside';
  const directionMultiplier = isEndInside ? -1 : 1;

  const verticalOffset = isEndOutside ? VERTICAL_LABEL_OFFSET : INSIDE_LABEL_OFFSET;
  const horizontalOffset = isEndOutside ? HORIZONTAL_LABEL_OFFSET : INSIDE_LABEL_OFFSET;

  // 'start' anchors to the bar baseline (0), the others anchor to the bar tip (metric)
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
    seriesFill: isEndOutside ? seriesFill : { signal: BACKGROUND_COLOR },
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
  const { barName, color, colorOverride, colorScheme, dimension, index, metric, metricAxis, orientation, position } =
    labelOptions;

  const { metricScaleKey, dimensionScaleKey } = getOrientationProperties(orientation, metricAxis);
  const isVertical = orientation === 'vertical';

  const fillEncoding = colorOverride
    ? { signal: `datum[${JSON.stringify(colorOverride)}]` }
    : getColorProductionRule(color, colorScheme);

  // Label text computed inline — no derived dataset needed
  const textSignal = `format(datum["${metric}"], "${DEFAULT_NUMBER_FORMAT}")`;

  // Dimension axis: center of the bar's band
  const dimensionBandCenter = { scale: dimensionScaleKey, field: dimension, band: 0.5 };

  const { metricAxisEncoding, verticalBaseline, horizontalAlign, seriesFill } = getBarDirectLabelPositionEncodings(
    position,
    isVertical,
    metric,
    metricScaleKey,
    fillEncoding
  );

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
        strokeWidth: { value: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH },
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
  orientation: barOptions.orientation,
  position: labelOptions.position ?? 'end-outside',
});
