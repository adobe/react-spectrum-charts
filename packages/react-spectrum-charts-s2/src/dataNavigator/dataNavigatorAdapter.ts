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
import { Item, View } from 'vega';

import { FOCUSED_DIMENSION, FOCUSED_ITEM, FOCUSED_REGION, INTERACTION_MODALITY } from '@spectrum-charts/constants';
import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { clearHoverSignals } from '../utils';
import { NavigableChartType, buildChartStructure, getNodeIdForDatum } from './buildChartStructure';
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
  /** Whether the dimension field is time-scaled (line charts only; formats dates in accessible labels). */
  isTimeDimension?: boolean;
  /** Optional chart title for the accessible description. */
  title?: string;
  /** Stable id used to namespace the rendered nav elements. */
  chartId: string;
  /** Accessor for the live Vega view; focus signals are set on it as the user navigates. */
  getView: () => View | undefined;
  /** Called with the leaf datum when focus lands on one, and with undefined when focus leaves it. */
  onLeafFocus?: (datum: SimpleData | undefined) => void;
  /** Called with the leaf datum when Enter or Space is pressed while it's focused. */
  onActivate?: (datum: SimpleData) => void;
  /** Reads whether the chart's popover is open and, if not, when it last closed (ms, or null) — used to gate/suppress Escape's drill-out around a popover close. */
  getPopoverInfo?: () => { isOpen: boolean; closedAt: number | null };
  /**
   * Reads the navigable mark's base name (e.g. `line0`) and the spec's known signal names, used to
   * clear the mark's hover signals on mouseout. A getter (rather than plain values) so a hover-driven
   * re-render that recomputes these upstream doesn't tear down and rebuild the whole nav structure.
   */
  getHoverClearInfo?: () => { markName?: string; specSignalNames?: ReadonlySet<string> };
}

export interface AttachDataNavigatorHandle {
  /** Tears down the navigator's listeners. */
  destroy: () => void;
  /** Re-focuses whichever node is currently tracked as focused — used to restore focus after a popover closes. */
  refocusCurrent: () => void;
  /**
   * (Re-)registers the click/mouseout listeners onto the current view. Call again once the Vega
   * view becomes available after attach (it resolves asynchronously) instead of tearing down and
   * rebuilding the whole navigator, which would reset `current` and lose the tracked focus position.
   */
  attachViewListeners: () => void;
}

/** A leaf is an actual data point (bar/segment/line point), not a region or dimension group. */
const isLeafNode = (node: NodeObject): boolean => node.dimensionLevel == null;

interface FocusSignals {
  item: string | null; // a single bar / stacked segment
  region: string | null; // the whole chart (entry/root)
  dimension: string | null; // a dimension group, e.g. a whole stack
}

/**
 * Maps the focused node to the chart's focus signals by its level:
 *  - leaf (no dimensionLevel) → a single bar/segment (`item` = node id)
 *  - dimension root (level 1) → the chart overview (`region` = 'chart')
 *  - division (level 2)       → a dimension group / stack (`dimension` = the column value)
 */
const nodeFocusSignals = (node: NodeObject): FocusSignals => {
  if (node.dimensionLevel == null) {
    return { item: node.id, region: null, dimension: null };
  }
  if (node.dimensionLevel === 1) {
    return { item: null, region: 'chart', dimension: null };
  }
  const dimensionValue = node.derivedNode ? node.data?.[node.derivedNode] : undefined;
  const dimension = dimensionValue == null ? null : String(dimensionValue);
  return { item: null, region: null, dimension };
};

const applyFocusSignals = (view: View | undefined, { item, region, dimension }: FocusSignals): void => {
  if (!view) return;

  view.signal(FOCUSED_ITEM, item);
  view.signal(FOCUSED_REGION, region);
  view.signal(FOCUSED_DIMENSION, dimension);
  view.signal(INTERACTION_MODALITY, 'keyboard');
  view.runAsync();
};

const CLEARED_FOCUS: FocusSignals = { item: null, region: null, dimension: null };

/** How soon after a popover closes an Escape press is treated as part of the same close gesture. */
const ESCAPE_AFTER_POPOVER_CLOSE_SUPPRESSION_MS = 500;

/** vega-tooltip's default DOM element id for ChartInspect's rendered tooltip content. */
const CHART_INSPECT_TOOLTIP_ID = 'vg-tooltip-element';

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
  isTimeDimension,
  title,
  chartId,
  getView,
  onLeafFocus,
  onActivate,
  getPopoverInfo,
  getHoverClearInfo,
}: AttachDataNavigatorOptions): AttachDataNavigatorHandle => {
  const noopHandle: AttachDataNavigatorHandle = {
    destroy: () => undefined,
    refocusCurrent: () => undefined,
    attachViewListeners: () => undefined,
  };
  const built = buildChartStructure({ chartType, data, dimension, color, metric, isTimeDimension, title });
  if (!built) return noopHandle;
  const { structure, entryPoint } = built;

  if (!container.id) {
    container.id = `dn-root-${chartId}`;
  }

  container.querySelectorAll('.dn-wrapper, .dn-exit-position, .dn-exit').forEach((node) => node.remove());

  let current: string | null = null;
  const pendingBlurChecks = new Set<ReturnType<typeof setTimeout>>();
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
      height: 0,
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

    if (current) rendering.remove(current);

    const el = rendering.render({ renderId, datum: node });
    if (!el) return;

    // Visual focus comes from the Vega ring, so overlay the element across the whole container.
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.top = '0';
    el.style.left = '0';

    el.addEventListener('keydown', (event) => {
      // Enter/Space on a leaf activate it (open its popover) instead of drilling in — leaves have no 'child' edge, so this doesn't change non-leaf Enter behavior.
      if ((event.code === 'Enter' || event.code === 'Space') && isLeafNode(node)) {
        event.preventDefault();
        if (onActivate && node.data) onActivate(node.data as SimpleData);
        return;
      }
      // ChartInspect has no tracked "open" state (vega-tooltip just toggles a CSS class), so Escape checks its visibility directly and dismisses it before drilling out.
      if (event.code === 'Escape') {
        const tooltipEl = document.getElementById(CHART_INSPECT_TOOLTIP_ID);
        if (tooltipEl?.classList.contains('visible')) {
          tooltipEl.classList.remove('visible');
          event.preventDefault();
          return;
        }
      }
      // Escape closes an open popover, or is suppressed for a short grace window right after it closes, so a fast double-Escape doesn't also drill out a level.
      if (event.code === 'Escape') {
        const { isOpen, closedAt } = getPopoverInfo?.() ?? { isOpen: false, closedAt: null };
        const closedRecently = closedAt != null && Date.now() - closedAt < ESCAPE_AFTER_POPOVER_CLOSE_SUPPRESSION_MS;
        if (isOpen || closedRecently) {
          event.preventDefault();
          return;
        }
      }
      const direction = input.keydownValidator(event);
      if (!direction) return;
      event.preventDefault();
      // Final exit behavior is undecided, this is the current placeholder
      if (direction === 'parent' && current === entryPoint) {
        if (rendering.exitElement) {
          rendering.exitElement.style.display = 'block';
          input.focus(rendering.exitElement.id);
        }
        return;
      }
      const next = input.move(current, direction);
      if (next) navigate(next);
    });

    el.addEventListener('focus', () => {
      applyFocusSignals(getView(), nodeFocusSignals(node));
      onLeafFocus?.(isLeafNode(node) ? (node.data as SimpleData | undefined) : undefined);
    });

    // Deferred so a same-call synchronous re-focus (arrow/drill navigation) is seen first — this only fires for a genuine focus-left-the-navigator blur, and clears just the visual signals (not the node/`current`) so shift+Tab back re-applies them via the 'focus' listener above.
    el.addEventListener('blur', () => {
      const timeoutId = setTimeout(() => {
        pendingBlurChecks.delete(timeoutId);
        if ((document.activeElement as HTMLElement | null)?.classList.contains('dn-node')) return;
        // Skipped while a popover is open — its autofocus blurs this node too, but Navigator's isPopoverOpen effect already restores focus here once it closes.
        if (getPopoverInfo?.().isOpen) return;
        applyFocusSignals(getView(), CLEARED_FOCUS);
        onLeafFocus?.(undefined);
      }, 0);
      pendingBlurChecks.add(timeoutId);
    });

    input.focus(renderId);
    current = node.id;
  }

  if (rendering.exitElement) {
    rendering.exitElement.addEventListener('focus', () => {
      if (current) rendering.remove(current);
      current = null;
      applyFocusSignals(getView(), CLEARED_FOCUS);
      onLeafFocus?.(undefined);
    });
  }

  // Clicking a mark moves focus to match (hover never does); falls back to unwrapping `datum.datum` for overlay marks like a voronoi cell.
  const resolveNodeId = (datum: unknown): string | undefined =>
    datum ? getNodeIdForDatum(chartType, datum as SimpleData, { dimension, color }) : undefined;

  const handleClick = (_event: unknown, item?: Item | null) => {
    if (!item?.datum) return;
    const nodeId = resolveNodeId(item.datum) ?? resolveNodeId((item.datum as { datum?: unknown }).datum);
    if (!nodeId || nodeId === current) return;
    const node = structure.nodes[nodeId];
    if (node) navigate(node);
  };

  // Clears the mark's own hovered-item signal (not just modality) so leaving the chart hands the hover-look back to whatever is focused, restoring opacity faded by the last hover.
  const restoreFocusHoverLook = () => {
    const view = getView();
    if (!view) return;
    view.signal(INTERACTION_MODALITY, 'keyboard');
    const { markName, specSignalNames } = getHoverClearInfo?.() ?? {};
    if (markName && specSignalNames) {
      clearHoverSignals(view, markName, specSignalNames);
    }
    view.runAsync();
  };

  // Vega's mouseout `item` is ambiguous right at a mark's edge, so this is only a fast path for the common case — mouseleave/mouseover below are the unambiguous signals.
  const handleMouseOut = (_event: unknown, item?: Item | null) => {
    if (item) return;
    restoreFocusHoverLook();
  };

  // Moving onto another in-canvas element (legend, axis label) never fires mouseleave and can leave the mark's hovered-item signal stuck, so anything that isn't one of our navigable points is treated as no-longer-hovering.
  const handleMouseOver = (_event: unknown, item?: Item | null) => {
    if (!item?.datum) {
      restoreFocusHoverLook();
      return;
    }
    const nodeId = resolveNodeId(item.datum) ?? resolveNodeId((item.datum as { datum?: unknown }).datum);
    if (!nodeId) restoreFocusHoverLook();
  };

  // Unlike Vega's own mouseout, a native mouseleave on the container is purely position-based, so it isn't subject to the same edge-of-mark ambiguity.
  const handleContainerMouseLeave = () => restoreFocusHoverLook();
  container.addEventListener('mouseleave', handleContainerMouseLeave);

  // getView() can be undefined at attach time, so click/mouseout listeners are registered lazily via attachViewListeners() below rather than only here, letting the view resolve later without a rebuild.
  let registeredView: View | undefined;
  const attachViewListeners = (): void => {
    const view = getView();
    if (!view || view === registeredView) return;
    registeredView?.removeEventListener('click', handleClick);
    registeredView?.removeEventListener('mouseout', handleMouseOut);
    registeredView?.removeEventListener('mouseover', handleMouseOver);
    view.addEventListener('click', handleClick);
    view.addEventListener('mouseout', handleMouseOut);
    view.addEventListener('mouseover', handleMouseOver);
    registeredView = view;
  };
  attachViewListeners();

  return {
    destroy: () => {
      registeredView?.removeEventListener('click', handleClick);
      registeredView?.removeEventListener('mouseout', handleMouseOut);
      registeredView?.removeEventListener('mouseover', handleMouseOver);
      container.removeEventListener('mouseleave', handleContainerMouseLeave);
      pendingBlurChecks.forEach((timeoutId) => clearTimeout(timeoutId));
      pendingBlurChecks.clear();
    },
    refocusCurrent: () => {
      const node = current ? structure.nodes[current] : undefined;
      if (node) input.focus(node.renderId ?? node.id);
    },
    attachViewListeners,
  };
};
