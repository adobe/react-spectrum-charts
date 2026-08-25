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
import { View } from 'vega';

import { FOCUSED_DIMENSION, FOCUSED_ITEM, FOCUSED_REGION, FOCUSED_SERIES, HOVERED_SERIES } from '@spectrum-charts/constants';
import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { AxisRegionOptions, LegendRegionOptions, NavigableChartType, buildChartStructure } from './buildChartStructure';
import { clearAxisFocusRing, getVisibleAxisLabelColumns, setAxisFocusRing } from './axisLabelGeometry';
import { getNodeRegion, stripRegionPrefix } from './composeRegions';
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
  /** Optional chart title for the accessible description. */
  title?: string;
  /** When provided, adds a top-level, sibling-navigable x-axis region alongside chart content. */
  xAxis?: AxisRegionOptions;
  /** When provided, adds a top-level, sibling-navigable y-axis region alongside chart content. */
  yAxis?: AxisRegionOptions;
  /** When provided, adds a top-level, sibling-navigable legend region alongside chart content. */
  legend?: LegendRegionOptions;
  /** When false, the chart-content (bar) region is omitted so only auxiliary regions are navigable. Defaults to true. */
  content?: boolean;
  /** Stable id used to namespace the rendered nav elements. */
  chartId: string;
  /** Accessor for the live Vega view; focus signals are set on it as the user navigates. */
  getView: () => View | undefined;
}

interface FocusSignals {
  item: string | null; // a single bar / stacked segment
  region: string | null; // the whole chart (entry/root)
  dimension: string | null; // a dimension group, e.g. a whole stack
  series: string | null; // a legend entry
}

const CLEARED_FOCUS: FocusSignals = { item: null, region: null, dimension: null, series: null };

/**
 * Maps the focused node to the chart's focus signals, dispatching first on which top-level
 * region the node belongs to (chart content is untagged, for backward compatibility):
 *  - content, leaf (no dimensionLevel) → a single bar/segment (`item` = node id)
 *  - content, dimension root (level 1) → the chart overview (`region` = 'chart')
 *  - content, division (level 2)       → a dimension group / stack (`dimension` = the column value)
 *  - xAxis, leaf tick                  → reuses the same content signal a matching bar/stack would
 *    set (`item` for a plain bar, `dimension` for a stacked one), so browsing ticks highlights
 *    the corresponding chart content without a chart having to be multi-series aware.
 *  - legend (root or entry)             → sets `region` = 'legend' so a ring is drawn around the whole
 *    legend the entire time it's focused; a leaf entry also sets a dedicated `series` signal (kept
 *    separate from the externally-controlled highlightedSeries signal so keyboard focus can't clobber it)
 *  - yAxis root                         → descriptive only; no visual signal
 */
const nodeFocusSignals = (node: NodeObject, hasSeries: boolean): FocusSignals => {
  const region = getNodeRegion(node);

  if (region === 'xAxis') {
    if (node.dimensionLevel === 1) return CLEARED_FOCUS;
    return hasSeries ? { ...CLEARED_FOCUS, dimension: node.id } : { ...CLEARED_FOCUS, item: node.id };
  }
  if (region === 'legend') {
    // `region: 'legend'` draws the ring around the whole legend the entire time it's focused (root
    // and entries alike). On an entry we additionally set `series` to highlight that specific entry;
    // the Vega legend matches it on the raw series value (`FOCUSED_SERIES === datum.value`), so strip
    // the `legend::` namespace composeRegions added — the namespaced id never matches.
    const legendRegion: FocusSignals = { ...CLEARED_FOCUS, region: 'legend' };
    if (node.dimensionLevel === 1) return legendRegion;
    return { ...legendRegion, series: stripRegionPrefix(node) };
  }
  if (region === 'yAxis') {
    return CLEARED_FOCUS;
  }

  // region === 'content' (or untagged, when no other regions were composed in)
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

const applyFocusSignals = (
  view: View | undefined,
  { item, region, dimension, series }: FocusSignals,
  legendHoverSignal?: string
): void => {
  if (!view) return;

  view.signal(FOCUSED_ITEM, item);
  view.signal(FOCUSED_REGION, region);
  view.signal(FOCUSED_DIMENSION, dimension);
  view.signal(FOCUSED_SERIES, series);
  // Keyboard focus is a highlight behavior: focusing a legend entry activates the same series
  // highlight (dim others + bars) as hovering it, by driving the legend's hover signal.
  if (legendHoverSignal) {
    view.signal(legendHoverSignal, region === 'legend' && series != null ? series : null);
  }
  view.runAsync();
};

/**
 * Draws the axis focus ring around the focused x-axis label's real rendered bounds (read from the
 * scenegraph, primary + sublabel unioned). Only visible labels have a column, so an overlap-hidden or
 * non-axis node clears the ring.
 */
/** The bar dimension-hover signal to drive on axis focus (so focus highlights the bar like mouse hover). */
interface AxisHover {
  signal: string;
  dimension: string;
}

const applyAxisFocusRing = (view: View | undefined, node: NodeObject, axisHover?: AxisHover): void => {
  if (!view) return;
  const clearHover = (): void => {
    if (axisHover) view.signal(axisHover.signal, null);
  };
  if (getNodeRegion(node) === 'xAxis') {
    const columns = getVisibleAxisLabelColumns(view, 'bottom');
    if (columns.length) {
      // The union of all visible labels is the axis's real horizontal content extent (labels overflow
      // the data rect); clamp every ring to it so rings wrap the full labels without resizing the chart.
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
        // Axis-level focus: ring around the whole axis (the union); no single series to highlight.
        setAxisFocusRing(view, union, union.x1, union.x2);
        clearHover();
        return;
      }
      const value = stripRegionPrefix(node);
      const column = columns.find((c) => c.value === value);
      if (column) {
        // Highlight the focused label's bar, matching mouse hover.
        if (axisHover) view.signal(axisHover.signal, { [axisHover.dimension]: value });
        setAxisFocusRing(view, column.bounds, union.x1, union.x2);
        return;
      }
    }
  }
  clearAxisFocusRing(view);
  clearHover();
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
  title,
  xAxis,
  yAxis,
  legend,
  content,
  chartId,
  getView,
}: AttachDataNavigatorOptions): void => {
  // Restrict x-axis navigation to labels Vega actually painted, so overlap-hidden ticks are skipped
  // (their focus ring wouldn't render). Read from the live, laid-out scenegraph.
  const initialView = getView();
  const xAxisRegion =
    xAxis && initialView
      ? { ...xAxis, visibleValues: getVisibleAxisLabelColumns(initialView, 'bottom').map((column) => column.value) }
      : xAxis;

  const built = buildChartStructure({ chartType, data, dimension, color, metric, title, xAxis: xAxisRegion, yAxis, legend, content });
  if (!built) return;
  const { structure, entryPoint } = built;
  const hasSeries = color !== undefined;
  // When the legend has highlight enabled, focusing an entry drives its hover signal so the same
  // dimming as hover activates. Undefined otherwise (no hover signal exists in the spec).
  const legendHoverSignal = legend?.highlight ? `${legend.name ?? 'legend0'}_${HOVERED_SERIES}` : undefined;
  // Focusing an axis label drives the bar's dimension-hover signal, so keyboard focus highlights the bar
  // the same way mouse hover does (the built-in highlight is a mouseover behavior).
  const axisHover = xAxis?.dimensionHoverSignal ? { signal: xAxis.dimensionHoverSignal, dimension: xAxis.field } : undefined;

  if (!container.id) {
    container.id = `dn-root-${chartId}`;
  }

  container.querySelectorAll('.dn-wrapper, .dn-exit-position, .dn-exit').forEach((node) => node.remove());

  let current: string | null = null;
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

    const previous = current;

    const el = rendering.render({ renderId, datum: node });
    if (!el) return;

    // Visual focus comes from the Vega ring, so overlay the element across the whole container.
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.top = '0';
    el.style.left = '0';

    el.addEventListener('keydown', (event) => {
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
      applyFocusSignals(getView(), nodeFocusSignals(node, hasSeries), legendHoverSignal);
      applyAxisFocusRing(getView(), node, axisHover);
    });

    input.focus(renderId);
    current = node.id;

    // Remove the previously focused node AFTER moving focus to the new one, so the transient
    // `focusout` carries the new node as relatedTarget — keeping clearFocusIfLeft() (below) from
    // mistaking an internal move for the user leaving the widget.
    if (previous && previous !== node.id) rendering.remove(previous);
  }

  const clearFocusState = () => {
    if (current) rendering.remove(current);
    current = null;
    applyFocusSignals(getView(), CLEARED_FOCUS, legendHoverSignal);
    const view = getView();
    if (axisHover && view) view.signal(axisHover.signal, null);
    clearAxisFocusRing(view);
  };

  // When focus leaves the navigator entirely (Tab away or a mouse click elsewhere), clear the Vega
  // focus ring so it doesn't linger. Moves within the widget (node→node, node→exit) keep a
  // relatedTarget inside the container and are ignored.
  rendering.wrapper?.addEventListener('focusout', (event) => {
    const next = event.relatedTarget;
    if (next instanceof Node && container.contains(next)) return;
    clearFocusState();
  });

  if (rendering.exitElement) {
    rendering.exitElement.addEventListener('focus', clearFocusState);
  }
};
