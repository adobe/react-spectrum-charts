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
import { LineMark, NumericValueRef, ProductionRule, SymbolMark } from 'vega';

import {
  BACKGROUND_COLOR,
  FILTERED_TABLE,
  FOCUSED_DIMENSION,
  FOCUSED_ITEM,
  NAVIGATION_ID_SEPARATOR,
  NAVIGATION_INDEX_FIELD,
} from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { FOCUS_RING_STROKE_WIDTH } from '../marks/chartFocusRingUtils';
import { getFocusedGroupOrItemMatchExpr } from '../marks/focusMatchUtils';
import { getXProductionRule } from '../marks/markUtils';
import { LineSpecOptions } from '../types';
import { getLineYEncoding } from './lineMarkUtils';

export { getChartFocusRing } from '../marks/chartFocusRingUtils';

const LINE_FOCUS_RING_OUTER_STROKE_WIDTH = 12;
const LINE_FOCUS_RING_GAP_STROKE_WIDTH = 8;
const POINT_FOCUS_RING_SIZE = 500;

const getLineFocusRingStrokeWidth = (color: LineSpecOptions['color'], width: number): ProductionRule<NumericValueRef> => [
  { test: `${FOCUSED_DIMENSION} === datum.${color}`, value: width },
  { value: 0 },
];

/**
 * The outer, accent-colored layer of the two-layer halo drawn behind the real line path, visible
 * only while that line's division is focused. Wider than getLineFocusRingGap so a ring of accent
 * color remains visible around its edges once the gap layer is drawn on top of it.
 */
export const getLineFocusRingOuter = (options: LineSpecOptions, dataSource: string): LineMark => {
  const { color, colorScheme, dimension, interpolate, metric, name, scaleType } = options;
  return {
    name: `${name}_focusRingOuter`,
    type: 'line',
    from: { data: dataSource },
    interactive: false,
    aria: false,
    encode: {
      enter: {
        y: getLineYEncoding(options, metric),
        stroke: { value: getS2ColorValue('blue-800', colorScheme) },
        strokeCap: { value: 'round' },
        strokeJoin: { value: 'round' },
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
        ...(interpolate ? { interpolate: { value: interpolate } } : {}),
        strokeWidth: getLineFocusRingStrokeWidth(color, LINE_FOCUS_RING_OUTER_STROKE_WIDTH),
      },
    },
  };
};

/**
 * The inner background-colored gap layer, drawn on top of getLineFocusRingOuter (and behind the
 * real line, drawn last) so the accent ring reads as a halo with a clean gap, rather than the
 * accent color bleeding directly into the line's own color.
 */
export const getLineFocusRingGap = (options: LineSpecOptions, dataSource: string): LineMark => {
  const { color, dimension, interpolate, metric, name, scaleType } = options;
  return {
    name: `${name}_focusRingGap`,
    type: 'line',
    from: { data: dataSource },
    interactive: false,
    aria: false,
    encode: {
      enter: {
        y: getLineYEncoding(options, metric),
        stroke: { signal: BACKGROUND_COLOR },
        strokeCap: { value: 'round' },
        strokeJoin: { value: 'round' },
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
        ...(interpolate ? { interpolate: { value: interpolate } } : {}),
        strokeWidth: getLineFocusRingStrokeWidth(color, LINE_FOCUS_RING_GAP_STROKE_WIDTH),
      },
    },
  };
};

/**
 * Raises the focused line's entire facet group (halo + line) above every other line, regardless
 * of draw order. Stays raised while a point within the line is focused, not just the line itself.
 */
export const getLineGroupZIndexEncoding = (color: LineSpecOptions['color']): ProductionRule<NumericValueRef> => [
  { test: getFocusedGroupOrItemMatchExpr(`datum.${color}`), value: 1 },
  { value: 0 },
];

/** A ring drawn around the focused point, on top of (and independent from) the reused hover-highlight point. */
export const getPointFocusRing = (options: LineSpecOptions): SymbolMark => {
  const { color, colorScheme, dimension, metric, name, scaleType } = options;
  const focusedItemId =
    typeof color === 'string'
      ? `datum.${color} + "${NAVIGATION_ID_SEPARATOR}" + datum.${NAVIGATION_INDEX_FIELD}`
      : `'' + datum.${NAVIGATION_INDEX_FIELD}`;
  return {
    name: `${name}_pointFocusRing`,
    type: 'symbol',
    from: { data: FILTERED_TABLE },
    interactive: false,
    aria: false,
    encode: {
      enter: {
        size: { value: POINT_FOCUS_RING_SIZE },
        fill: { value: 'transparent' },
        strokeWidth: { value: FOCUS_RING_STROKE_WIDTH },
        stroke: { value: getS2ColorValue('blue-800', colorScheme) },
        y: getLineYEncoding(options, metric),
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
        opacity: [{ test: `${FOCUSED_ITEM} === ${focusedItemId}`, value: 1 }, { value: 0 }],
      },
    },
  };
};
