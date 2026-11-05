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

import { COMPONENT_NAME, MARK_ID, SELECTED_ITEM } from '@spectrum-charts/core-s2/constants';
import { Datum, MarkBounds, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { triggerPopover } from '../utils/markClickUtils.js';
import { Row } from './barHoverParity.js';
import { barNavStrategy } from './barNavStrategy.js';
import { toNavigationKey } from './buildBarStructure.js';
import { NavigableChartType, getNodeIdForDatum } from './buildChartStructure.js';
import { ChartNavStrategy, StrategyContext } from './chartNavStrategy.js';
import { hideFocusedItemTooltip } from './focusedItemTooltip.js';
import {
  CLEARED_FOCUS,
  FocusSignals,
  NavigationRegion,
  RegionContext,
  applyFocusSignals,
  logFocusError,
} from './navigationRegion.js';

const chartNavStrategies: Record<NavigableChartType, ChartNavStrategy> = {
  bar: barNavStrategy,
};

export interface ChartRegionOptions extends RegionContext {
  chartType: NavigableChartType;
  /** The navigable mark's name, e.g. `bar0` */
  markName?: string;
  dimension?: string;
  /** The field a row's series is keyed by */
  seriesField?: string;
  /** Series fields a leaf's tooltip lists */
  seriesLabelFields: string[];
  metric?: string;
  /** Maps a data field to its axis/legend title */
  fieldLabels: Record<string, string>;
  /** Whether the mark has a ChartInspect, which renders the full datum */
  hasChartInspect: boolean;
}

/** The chart content region, plus a dimension highlight other regions (e.g. an axis tick) can drive. */
export interface ChartRegion extends NavigationRegion {
  /** Highlights the node's dimension value like hovering its axis label, or clears it for `null` */
  highlightDimension?: (node: NodeObject | null) => void;
}

/**
 * Maps a focused content node to the chart's focus signals:
 *  - leaf (no dimensionLevel)   → a single bar/segment (`item` = node id)
 *  - dimension root (level 1)   → the chart overview (`region` = 'chart')
 *  - division (level 2)         → a dimension group / stack (`dimension` = the column value)
 * @param node
 * @returns FocusSignals
 */
const nodeFocusSignals = (node: NodeObject): FocusSignals => {
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

/**
 * Creates the region for the chart's own marks: focusing a node mirrors hovering it, and Enter/Space mirror clicking it.
 * @param options
 * @returns ChartRegion
 */
export const createChartRegion = ({
  view,
  container,
  chartId,
  getActions,
  keepFocusThroughPopover,
  chartType,
  markName,
  dimension,
  seriesField,
  seriesLabelFields,
  metric,
  fieldLabels,
  hasChartInspect,
}: ChartRegionOptions): ChartRegion => {
  const strategy = chartNavStrategies[chartType];
  const ctx: StrategyContext | undefined =
    markName && dimension ? { markName, dimension, color: seriesField, metric } : undefined;

  const showTooltip = (v: View, node: NodeObject, context: StrategyContext) => {
    if (node.dimensionLevel == null) {
      // Leaf: full datum for ChartInspect, otherwise a clean axis-titled subset.
      const row = strategy.findLeafRow(v, node, context);
      const fields = [context.dimension, ...seriesLabelFields, metric];
      const value = row ? buildLeafTooltipValue(row, context.markName, hasChartInspect, fieldLabels, fields) : null;
      strategy.showLeafTooltip(container, v, row, value, context);
    } else if (node.dimensionLevel === 1) {
      strategy.showLeafTooltip(container, v, undefined, null, context);
    } else {
      strategy.showDivisionTooltip(container, v, node, context);
    }
  };

  /** Sets the shared context refs and triggers the popover through the same DOM-button-click a real click uses. */
  const openPopover = (row: Row, bounds: MarkBounds) => {
    const { selectedData, selectedDataBounds, selectedDataName, keyboardPopoverComponentName } = getActions();
    if (!markName || !selectedData || !selectedDataBounds || !selectedDataName) return;
    selectedData.current = { ...row, [COMPONENT_NAME]: markName } as unknown as Datum;
    selectedDataBounds.current = bounds;
    selectedDataName.current = markName;
    if (keyboardPopoverComponentName) keyboardPopoverComponentName.current = markName;
    if (triggerPopover(chartId, markName, 'click')) {
      keepFocusThroughPopover();
      view?.signal(SELECTED_ITEM, row[MARK_ID] ?? null);
      // Tells the popover's close handler hover-parity is still owned by keyboard focus (see keyboardPopoverComponentName's doc).
    } else if (keyboardPopoverComponentName) {
      keyboardPopoverComponentName.current = null;
      selectedData.current = null;
      selectedDataName.current = '';
    }
  };

  /** Activates a focused leaf — opens its popover (if any) and fires its `onClick` (if any), the same pair a real click runs. */
  const activate = (node: NodeObject) => {
    if (!view || !ctx) return;
    const row = strategy.findLeafRow(view, node, ctx);
    if (!row) return;
    const bounds = strategy.resolveLeafPopoverBounds(view, row, ctx);
    if (bounds) openPopover(row, bounds);
    getActions().onNodeClick?.(row as unknown as Datum);
  };

  const openDivisionPopover = (node: NodeObject) => {
    if (!view || !ctx) return;
    const popover = strategy.resolveDivisionPopover?.(view, node, ctx);
    if (popover) openPopover(popover.row, popover.bounds);
  };

  return {
    getBounds: (node) => {
      // The dimension root (whole chart) has no single mark.
      if (!view || !ctx || node.dimensionLevel === 1) return undefined;
      if (node.dimensionLevel != null) return strategy.resolveDivisionBounds(view, container, node, ctx);
      const row = strategy.findLeafRow(view, node, ctx);
      return row ? strategy.resolveLeafBounds(view, container, row, ctx) : undefined;
    },
    focus: (node) => {
      // Set before applyFocusSignals's runAsync() so both flush together in one dataflow pulse.
      if (view && ctx) strategy.applyFocusedLook(view, node, ctx);
      applyFocusSignals(view, nodeFocusSignals(node))
        ?.then(() => {
          if (!view) return;
          if (ctx) showTooltip(view, node, ctx);
          else hideFocusedItemTooltip(view);
        })
        .catch(logFocusError);
    },
    handleKey: (node, event) => {
      if (event.code !== 'Enter' && event.code !== 'Space') return false;
      // Enter/Space activate a leaf, the same as a real click. Enter still drills into non-leaves.
      if (node.dimensionLevel == null) {
        activate(node);
        return true;
      }
      // Space on a division opens its popover; Enter keeps drilling into its leaves.
      if (event.code === 'Space') {
        if (node.dimensionLevel === 2) openDivisionPopover(node);
        return true;
      }
      return false;
    },
    findNode: ({ datum }) => {
      if (!datum) return undefined;
      const options = { dimension, seriesField };
      return (
        getNodeIdForDatum(chartType, datum as SimpleData, options) ??
        (datum.datum ? getNodeIdForDatum(chartType, datum.datum as SimpleData, options) : undefined)
      );
    },
    getClickPopover: () => (getActions().hasChartPopover ? markName : undefined),
    restoreSignals: view && ctx ? strategy.getHoverSignals?.(ctx) : undefined,
    restore: (node) => {
      if (!view || !ctx) return;
      strategy.applyFocusedLook(view, node, ctx);
      view.runAfter((v) => {
        v.runAsync()
          .then(() => showTooltip(v, node, ctx))
          .catch(logFocusError);
      });
    },
    clear: () => {
      if (view && ctx) strategy.applyFocusedLook(view, null, ctx);
    },
    highlightDimension: view && ctx ? (node) => strategy.applyFocusedLook(view, node, ctx, true) : undefined,
  };
};
