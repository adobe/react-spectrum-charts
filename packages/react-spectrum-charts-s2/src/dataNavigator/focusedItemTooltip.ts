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

import { DIMENSION_HOVER_AREA, MARK_ID } from '@spectrum-charts/constants';

import { Row } from './barHoverParity';

interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/*
 * Vega scenegraph nodes are loosely typed; narrow the few fields read here. A plain signal's
 * `data(name)` reference isn't reliably re-evaluated on data changes (unlike a mark's own encode),
 * so the focused item is read directly off the rendered scenegraph instead of a derived signal.
 */
interface SceneNode {
  marktype?: string;
  name?: string;
  items?: SceneNode[];
  bounds?: Bounds;
  opacity?: number;
  x?: number;
  y?: number;
  mark?: { group?: SceneNode };
  datum?: Row;
}

/** Every rendered instance of a named mark, wherever it's nested in the scenegraph. */
const findSceneItems = (view: View, marktype: string, name: string): SceneNode[] => {
  const results: SceneNode[] = [];
  const walk = (node: SceneNode | undefined): void => {
    if (!node || typeof node !== 'object') return;
    if (node.marktype === marktype && node.name === name && Array.isArray(node.items)) {
      results.push(...node.items);
      return;
    }
    node.items?.forEach(walk);
  };
  walk((view as unknown as { scenegraph: () => { root: SceneNode } }).scenegraph().root);
  return results;
};

/*
 * vega-tooltip's registered callback (set via `view.tooltip((handler, event, item, value) => ...)`
 * in useNewChartView.tsx). Calling it ourselves reuses ChartInspect's real DOM element, styling,
 * and positioning instead of a parallel tooltip implementation.
 */
type TooltipCallback = (handler: unknown, event: unknown, item: unknown, value: unknown) => void;

/** `view.tooltip()` with no args is an untyped getter for the callback above (vega-view: `if (!arguments.length) return this._tooltip`). */
const getRegisteredTooltipCallback = (view: View): TooltipCallback | undefined =>
  (view.tooltip as unknown as () => TooltipCallback | undefined)();

/** Finds the currently-visible (`opacity > 0`) rendered instance of a named rect mark, if any. */
export const findVisibleRingItem = (view: View, ringMarkName: string): SceneNode | undefined =>
  findSceneItems(view, 'rect', ringMarkName).find((item) => (item.opacity ?? 0) > 0);

/** Finds the real rendered bar/segment rect (not its focus ring) by `MARK_ID`, so a Space-triggered popover can anchor to the actual mark's bounds, as a real click does. */
export const findFocusedBarSceneItem = (view: View, markName: string, markId: unknown): SceneNode | undefined =>
  findSceneItems(view, 'rect', markName).find((item) => item.datum?.[MARK_ID] === markId);

/** Same as `findFocusedBarSceneItem`, but for the `${markName}_dimensionHoverArea` mark (a whole stack), matched by dimension value since its rows have no `MARK_ID`. */
export const findFocusedDimensionAreaSceneItem = (
  view: View,
  markName: string,
  dimension: string,
  dimensionValue: unknown
): SceneNode | undefined =>
  findSceneItems(view, 'rect', `${markName}_${DIMENSION_HOVER_AREA}`).find((item) => item.datum?.[dimension] === dimensionValue);

/** Bounds are group-relative; walk up the mark's owning groups to make them view-relative. */
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

export const hideFocusedItemTooltip = (view: View | undefined): void => {
  const tooltipCallback = view && getRegisteredTooltipCallback(view);
  tooltipCallback?.(undefined, undefined, undefined, null);
};

/**
 * Triggers the real ChartInspect tooltip by calling the same callback Vega calls on mouseover, so
 * keyboard focus gets identical content and positioning. `value` must match the mark's own
 * `tooltip` encoding shape (see `dataNavigatorAdapter.ts`); `null` hides it. `ringMarkName` is
 * whichever ring is visible for the node, used to read its bounds for positioning — call only
 * after `view.runAsync()` resolves so those bounds reflect the new focus.
 */
export const showFocusedItemTooltip = (container: HTMLElement, view: View, ringMarkName: string, value: unknown): void => {
  const tooltipCallback = getRegisteredTooltipCallback(view);
  if (!tooltipCallback) return;

  if (value == null) {
    tooltipCallback(undefined, undefined, undefined, null);
    return;
  }

  const ringItem = findVisibleRingItem(view, ringMarkName);
  const bounds = ringItem ? absoluteBounds(ringItem) : undefined;
  if (!ringItem || !bounds) {
    tooltipCallback(undefined, undefined, undefined, null);
    return;
  }

  const [originX, originY] = view.origin();
  const containerRect = container.getBoundingClientRect();
  // Duck-typed stand-in for Vega's private interaction handler — vega-tooltip's mark-relative
  // positioning (calculatePositionRelativeToMark) only reads these two fields off it.
  const fakeHandler = { _el: container, _origin: [originX, originY] };
  const syntheticEvent = {
    type: 'focus',
    clientX: containerRect.left + originX + (bounds.x1 + bounds.x2) / 2,
    clientY: containerRect.top + originY + bounds.y1,
  };

  tooltipCallback(fakeHandler, syntheticEvent, ringItem, value);
};
