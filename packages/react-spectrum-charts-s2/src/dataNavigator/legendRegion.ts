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

import { HOVERED_SERIES } from '@spectrum-charts/core-s2/constants';
import { NavigableLegend } from '@spectrum-charts/vega-spec-builder-s2';

import { getPopoverButton } from '../utils/markClickUtils.js';
import { dispatchViewEvent } from '../utils/viewEvents.js';
import { clearAxisFocusRing, padAxisBounds, setAxisFocusRing } from './axisLabelGeometry.js';
import {
  getLegendNodeContentId,
  getLegendNodeLevel,
  getLegendNodeSeries,
  getLegendNodeToggledLabel,
  isLegendNodeHidden,
  legendSeriesId,
} from './buildLegendStructure.js';
import { ChartRegion } from './chartRegion.js';
import { prefixed } from './composeRegions.js';
import { SceneNode, hideFocusedItemTooltip, showSceneItemTooltip } from './focusedItemTooltip.js';
import { ArrowKey, LegendEntry, findLegendNeighbor, getLegendBounds, getLegendEntries } from './legendGeometry.js';
import {
  CLEARED_FOCUS,
  ClickedItem,
  NavigationRegion,
  RegionContext,
  applyFocusSignals,
  logFocusError,
} from './navigationRegion.js';

export const LEGEND_REGION = 'legend';

export interface LegendRegionOptions extends RegionContext {
  legend: NavigableLegend;
  /** Series toggled off via the legend */
  hiddenSeries: string[];
  /** The chart content region, which a legend item's mark focus is delegated to */
  chartRegion: ChartRegion;
  /** Looks up a node of the composed structure */
  getNode: (id: string) => NodeObject | undefined;
  /** Moves focus to a node of the composed structure */
  moveTo: (node: NodeObject) => void;
}

const ARROW_KEYS = new Set<string>(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

/** The legend series each container last reported as hovered, so `mouseout` pairs with it across rebuilds. */
const hoveredSeriesByContainer = new WeakMap<HTMLElement, string>();

/** The series a clicked legend scene item (entry group, symbol or label) belongs to. */
const legendValueForItem = (item: ClickedItem, legendName: string): string | undefined => {
  const mark = item.mark;
  const isEntryGroup = mark?.name === `${legendName}_legendEntry`;
  if (!isEntryGroup && mark?.role !== 'legend-symbol' && mark?.role !== 'legend-label') return undefined;
  // An entry group's own datum only carries its index; its symbol/label children carry the value.
  const value = isEntryGroup ? item.items?.[0]?.items?.[0]?.datum?.value : item.datum?.value;
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : undefined;
};

/**
 * Creates the region for a categorical legend: its root and series ring the legend with a DOM overlay
 * and mirror hovering and clicking an entry; its items mirror the chart marks they stand for.
 * @param options
 * @returns NavigationRegion
 */
export const createLegendRegion = ({
  view,
  container,
  chartId,
  getActions,
  keepFocusThroughPopover,
  legend,
  hiddenSeries,
  chartRegion,
  getNode,
  moveTo,
}: LegendRegionOptions): NavigationRegion => {
  const focusRing = document.createElement('div');
  focusRing.className = 'dn-legend-focus-ring';
  focusRing.setAttribute('aria-hidden', 'true');
  container.appendChild(focusRing);

  const hoverSignal = `${legend.name}_${HOVERED_SERIES}`;
  const getEntries = (): LegendEntry[] => (view ? getLegendEntries(view, container, legend.name) : []);
  const findEntry = (node: NodeObject) => getEntries().find((entry) => entry.value === getLegendNodeSeries(node));
  const getContentNode = (node: NodeObject) => {
    const contentId = getLegendNodeContentId(node);
    return contentId ? getNode(contentId) : undefined;
  };

  /** Sets the legend's hover signal, which only exists when the legend highlights. */
  const setHoveredSeries = (value: string | null) => {
    if (!view || !legend.highlight) return;
    try {
      view.signal(hoverSignal, value);
    } catch {
      // absent on a rebuilding view
    }
  };

  /** Reports the hovered series through the legend's mouseover/mouseout, like moving the pointer between entries. */
  const reportHoveredSeries = (series: string | undefined) => {
    const previous = hoveredSeriesByContainer.get(container);
    if (previous === series) return;
    const entries = getEntries();
    if (previous !== undefined) {
      hoveredSeriesByContainer.delete(container);
      dispatchViewEvent(view, 'mouseout', entries.find((entry) => entry.value === previous)?.item);
    }
    const entry = entries.find((candidate) => candidate.value === series);
    if (series !== undefined && entry) {
      hoveredSeriesByContainer.set(container, series);
      dispatchViewEvent(view, 'mouseover', entry.item);
    }
  };

  /** Real legend hover doesn't highlight a toggled-off series either. */
  const highlightSeries = (node: NodeObject) => {
    const series = getLegendNodeLevel(node) === 'series' ? getLegendNodeSeries(node) : undefined;
    setHoveredSeries(series !== undefined && !hiddenSeries.includes(series) ? series : null);
  };

  const showEntryTooltip = (v: View, node: NodeObject) => {
    const entry = getLegendNodeLevel(node) === 'series' ? findEntry(node) : undefined;
    if (!entry || !showSceneItemTooltip(container, v, entry.item as SceneNode, entry.item.tooltip)) {
      hideFocusedItemTooltip(v);
    }
  };

  /** Keeps focus through the legend popover a click on the series opens, if it has one. */
  const keepFocusThroughLegendPopover = (trigger: 'click' | 'contextmenu' = 'click') => {
    if (!getPopoverButton(chartId, legend.name, trigger)) return;
    keepFocusThroughPopover();
    const { keyboardPopoverComponentName } = getActions();
    if (keyboardPopoverComponentName) keyboardPopoverComponentName.current = legend.name;
  };

  /** Runs the legend's own click (popover, onClick, toggle) for the series' entry. */
  const activateSeries = (node: NodeObject) => {
    const entry = findEntry(node);
    if (!entry) return;
    keepFocusThroughLegendPopover();
    dispatchViewEvent(view, 'click', entry.item);
  };

  /** Moves to the adjacent series in the legend's rendered grid, which wraps with its size. */
  const moveSeries = (node: NodeObject, key: ArrowKey) => {
    const series = getLegendNodeSeries(node);
    const next = series === undefined ? undefined : findLegendNeighbor(getEntries(), series, key);
    const nextNode = next === undefined ? undefined : getNode(prefixed(LEGEND_REGION, legendSeriesId(next)));
    if (nextNode) moveTo(nextNode);
  };

  const getRingBounds = (node: NodeObject) => {
    if (!view) return undefined;
    return getLegendNodeLevel(node) === 'series'
      ? findEntry(node)?.bounds
      : getLegendBounds(view, container, legend.name);
  };

  return {
    getBounds: (node) => {
      const contentNode = getContentNode(node);
      if (contentNode) return chartRegion.getBounds?.(contentNode);
      const bounds = getRingBounds(node);
      return bounds && padAxisBounds(bounds);
    },
    focus: (node, el) => {
      const contentNode = getContentNode(node);
      const series = getLegendNodeLevel(node) === 'series' ? getLegendNodeSeries(node) : undefined;
      reportHoveredSeries(series);
      if (contentNode) {
        clearAxisFocusRing(focusRing);
        setHoveredSeries(null);
        chartRegion.focus(contentNode, el);
        return;
      }
      chartRegion.clear();
      const bounds = getRingBounds(node);
      if (bounds) setAxisFocusRing(focusRing, bounds);
      else clearAxisFocusRing(focusRing);
      // Set before applyFocusSignals's runAsync() so both flush together in one dataflow pulse.
      highlightSeries(node);
      applyFocusSignals(view, CLEARED_FOCUS)
        ?.then(() => {
          if (view) showEntryTooltip(view, node);
        })
        .catch(logFocusError);
    },
    handleKey: (node, event) => {
      const contentNode = getContentNode(node);
      if (contentNode) return chartRegion.handleKey?.(contentNode, event) ?? false;
      if (getLegendNodeLevel(node) !== 'series') return false;
      if (event.code === 'Space') {
        activateSeries(node);
        return true;
      }
      if (ARROW_KEYS.has(event.key)) {
        moveSeries(node, event.key as ArrowKey);
        return true;
      }
      // Enter drills into the series' items; Escape returns to the legend root.
      return false;
    },
    findNode: (item) => {
      const value = legendValueForItem(item, legend.name);
      const nodeId = value === undefined ? undefined : prefixed(LEGEND_REGION, legendSeriesId(value));
      return nodeId && getNode(nodeId) ? nodeId : undefined;
    },
    getClickPopover: (node) => {
      const contentNode = getContentNode(node);
      if (contentNode) return chartRegion.getClickPopover?.(contentNode);
      return getPopoverButton(chartId, legend.name) ? legend.name : undefined;
    },
    getRestoredLabel: (node, previous) =>
      getLegendNodeLevel(node) === 'series' && isLegendNodeHidden(node) !== isLegendNodeHidden(previous)
        ? getLegendNodeToggledLabel(node)
        : undefined,
    restoreSignals: legend.highlight ? [hoverSignal] : undefined,
    restore: (node) => {
      const contentNode = getContentNode(node);
      if (contentNode) {
        chartRegion.restore?.(contentNode);
        return;
      }
      view?.runAfter((v) => {
        highlightSeries(node);
        v.runAsync().catch(logFocusError);
      });
    },
    clear: () => {
      clearAxisFocusRing(focusRing);
      setHoveredSeries(null);
      reportHoveredSeries(undefined);
    },
    destroy: () => focusRing.remove(),
  };
};
