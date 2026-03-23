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
import { Mark, TextMark } from 'vega';

import { DIRECT_LABEL_BACKGROUND_STROKE_WIDTH, DIRECT_LABEL_FONT_WEIGHT, FILTERED_TABLE } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getOrientationProperties } from '../bar/barUtils';
import { getColorProductionRule, getMarkOpacity } from '../marks/markUtils';
import { BarDirectLabelOptions, BarDirectLabelSpecOptions, BarSpecOptions } from '../types';

// Pixel gap between the bar tip and the label
const LABEL_OFFSET = 4;
const DEFAULT_NUMBER_FORMAT = ',.2~f';

/**
 * Text marks: background stroke halo + foreground fill, placed outside the tip of each bar.
 * Vertical bars: label above (positive) or below (negative) the bar, horizontally centered.
 * Horizontal bars: label to the right (positive) or left (negative) of the bar, vertically centered.
 *
 * No separate data source is needed — each row in FILTERED_TABLE is already one bar.
 */
export const getBarDirectLabelMarks = (labelOptions: BarDirectLabelSpecOptions, barOptions: BarSpecOptions): Mark[] => {
  const { barName, color, colorOverride, colorScheme, dimension, index, metric, metricAxis, orientation } =
    labelOptions;

  const { metricScaleKey, dimensionScaleKey } = getOrientationProperties(orientation, metricAxis);
  const isVertical = orientation === 'vertical';

  const resolvedBg = getS2ColorValue('gray-25', colorScheme);
  const fillEncoding = colorOverride
    ? { signal: `datum[${JSON.stringify(colorOverride)}]` }
    : getColorProductionRule(color, colorScheme);

  // Label text computed inline — no derived dataset needed
  const textSignal = `format(datum["${metric}"], "${DEFAULT_NUMBER_FORMAT}")`;

  // Dimension axis: center of the bar's band
  const dimensionBandCenter = { scale: dimensionScaleKey, field: dimension, band: 0.5 };

  // Metric axis: at the bar tip, offset outside. Direction reverses for negative values.
  const metricOutsideTip = isVertical
    ? [
        // negative bar → label below (offset downward = positive y offset)
        { test: `datum["${metric}"] < 0`, scale: metricScaleKey, field: metric, offset: LABEL_OFFSET },
        // positive bar → label above (offset upward = negative y offset)
        { scale: metricScaleKey, field: metric, offset: -LABEL_OFFSET },
      ]
    : [
        // negative bar → label to the left (offset leftward = negative x offset)
        { test: `datum["${metric}"] < 0`, scale: metricScaleKey, field: metric, offset: -LABEL_OFFSET },
        // positive bar → label to the right (offset rightward = positive x offset)
        { scale: metricScaleKey, field: metric, offset: LABEL_OFFSET },
      ];

  // Text baseline/align rules to keep labels outside the bar for both positive and negative values
  const verticalBaseline = [
    { test: `datum["${metric}"] < 0`, value: 'top' as const },
    { value: 'bottom' as const },
  ];
  const horizontalAlign = [
    { test: `datum["${metric}"] < 0`, value: 'right' as const },
    { value: 'left' as const },
  ];

  const baseEnter = isVertical
    ? {
        x: dimensionBandCenter,
        y: metricOutsideTip,
        align: { value: 'center' as const },
        baseline: verticalBaseline,
        text: { signal: textSignal },
        fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
      }
    : {
        y: dimensionBandCenter,
        x: metricOutsideTip,
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
        stroke: { value: resolvedBg },
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
        fill: fillEncoding,
      },
      update: {
        opacity: getMarkOpacity(barOptions),
      },
    },
  };

  return [backgroundMark, mainMark];
};

/**
 * Applies defaults and inherits context from the parent bar, producing BarDirectLabelSpecOptions.
 */
export const getBarDirectLabelSpecOptions = (
  _labelOptions: BarDirectLabelOptions,
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
});
