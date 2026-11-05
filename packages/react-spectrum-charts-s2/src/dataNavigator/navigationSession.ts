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
import dataNavigator, { NodeObject } from 'data-navigator';
import { SignalListenerHandler, View } from 'vega';

import { LAST_RSC_SERIES_ID, SERIES_ID, TABLE } from '@spectrum-charts/core-s2/constants';
import { NavigableLegend, Orientation, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { getVisibleAxisLabelColumns, positionOverlayAtBounds } from './axisLabelGeometry.js';
import { createAxisRegion } from './axisRegion.js';
import { Row } from './barHoverParity.js';
import { withViewKeys } from './barSeries.js';
import { getMetricTitleBySeries } from './buildBarStructure.js';
import { AxisRegionOptions, NavigableChartType, buildChartStructure } from './buildChartStructure.js';
import { createChartRegion } from './chartRegion.js';
import { getNodeRegion } from './composeRegions.js';
import './dataNavigator.css';
import { hideFocusedItemTooltip } from './focusedItemTooltip.js';
import { getLegendEntries } from './legendGeometry.js';
import { LEGEND_REGION, createLegendRegion } from './legendRegion.js';
import {
  CLEARED_FOCUS,
  ClickedItem,
  NavigationActions,
  NavigationRegion,
  applyFocusSignals,
  logFocusError,
} from './navigationRegion.js';

export type { NavigationActions, Ref } from './navigationRegion.js';

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

export interface NavigationSessionOptions extends NavigationActions {
  /** Positioned element the navigation overlay is rendered into. */
  container: HTMLElement;
  /** The chart type to build navigation for. */
  chartType: NavigableChartType;
  /** Chart data (plain objects). */
  data: SimpleData[];
  /** Primary categorical / x-axis field. */
  dimension?: string;
  /** Series / color field (set for stacked bars), read as the series' name in labels. */
  color?: string;
  /** Every field dividing the bar into series (color, lineType, opacity and dual-facet fields), in the chart's series-id order. */
  seriesFields?: string[];
  /** For a dodged-and-stacked bar, the fields splitting each category into side-by-side stacks. */
  dodgeFields?: string[];
  /** For a dodged-and-stacked bar, the fields that tell a stack's segments apart. */
  stackFields?: string[];
  /** Bar layout type. */
  type?: 'dodged' | 'stacked';
  /** Per-datum color override field used in accessible bar labels. */
  colorOverride?: string;
  /** Locale used for accessible color names. */
  locale?: string;
  /** Primary metric / y-axis field. */
  metric?: string;
  /** The stack sort field. When set on a stacked bar, determines which segment is reached first, mirroring Vega's own stack sort. */
  order?: string;
  /** Chart orientation. Swaps which arrow keys move between stacks vs. within a stack. Defaults to vertical. */
  orientation?: Orientation;
  /** Maps a data field to its axis/legend title. Drives the focused leaf's accessible name and, for bars without a ChartInspect, a clean focus tooltip listing only these fields. */
  fieldLabels?: Record<string, string>;
  /** The metric axis titles of a dual-metric-axis bar; the secondary one belongs to the last series. */
  metricAxisTitles?: { primary?: string; secondary?: string };
  /** Whether the mark has a ChartInspect. When true the focus tooltip keeps the full datum (ChartInspect renders it); when false it shows only the `fieldLabels` fields. */
  hasChartInspect?: boolean;
  /** The mark's own name (e.g. `bar0`) — drives its real hover signals for mouse-hover parity. */
  markName?: string;
  /** Optional chart title for the accessible description. */
  title?: string;
  /** When provided, adds an x-axis region below chart content (Down moves to it, Up comes back). */
  xAxis?: AxisRegionOptions;
  /** The chart's categorical legends; the one for the navigable mark's series becomes a legend region. */
  legends?: NavigableLegend[];
  /** Stable id used to namespace the rendered nav elements. */
  chartId: string;
  /** The view the session reads and drives; focus signals are set on it as the user navigates. */
  view: View | undefined;
}

/** The node focused when a session was destroyed, which the next session restores focus to. */
export interface FocusedNode {
  /** The node as it was before any rebuild since the last key press, so a change across rebuilds is still announced */
  node: NodeObject;
}

/** Keyboard navigation mounted into a container for one view and one navigation structure. */
export interface NavigationSession {
  /** Replaces what activating a node does, keeping focus */
  setActions: (actions: NavigationActions) => void;
  /** Moves focus to the entry button */
  focusEntry: () => void;
  /** The focused node, while focus is inside the navigation */
  getFocusedNode: () => FocusedNode | undefined;
  /** Moves focus to the same node of this session; returns false when it no longer exists */
  restoreFocus: (focused: FocusedNode) => boolean;
  /** Removes the navigation elements and the view listeners; `handOff` keeps the focus look for the next session to restore */
  destroy: (options?: { handOff?: boolean }) => void;
}

/** Elements a session adds to its container. */
const NAVIGATION_ELEMENTS = '.dn-wrapper, .dn-exit-position, .dn-exit, .dn-axis-focus-ring, .dn-legend-focus-ring';

/** vega-tooltip's default DOM element id — it toggles the `visible` class on this single shared element. */
const CHART_INSPECT_TOOLTIP_ID = 'vg-tooltip-element';

/** Vega view event callback shape (`(event, item) => void`); the item is the scene item under the pointer, if any. */
type ViewEventHandler = (event: unknown, item: ClickedItem | null | undefined) => void;

/**
 * Real mouse mouseout unconditionally nulls the chart's hover signals, clobbering whatever the
 * keyboard-focused node set. Has the focused node's region restore its look whenever this happens.
 * @param view
 * @param signals hover signals to watch
 * @param restore restores the focused node's look
 * @returns a function that removes the guard
 */
const guardFocusedLookAgainstMouseClear = (view: View, signals: string[], restore: () => void): (() => void) => {
  const handler: SignalListenerHandler = (_name, value) => {
    if (value == null) restore();
  };
  const watched: string[] = [];
  try {
    for (const signal of signals) {
      view.addSignalListener(signal, handler);
      watched.push(signal);
    }
  } catch {
    // A view without these signals (e.g. finalized) has nothing to guard.
  }
  return () => {
    for (const signal of watched) {
      try {
        view.removeSignalListener(signal, handler);
      } catch {
        // already finalized
      }
    }
  };
};

/** Reads a view's rows for a data set, or undefined when the view doesn't have it. */
const readViewData = (view: View | undefined, name: string): Row[] | undefined => {
  try {
    return view ? (view.data(name) as Row[]) : undefined;
  } catch {
    return undefined;
  }
};

/** Reads a signal's value from the view, or undefined when the view doesn't have it. */
const readSignal = (view: View | undefined, name: string): unknown => {
  try {
    return view?.signal(name);
  } catch {
    return undefined;
  }
};

/**
 * Gets each series' metric-axis title for a dual-metric-axis bar, reading which series the chart put on the secondary axis.
 * @param view
 * @param data
 * @param color
 * @param titles
 * @returns Record<string, string> | undefined
 */
const readMetricTitleBySeries = (
  view: View | undefined,
  data: SimpleData[],
  color: string | undefined,
  titles: NavigationSessionOptions['metricAxisTitles']
): Record<string, string> | undefined => {
  if (!titles || !color) return undefined;
  const lastSeries = readSignal(view, LAST_RSC_SERIES_ID);
  const secondarySeries =
    typeof lastSeries === 'string' || typeof lastSeries === 'number' ? String(lastSeries) : undefined;
  return getMetricTitleBySeries(data, color, titles, secondarySeries);
};

/** Reads the series the legend has toggled off from the view. */
const readHiddenSeries = (view: View | undefined): string[] => {
  try {
    const value: unknown = view?.signal('hiddenSeries');
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
};

/**
 * The legend for the navigable mark's series: the first whose symbols are colored by the mark's color.
 * @param legends
 * @param color
 * @returns NavigableLegend | undefined
 */
const pickLegend = (legends: NavigableLegend[] | undefined, color: string | undefined): NavigableLegend | undefined =>
  color === undefined
    ? undefined
    : legends?.find((legend) => legend.colorField === undefined || legend.colorField === color);

/** The legend's entries in rendered order; falls back to the data's entries when the legend isn't in the scenegraph. */
const getLegendSeries = (
  view: View | undefined,
  container: HTMLElement,
  legend: NavigableLegend,
  data: SimpleData[]
): string[] => {
  const entries = view ? getLegendEntries(view, container, legend.name) : [];
  if (entries.length) return entries.map((entry) => entry.value);
  return [...new Set(data.map((row) => legend.entryFields.map((field) => String(row[field])).join(' | ')))];
};

/**
 * Builds the navigation structure and mounts data-navigator's rendering +
 * input modules for one view. The visible focus indicator is drawn on the Vega canvas (focus-ring marks); the
 * elements created here are invisible overlays used only for keyboard focus and assistive tech.
 */
export const mountNavigationSession = ({
  container,
  chartType,
  data,
  dimension,
  color,
  seriesFields = [],
  dodgeFields,
  stackFields,
  type,
  colorOverride,
  locale,
  metric,
  order,
  orientation,
  fieldLabels,
  metricAxisTitles,
  hasChartInspect,
  markName,
  title,
  xAxis,
  legends,
  chartId,
  view,
  ...initialActions
}: NavigationSessionOptions): NavigationSession | undefined => {
  let actions: NavigationActions = initialActions;
  // Restrict x-axis navigation to labels Vega actually painted, so overlap-hidden ticks are skipped
  // (their focus ring wouldn't render). Read from the live, laid-out scenegraph.
  const xAxisRegion =
    xAxis && view
      ? { ...xAxis, visibleValues: getVisibleAxisLabelColumns(view, container, 'bottom').map((column) => column.value) }
      : xAxis;

  // Rows are keyed by the chart's own series id and dimension value, so ids match the spec's even when it parses the dimension (e.g. time).
  const { data: navData, dimensionLabels } = withViewKeys(data, readViewData(view, TABLE) as SimpleData[] | undefined, {
    seriesFields,
    dimension,
  });
  const seriesField = navData.some((row) => SERIES_ID in row) ? SERIES_ID : color;
  const colorLabelFields = color ? [color] : [];
  const legend = pickLegend(legends, color);
  const hiddenSeries = legend ? readHiddenSeries(view) : [];

  const built = buildChartStructure({
    chartType,
    data: navData,
    dimension,
    color,
    seriesField,
    dodgeFields,
    stackFields,
    type,
    colorOverride,
    locale,
    metric,
    order,
    orientation,
    title,
    fieldLabels,
    dimensionLabels,
    metricTitleBySeries: readMetricTitleBySeries(view, navData, color, metricAxisTitles),
    xAxis: xAxisRegion,
    legend: legend && {
      ...legend,
      series: getLegendSeries(view, container, legend, navData),
    },
    hiddenSeries,
  });
  if (!built) return undefined;
  const { structure, entryPoint } = built;

  if (!container.id) {
    container.id = `dn-root-${chartId}`;
  }

  container.querySelectorAll(NAVIGATION_ELEMENTS).forEach((node) => node.remove());

  let current: string | null = null;
  // The persisted node stays in the DOM after focus leaves the widget (so Shift+Tab returns to it), so
  // `current` alone can't tell whether focus is actually inside; this tracks that so the hover guard
  // below doesn't re-apply the focused node's look once focus has left the chart.
  let focusInsideWidget = false;
  // Set when Space opens a popover: moving focus into it fires a focusout that looks identical to
  // leaving the widget. Consumed by the next focusout so the node survives for focus-restore on close.
  let suppressNextLeave = false;
  // Set once the session is destroyed, so a focusout from removing its elements is ignored.
  let destroyed = false;
  // The node focused before the rebuild that restored focus here, until the next key press or move.
  let restoredFrom: NodeObject | undefined;
  const width = container.clientWidth || 400;
  const height = container.clientHeight || 300;

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

  const chartRegion = createChartRegion({
    view,
    container,
    chartId,
    getActions: () => actions,
    keepFocusThroughPopover: () => {
      suppressNextLeave = true;
    },
    chartType,
    markName,
    dimension,
    seriesField,
    seriesLabelFields: seriesFields.length ? seriesFields : colorLabelFields,
    metric,
    fieldLabels: fieldLabels ?? {},
    hasChartInspect: hasChartInspect ?? false,
  });
  const regions: Record<string, NavigationRegion> = { content: chartRegion };
  if (xAxisRegion) {
    regions.xAxis = createAxisRegion({ view, container, highlightDimension: chartRegion.highlightDimension });
  }
  if (legend && Object.values(structure.nodes).some((node) => getNodeRegion(node) === LEGEND_REGION)) {
    regions[LEGEND_REGION] = createLegendRegion({
      view,
      container,
      chartId,
      getActions: () => actions,
      keepFocusThroughPopover: () => {
        suppressNextLeave = true;
      },
      legend,
      hiddenSeries,
      chartRegion,
      getNode: (id) => structure.nodes[id],
      moveTo: (node) => navigate(node),
    });
  }
  const regionList = Object.values(regions);
  // Content nodes are untagged when the chart has no other regions.
  const regionFor = (node: NodeObject): NavigationRegion => regions[getNodeRegion(node) ?? 'content'] ?? chartRegion;

  const removeHoverGuard = view
    ? guardFocusedLookAgainstMouseClear(view, [...new Set(regionList.flatMap((r) => r.restoreSignals ?? []))], () => {
        const node = focusInsideWidget && current ? structure.nodes[current] : undefined;
        // A region root has no specific item to restore.
        if (node && node.dimensionLevel !== 1) regionFor(node).restore?.(node);
      })
    : undefined;

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

  function navigate(node: NodeObject) {
    const renderId = node.renderId || node.id;
    node.renderId = renderId;
    const region = regionFor(node);

    // Take the entry button out of Tab order once inside, or Shift+Tab lands back on it (a real,
    // always-tabbable <button>) instead of leaving the widget — restored in clearFocusState().
    if (rendering.entryButton) {
      (rendering.entryButton as HTMLButtonElement).tabIndex = -1;
    }

    const previous = current;
    if (restoredFrom && restoredFrom.id !== node.id) restoredFrom = undefined;
    // Hide synchronously so a stale tooltip never lingers while the new focus's bounds resolve.
    hideFocusedItemTooltip(view);

    const el = rendering.render({ renderId, datum: node });
    if (!el) return;

    // Size/position .dn-node to the focused item so a screen magnifier centers on it, not the whole chart.
    const bounds = region.getBounds?.(node);
    if (bounds) {
      positionOverlayAtBounds(el, bounds);
    } else {
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.top = '0';
      el.style.left = '0';
    }
    el.style.outline = 'none';
    el.style.boxShadow = 'none';

    el.addEventListener('keydown', (event) => {
      restoredFrom = undefined;
      if (region.handleKey?.(node, event)) {
        event.preventDefault();
        return;
      }
      // WCAG 2.2 SC 1.4.13: content shown on focus must be dismissible without moving focus. The first
      // Escape dismisses a visible inspect/focus tooltip and keeps focus here; a later Escape then drills
      // out. (The React Spectrum axis-label tooltip dismisses itself on Escape via onOpenChange.)
      if (event.code === 'Escape') {
        const tooltipEl = document.getElementById(CHART_INSPECT_TOOLTIP_ID);
        if (tooltipEl?.classList.contains('visible')) {
          tooltipEl.classList.remove('visible');
          event.preventDefault();
          return;
        }
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
      focusInsideWidget = true;
      for (const other of regionList) {
        if (other !== region) other.clear();
      }
      region.focus(node, el);
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

  // Clears only the visual focus indicators, leaving the focused node and `current` intact so
  // Shift+Tab back into the widget restores focus to it.
  const clearFocusVisuals = () => {
    // Clear before the regions reset hover signals: the guard keys off this to know focus has left.
    focusInsideWidget = false;
    hideFocusedItemTooltip(view);
    regionList.forEach((region) => region.clear());
    applyFocusSignals(view, CLEARED_FOCUS)?.catch(logFocusError);
  };

  // Full teardown: removes the focused node, restores the entry button to tab order, and clears the
  // visual indicators. Only for an explicit drill-out (the exit element), not a plain tab/click away.
  const clearFocusState = () => {
    if (current) rendering.remove(current);
    current = null;
    if (rendering.entryButton) {
      (rendering.entryButton as HTMLButtonElement).tabIndex = 0;
    }
    clearFocusVisuals();
  };

  // Focus leaving the navigator entirely (tab/click away) clears only the visual indicators; the node
  // persists so Shift+Tab back returns to it (its `focus` listener re-applies the look). Moves
  // within the widget (node→node, node→exit) keep a relatedTarget inside the container and are ignored.
  rendering.wrapper?.addEventListener('focusout', (event) => {
    if (destroyed) return;
    if (suppressNextLeave) {
      suppressNextLeave = false;
      return;
    }
    const next = event.relatedTarget;
    if (next instanceof Node && container.contains(next)) return;
    clearFocusVisuals();
  });

  if (rendering.exitElement) {
    rendering.exitElement.addEventListener('focus', clearFocusState);
  }

  const findNodeId = (item: ClickedItem) => {
    for (const region of regionList) {
      const nodeId = region.findNode?.(item);
      if (nodeId) return nodeId;
    }
    return undefined;
  };

  // Clicking a mark moves keyboard focus to the matching node (hover never does). On mousedown, so the
  // node is focused before a click opens its popover — popover focus-restore then returns here on close.
  const handleMousedown: ViewEventHandler = (event, item) => {
    const nodeId = item ? findNodeId(item) : undefined;
    if (!nodeId || nodeId === current) return;
    const node = structure.nodes[nodeId];
    if (!node) return;
    // Prevent the browser's default mousedown focus, which would otherwise move focus off the node we
    // focus below (to the chart element or <body>) and immediately tear this focus state back down.
    (event as { preventDefault?: () => void })?.preventDefault?.();
    navigate(node);
    // The ensuing click opens this mark's popover, pulling focus into it. Suppress the resulting
    // focusout (as the keyboard path does) so the node survives for React Spectrum's focus-restore on close.
    const popover = regionFor(node).getClickPopover?.(node);
    if (popover) {
      suppressNextLeave = true;
      if (actions.keyboardPopoverComponentName) actions.keyboardPopoverComponentName.current = popover;
    }
  };
  view?.addEventListener('mousedown', handleMousedown);

  return {
    setActions: (next) => {
      actions = next;
    },
    focusEntry: () => rendering.entryButton?.focus(),
    getFocusedNode: () => {
      const node = focusInsideWidget && current ? structure.nodes[current] : undefined;
      return node && { node: restoredFrom ?? node };
    },
    restoreFocus: ({ node: previous }) => {
      const node = structure.nodes[previous.id];
      if (!node) {
        clearFocusVisuals();
        return false;
      }
      const label = regionFor(node).getRestoredLabel?.(node, previous);
      if (!label || !node.semantics) {
        navigate(node);
        return true;
      }
      // Only the restored node reads the change; moving away and back reads its usual name.
      const usual = node.semantics.label;
      node.semantics.label = label;
      navigate(node);
      node.semantics.label = usual;
      restoredFrom = previous;
      return true;
    },
    destroy: ({ handOff = false } = {}) => {
      destroyed = true;
      if (current && !handOff) clearFocusVisuals();
      current = null;
      removeHoverGuard?.();
      try {
        view?.removeEventListener('mousedown', handleMousedown);
      } catch {
        // already finalized
      }
      regionList.forEach((region) => region.destroy?.());
      container.querySelectorAll(NAVIGATION_ELEMENTS).forEach((node) => node.remove());
    },
  };
};
