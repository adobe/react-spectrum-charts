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

import { FOCUSED_DIMENSION, FOCUSED_ITEM, FOCUSED_REGION } from '@spectrum-charts/core-s2/constants';
import { Datum, MarkBounds } from '@spectrum-charts/vega-spec-builder-s2';

import { Row } from './barHoverParity.js';

/** A mutable reference shared with the chart, like a React ref. */
export interface Ref<T> {
  current: T;
}

/** What activating a node does; can change without rebuilding the navigation. */
export interface NavigationActions {
  /** Same context refs `handleMarkClick` uses — Space opens a focused bar/segment's popover through the exact same trigger. */
  selectedData?: Ref<Datum | null>;
  selectedDataBounds?: Ref<MarkBounds | undefined>;
  selectedDataName?: Ref<string | undefined>;
  /** Lets the popover's own close handler know it doesn't need to clear hover-parity signals — keyboard focus still owns them. */
  keyboardPopoverComponentName?: Ref<string | null>;
  /** Fires the focused mark's `onClick` (if it declares one) on Enter/Space, mirroring a real click, which runs onClick alongside opening any popover. */
  onNodeClick?: (datum: Datum) => void;
  /** Whether the mark has a ChartPopover — a click that focuses a node also opens it, so focus must be retained through the popover. */
  hasChartPopover?: boolean;
}

/**
 * Whether a key press is the keyboard right-click: Shift+F10 or the ContextMenu key.
 * @param event
 * @returns boolean
 */
export const isContextMenuKey = (event: KeyboardEvent): boolean =>
  event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');

/**
 * A synthetic right-click at the center of an item's viewport bounds, so `onContextMenu` can place a menu next to it.
 * @param bounds
 * @returns MouseEvent
 */
export const contextMenuEventAt = (bounds: Bounds | undefined): MouseEvent =>
  new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: bounds ? (bounds.x1 + bounds.x2) / 2 : 0,
    clientY: bounds ? (bounds.y1 + bounds.y2) / 2 : 0,
  });

export interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** A clicked Vega scene item; overlay marks (e.g. a voronoi cell) wrap the real datum one level deeper. */
export interface ClickedItem {
  datum?: Row & { datum?: Row };
  mark?: { role?: string; name?: string };
  items?: ClickedItem[];
}

/** What a session shares with its regions. */
export interface RegionContext {
  view: View | undefined;
  container: HTMLElement;
  chartId: string;
  getActions: () => NavigationActions;
  /** Keeps the focused node through the focusout a popover opening causes */
  keepFocusThroughPopover: () => void;
}

/** One navigable part of a chart (its content, an axis, a legend) and how its nodes behave when focused. */
export interface NavigationRegion {
  /** Page bounds the focused node's overlay is sized to; `undefined` covers the whole chart */
  getBounds?: (node: NodeObject) => Bounds | undefined;
  /** Shows the node's focus look */
  focus: (node: NodeObject, el: HTMLElement) => void;
  /** Handles a key on a focused node; returns true when handled */
  handleKey?: (node: NodeObject, event: KeyboardEvent) => boolean;
  /** The node for a clicked scene item, if it belongs to this region */
  findNode?: (item: ClickedItem) => string | undefined;
  /** The popover a click on the node opens, so focus is kept through it */
  getClickPopover?: (node: NodeObject) => string | undefined;
  /** The name read once when focus is restored onto the node after a rebuild, given the node focused before it */
  getRestoredLabel?: (node: NodeObject, previous: NodeObject) => string | undefined;
  /** Signals the mouse clears that also carry a focused node's look */
  restoreSignals?: string[];
  /** Reapplies a focused node's look after the mouse cleared it */
  restore?: (node: NodeObject) => void;
  /** Removes this region's focus look */
  clear: () => void;
  /** Removes anything the region added to the container */
  destroy?: () => void;
}

export interface FocusSignals {
  item: string | null; // a single bar / stacked segment
  region: string | null; // the whole chart (entry/root)
  dimension: string | null; // a dimension group, e.g. a whole stack
}

export const CLEARED_FOCUS: FocusSignals = { item: null, region: null, dimension: null };

export const logFocusError = (error: unknown): void => {
  console.error('Failed to update accessible navigation focus:', error);
};

/**
 * Sets the chart's focus signals and runs the view.
 * @param view
 * @param signals
 * @returns the view's run, or undefined when the view has no focus signals
 */
export const applyFocusSignals = (
  view: View | undefined,
  { item, region, dimension }: FocusSignals
): Promise<unknown> | undefined => {
  if (!view) return undefined;
  try {
    view.signal(FOCUSED_ITEM, item);
    view.signal(FOCUSED_REGION, region);
    view.signal(FOCUSED_DIMENSION, dimension);
    return view.runAsync();
  } catch {
    // FOCUSED_* only exist with accessibleNavigation and can be absent on a rebuilding/finalized view.
    return undefined;
  }
};
