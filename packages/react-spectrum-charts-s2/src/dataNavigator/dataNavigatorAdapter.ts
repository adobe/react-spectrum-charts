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
  HOVERED_SERIES,
  MARK_ID,
  SELECTED_ITEM,
  SERIES_ID,
  TABLE,
} from '@spectrum-charts/constants';
import { Datum, MarkBounds, Orientation, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { ActionItem, getItemBounds, getPopoverButton, triggerPopover } from '../utils/markClickUtils';
import { clearAxisFocusRing, getVisibleAxisLabelColumns, padAxisBounds, positionOverlayAtBounds, setAxisFocusRing } from './axisLabelGeometry';
import { withViewKeys } from './barSeries';
import { applyHoverParitySignals, findFocusedRow, findFocusedStackRow, getNodeFieldValues, Row } from './barHoverParity';
import { toNavigationKey } from './buildBarStructure';
import { AxisRegionOptions, LegendRegionOptions, NavigableChartType, buildChartStructure, getNodeIdForDatum } from './buildChartStructure';
import {
  getLegendNodeContentId,
  getLegendNodeLevel,
  getLegendNodeSeries,
  getLegendNodeToggledLabel,
  isLegendNodeHidden,
  legendSeriesId,
} from './buildLegendStructure';
import { getNodeRegion, prefixed, stripRegionPrefix } from './composeRegions';
import {
  SceneNode,
  findFocusedBarSceneItem,
  findFocusedDimensionAreaSceneItem,
  hideFocusedItemTooltip,
  pageBoundsForItem,
  showAxisLabelTooltip,
  showFocusedItemTooltip,
  showSceneItemTooltip,
} from './focusedItemTooltip';
import { ArrowKey, LegendEntry, findLegendNeighbor, getLegendBounds, getLegendEntries } from './legendGeometry';
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

export interface LegendNavigationOptions {
  /** The legend's name (e.g. `legend0`) — its hover signal, entry mark and popover are namespaced off of it. */
  name: string;
  /** Legend title for the region's accessible name. */
  title?: string;
  /** Series value → the label the legend displays for it (from `legendLabels`). */
  labels?: LegendRegionOptions['labels'];
  /** Series value → its legend description and optional title (from `descriptions`). */
  descriptions?: LegendRegionOptions['descriptions'];
  /** The legend's `keys`: entries are groups of rows sharing these fields' values rather than `color` values. */
  keys?: string[];
  /** The legend's `onMouseOver`, called when keyboard focus moves onto a series, the same as hovering its entry. */
  onMouseOver?: (seriesName: string) => void;
  /** The legend's `onMouseOut`, called when keyboard focus leaves a series, the same as un-hovering its entry. */
  onMouseOut?: (seriesName: string) => void;
  /** Where the legend sits relative to the plot; the arrow pointing that way from the chart moves to it. */
  position?: LegendRegionOptions['position'];
  /** Whether the legend highlights the hovered series — focus then drives the same highlight. */
  highlight?: boolean;
  /** Series the legend doesn't render; used for the series list when the legend's scenegraph isn't readable. */
  hiddenEntries?: string[];
  /** Runs the legend's own click behavior (popover, onClick, toggle) for a rendered entry scene item. */
  onActivate?: (item: unknown) => void;
  /** Runs the legend's own right-click behavior (its `rightClick` popover) for a rendered entry scene item. */
  onContextMenu?: (item: unknown) => void;
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
  /** Per-series metric-axis titles for dual-metric-axis bars. */
  metricTitleBySeries?: Record<string, string>;
  /** Whether the mark has a ChartInspect. When true the focus tooltip keeps the full datum (ChartInspect renders it); when false it shows only the `fieldLabels` fields. */
  hasChartInspect?: boolean;
  /** The mark's own name (e.g. `bar0`) — drives its real hover signals for mouse-hover parity. */
  markName?: string;
  /** Optional chart title for the accessible description. */
  title?: string;
  /** When provided, adds an x-axis region below chart content (Down moves to it, Up comes back). */
  xAxis?: AxisRegionOptions;
  /** When provided (and the bar has a `color` series), adds a legend region: series, then that series' bars. */
  legend?: LegendNavigationOptions;
  /** Series toggled off via the legend; skipped by chart content and not drillable from the legend. */
  hiddenSeries?: string[];
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
  /** Fires the focused mark's `onClick` (if it declares one) on Enter/Space, mirroring a real click, which runs onClick alongside opening any popover. */
  onNodeClick?: (datum: Datum) => void;
  /** Fires the focused mark's `onContextMenu` (if it declares one) on Shift+F10 or the ContextMenu key, mirroring a right-click. */
  onNodeContextMenu?: (event: MouseEvent, datum: Datum) => void;
  /** Whether the mark has a ChartPopover — a click that focuses a node also opens it, so focus must be retained through the popover. */
  hasChartPopover?: boolean;
}

/** How a focused leaf finds its live row (`field`) and which series fields its tooltip lists. */
interface SeriesLookup {
  field: string | undefined;
  labelFields: string[];
}

interface FocusSignals {
  item: string | null; // a single bar / stacked segment
  region: string | null; // the whole chart (entry/root)
  dimension: string | null; // a dimension group, e.g. a whole stack
}

const CLEARED_FOCUS: FocusSignals = { item: null, region: null, dimension: null };

interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Resolves page-absolute bounds for the mark a focused content node represents, so `.dn-node` can be
 * sized to it for screen-magnifier support.
 * @returns `undefined` for the dimension-root (whole-chart) node or when no matching mark is found — callers fall back to the full container.
 */
const resolveContentFocusBounds = (
  view: View,
  container: HTMLElement,
  node: NodeObject,
  markName: string,
  dimension: string,
  seriesField: string | undefined
): Bounds | undefined => {
  if (node.dimensionLevel === 1) return undefined;

  if (node.dimensionLevel == null) {
    const row = findFocusedRow(view, node, dimension, seriesField);
    const item = row ? findFocusedBarSceneItem(view, markName, row[MARK_ID]) : undefined;
    return item ? pageBoundsForItem(view, container, item) : undefined;
  }

  // Resolve the dimension directly rather than via findFocusedStackRow, which reads a stacked-only data source and would throw for a dodged bar.
  const { dimensionValue } = getNodeFieldValues(node, dimension);
  const item = dimensionValue != null ? findFocusedDimensionAreaSceneItem(view, markName, dimension, dimensionValue) : undefined;
  return item ? pageBoundsForItem(view, container, item) : undefined;
};

/** vega-tooltip's default DOM element id — it toggles the `visible` class on this single shared element. */
const CHART_INSPECT_TOOLTIP_ID = 'vg-tooltip-element';

/**
 * Maps the focused node to the chart's focus signals:
 *  - x-axis region             → drives its own DOM ring + dimension-hover parity; must not also
 *    activate the bar/stack focus ring
 *  - legend root/series         → drives its own DOM ring + legend-hover parity; legend bar → its content bar's ring
 *  - leaf (no dimensionLevel)   → a single bar/segment (`item` = node id)
 *  - dimension root (level 1)   → the chart overview (`region` = 'chart')
 *  - division (level 2)         → a dimension group / stack (`dimension` = the column value)
 */
const nodeFocusSignals = (node: NodeObject): FocusSignals => {
  if (getNodeRegion(node) === 'xAxis') {
    return CLEARED_FOCUS;
  }
  if (getNodeRegion(node) === 'legend') {
    // A legend bar mirrors its chart-content bar, so it reuses that bar's focus ring.
    const contentId = getLegendNodeContentId(node);
    return contentId ? { ...CLEARED_FOCUS, item: contentId } : CLEARED_FOCUS;
  }
  if (node.dimensionLevel == null) {
    return { ...CLEARED_FOCUS, item: node.id };
  }
  if (node.dimensionLevel === 1) {
    return { ...CLEARED_FOCUS, region: 'chart' };
  }
  const dimensionValue = node.derivedNode ? node.data?.[node.derivedNode] : undefined;
  const dimension = dimensionValue === undefined ? null : toNavigationKey(dimensionValue);
  return { ...CLEARED_FOCUS, dimension };
};

const applyFocusSignals = (view: View | undefined, { item, region, dimension }: FocusSignals): Promise<unknown> | undefined => {
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

/**
 * Builds the focus tooltip value for a leaf. With a ChartInspect, the full datum is kept (its
 * `formatTooltip` renders it). Without one, vega-tooltip's default table would dump every field, so
 * instead emit only the dimension/color/metric fields, keyed by their axis/legend titles.
 */
const buildLeafTooltipValue = (
  row: Row,
  markName: string,
  hasChartInspect: boolean,
  fieldLabels: Record<string, string>,
  fields: (string | undefined)[]
): Row => {
  if (hasChartInspect) return { ...row, [COMPONENT_NAME]: markName };
  const clean: Row = {};
  for (const field of fields) {
    if (field && field in row) clean[fieldLabels[field] ?? field] = row[field];
  }
  return clean;
};

/** Shows the tooltip matching a focused node (leaf, stack, or none) — shared by the `focus` handler and the mouse-hover guard below. */
const showTooltipForFocusedNode = (
  container: HTMLElement,
  view: View,
  node: NodeObject,
  markName: string,
  dimension: string,
  series: SeriesLookup,
  metric: string | undefined,
  fieldLabels: Record<string, string>,
  hasChartInspect: boolean
): void => {
  const signals = nodeFocusSignals(node);
  if (signals.item != null) {
    // Leaf: full datum for ChartInspect, otherwise a clean axis-titled subset.
    const row = findFocusedRow(view, node, dimension, series.field);
    const fields = [dimension, ...series.labelFields, metric];
    const value = row ? buildLeafTooltipValue(row, markName, hasChartInspect, fieldLabels, fields) : null;
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

/** Vega view event callback shape (`(event, item) => void`); the item is the scene item under the pointer, if any. */
type ViewEventHandler = (event: unknown, item: { datum?: Row } | null | undefined) => void;

/** One click-to-focus handler per view, so a re-attach replaces rather than stacks the listener. */
const clickToFocusHandlers = new WeakMap<View, ViewEventHandler>();

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
  series: SeriesLookup,
  metric: string | undefined,
  fieldLabels: Record<string, string>,
  hasChartInspect: boolean,
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
    // Legend root/series drive the legend's own hover signal instead (see guardLegendHoverAgainstMouseClear).
    if (getNodeRegion(node) === 'legend' && getLegendNodeLevel(node) !== 'bar') return;
    const isAxisNode = getNodeRegion(node) === 'xAxis';
    applyHoverParitySignals(view, { markName, dimension, color: series.field }, node, isAxisNode);
    // Axis ticks don't drive the chart tooltip (matching real axis-label hover), only the bar/stack does.
    if (isAxisNode) {
      view.runAfter((v) => v.runAsync());
      return;
    }
    view.runAfter((v) => {
      v.runAsync().then(() => showTooltipForFocusedNode(container, v, node, markName, dimension, series, metric, fieldLabels, hasChartInspect));
    });
  };
  try {
    view.addSignalListener(itemSignal, handler);
    view.addSignalListener(dimensionSignal, handler);
    hoverGuardHandlers.set(view, handler);
  } catch {
    // The view can be mid-rebuild (e.g. orientation just changed) or finalized and not expose these
    // signals yet; skip wiring rather than throwing — the next re-attach registers on the ready view.
  }
};

/** One legend-hover guard handler per view, mirroring `hoverGuardHandlers`. */
const legendHoverGuardHandlers = new WeakMap<View, { signal: string; handler: SignalListenerHandler }>();

/** The last node focused in each container, so focus can be restored onto the rebuilt structure after a re-attach. */
const lastFocusedNodeIds = new WeakMap<HTMLElement, string>();

/** The legend series each container last reported through `onMouseOver`, so `onMouseOut` pairs with it across re-attaches. */
const keyboardHoveredLegendSeries = new WeakMap<HTMLElement, string>();

/** A legend series activated with Space and whether it was hidden then, so the restored focus can announce a toggle. */
const pendingLegendToggles = new WeakMap<HTMLElement, { nodeId: string; wasHidden: boolean }>();

/** Sets the legend's hover signal (only present when the legend highlights), mirroring real legend-entry hover. */
const setLegendHoveredSeries = (view: View, legend: LegendNavigationOptions | undefined, value: string | null): void => {
  if (!legend?.highlight) return;
  try {
    view.signal(`${legend.name}_${HOVERED_SERIES}`, value);
  } catch {
    // The signal is absent on a rebuilding view; keyboard focus still drives the legend ring.
  }
};

/**
 * Real legend-entry mouseout nulls `${legend}_hoveredSeries`, clobbering the keyboard-focused series'
 * highlight. Reapplies it whenever this happens while a legend series is still keyboard-focused.
 */
const guardLegendHoverAgainstMouseClear = (
  view: View,
  legend: LegendNavigationOptions,
  hiddenSeries: string[] | undefined,
  getFocusedNode: () => NodeObject | undefined
): void => {
  const previous = legendHoverGuardHandlers.get(view);
  if (previous) view.removeSignalListener(previous.signal, previous.handler);
  if (!legend.highlight) return;
  const signal = `${legend.name}_${HOVERED_SERIES}`;
  const handler: SignalListenerHandler = (_name, value) => {
    if (value != null) return;
    const node = getFocusedNode();
    const series = node && getNodeRegion(node) === 'legend' && getLegendNodeLevel(node) === 'series' ? getLegendNodeSeries(node) : undefined;
    if (series === undefined || hiddenSeries?.includes(series)) return;
    view.runAfter((v) => {
      setLegendHoveredSeries(v, legend, series);
      v.runAsync();
    });
  };
  try {
    view.addSignalListener(signal, handler);
    legendHoverGuardHandlers.set(view, { signal, handler });
  } catch {
    // Mirrors guardHoverParityAgainstMouseClear: skip on a view that doesn't expose the signal yet.
  }
};

/** The legend's series, in rendered order; falls back to the data's series when the legend isn't in the scenegraph. */
const resolveLegendSeries = (
  view: View | undefined,
  container: HTMLElement,
  legend: LegendNavigationOptions,
  data: SimpleData[],
  entryFields: string[]
): string[] => {
  const entries = view ? getLegendEntries(view, container, legend.name) : [];
  if (entries.length) return entries.map((entry) => entry.value);
  const hidden = new Set(legend.hiddenEntries ?? []);
  const entryOf = (row: SimpleData) => entryFields.map((field) => String(row[field])).join(' | ');
  return [...new Set(data.map(entryOf))].filter((value) => !hidden.has(value));
};

/** Reads a view's rows for a data set, or undefined when the view doesn't have it (e.g. mid-rebuild). */
const readViewData = (view: View | undefined, name: string): Row[] | undefined => {
  try {
    return view ? (view.data(name) as Row[]) : undefined;
  } catch {
    return undefined;
  }
};

/**
 * The fields a legend's entries join, read from its `${name}Aggregate` rows (grouped by those fields, each
 * with the joined `${name}Entries` value), so rows match entries exactly however the legend faceted them.
 */
export const getLegendEntryFields = (view: View | undefined, legendName: string): string[] | undefined => {
  const entriesField = `${legendName}Entries`;
  const row = readViewData(view, `${legendName}Aggregate`)?.[0];
  if (!row) return undefined;
  const candidates = Object.keys(row).filter((key) => key !== entriesField);
  const joins = (fields: string[]) => fields.length > 0 && fields.map((field) => String(row[field])).join(' | ') === String(row[entriesField]);
  // A groupby-only aggregate also emits a `count` field.
  const withoutCount = candidates.filter((key) => key !== 'count');
  if (joins(withoutCount)) return withoutCount;
  return joins(candidates) ? candidates : undefined;
};

const ARROW_KEYS = new Set<string>(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

/** The platform keyboard equivalents of a right-click: Shift+F10 and the ContextMenu key. */
export const isContextMenuKey = (event: KeyboardEvent): boolean => event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10');

/** A synthetic right-click at the center of a mark's viewport bounds, for `onContextMenu` consumers positioning a menu. */
const contextMenuEventAt = (bounds: Bounds | undefined): MouseEvent =>
  new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: bounds ? (bounds.x1 + bounds.x2) / 2 : 0,
    clientY: bounds ? (bounds.y1 + bounds.y2) / 2 : 0,
  });

type LegendClickItem = { mark?: { role?: string; name?: string }; datum?: { value?: unknown }; items?: { items?: LegendClickItem[] }[] };

/** The series a clicked legend scene item (entry group, symbol or label) belongs to. */
const legendValueForSceneItem = (item: unknown, legendName: string): string | undefined => {
  const sceneItem = item as LegendClickItem | null | undefined;
  const mark = sceneItem?.mark;
  const isEntryGroup = mark?.name === `${legendName}_legendEntry`;
  if (!isEntryGroup && mark?.role !== 'legend-symbol' && mark?.role !== 'legend-label') return undefined;
  // An entry group's own datum only carries its index; its symbol/label children carry the value.
  const value = isEntryGroup ? sceneItem?.items?.[0]?.items?.[0]?.datum?.value : sceneItem?.datum?.value;
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : undefined;
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
  metricTitleBySeries,
  hasChartInspect,
  markName,
  title,
  xAxis,
  legend,
  hiddenSeries,
  chartId,
  getView,
  selectedData,
  selectedDataBounds,
  selectedDataName,
  keyboardPopoverComponentName,
  onNodeClick,
  onNodeContextMenu,
  hasChartPopover,
}: AttachDataNavigatorOptions): void => {
  // Restrict x-axis navigation to labels Vega actually painted, so overlap-hidden ticks are skipped
  // (their focus ring wouldn't render). Read from the live, laid-out scenegraph.
  const initialView = getView();
  const xAxisRegion =
    xAxis && initialView
      ? { ...xAxis, visibleValues: getVisibleAxisLabelColumns(initialView, container, 'bottom').map((column) => column.value) }
      : xAxis;

  // Rows are keyed by the chart's own series id and dimension value, so ids match the spec's even when it parses the dimension (e.g. time).
  const { data: navData, dimensionLabels } = withViewKeys(data, readViewData(initialView, TABLE) as SimpleData[] | undefined, {
    seriesFields,
    dimension,
  });
  const seriesField = navData.some((row) => SERIES_ID in row) ? SERIES_ID : color;
  const colorLabelFields = color ? [color] : [];
  const series: SeriesLookup = { field: seriesField, labelFields: seriesFields.length ? seriesFields : colorLabelFields };
  const legendEntryFields =
    legend && (getLegendEntryFields(initialView, legend.name) ?? (legend.keys?.length ? legend.keys : series.labelFields));

  const legendRegion =
    legend && seriesField && legendEntryFields?.length
      ? {
          series: resolveLegendSeries(initialView, container, legend, navData, legendEntryFields),
          title: legend.title,
          position: legend.position,
          labels: legend.labels,
          descriptions: legend.descriptions,
          entryFields: legendEntryFields,
        }
      : undefined;

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
    metricTitleBySeries,
    xAxis: xAxisRegion,
    legend: legendRegion,
    hiddenSeries,
  });
  if (!built) return;
  const { structure, entryPoint } = built;

  if (!container.id) {
    container.id = `dn-root-${chartId}`;
  }

  // A re-attach (new data, size, or a legend toggle re-embedding the view) replaces every node; if one
  // was focused, restore focus onto its rebuilt counterpart rather than dropping it to <body>.
  const activeElement = document.activeElement;
  const restoreId =
    activeElement instanceof HTMLElement && activeElement.classList.contains('dn-node') && container.contains(activeElement)
      ? lastFocusedNodeIds.get(container)
      : undefined;

  container.querySelectorAll('.dn-wrapper, .dn-exit-position, .dn-exit').forEach((node) => node.remove());
  container.querySelectorAll('.dn-axis-focus-ring, .dn-legend-focus-ring').forEach((node) => node.remove());

  let current: string | null = null;
  // The persisted node stays in the DOM after focus leaves the widget (so Shift+Tab returns to it), so
  // `current` alone can't tell whether focus is actually inside; this tracks that so the hover guard
  // below doesn't re-apply the focused node's dimming once focus has left the chart.
  let focusInsideWidget = false;
  // Set when Space opens a popover: moving focus into it fires a focusout that looks identical to
  // leaving the widget. Consumed by the next focusout so the node survives for focus-restore on close.
  let suppressNextLeave = false;
  const width = container.clientWidth || 400;
  const height = container.clientHeight || 300;

  const view = getView();
  const getFocusedNode = () => (focusInsideWidget && current ? structure.nodes[current] : undefined);
  if (view && markName && dimension) {
    guardHoverParityAgainstMouseClear(container, view, markName, dimension, series, metric, fieldLabels ?? {}, hasChartInspect ?? false, getFocusedNode);
  }
  if (view && legendRegion) {
    guardLegendHoverAgainstMouseClear(view, legend as LegendNavigationOptions, hiddenSeries, getFocusedNode);
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

  // Same DOM-overlay approach for the legend ring: Vega's legend has no focusable mark to ring.
  const legendFocusRing = document.createElement('div');
  legendFocusRing.className = 'dn-legend-focus-ring';
  legendFocusRing.setAttribute('aria-hidden', 'true');
  container.appendChild(legendFocusRing);

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
   * Draws the axis focus ring around the focused x-axis label's real rendered bounds, sizes the
   * focused `.dn-node` to the same bounds (so a screen magnifier centers on the actual label instead
   * of the whole chart), and drives dimension-only hover parity so the corresponding bar highlights
   * like real axis-label hover does. The whole-axis root node rings the full label row with no single
   * dimension value to highlight.
   */
  function applyAxisFocus(node: NodeObject, el: HTMLElement) {
    const view = getView();
    if (!view || !markName || !dimension) {
      clearAxisFocusRing(focusRing);
      return;
    }
    const columns = getVisibleAxisLabelColumns(view, container, 'bottom');
    if (!columns.length) {
      clearAxisFocusRing(focusRing);
      applyHoverParitySignals(view, { markName, dimension, color: seriesField }, null, true);
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
      applyHoverParitySignals(view, { markName, dimension, color: seriesField }, null, true);
      return;
    }

    const value = stripRegionPrefix(node);
    const column = columns.find((c) => c.value === value);
    if (!column) {
      clearAxisFocusRing(focusRing);
      applyHoverParitySignals(view, { markName, dimension, color: seriesField }, null, true);
      return;
    }
    setAxisFocusRing(focusRing, column.bounds);
    const bounds = padAxisBounds(column.bounds);
    if (bounds) positionOverlayAtBounds(el, bounds);
    applyHoverParitySignals(view, { markName, dimension, color: seriesField }, node, true);
    // Show the label's tooltip on focus, matching mouse hover. React Spectrum's TooltipTrigger dismisses
    // it on Escape (via onOpenChange in RscChart) without moving focus — WCAG 2.2 SC 1.4.13.
    showAxisLabelTooltip(view, value);
  }

  /** The legend's live rendered entries (re-read each time, so wrapping/resizing is always current). */
  function currentLegendEntries(): LegendEntry[] {
    const view = getView();
    return view && legend ? getLegendEntries(view, container, legend.name) : [];
  }

  /**
   * Rings the focused legend root (whole legend) or series (its entry) with a DOM overlay, sizes the
   * `.dn-node` to it, and drives legend-hover parity. A legend bar instead reuses its content bar's ring
   * and hover parity.
   */
  function applyLegendFocus(node: NodeObject, el: HTMLElement) {
    const view = getView();
    if (!view || !legend) return;
    const level = getLegendNodeLevel(node);
    if (level === 'bar') {
      clearAxisFocusRing(legendFocusRing);
      setLegendHoveredSeries(view, legend, null);
      if (markName && dimension) applyHoverParitySignals(view, { markName, dimension, color: seriesField }, node);
      return;
    }
    if (markName && dimension) applyHoverParitySignals(view, { markName, dimension, color: seriesField }, null);
    const series = getLegendNodeSeries(node);
    const bounds =
      level === 'series'
        ? currentLegendEntries().find((entry) => entry.value === series)?.bounds
        : getLegendBounds(view, container, legend.name);
    if (bounds) {
      setAxisFocusRing(legendFocusRing, bounds);
      const padded = padAxisBounds(bounds);
      if (padded) positionOverlayAtBounds(el, padded);
    } else {
      clearAxisFocusRing(legendFocusRing);
    }
    // Real legend hover doesn't highlight a toggled-off series either.
    const highlighted = level === 'series' && series !== undefined && !hiddenSeries?.includes(series) ? series : null;
    setLegendHoveredSeries(view, legend, highlighted);
  }

  /** Shows the focused series' legend description tooltip (if any), matching legend-entry hover. */
  function showLegendEntryTooltip(view: View, node: NodeObject) {
    const series = getLegendNodeSeries(node);
    const entry = currentLegendEntries().find((candidate) => candidate.value === series);
    if (!entry || !showSceneItemTooltip(container, view, entry.item as SceneNode, entry.item.tooltip)) {
      hideFocusedItemTooltip(view);
    }
  }

  /** Reports keyboard focus entering/leaving a legend series through the legend's onMouseOver/onMouseOut, like hover. */
  function setKeyboardHoveredLegendSeries(series: string | undefined) {
    const previous = keyboardHoveredLegendSeries.get(container);
    if (previous === series) return;
    if (previous !== undefined) {
      keyboardHoveredLegendSeries.delete(container);
      legend?.onMouseOut?.(previous);
    }
    if (series !== undefined) {
      keyboardHoveredLegendSeries.set(container, series);
      legend?.onMouseOver?.(series);
    }
  }

  /** Runs the legend's own click behavior for the focused series: popover, onClick, and/or toggle. */
  function activateLegendEntry(node: NodeObject) {
    if (!legend?.onActivate) return;
    const series = getLegendNodeSeries(node);
    const entry = currentLegendEntries().find((candidate) => candidate.value === series);
    if (!entry) return;
    pendingLegendToggles.set(container, { nodeId: node.id, wasHidden: isLegendNodeHidden(node) });
    if (getPopoverButton(chartId, legend.name)) {
      suppressNextLeave = true;
      if (keyboardPopoverComponentName) keyboardPopoverComponentName.current = legend.name;
    }
    legend.onActivate(entry.item);
  }

  /** Runs the legend's own right-click behavior for the focused series: its `rightClick` popover. */
  function openLegendContextMenu(node: NodeObject) {
    if (!legend?.onContextMenu) return;
    const series = getLegendNodeSeries(node);
    const entry = currentLegendEntries().find((candidate) => candidate.value === series);
    if (!entry) return;
    if (getPopoverButton(chartId, legend.name, 'contextmenu')) {
      suppressNextLeave = true;
      if (keyboardPopoverComponentName) keyboardPopoverComponentName.current = legend.name;
    }
    legend.onContextMenu(entry.item);
  }

  /** Moves between legend series following the legend's live rendered grid (rows/columns wrap with its size). */
  function moveLegendSeries(node: NodeObject, key: ArrowKey) {
    const series = getLegendNodeSeries(node);
    if (series === undefined) return;
    const next = findLegendNeighbor(currentLegendEntries(), series, key);
    const nextNode = next === undefined ? undefined : structure.nodes[prefixed('legend', legendSeriesId(next))];
    if (nextNode) navigate(nextNode);
  }

  /** Sets the shared context refs and triggers the popover through the same DOM-button-click a real click uses. */
  function triggerBarPopover(row: Row, sceneItem: unknown, trigger: 'click' | 'contextmenu' = 'click') {
    if (!markName || !selectedData || !selectedDataBounds || !selectedDataName) return;
    selectedData.current = { ...row, [COMPONENT_NAME]: markName } as unknown as Datum;
    selectedDataBounds.current = getItemBounds(sceneItem as ActionItem);
    selectedDataName.current = markName;
    if (keyboardPopoverComponentName) keyboardPopoverComponentName.current = markName;
    if (triggerPopover(chartId, markName, trigger)) {
      suppressNextLeave = true;
      const view = getView();
      if (view) {
        view.signal(SELECTED_ITEM, row[MARK_ID] ?? null);
      }
      // Tells the popover's close handler hover-parity is still owned by keyboard focus (see keyboardPopoverComponentName's doc).
    } else if (keyboardPopoverComponentName) {
      keyboardPopoverComponentName.current = null;
      selectedData.current = null;
      selectedDataName.current = '';
    }
  }

  /** Activates the focused leaf bar/segment — opens its popover (if any) and fires its `onClick` (if any), the same pair a real click runs. */
  function activateBar(node: NodeObject) {
    const view = getView();
    if (!view || !markName || !dimension) return;
    const row = findFocusedRow(view, node, dimension, seriesField);
    if (!row) return;
    const sceneItem = findFocusedBarSceneItem(view, markName, row[MARK_ID]);
    if (sceneItem) triggerBarPopover(row, sceneItem);
    onNodeClick?.(row as unknown as Datum);
  }

  /** Right-clicks the focused leaf bar/segment — opens its `rightClick` popover (if any) and fires its `onContextMenu` (if any). */
  function openBarContextMenu(node: NodeObject) {
    const view = getView();
    if (!view || !markName || !dimension) return;
    const row = findFocusedRow(view, node, dimension, seriesField);
    if (!row) return;
    const sceneItem = findFocusedBarSceneItem(view, markName, row[MARK_ID]);
    if (sceneItem && getPopoverButton(chartId, markName, 'contextmenu')) triggerBarPopover(row, sceneItem, 'contextmenu');
    onNodeContextMenu?.(contextMenuEventAt(sceneItem ? pageBoundsForItem(view, container, sceneItem) : undefined), row as unknown as Datum);
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

    // Size/position .dn-node to the real focused mark so a screen magnifier centers on it, not the
    // whole chart. An x-axis node gets its bounds from applyAxisFocus below (its own scenegraph read);
    // the dimension-root (whole-chart) node has no single mark, so it keeps the full-container default.
    const isAxisNode = getNodeRegion(node) === 'xAxis';
    const isLegendOverviewNode = getNodeRegion(node) === 'legend' && getLegendNodeLevel(node) !== 'bar';
    const view = getView();
    const contentBounds =
      !isAxisNode && !isLegendOverviewNode && view && markName && dimension
        ? resolveContentFocusBounds(view, container, node, markName, dimension, seriesField)
        : undefined;
    if (contentBounds) {
      positionOverlayAtBounds(el, contentBounds);
    } else {
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.top = '0';
      el.style.left = '0';
    }
    el.style.outline = 'none';
    el.style.boxShadow = 'none';

    el.addEventListener('keydown', (event) => {
      // Any further key press ends the toggle announcement a legend Space may set below.
      pendingLegendToggles.delete(container);
      // Legend series: Space runs the entry's own click, arrows follow the legend's rendered grid, and
      // Enter/Escape fall through to the structure (Enter drills into the series' bars unless it's hidden).
      const isLegendSeries = getNodeRegion(node) === 'legend' && getLegendNodeLevel(node) === 'series';
      const isChartLeaf = getNodeRegion(node) !== 'xAxis' && !isLegendOverviewNode && node.dimensionLevel == null;
      // Shift+F10 / ContextMenu: the keyboard right-click, for `rightClick` popovers and `onContextMenu`.
      if (isContextMenuKey(event) && (isLegendSeries || isChartLeaf)) {
        event.preventDefault();
        if (isLegendSeries) openLegendContextMenu(node);
        else openBarContextMenu(node);
        return;
      }
      if (isLegendSeries) {
        if (event.code === 'Space') {
          event.preventDefault();
          activateLegendEntry(node);
          return;
        }
        if (ARROW_KEYS.has(event.key)) {
          event.preventDefault();
          moveLegendSeries(node, event.key as ArrowKey);
          return;
        }
      }
      const isChartNode = getNodeRegion(node) !== 'xAxis' && !isLegendOverviewNode;
      // Enter/Space activate a focused leaf bar/segment — open its popover and fire its onClick, the
      // same as a real click. Enter still drills into non-leaves (they own a 'child' edge); leaves don't.
      if ((event.code === 'Enter' || event.code === 'Space') && isChartNode && node.dimensionLevel == null) {
        event.preventDefault();
        activateBar(node);
        return;
      }
      // Space on a whole stack opens its dimension-area popover (Enter keeps drilling into segments);
      // axis labels have no popover at all.
      if (event.code === 'Space') {
        event.preventDefault();
        if (isChartNode && node.dimensionLevel === 2) {
          openStackPopover(node);
        }
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
      const view = getView();
      const isAxisNode = getNodeRegion(node) === 'xAxis';
      const isLegendNode = getNodeRegion(node) === 'legend';
      // Set before applyFocusSignals's runAsync() so both flush together in one dataflow pulse.
      if (isAxisNode) {
        clearAxisFocusRing(legendFocusRing);
        if (view) setLegendHoveredSeries(view, legend, null);
        applyAxisFocus(node, el);
      } else if (isLegendNode) {
        clearAxisFocusRing(focusRing);
        applyLegendFocus(node, el);
      } else {
        clearAxisFocusRing(focusRing);
        clearAxisFocusRing(legendFocusRing);
        if (view) setLegendHoveredSeries(view, legend, null);
        if (view && markName && dimension) {
          applyHoverParitySignals(view, { markName, dimension, color: seriesField }, node);
        }
      }
      setKeyboardHoveredLegendSeries(isLegendNode && getLegendNodeLevel(node) === 'series' ? getLegendNodeSeries(node) : undefined);
      const signals = nodeFocusSignals(node);
      applyFocusSignals(view, signals)
        ?.then(() => {
          if (!view || isAxisNode) return;
          if (isLegendOverviewNode) {
            if (getLegendNodeLevel(node) === 'series') showLegendEntryTooltip(view, node);
            else hideFocusedItemTooltip(view);
            return;
          }
          if (!markName || !dimension) {
            showFocusedItemTooltip(container, view, `${markName ?? 'bar0'}_focusRing`, null);
            return;
          }
          showTooltipForFocusedNode(container, view, node, markName, dimension, series, metric, fieldLabels ?? {}, hasChartInspect ?? false);
        });
    });

    // Set before input.focus(): it synchronously fires the 'focus' listener above, which can
    // synchronously flush signal listeners (e.g. the mouse-hover guard) — current must already
    // reflect this node or a listener firing mid-transition reapplies the previous node's values.
    current = node.id;
    lastFocusedNodeIds.set(container, node.id);
    input.focus(renderId);

    // Remove the previous node AFTER moving focus, so its focusout carries the new node as
    // relatedTarget — keeping the focusout handler below from treating this as leaving the widget.
    if (previous && previous !== node.id) rendering.remove(previous);
  }

  // Clears only the visual focus indicators (Vega ring, hover parity, tooltip, axis ring), leaving the
  // focused node and `current` intact so Shift+Tab back into the widget restores focus to it.
  const clearFocusVisuals = () => {
    // Clear before nulling the hover signal: the guard keys off this to know focus has left, so it
    // won't re-apply the persisted node's dimming when it sees the signal go null.
    focusInsideWidget = false;
    const view = getView();
    hideFocusedItemTooltip(view);
    if (view && markName && dimension) {
      applyHoverParitySignals(view, { markName, dimension, color: seriesField }, null);
    }
    if (view) setLegendHoveredSeries(view, legend, null);
    setKeyboardHoveredLegendSeries(undefined);
    clearAxisFocusRing(focusRing);
    clearAxisFocusRing(legendFocusRing);
    applyFocusSignals(view, CLEARED_FOCUS);
  };

  // Full teardown: removes the focused node, restores the entry button to tab order, and clears the
  // visual indicators. Only for an explicit drill-out (the exit element), not a plain tab/click away.
  const clearFocusState = () => {
    if (current) rendering.remove(current);
    current = null;
    lastFocusedNodeIds.delete(container);
    if (rendering.entryButton) {
      (rendering.entryButton as HTMLButtonElement).tabIndex = 0;
    }
    clearFocusVisuals();
  };

  // Focus leaving the navigator entirely (tab/click away) clears only the visual indicators; the node
  // persists so Shift+Tab back returns to it (its `focus` listener re-applies the ring/signals). Moves
  // within the widget (node→node, node→exit) keep a relatedTarget inside the container and are ignored.
  rendering.wrapper?.addEventListener('focusout', (event) => {
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

  // Clicking a mark moves keyboard focus to the matching node (hover never does). On mousedown, so the
  // node is focused before a click opens its popover — popover focus-restore then returns here on close.
  if (view) {
    const previous = clickToFocusHandlers.get(view);
    if (previous) view.removeEventListener('mousedown', previous);
    const handleMousedown: ViewEventHandler = (event, item) => {
      const legendValue = legend && legendRegion ? legendValueForSceneItem(item, legend.name) : undefined;
      if (legendValue !== undefined) {
        focusLegendSeriesFromClick(event, legendValue);
        return;
      }
      const datum = item?.datum;
      if (!datum) return;
      // Overlay marks (e.g. a voronoi cell) wrap the real datum one level deeper.
      const nested = (datum as { datum?: Row }).datum;
      const nodeId =
        getNodeIdForDatum(chartType, datum as SimpleData, { dimension, seriesField }) ??
        (nested ? getNodeIdForDatum(chartType, nested as SimpleData, { dimension, seriesField }) : undefined);
      if (!nodeId || nodeId === current) return;
      const node = structure.nodes[nodeId];
      if (!node) return;
      // Prevent the browser's default mousedown focus, which would otherwise move focus off the node we
      // focus below (to the chart element or <body>) and immediately tear this focus state back down.
      (event as { preventDefault?: () => void })?.preventDefault?.();
      navigate(node);
      // The ensuing click opens this mark's popover, pulling focus into it. Suppress the resulting
      // focusout (as the keyboard path does) so the node survives for React Spectrum's focus-restore on close.
      if (hasChartPopover) {
        suppressNextLeave = true;
        if (keyboardPopoverComponentName && markName) keyboardPopoverComponentName.current = markName;
      }
    };
    view.addEventListener('mousedown', handleMousedown);
    clickToFocusHandlers.set(view, handleMousedown);
  }

  /** Clicking a legend entry focuses its series node, the same as clicking a bar focuses the bar. */
  function focusLegendSeriesFromClick(event: unknown, value: string) {
    const node = structure.nodes[prefixed('legend', legendSeriesId(value))];
    if (!node || node.id === current) return;
    (event as { preventDefault?: () => void })?.preventDefault?.();
    navigate(node);
    // The ensuing click may open the legend's popover; keep the node alive through it, as for bars.
    if (legend && getPopoverButton(chartId, legend.name)) {
      suppressNextLeave = true;
      if (keyboardPopoverComponentName) keyboardPopoverComponentName.current = legend.name;
    }
  }

  // Kept across re-attaches (a toggle can re-render more than once) until the next key press or a restore elsewhere.
  const pendingToggle = pendingLegendToggles.get(container);
  if (pendingToggle && pendingToggle.nodeId !== restoreId) pendingLegendToggles.delete(container);
  if (restoreId) {
    const restoreNode = structure.nodes[restoreId] ?? (entryPoint ? structure.nodes[entryPoint] : undefined);
    if (restoreNode) navigateRestored(restoreNode, pendingToggle);
  }

  /** Restores focus after a re-attach; right after a toggle, the node's name says what changed so it's announced once. */
  function navigateRestored(node: NodeObject, toggle: { nodeId: string; wasHidden: boolean } | undefined) {
    const toggledLabel = getLegendNodeToggledLabel(node);
    const wasToggled = toggle?.nodeId === node.id && toggle.wasHidden !== isLegendNodeHidden(node) && toggledLabel;
    if (!wasToggled || !node.semantics) {
      navigate(node);
      return;
    }
    const label = node.semantics.label;
    node.semantics.label = toggledLabel;
    navigate(node);
    // Only the restored node reads the toggle message; moving away and back reads the normal name.
    node.semantics.label = label;
  }
};
