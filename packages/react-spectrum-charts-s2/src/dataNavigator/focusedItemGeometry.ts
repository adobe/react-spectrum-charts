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
import { View } from 'vega';

import { toCamelCase } from '@spectrum-charts/utils';
import { BarType, MarkBounds, Orientation, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

/** The subset of a navigable mark's fields needed to look up its x/y scales and datum fields. */
export interface FocusedItemFields {
  dimension?: string;
  metric?: string;
  scaleType?: string;
  /** Custom y scale name for dual-metric-axis charts; falls back to the default 'yLinear' scale. */
  metricAxis?: string;
  /** Bar-only: present when the focused mark is a Bar, selecting the band/linear axis pairing below instead of Line's continuous x-scale. */
  orientation?: Orientation;
  /** Bar-only: stacked bars render their end from the cumulative `${metric}1` field, not the raw metric. */
  type?: BarType;
}

export interface ClientPosition {
  clientX: number;
  clientY: number;
}

/** Small fixed hit-radius around a point, since a keyboard-focused datum has no rendered mark bounds to reuse. */
const FOCUSED_ITEM_RADIUS = 4;

/** Mirrors getOrientationProperties/getStackedMetricEncodings in barUtils.ts; dodged multi-series bars fall back to the group's shared band position since their per-series sub-offset isn't reachable via View.scale(). */
const getBarScaledPoint = (
  view: View,
  datum: SimpleData,
  dimension: string,
  metric: string,
  orientation: Orientation,
  metricAxis: string | undefined,
  type: BarType | undefined
): { x: number; y: number } => {
  const dimensionScale = view.scale(orientation === 'vertical' ? 'xBand' : 'yBand');
  const metricScale = view.scale(metricAxis || (orientation === 'vertical' ? 'yLinear' : 'xLinear'));
  const metricField = type === 'stacked' ? `${metric}1` : metric;
  const dimensionPos = dimensionScale(datum[dimension]) + dimensionScale.bandwidth() / 2;
  const metricPos = metricScale(datum[metricField]);
  return orientation === 'vertical' ? { x: dimensionPos, y: metricPos } : { x: metricPos, y: dimensionPos };
};

/** Scale names follow the convention in vega-spec-builder-s2/src/scale/scaleSpecBuilder.ts. */
const getScaledPoint = (
  view: View,
  datum: SimpleData,
  { dimension, metric, scaleType, metricAxis, orientation, type }: FocusedItemFields
): { x: number; y: number } | undefined => {
  if (!dimension || !metric) return undefined;
  try {
    if (orientation) return getBarScaledPoint(view, datum, dimension, metric, orientation, metricAxis, type);
    const xScale = view.scale(toCamelCase(`x ${scaleType ?? 'linear'}`));
    const yScale = view.scale(metricAxis || 'yLinear');
    return { x: xScale(datum[dimension]), y: yScale(datum[metric]) };
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Unable to resolve scale for focused item position', e);
    }
    return undefined;
  }
};

/** Chart-local (pre view.origin()) pixel bounds around a keyboard-focused datum, anchoring a popover the same way getItemBounds() does for a real click in markClickUtils.ts. */
export const getFocusedItemBounds = (view: View, datum: SimpleData, fields: FocusedItemFields): MarkBounds => {
  const point = getScaledPoint(view, datum, fields);
  if (!point) return { x1: 0, x2: 0, y1: 0, y2: 0 };
  return {
    x1: point.x - FOCUSED_ITEM_RADIUS,
    x2: point.x + FOCUSED_ITEM_RADIUS,
    y1: point.y - FOCUSED_ITEM_RADIUS,
    y2: point.y + FOCUSED_ITEM_RADIUS,
  };
};

/** Viewport-absolute position of a keyboard-focused datum, for synthesizing a vega-tooltip event. */
export const getFocusedItemClientPosition = (
  view: View,
  container: HTMLElement,
  datum: SimpleData,
  fields: FocusedItemFields
): ClientPosition => {
  const rect = container.getBoundingClientRect();
  const [originX, originY] = view.origin();
  const point = getScaledPoint(view, datum, fields) ?? { x: 0, y: 0 };
  return {
    clientX: rect.left + originX + point.x,
    clientY: rect.top + originY + point.y,
  };
};
