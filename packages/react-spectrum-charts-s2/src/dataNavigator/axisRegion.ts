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
import { NodeObject } from 'data-navigator';
import { View } from 'vega';

import {
  clearAxisFocusRing,
  getVisibleAxisLabelColumns,
  padAxisBounds,
  positionOverlayAtBounds,
  setAxisFocusRing,
} from './axisLabelGeometry.js';
import { stripRegionPrefix } from './composeRegions.js';
import { showAxisLabelTooltip } from './focusedItemTooltip.js';
import { CLEARED_FOCUS, NavigationRegion, applyFocusSignals, logFocusError } from './navigationRegion.js';

export interface AxisRegionContext {
  view: View | undefined;
  container: HTMLElement;
  /** Highlights the chart marks for a tick's value like hovering its label; `null` clears it */
  highlightDimension?: (node: NodeObject | null) => void;
}

/**
 * Creates the region for the bottom axis's labels. Its focus ring is a DOM overlay, unlike the canvas
 * rings of chart marks, so it can extend past the plot's clipped bounds for long labels.
 * @param options
 * @returns NavigationRegion
 */
export const createAxisRegion = ({ view, container, highlightDimension }: AxisRegionContext): NavigationRegion => {
  const focusRing = document.createElement('div');
  focusRing.className = 'dn-axis-focus-ring';
  focusRing.setAttribute('aria-hidden', 'true');
  container.appendChild(focusRing);

  /**
   * Draws the ring around the focused label's rendered bounds and sizes the node's overlay to match,
   * so a screen magnifier centers on the label. The axis root rings the whole label row.
   */
  const applyAxisFocus = (node: NodeObject, el: HTMLElement) => {
    if (!view || !highlightDimension) {
      clearAxisFocusRing(focusRing);
      return;
    }
    const columns = getVisibleAxisLabelColumns(view, container, 'bottom');
    if (!columns.length) {
      clearAxisFocusRing(focusRing);
      highlightDimension(null);
      return;
    }
    const union = columns.reduce(
      (acc, c) => ({
        x1: Math.min(acc.x1, c.bounds.x1),
        y1: Math.min(acc.y1, c.bounds.y1),
        x2: Math.max(acc.x2, c.bounds.x2),
        y2: Math.max(acc.y2, c.bounds.y2),
      }),
      columns[0].bounds
    );
    if (node.dimensionLevel === 1) {
      // Axis-level focus: ring around the whole axis; no single tick value to highlight.
      setAxisFocusRing(focusRing, union);
      const bounds = padAxisBounds(union);
      if (bounds) positionOverlayAtBounds(el, bounds);
      highlightDimension(null);
      return;
    }

    const value = stripRegionPrefix(node);
    const column = columns.find((c) => c.value === value);
    if (!column) {
      clearAxisFocusRing(focusRing);
      highlightDimension(null);
      return;
    }
    setAxisFocusRing(focusRing, column.bounds);
    const bounds = padAxisBounds(column.bounds);
    if (bounds) positionOverlayAtBounds(el, bounds);
    highlightDimension(node);
    // Show the label's tooltip on focus, matching mouse hover. React Spectrum's TooltipTrigger dismisses
    // it on Escape (via onOpenChange in RscChart) without moving focus — WCAG 2.2 SC 1.4.13.
    showAxisLabelTooltip(view, value);
  };

  return {
    focus: (node, el) => {
      applyAxisFocus(node, el);
      // Axis focus must not also show a chart mark's focus ring.
      applyFocusSignals(view, CLEARED_FOCUS)?.catch(logFocusError);
    },
    // Axis labels have no popover.
    handleKey: (_node, event) => event.code === 'Space',
    restore: (node) => {
      highlightDimension?.(node);
      // Axis ticks don't drive the chart tooltip (matching real axis-label hover).
      view?.runAfter((v) => v.runAsync());
    },
    clear: () => clearAxisFocusRing(focusRing),
    destroy: () => focusRing.remove(),
  };
};
