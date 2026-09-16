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
import { ArcMark, Mark, PathMark, SymbolMark, TextMark } from 'vega';

import { BACKGROUND_COLOR } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { getColorProductionRule } from '../marks/markUtils';
import { getTextNumberFormat } from '../textUtils';
import { GaugeSpecOptions } from '../types';

// below this inner radius there isn't room to render center text legibly; hide it rather than overlap the arc
const GAUGE_LABEL_MIN_RADIUS = 20;

/**
 * Gets the pixel width available for center text at vertical offset dyExpr inside the hole,
 * so long labels truncate with an ellipsis instead of overflowing into the arc.
 * @param name
 * @param dyExpr
 * @returns Vega expression string
 */
const getTextLimit = (name: string, dyExpr: string): string =>
  `2 * sqrt(max(0, pow(${name}_innerRadius, 2) - pow(${dyExpr}, 2)))`;

/**
 * Gets all marks that make up the gauge (track, needle or fill, and center label/value).
 * @param options
 * @returns Mark[]
 */
export const getGaugeMarks = (options: GaugeSpecOptions): Mark[] => {
  const { showNeedle } = options;
  const marks: Mark[] = [getTrackArcMark(options)];

  if (showNeedle) {
    marks.push(getNeedleMark(options), getNeedleTipMark(options), getPivotMark(options));
  } else {
    marks.push(getValueFillMark(options));
  }

  marks.push(getValueLabelMark(options), getMetricLabelMark(options));

  return marks;
};

/**
 * Gets the fixed neutral-token track arc mark. The track color is not user-configurable.
 * @param options
 * @returns ArcMark
 */
const getTrackArcMark = ({ name, colorScheme }: GaugeSpecOptions): ArcMark => ({
  type: 'arc',
  name: `${name}_track`,
  description: `${name}_track`,
  interactive: false,
  encode: {
    enter: {
      fill: { value: getS2ColorValue('gray-200', colorScheme) },
    },
    // geometry depends on the width/height-derived cx/cy/radius signals, which a live container
    // resize updates in place (VegaChart's resizeView) without recreating mark items - enter-only
    // properties would freeze at their initial value, so this must live in update
    update: {
      x: { signal: `${name}_cx` },
      y: { signal: `${name}_cy` },
      startAngle: { signal: `${name}_startAngle` },
      endAngle: { signal: `${name}_endAngle` },
      outerRadius: { signal: `${name}_radius` },
      innerRadius: { signal: `${name}_innerRadius` },
      cornerRadius: { signal: `(${name}_radius - ${name}_innerRadius) / 2` },
    },
  },
});

/**
 * Gets the value fill arc mark used in fill mode (showNeedle: false). Fills from the start
 * of the track to the aggregated value's angle.
 * @param options
 * @returns ArcMark
 */
const getValueFillMark = ({ name, color, colorScheme }: GaugeSpecOptions): ArcMark => ({
  type: 'arc',
  name: `${name}_fill`,
  description: `${name}_fill`,
  from: { data: name },
  interactive: false,
  encode: {
    enter: {
      fill: getColorProductionRule({ value: color }, colorScheme),
    },
    update: {
      x: { signal: `${name}_cx` },
      y: { signal: `${name}_cy` },
      outerRadius: { signal: `${name}_radius` },
      innerRadius: { signal: `${name}_innerRadius` },
      cornerRadius: { signal: `(${name}_radius - ${name}_innerRadius) / 2` },
      startAngle: { signal: `${name}_startAngle` },
      endAngle: { field: `${name}_valueAngle` },
    },
  },
});

/**
 * Gets the needle path mark. Points from the pivot toward the aggregated value's angle.
 * All dimensions are fractions of the actual rendered inner radius, not an input size prop.
 * @param options
 * @returns PathMark
 */
const getNeedleMark = ({ name, colorScheme }: GaugeSpecOptions): PathMark => {
  const cx = `${name}_cx`;
  const cy = `${name}_cy`;
  const baseHalfWidth = `${name}_needleBaseHalfWidth`;
  const tipHalfWidth = `${name}_needleTipHalfWidth`;
  const tipR = `(${name}_innerRadius - ${name}_needleTipGap)`;
  const angle = `datum.${name}_valueAngle`;

  const baseLeftX = `(${cx} - ${baseHalfWidth} * cos(${angle}))`;
  const baseLeftY = `(${cy} - ${baseHalfWidth} * sin(${angle}))`;
  const baseRightX = `(${cx} + ${baseHalfWidth} * cos(${angle}))`;
  const baseRightY = `(${cy} + ${baseHalfWidth} * sin(${angle}))`;
  const tipLeftX = `(${cx} + ${tipR} * sin(${angle}) - ${tipHalfWidth} * cos(${angle}))`;
  const tipLeftY = `(${cy} - ${tipR} * cos(${angle}) - ${tipHalfWidth} * sin(${angle}))`;
  const tipRightX = `(${cx} + ${tipR} * sin(${angle}) + ${tipHalfWidth} * cos(${angle}))`;
  const tipRightY = `(${cy} - ${tipR} * cos(${angle}) + ${tipHalfWidth} * sin(${angle}))`;

  const path = [
    `'M ' + ${baseLeftX} + ',' + ${baseLeftY}`,
    `+ ' L ' + ${tipLeftX} + ',' + ${tipLeftY}`,
    `+ ' L ' + ${tipRightX} + ',' + ${tipRightY}`,
    `+ ' L ' + ${baseRightX} + ',' + ${baseRightY}`,
    `+ ' Z'`,
  ].join(' ');

  return {
    type: 'path',
    name: `${name}_needle`,
    description: `${name}_needle`,
    from: { data: name },
    interactive: false,
    encode: {
      enter: { fill: { value: getS2ColorValue('gray-800', colorScheme) } },
      update: { path: { signal: path } },
    },
  };
};

/**
 * Gets the rounded needle tip mark. A separate circle guarantees a geometrically round cap.
 * @param options
 * @returns SymbolMark
 */
const getNeedleTipMark = ({ name, colorScheme }: GaugeSpecOptions): SymbolMark => {
  const angle = `datum.${name}_valueAngle`;
  const tipR = `(${name}_innerRadius - ${name}_needleTipGap)`;
  return {
    type: 'symbol',
    name: `${name}_needleTip`,
    description: `${name}_needleTip`,
    from: { data: name },
    interactive: false,
    encode: {
      enter: {
        shape: { value: 'circle' },
        fill: { value: getS2ColorValue('gray-800', colorScheme) },
      },
      update: {
        x: { signal: `${name}_cx + ${tipR} * sin(${angle})` },
        y: { signal: `${name}_cy - ${tipR} * cos(${angle})` },
        size: { signal: `pow(${name}_needleTipDiameter, 2)` },
      },
    },
  };
};

/**
 * Gets the pivot mark the needle rotates around.
 * @param options
 * @returns SymbolMark
 */
const getPivotMark = ({ name, colorScheme }: GaugeSpecOptions): SymbolMark => ({
  type: 'symbol',
  name: `${name}_pivot`,
  description: `${name}_pivot`,
  interactive: false,
  zindex: 1,
  encode: {
    enter: {
      shape: { value: 'circle' },
      stroke: { value: getS2ColorValue('gray-800', colorScheme) },
    },
    update: {
      x: { signal: `${name}_cx` },
      y: { signal: `${name}_cy` },
      size: { signal: `pow(${name}_pivotDiameter, 2)` },
      strokeWidth: { signal: `${name}_pivotStrokeWidth` },
      fill: { signal: BACKGROUND_COLOR },
    },
  },
});

/**
 * Gets the center text mark showing the aggregated, formatted metric value. Font size and
 * available width both derive from the actual rendered inner radius.
 * @param options
 * @returns TextMark
 */
const getValueLabelMark = ({ name, metric, showNeedle, numberFormat, colorScheme }: GaugeSpecOptions): TextMark => {
  const yMultiplier = showNeedle ? 0.4 : -0.1;
  const dy = `${name}_radius * ${Math.abs(yMultiplier)}`;
  return {
    type: 'text',
    name: `${name}_value`,
    description: `${name}_value`,
    from: { data: name },
    interactive: false,
    encode: {
      enter: {
        text: [...getTextNumberFormat(numberFormat, metric), { field: metric }],
        align: { value: 'center' },
        baseline: { value: 'middle' },
        fontWeight: { value: 800 },
        fill: { value: getS2ColorValue('gray-900', colorScheme) },
      },
      update: {
        x: { signal: `${name}_cx` },
        y: { signal: `${name}_cy + ${name}_radius * ${yMultiplier}` },
        fontSize: [
          { test: `${name}_innerRadius < ${GAUGE_LABEL_MIN_RADIUS}`, value: 0 },
          { signal: `${name}_valueFontSize` },
        ],
        limit: { signal: getTextLimit(name, dy) },
      },
    },
  };
};

/**
 * Gets the center text mark showing the gauge's label, always rendered even without data.
 * Font size and available width both derive from the actual rendered inner radius.
 * @param options
 * @returns TextMark
 */
const getMetricLabelMark = ({ name, label, showNeedle, colorScheme }: GaugeSpecOptions): TextMark => {
  const yMultiplier = showNeedle ? 0.65 : 0.2;
  const dy = `${name}_radius * ${yMultiplier}`;
  return {
    type: 'text',
    name: `${name}_label`,
    description: `${name}_label`,
    interactive: false,
    encode: {
      enter: {
        text: { value: label },
        align: { value: 'center' },
        baseline: { value: 'top' },
        fontWeight: { value: 700 },
        fill: { value: getS2ColorValue('gray-700', colorScheme) },
      },
      update: {
        x: { signal: `${name}_cx` },
        y: { signal: `${name}_cy + ${dy}` },
        fontSize: [
          { test: `${name}_innerRadius < ${GAUGE_LABEL_MIN_RADIUS}`, value: 0 },
          { signal: `${name}_metricFontSize` },
        ],
        limit: { signal: getTextLimit(name, dy) },
      },
    },
  };
};
