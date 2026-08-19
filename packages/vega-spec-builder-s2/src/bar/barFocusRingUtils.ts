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

import { RectEncodeEntry, RectMark } from 'vega';

import { FOCUSED_DIMENSION, FOCUSED_ITEM, FOCUSED_REGION, NAVIGATION_ID_SEPARATOR, STACK_ID } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { BarSpecOptions } from '../types';
import { getOrientationProperties, isDodgedAndStacked, rotateRectClockwiseIfNeeded } from './barUtils';

const FOCUS_RING_STROKE_WIDTH = 2;
const FOCUS_RING_ROUNDED_RADIUS = 6;
const FOCUS_RING_FLAT_RADIUS = 2;
const FOCUS_RING_OFFSET = 3;

/** Ring corners for a single bar or whole stack treated as one shape: rounded metric end, flat base. */
const getStaticFocusRingCorners = ({ hasSquareCorners, orientation }: BarSpecOptions): RectEncodeEntry => {
  const rounded = hasSquareCorners ? FOCUS_RING_FLAT_RADIUS : FOCUS_RING_ROUNDED_RADIUS;
  const flat = FOCUS_RING_FLAT_RADIUS;
  return orientation === 'vertical'
    ? {
        cornerRadiusTopLeft: { value: rounded },
        cornerRadiusTopRight: { value: rounded },
        cornerRadiusBottomRight: { value: flat },
        cornerRadiusBottomLeft: { value: flat },
      }
    : {
        cornerRadiusTopLeft: { value: flat },
        cornerRadiusTopRight: { value: rounded },
        cornerRadiusBottomRight: { value: rounded },
        cornerRadiusBottomLeft: { value: flat },
      };
};

/**
 * Handle square corners for the inner stacked bar segments.
 */
const getDynamicFocusRingCorners = (options: BarSpecOptions): RectEncodeEntry => {
  const { hasSquareCorners, metric, name, type } = options;
  const rounded = hasSquareCorners ? FOCUS_RING_FLAT_RADIUS : FOCUS_RING_ROUNDED_RADIUS;
  const flat = FOCUS_RING_FLAT_RADIUS;
  let topTest: string;
  let bottomTest: string;
  if (type === 'dodged' && !isDodgedAndStacked(options)) {
    topTest = `datum.datum.${metric} > 0`;
    bottomTest = `datum.datum.${metric} < 0`;
  } else {
    const stacks = `data('${name}_stacks')`;
    const stackIndex = `indexof(pluck(${stacks}, '${STACK_ID}'), datum.datum.${STACK_ID})`;
    topTest = `datum.datum.${metric}1 > 0 && ${stacks}[${stackIndex}].max_${metric}1 === datum.datum.${metric}1`;
    bottomTest = `datum.datum.${metric}1 < 0 && ${stacks}[${stackIndex}].min_${metric}1 === datum.datum.${metric}1`;
  }
  const rect: RectEncodeEntry = {
    cornerRadiusTopLeft: [{ test: topTest, value: rounded }, { value: flat }],
    cornerRadiusTopRight: [{ test: topTest, value: rounded }, { value: flat }],
    cornerRadiusBottomLeft: [{ test: bottomTest, value: rounded }, { value: flat }],
    cornerRadiusBottomRight: [{ test: bottomTest, value: rounded }, { value: flat }],
  };
  return rotateRectClockwiseIfNeeded(rect, options);
};

export const getBarFocusRing = (options: BarSpecOptions): RectMark => {
  const { color, colorScheme, dimension, name } = options;
  const focusedItemId =
    typeof color === 'string'
      ? `datum.datum.${dimension} + "${NAVIGATION_ID_SEPARATOR}" + datum.datum.${color}`
      : `datum.datum.${dimension}`;
  return {
    name: `${name}_focusRing`,
    type: 'rect',
    from: { data: name },
    interactive: false,
    encode: {
      enter: {
        fill: { value: 'transparent' },
        strokeWidth: { value: FOCUS_RING_STROKE_WIDTH },
        stroke: { value: getS2ColorValue('blue-800', colorScheme) },
        // Mirror the segment's own corners so stacked middle segments stay square.
        ...getDynamicFocusRingCorners(options),
      },
      update: {
        x: { signal: `datum.bounds.x1 - ${FOCUS_RING_OFFSET}` },
        x2: { signal: `datum.bounds.x2 + ${FOCUS_RING_OFFSET}` },
        y: { signal: `datum.bounds.y1 - ${FOCUS_RING_OFFSET}` },
        y2: { signal: `datum.bounds.y2 + ${FOCUS_RING_OFFSET}` },
        opacity: [{ test: `${FOCUSED_ITEM} === ${focusedItemId}`, value: 1 }, { value: 0 }],
      },
    },
  };
};

export const getChartFocusRing = (options: BarSpecOptions): RectMark => {
  const { colorScheme } = options;
  return {
    name: 'chartFocusRing',
    type: 'rect',
    interactive: false,
    encode: {
      enter: {
        fill: { value: 'transparent' },
        strokeWidth: { value: FOCUS_RING_STROKE_WIDTH },
        stroke: { value: getS2ColorValue('blue-800', colorScheme) },
        cornerRadius: { value: FOCUS_RING_ROUNDED_RADIUS },
      },
      update: {
        x: { value: 0 },
        x2: { signal: 'width' },
        y: { value: 0 },
        y2: { signal: 'height' },
        opacity: [{ test: `${FOCUSED_REGION} === 'chart'`, value: 1 }, { value: 0 }],
      },
    },
  };
};

/**
 * Focus ring around a whole stack (column) when that stack is focused. Sourced from the per-column
 */
export const getStackFocusRing = (options: BarSpecOptions): RectMark => {
  const { colorScheme, dimension, metric, name, orientation } = options;
  const { dimensionScaleKey, metricScaleKey } = getOrientationProperties(orientation);
  const dimStart = `scale('${dimensionScaleKey}', datum.${dimension}) - ${FOCUS_RING_OFFSET}`;
  const dimEnd = `scale('${dimensionScaleKey}', datum.${dimension}) + bandwidth('${dimensionScaleKey}') + ${FOCUS_RING_OFFSET}`;
  const stackTop = `scale('${metricScaleKey}', datum.max_${metric}1)`;
  const baseline = `scale('${metricScaleKey}', 0)`;
  const update: RectEncodeEntry =
    orientation === 'vertical'
      ? 
        {
          x: { signal: dimStart },
          x2: { signal: dimEnd },
          y: { signal: `${stackTop} - ${FOCUS_RING_OFFSET}` },
          y2: { signal: `${baseline} + ${FOCUS_RING_OFFSET}` },
        }
      : 
        {
          y: { signal: dimStart },
          y2: { signal: dimEnd },
          x: { signal: `${baseline} - ${FOCUS_RING_OFFSET}` },
          x2: { signal: `${stackTop} + ${FOCUS_RING_OFFSET}` },
        };
  return {
    name: `${name}_stackFocusRing`,
    type: 'rect',
    from: { data: `${name}_stacks` },
    interactive: false,
    encode: {
      enter: {
        fill: { value: 'transparent' },
        strokeWidth: { value: FOCUS_RING_STROKE_WIDTH },
        stroke: { value: getS2ColorValue('blue-800', colorScheme) },
        ...getStaticFocusRingCorners(options),
      },
      update: {
        ...update,
        opacity: [{ test: `${FOCUSED_DIMENSION} === datum.${dimension}`, value: 1 }, { value: 0 }],
      },
    },
  };
};
