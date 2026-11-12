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
import { MARK_ID } from '@spectrum-charts/core-s2/constants';
import { getS2ColorValue } from '@spectrum-charts/core-s2/tokens';

import { translate } from './bounds.js';
import { SceneNode } from './scene.js';
import { Bounds } from './text.js';
import { ChartState, ColorScheme, Datum } from './types.js';

/** A navigable data point; positions and bounds are in plot coordinates until the chart offsets them. */
export interface NavigationPoint {
  id: string;
  datum: Datum;
  x: number;
  y: number;
  bounds: Bounds;
}

/** A navigable series and its points in drawing order. */
export interface NavigationSeries {
  id: string;
  markName: string;
  seriesId: string;
  datum: Datum;
  bounds: Bounds;
  points: NavigationPoint[];
}

/** Everything a keyboard navigator needs to build its structure and position focus targets. */
export interface NavigationItems {
  /** Plot bounds, the chart region's focus target. */
  chart: Bounds;
  series: NavigationSeries[];
}

const FOCUS_RING_OFFSET = 3;
const FOCUS_RING_WIDTH = 2;
const FOCUS_RING_RADIUS = 6;

/**
 * Offsets navigation items from plot to view coordinates.
 * @param items
 * @param dx
 * @param dy
 * @returns items in view coordinates
 */
export const offsetNavigationItems = (items: NavigationItems, dx: number, dy: number): NavigationItems => ({
  chart: translate(items.chart, dx, dy),
  series: items.series.map((series) => ({
    ...series,
    bounds: translate(series.bounds, dx, dy),
    points: series.points.map((point) => ({
      ...point,
      x: point.x + dx,
      y: point.y + dy,
      bounds: translate(point.bounds, dx, dy),
    })),
  })),
});

const ringRect = (bounds: Bounds, stroke: string, offset: number): SceneNode => ({
  type: 'rect',
  key: 'focusRing',
  role: 'focus',
  x: bounds.x1 - offset,
  y: bounds.y1 - offset,
  width: bounds.x2 - bounds.x1 + 2 * offset,
  height: bounds.y2 - bounds.y1 + 2 * offset,
  cornerRadius: FOCUS_RING_RADIUS,
  stroke,
  strokeWidth: FOCUS_RING_WIDTH,
});

/**
 * Builds the keyboard focus ring for the focused item, series, or chart region, in plot coordinates.
 * @param state
 * @param items
 * @param colorScheme
 * @returns focus ring nodes
 */
export const buildFocusRing = (
  state: ChartState,
  items: NavigationItems,
  colorScheme: ColorScheme = 'light'
): SceneNode[] => {
  const stroke = getS2ColorValue('blue-800', colorScheme);
  if (state.focusedItem) {
    const id = state.focusedItem[MARK_ID];
    const point = items.series.flatMap((series) => series.points).find((p) => p.datum[MARK_ID] === id);
    if (!point) return [];
    const diameter = point.bounds.x2 - point.bounds.x1 + 2 * FOCUS_RING_OFFSET;
    return [
      {
        type: 'symbol',
        key: 'focusRing',
        role: 'focus',
        x: point.x,
        y: point.y,
        size: diameter * diameter,
        shape: 'circle',
        stroke,
        strokeWidth: FOCUS_RING_WIDTH,
      },
    ];
  }
  if (state.focusedSeries !== undefined && state.focusedSeries !== null) {
    const series = items.series.find((s) => s.seriesId === state.focusedSeries);
    return series ? [ringRect(series.bounds, stroke, FOCUS_RING_OFFSET)] : [];
  }
  if (state.focusedRegion === 'chart') return [ringRect(items.chart, stroke, 0)];
  return [];
};
