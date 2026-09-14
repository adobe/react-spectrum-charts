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
 * A scene item's `bounds` are relative to its owning group; walk up the `mark.group` chain to make
 * them view-relative — the same technique `focusedItemTooltip.ts` uses for bar/segment items. Read
 * from the scenegraph (Vega's own layout model) rather than the DOM, so this works identically under
 * both the `svg` and `canvas` renderers.
 */
const viewRelativeBounds = (item: SceneNode): Bounds | undefined => {
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

/**
 * The visible label "columns" for one axis: only labels Vega actually painted (`opacity > 0` — overlap-
 * hidden labels stay in the scenegraph at opacity 0), grouped by tick so a primary label and its
 * sublabel(s) at the same tick are ONE unit, using each item's real rendered bounds (which already
 * account for rotation/multiline). Grouped along the axis (by x for bottom/top, by y for left/right)
 * and returned in axis order, as absolute page coordinates (matching `container`'s own position).
 */
export const getVisibleAxisLabelColumns = (
  view: View,
  container: HTMLElement,
  orient: AxisOrient = 'bottom'
): AxisLabelColumn[] => {
  const horizontal = orient === 'bottom' || orient === 'top';
  const [originX, originY] = view.origin();
  const containerRect = container.getBoundingClientRect();
  const toPageBounds = (b: Bounds): Bounds => ({
    x1: containerRect.left + originX + b.x1,
    y1: containerRect.top + originY + b.y1,
    x2: containerRect.left + originX + b.x2,
    y2: containerRect.top + originY + b.y2,
  });

  const byTick = new Map<number, { value: string; primary: number; bounds: Bounds }>();
  for (const item of collectAxisLabelItems(view, orient)) {
    if ((item.opacity ?? 1) <= 0) continue;
    const localBounds = viewRelativeBounds(item);
    if (!localBounds) continue;
    const value = item.datum?.value != null ? String(item.datum.value) : '';
    const bounds = toPageBounds(localBounds);
    // Group ticks along the axis; union the rows perpendicular to it (primary + sublabel).
    const key = horizontal ? Math.round((bounds.x1 + bounds.x2) / 2) : Math.round((bounds.y1 + bounds.y2) / 2);
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
  const columns = [...byTick.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, col]) => ({ value: col.value, bounds: col.bounds }));
  return columns;
};

/**
 * Draw the focus ring around a box, padded evenly on all sides. A plain DOM overlay (unlike a Vega
 * mark) doesn't participate in autosize, so it can center over an edge label without being clamped
 * to the plot or label-union bounds.
 */
export const setAxisFocusRing = (element: HTMLElement | undefined, bounds: Bounds): void => {
  if (!element) return;

  const x1 = bounds.x1 - AXIS_FOCUS_RING_PAD;
  const x2 = bounds.x2 + AXIS_FOCUS_RING_PAD;
  const y1 = bounds.y1 - AXIS_FOCUS_RING_PAD;
  const y2 = bounds.y2 + AXIS_FOCUS_RING_PAD;

  if (x2 <= x1 || y2 <= y1) {
    clearAxisFocusRing(element);
    return;
  }

  element.style.display = 'block';
  const parentRect = element.offsetParent?.getBoundingClientRect();
  const left = parentRect ? parentRect.left : 0;
  const top = parentRect ? parentRect.top : 0;
  element.style.left = `${x1 - left}px`;
  element.style.top = `${y1 - top}px`;
  element.style.width = `${x2 - x1}px`;
  element.style.height = `${y2 - y1}px`;
};

export const clearAxisFocusRing = (element: HTMLElement | undefined): void => {
  if (!element) return;
  element.style.display = 'none';
};
