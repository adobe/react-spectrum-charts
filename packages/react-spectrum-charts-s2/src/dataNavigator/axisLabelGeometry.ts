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

import { AXIS_FOCUS_RING } from '@spectrum-charts/vega-spec-builder-s2';

/** Padding around the label content, on all sides of the focus ring. */
const AXIS_FOCUS_RING_PAD = 6;

interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** One navigable axis label column: the tick value + the union box of its primary label and sublabel(s). */
export interface AxisLabelColumn {
  value: string;
  bounds: Bounds;
}

/** Which axis to navigate. */
export type AxisOrient = 'bottom' | 'top' | 'left' | 'right';

/* Vega scenegraph nodes are loosely typed; narrow the few fields we read. */
type SceneNode = {
  marktype?: string;
  role?: string;
  items?: SceneNode[];
  bounds?: Bounds;
  opacity?: number;
  x?: number;
  y?: number;
  orient?: string;
  datum?: { value?: unknown };
  mark?: { role?: string; group?: SceneNode };
};

/** Absolute bounds of a rendered item = its group-relative bounds plus every ancestor group's offset. */
const absoluteBounds = (item: SceneNode): Bounds | undefined => {
  const b = item.bounds;
  if (!b) return undefined;
  let dx = 0;
  let dy = 0;
  let group = item.mark?.group;
  while (group) {
    dx += group.x ?? 0;
    dy += group.y ?? 0;
    group = group.mark?.group;
  }
  return { x1: b.x1 + dx, y1: b.y1 + dy, x2: b.x2 + dx, y2: b.y2 + dy };
};

const union = (a: Bounds, b: Bounds): Bounds => ({
  x1: Math.min(a.x1, b.x1),
  y1: Math.min(a.y1, b.y1),
  x2: Math.max(a.x2, b.x2),
  y2: Math.max(a.y2, b.y2),
});

/** Collect every rendered `axis-label` text item belonging to the axis with the given orient. */
const collectAxisLabelItems = (view: View, orient: AxisOrient): SceneNode[] => {
  const out: SceneNode[] = [];
  const walk = (node: SceneNode): void => {
    if (!node || typeof node !== 'object') return;
    if (
      node.marktype === 'text' &&
      node.role === 'axis-label' &&
      Array.isArray(node.items) &&
      node.items[0]?.mark?.group?.orient === orient
    ) {
      out.push(...node.items);
    }
    if (Array.isArray(node.items)) node.items.forEach(walk);
  };
  walk((view as unknown as { scenegraph: () => { root: SceneNode } }).scenegraph().root);
  return out;
};

/**
 * The visible label "columns" for one axis: only labels Vega actually painted (`opacity > 0` — overlap-
 * hidden labels stay in the scenegraph at opacity 0), grouped by tick so a primary label and its
 * sublabel(s) at the same tick are ONE unit, using each item's real rendered bounds (which already
 * account for rotation/multiline). Grouped along the axis (by x for bottom/top, by y for left/right)
 * and returned in axis order.
 */
export const getVisibleAxisLabelColumns = (view: View, orient: AxisOrient = 'bottom'): AxisLabelColumn[] => {
  const horizontal = orient === 'bottom' || orient === 'top';
  const byTick = new Map<number, { value: string; primary: number; bounds: Bounds }>();
  for (const item of collectAxisLabelItems(view, orient)) {
    if ((item.opacity ?? 1) <= 0) continue;
    const bounds = absoluteBounds(item);
    if (!bounds) continue;
    // Group ticks along the axis; union the rows perpendicular to it (primary + sublabel).
    const key = horizontal ? Math.round((bounds.x1 + bounds.x2) / 2) : Math.round((bounds.y1 + bounds.y2) / 2);
    const value = item.datum?.value != null ? String(item.datum.value) : '';
    const existing = byTick.get(key);
    if (!existing) {
      byTick.set(key, { value, primary: horizontal ? bounds.y1 : bounds.x1, bounds });
      continue;
    }
    existing.bounds = union(existing.bounds, bounds);
    // Keep the primary row's value (topmost for a bottom axis; outermost for a side axis).
    const rowStart = horizontal ? bounds.y1 : bounds.x1;
    if (rowStart < existing.primary) {
      existing.primary = rowStart;
      existing.value = value;
    }
  }
  return [...byTick.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, col]) => ({ value: col.value, bounds: col.bounds }));
};

/**
 * Draw the focus ring around a box (+ padding). The ring is a top-level mark included in autosize's
 * fit, so it must not extend past the existing content bounds or the chart re-fits/resizes. Labels
 * legitimately overflow the inner data rect (Vega already sized the chart to include them), so the
 * horizontal clamp is the LABEL extent (`clampMinX`..`clampMaxX` = the union of all labels = the real
 * content edge), not the data rect — that wraps the full label without growing bounds. Vertical padding
 * sits within the plot (above) and axis title (below), so it's safe.
 */
export const setAxisFocusRing = (
  view: View | undefined,
  bounds: Bounds,
  clampMinX: number,
  clampMaxX: number
): void => {
  if (!view) return;
  const x1 = Math.max(clampMinX, bounds.x1 - AXIS_FOCUS_RING_PAD);
  const x2 = Math.min(clampMaxX, bounds.x2 + AXIS_FOCUS_RING_PAD);
  view.signal(AXIS_FOCUS_RING, {
    x: x1,
    y: bounds.y1 - AXIS_FOCUS_RING_PAD,
    width: Math.max(0, x2 - x1),
    height: bounds.y2 - bounds.y1 + 2 * AXIS_FOCUS_RING_PAD,
  });
  view.runAsync();
};

export const clearAxisFocusRing = (view: View | undefined): void => {
  if (!view) return;
  view.signal(AXIS_FOCUS_RING, null);
  view.runAsync();
};
