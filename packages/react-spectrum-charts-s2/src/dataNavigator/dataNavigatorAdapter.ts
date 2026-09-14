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

import { RefObject } from 'react';

import dataNavigator, { NodeObject } from 'data-navigator';
import { SignalListenerHandler, View } from 'vega';

import {
  COMPONENT_NAME,
  DIMENSION_HOVER_AREA,
  FOCUSED_DIMENSION,
  FOCUSED_ITEM,
  FOCUSED_REGION,
  HOVERED_ITEM,
  MARK_ID,
} from '@spectrum-charts/constants';
import { Datum, MarkBounds, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { ActionItem, getItemBounds, triggerPopover } from '../utils/markClickUtils';
import { clearAxisFocusRing, getVisibleAxisLabelColumns, setAxisFocusRing } from './axisLabelGeometry';
import { applyHoverParitySignals, findFocusedRow, findFocusedStackRow, Row } from './barHoverParity';
import { AxisRegionOptions, NavigableChartType, buildChartStructure } from './buildChartStructure';
import { getNodeRegion, stripRegionPrefix } from './composeRegions';
import {
  findFocusedBarSceneItem,
  findFocusedDimensionAreaSceneItem,
  hideFocusedItemTooltip,
  showFocusedItemTooltip,
} from './focusedItemTooltip';
import './dataNavigator.css';

/*
 * data-navigator's `rendering()` and `input()` factories are typed as `() => any`.
 */
interface DataNavigatorRenderer {
  initialize: () => void;
  render: (node: { renderId: string; datum: NodeObject }) => HTMLElement | undefined;
  remove: (renderId: string) => void;
  wrapper?: HTMLElement;
  exitElement?: HTMLElement;
  entryButton?: HTMLElement;
}

interface DataNavigatorInput {
  enter: () => NodeObject | undefined;
  move: (current: string | null, direction: string) => NodeObject | undefined;
  keydownValidator: (event: KeyboardEvent) => string | undefined;
  focus: (renderId: string) => void;
}

export interface AttachDataNavigatorOptions {
  /** Positioned element the navigation overlay is rendered into. */
  container: HTMLElement;
  /** The chart type to build navigation for. */
  chartType: NavigableChartType;
  /** Chart data (plain objects). */
  data: SimpleData[];
  /** Primary categorical / x-axis field. */
  dimension?: string;
  /** Series / color field (set for stacked bars). */
  color?: string;
  /** Primary metric / y-axis field. */
  metric?: string;
  /** The mark's own name (e.g. `bar0`) — drives its real hover signals for mouse-hover parity. */
  markName?: string;
  /** Optional chart title for the accessible description. */
  title?: string;
  /** When provided, adds a sibling-navigable x-axis region alongside chart content (Left/Right moves between them). */
  xAxis?: AxisRegionOptions;
  /** Stable id used to namespace the rendered nav elements. */
  chartId: string;
  /** Accessor for the live Vega view; focus signals are set on it as the user navigates. */
  getView: () => View | undefined;
  /** Same context refs `handleMarkClick` uses — Space opens a focused bar/segment's popover through the exact same trigger. */
  selectedData?: RefObject<Datum | null>;
  selectedDataBounds?: RefObject<MarkBounds>;
  selectedDataName?: RefObject<string>;
  /** Lets the popover's own close handler know it doesn't need to clear hover-parity signals — keyboard focus still owns them. */
  keyboardPopoverComponentName?: RefObject<string | null>;
}

interface FocusSignals {
  item: string | null; // a single bar / stacked segment
  region: string | null; // the whole chart (entry/root)
  dimension: string | null; // a dimension group, e.g. a whole stack
}

const CLEARED_FOCUS: FocusSignals = { item: null, region: null, dimension: null };

/**
 * Maps the focused node to the chart's focus signals:
 *  - x-axis region             → drives its own DOM ring + dimension-hover parity; must not also
 *    activate the bar/stack focus ring
 *  - leaf (no dimensionLevel)   → a single bar/segment (`item` = node id)
 *  - dimension root (level 1)   → the chart overview (`region` = 'chart')
 *  - division (level 2)         → a dimension group / stack (`dimension` = the column value)
 */
const nodeFocusSignals = (node: NodeObject): FocusSignals => {
  if (getNodeRegion(node) === 'xAxis') {
    return CLEARED_FOCUS;
  }
  if (node.dimensionLevel == null) {
    return { ...CLEARED_FOCUS, item: node.id };
  }
  if (node.dimensionLevel === 1) {
    return { ...CLEARED_FOCUS, region: 'chart' };
  }
  const dimensionValue = node.derivedNode ? node.data?.[node.derivedNode] : undefined;
  const dimension = dimensionValue == null ? null : String(dimensionValue);
  return { ...CLEARED_FOCUS, dimension };
};

const applyFocusSignals = (view: View | undefined, { item, region, dimension }: FocusSignals): Promise<unknown> | undefined => {
  if (!view) return undefined;

  view.signal(FOCUSED_ITEM, item);
  view.signal(FOCUSED_REGION, region);
  view.signal(FOCUSED_DIMENSION, dimension);
  return view.runAsync();
};

/** Shows the tooltip matching a focused node (leaf, stack, or none) — shared by the `focus` handler and the mouse-hover guard below. */
const showTooltipForFocusedNode = (
  container: HTMLElement,
  view: View,
  node: NodeObject,
  markName: string,
  dimension: string,
  color: string | undefined
): void => {
  const signals = nodeFocusSignals(node);
  if (signals.item != null) {
    // Leaf: same value shape its own tooltip encoding produces.
    const row = findFocusedRow(view, node, dimension, color);
    const value = row ? { ...row, [COMPONENT_NAME]: markName } : null;
    showFocusedItemTooltip(container, view, `${markName}_focusRing`, value);
  } else if (signals.dimension != null) {
    // Division (whole stack): empty unless a dimensionArea-targeted ChartInspect exists, matching real hover.
    const stackRow = findFocusedStackRow(view, node, dimension, markName);
    const value = stackRow ? { ...stackRow, [COMPONENT_NAME]: `${markName}_${DIMENSION_HOVER_AREA}`, dimension } : null;
    showFocusedItemTooltip(container, view, `${markName}_stackFocusRing`, value);
  } else {
    showFocusedItemTooltip(container, view, `${markName}_focusRing`, null);
  }
};

/** One guard handler per view (re-registering on every attach would leak stale closures/duplicate listeners). */
const hoverGuardHandlers = new WeakMap<View, SignalListenerHandler>();

/**
 * Real mouse mouseout unconditionally nulls the shared `${markName}_hoveredItem` signals (see
 * `addHoveredItemSignal`), clobbering whatever the keyboard-focused item set. Reapplies that
 * item's value (and its tooltip) whenever this happens while a node is still keyboard-focused.
 */
const guardHoverParityAgainstMouseClear = (
  container: HTMLElement,
  view: View,
  markName: string,
  dimension: string,
  color: string | undefined,
  getFocusedNode: () => NodeObject | undefined
): void => {
  const itemSignal = `${markName}_${HOVERED_ITEM}`;
  const dimensionSignal = `${markName}_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`;
  const previous = hoverGuardHandlers.get(view);
  if (previous) {
    view.removeSignalListener(itemSignal, previous);
    view.removeSignalListener(dimensionSignal, previous);
  }
  const handler: SignalListenerHandler = (_name, value) => {
    if (value != null) return;
    const node = getFocusedNode();
    // The chart root and axis root have no specific row to restore — nothing to guard.
    if (!node || node.dimensionLevel === 1) return;
    const isAxisNode = getNodeRegion(node) === 'xAxis';
    applyHoverParitySignals(view, { markName, dimension, color }, node, isAxisNode);
    // Axis ticks don't drive the chart tooltip (matching real axis-label hover), only the bar/stack does.
    if (isAxisNode) {
      view.runAfter((v) => v.runAsync());
      return;
    }
    view.runAfter((v) => {
      v.runAsync().then(() => showTooltipForFocusedNode(container, v, node, markName, dimension, color));
    });
  };
  view.addSignalListener(itemSignal, handler);
  view.addSignalListener(dimensionSignal, handler);
  hoverGuardHandlers.set(view, handler);
};

/**
 * Builds the navigation structure and drives data-navigator's rendering +
 * input modules. The visible focus indicator is drawn on the Vega canvas (focus-ring marks); the
 * elements created here are invisible overlays used only for keyboard focus and assistive tech.
 */
export const attachDataNavigator = ({
  container,
  chartType,
  data,
  dimension,
  color,
  metric,
  markName,
  title,
  xAxis,
  chartId,
  getView,
  selectedData,
  selectedDataBounds,
  selectedDataName,
  keyboardPopoverComponentName,
}: AttachDataNavigatorOptions): void => {
  // Restrict x-axis navigation to labels Vega actually painted, so overlap-hidden ticks are skipped
  // (their focus ring wouldn't render). Read from the live, laid-out scenegraph.
  const initialView = getView();
  const xAxisRegion =
    xAxis && initialView
      ? { ...xAxis, visibleValues: getVisibleAxisLabelColumns(initialView, 'bottom').map((column) => column.value) }
      : xAxis;

  const built = buildChartStructure({ chartType, data, dimension, color, metric, title, xAxis: xAxisRegion });
  if (!built) return;
  const { structure, entryPoint } = built;

  if (!container.id) {
    container.id = `dn-root-${chartId}`;
  }

  container.querySelectorAll('.dn-wrapper, .dn-exit-position, .dn-exit').forEach((node) => node.remove());
  container.querySelectorAll('.dn-axis-focus-ring').forEach((node) => node.remove());

  let current: string | null = null;
  // Set when Space opens a popover: moving focus into it fires a focusout that looks identical to
  // leaving the widget. Consumed by the next focusout so the node survives for focus-restore on close.
  let suppressNextLeave = false;
  const width = container.clientWidth || 400;
  const height = container.clientHeight || 300;

  const view = getView();
  if (view && markName && dimension) {
    guardHoverParityAgainstMouseClear(container, view, markName, dimension, color, () => (current ? structure.nodes[current] : undefined));
  }

  const rendering: DataNavigatorRenderer = dataNavigator.rendering({
    elementData: structure.nodes,
    defaults: {
      cssClass: 'dn-node',
      spatialProperties: { x: 0, y: 0, width, height },
    },
    suffixId: chartId,
    root: {
      id: container.id,
      description: 'Accessible chart navigation',
      width: '100%',
      // A falsy height here is a no-op in the library's own `root.height && (...)` check, so this
      // must stay a truthy value or .dn-wrapper (and every .dn-node under it) collapses to 0px tall.
      height: '100%',
    },
    entryButton: { include: true, callbacks: { click: enter } },
    exitElement: { include: true },
  });

  rendering.initialize();

  // Invisible DOM overlay for the axis focus ring, so it can extend past the plot's clipped bounds
  // for overflowing/long axis labels — unlike the bar/stack ring, which is drawn on the Vega canvas.
  const focusRing = document.createElement('div');
  focusRing.className = 'dn-axis-focus-ring';
  focusRing.setAttribute('aria-hidden', 'true');
  container.appendChild(focusRing);

  const input: DataNavigatorInput = dataNavigator.input({
    structure,
    navigationRules: structure.navigationRules ?? {},
    entryPoint,
    exitPoint: rendering.exitElement?.id,
  });

  function enter() {
    const node = input.enter();
    if (node) {
      navigate(node);
    }
  }

  /**
   * Draws the axis focus ring around the focused x-axis label's real rendered bounds, and drives
   * dimension-only hover parity so the corresponding bar highlights like real axis-label hover does.
   * The whole-axis root node rings the full label row with no single dimension value to highlight.
   */
  function applyAxisFocus(node: NodeObject) {
    const view = getView();
    if (!view || !markName || !dimension) {
      clearAxisFocusRing(focusRing);
      return;
    }
    const columns = getVisibleAxisLabelColumns(view, 'bottom');
    if (!columns.length) {
      clearAxisFocusRing(focusRing);
      applyHoverParitySignals(view, { markName, dimension, color }, null, true);
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
      applyHoverParitySignals(view, { markName, dimension, color }, null, true);
      return;
    }

    const value = stripRegionPrefix(node);
    const column = columns.find((c) => c.value === value);
    if (!column) {
      clearAxisFocusRing(focusRing);
      applyHoverParitySignals(view, { markName, dimension, color }, null, true);
      return;
    }
    setAxisFocusRing(focusRing, column.bounds);
    applyHoverParitySignals(view, { markName, dimension, color }, node, true);
  }

  /** Sets the shared context refs and triggers the popover through the same DOM-button-click a real click uses. */
  function triggerBarPopover(row: Row, sceneItem: unknown) {
    if (!markName || !selectedData || !selectedDataBounds || !selectedDataName) return;
    selectedData.current = { ...row, [COMPONENT_NAME]: markName } as unknown as Datum;
    selectedDataBounds.current = getItemBounds(sceneItem as ActionItem);
    selectedDataName.current = markName;
    if (triggerPopover(chartId, markName, 'click')) {
      suppressNextLeave = true;
      // FOCUSED_ITEM stays untouched — getBarFocusRing already hides the ring when SELECTED_ITEM
      // matches. Tells the popover's close handler this component's hover-parity is still owned by
      // keyboard focus (see keyboardPopoverComponentName's doc).
      if (keyboardPopoverComponentName) keyboardPopoverComponentName.current = markName;
    }
  }

  /** Opens the focused leaf bar/segment's popover — same mechanism `handleMarkClick` uses on a real click. */
  function openBarPopover(node: NodeObject) {
    const view = getView();
    if (!view || !markName || !dimension) return;
    const row = findFocusedRow(view, node, dimension, color);
    if (!row) return;
    const sceneItem = findFocusedBarSceneItem(view, markName, row[MARK_ID]);
    if (!sceneItem) return;
    triggerBarPopover(row, sceneItem);
  }

  /** Opens the focused whole-stack (dimension area) popover — same one a real click on the stack's exposed padding already opens. */
  function openStackPopover(node: NodeObject) {
    const view = getView();
    if (!view || !markName || !dimension) return;
    const stackRow = findFocusedStackRow(view, node, dimension, markName);
    if (!stackRow) return;
    const sceneItem = findFocusedDimensionAreaSceneItem(view, markName, dimension, stackRow[dimension]);
    if (!sceneItem) return;
    triggerBarPopover(stackRow, sceneItem);
  }

  function navigate(node: NodeObject) {
    const renderId = node.renderId || node.id;
    node.renderId = renderId;

    // Take the entry button out of Tab order once inside, or Shift+Tab lands back on it (a real,
    // always-tabbable <button>) instead of leaving the widget — restored in clearFocusState().
    if (rendering.entryButton) {
      (rendering.entryButton as HTMLButtonElement).tabIndex = -1;
    }

    const previous = current;
    // Hide synchronously so a stale tooltip never lingers while the new focus's bounds resolve.
    hideFocusedItemTooltip(getView());

    const el = rendering.render({ renderId, datum: node });
    if (!el) return;

    // Visual focus comes from the Vega ring, so overlay the element across the whole container.
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.top = '0';
    el.style.left = '0';

    el.addEventListener('keydown', (event) => {
      // Space opens a popover, mirroring a real click on the bar/segment or the stack's padding —
      // no equivalent at the chart-root level, and axis labels have no popover at all.
      if (event.code === 'Space') {
        event.preventDefault();
        if (getNodeRegion(node) !== 'xAxis') {
          if (node.dimensionLevel == null) {
            openBarPopover(node);
          } else if (node.dimensionLevel === 2) {
            openStackPopover(node);
          }
        }
        return;
      }
      const direction = input.keydownValidator(event);
      if (!direction) return;
      event.preventDefault();
      const next = input.move(current, direction);
      if (next) {
        navigate(next);
        return;
      }
      // No edge supports this move (e.g. Escape at a top-level region root): drill out of the widget.
      if (direction === 'parent' && rendering.exitElement) {
        rendering.exitElement.style.display = 'block';
        input.focus(rendering.exitElement.id);
      }
    });

    el.addEventListener('focus', () => {
      const view = getView();
      const isAxisNode = getNodeRegion(node) === 'xAxis';
      // Set before applyFocusSignals's runAsync() so both flush together in one dataflow pulse.
      if (isAxisNode) {
        applyAxisFocus(node);
      } else {
        clearAxisFocusRing(focusRing);
        if (view && markName && dimension) {
          applyHoverParitySignals(view, { markName, dimension, color }, node);
        }
      }
      const signals = nodeFocusSignals(node);
      applyFocusSignals(view, signals)
        ?.then(() => {
          if (!view || isAxisNode) return;
          if (!markName || !dimension) {
            showFocusedItemTooltip(container, view, `${markName ?? 'bar0'}_focusRing`, null);
            return;
          }
          showTooltipForFocusedNode(container, view, node, markName, dimension, color);
        });
    });

    // Set before input.focus(): it synchronously fires the 'focus' listener above, which can
    // synchronously flush signal listeners (e.g. the mouse-hover guard) — current must already
    // reflect this node or a listener firing mid-transition reapplies the previous node's values.
    current = node.id;
    input.focus(renderId);

    // Remove the previous node AFTER moving focus, so its focusout carries the new node as
    // relatedTarget — keeping the focusout handler below from treating this as leaving the widget.
    if (previous && previous !== node.id) rendering.remove(previous);
  }

  const clearFocusState = () => {
    if (current) rendering.remove(current);
    current = null;
    if (rendering.entryButton) {
      (rendering.entryButton as HTMLButtonElement).tabIndex = 0;
    }
    const view = getView();
    hideFocusedItemTooltip(view);
    if (view && markName && dimension) {
      applyHoverParitySignals(view, { markName, dimension, color }, null);
    }
    clearAxisFocusRing(focusRing);
    applyFocusSignals(view, CLEARED_FOCUS);
  };

  // Clear focus state when it leaves the navigator entirely. Moves within the widget (node→node,
  // node→exit) keep a relatedTarget inside the container and are ignored.
  rendering.wrapper?.addEventListener('focusout', (event) => {
    if (suppressNextLeave) {
      suppressNextLeave = false;
      return;
    }
    const next = event.relatedTarget;
    if (next instanceof Node && container.contains(next)) return;
    clearFocusState();
  });

  if (rendering.exitElement) {
    rendering.exitElement.addEventListener('focus', clearFocusState);
  }
};
