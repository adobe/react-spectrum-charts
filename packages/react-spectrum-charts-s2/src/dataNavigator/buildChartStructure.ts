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
import { Structure } from 'data-navigator';

import { DEFAULT_CATEGORICAL_DIMENSION } from '@spectrum-charts/core-s2/constants';
import { Orientation, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { AxisFieldType, buildAxisStructure } from './buildAxisStructure.js';
import { barId, buildBarStructure, segmentId, toDimensionKey } from './buildBarStructure.js';
import { LegendSeriesDescription, buildLegendStructure } from './buildLegendStructure.js';
import { NamedRegion, RegionLink, composeRegions } from './composeRegions.js';
import { getBaseNavigationRules } from './navigationRules.js';

export type NavigableChartType = 'bar';

export interface AxisRegionOptions {
  /** The field this axis represents — the dimension for a categorical x-axis. */
  field: string;
  /** Whether the axis's tick nodes are discrete category values or generated numerical steps. */
  type: AxisFieldType;
  /** Optional axis title (falls back to the field name in generated labels). */
  title?: string;
  /** The rendered (non-overlap-hidden) tick values from the scenegraph; navigation is restricted to these. */
  visibleValues?: string[];
}

export interface LegendRegionOptions {
  /** The legend's rendered entry values, in layout order. */
  series: string[];
  /** Optional legend title for the region's accessible name. */
  title?: string;
  /** Series value → the label the legend displays for it. */
  labels?: Record<string, string>;
  /** Series value → its legend description and optional tooltip title. */
  descriptions?: Record<string, LegendSeriesDescription>;
  /** The fields each entry value joins (with " | "), e.g. the legend's `keys` or its facet fields. Defaults to the series field. */
  entryFields?: string[];
  /** Where the legend sits relative to the plot; the arrow pointing that way from the chart moves to it. Defaults to bottom. */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface ChartStructureOptions {
  /** The chart type to build a navigation structure for. */
  chartType: NavigableChartType;
  /** Chart data (plain objects). */
  data: SimpleData[];
  /** Primary categorical / x-axis field (e.g. bar category). */
  dimension?: string;
  /** Series / color field, read as the series' name in labels. */
  color?: string;
  /** The field identifying each row's series (the series id when several facets divide the series). Defaults to `color`; when set on a bar, the chart is multi-series. */
  seriesField?: string;
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
  /** Optional chart title for the accessible description. */
  title?: string;
  /** Maps a data field to its axis/legend title, so a focused leaf's accessible name reads as the chart's titles. */
  fieldLabels?: Record<string, string>;
  /** The original value of each dimension value the chart parsed (keyed by `String(parsed)`), read in labels instead of the parsed value. */
  dimensionLabels?: Map<string, unknown>;
  /** Per-series metric-axis titles for dual-metric-axis bars. */
  metricTitleBySeries?: Record<string, string>;
  /** When provided, adds an x-axis region below chart content (Down moves to it, Up comes back). */
  xAxis?: AxisRegionOptions;
  /** When provided (and the bar has a series), adds a legend region at its position: series, then that series' bars. */
  legend?: LegendRegionOptions;
  /** Series toggled off via the legend; excluded from chart content and not drillable from the legend. */
  hiddenSeries?: string[];
}

export interface ChartStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

const contentStructureBuilders: Record<NavigableChartType, (options: ChartStructureOptions) => ChartStructure> = {
  bar: buildBarStructure,
};

/**
 * The leaf node id for a clicked mark's datum, matching how the content builder keys its leaves — so a
 * mouse click can move keyboard focus to the same node. Returns undefined when the datum isn't a
 * navigable leaf (e.g. an axis label or a stack's padding area).
 */
export const getNodeIdForDatum = (
  chartType: NavigableChartType,
  datum: SimpleData,
  { dimension = DEFAULT_CATEGORICAL_DIMENSION, seriesField }: { dimension?: string; seriesField?: string }
): string | undefined => {
  if (chartType !== 'bar') return undefined;
  const dimensionKey = toDimensionKey(datum[dimension]);
  if (dimensionKey === undefined) return undefined;
  // Stacked leaves are keyed by dimension+series; a padding-area datum has no series, so it won't match.
  if (seriesField !== undefined) {
    return datum[seriesField] == null ? undefined : segmentId(dimensionKey, datum[seriesField]);
  }
  return barId(dimensionKey);
};

const LEGEND_KEYS = { top: 'ArrowUp', bottom: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' } as const;

/**
 * Spatial moves between region roots: the x-axis sits below the chart, and the legend on its own side.
 * A bottom legend sits below the x-axis when there is one.
 */
const getRegionLinks = (regions: NamedRegion[], legendPosition: LegendRegionOptions['position'] = 'bottom'): RegionLink[] => {
  const hasRegion = (name: string) => regions.some((region) => region.name === name);
  const links: RegionLink[] = [];
  if (hasRegion('xAxis')) links.push({ from: 'content', to: 'xAxis', key: 'ArrowDown' });
  if (hasRegion('legend')) {
    const from = legendPosition === 'bottom' && hasRegion('xAxis') ? 'xAxis' : 'content';
    links.push({ from, to: 'legend', key: LEGEND_KEYS[legendPosition] });
  }
  return links;
};

export const buildChartStructure = (options: ChartStructureOptions): ChartStructure | undefined => {
  const buildContent = contentStructureBuilders[options.chartType];
  if (!buildContent) return undefined;
  const content = buildContent(options);

  const regions: NamedRegion[] = [
    { name: 'content', structure: content.structure, entryPoint: content.entryPoint, namespace: false },
  ];
  if (options.xAxis) {
    const xAxis = buildAxisStructure({ data: options.data, ...options.xAxis });
    // No navigable ticks (e.g. none of the axis's values are currently painted, or the region was wired
    // to a mismatched axis): skip the axis region rather than letting composeRegions throw on it.
    if (xAxis.entryPoint) regions.push({ name: 'xAxis', structure: xAxis.structure, entryPoint: xAxis.entryPoint });
  }
  const seriesField = options.seriesField ?? options.color;
  if (options.legend && seriesField) {
    const { series, title, labels, descriptions, entryFields } = options.legend;
    const legend = buildLegendStructure({ ...options, seriesField, entryFields, series, title, labels, descriptions });
    if (legend.entryPoint) regions.push({ name: 'legend', structure: legend.structure, entryPoint: legend.entryPoint });
  }

  if (regions.length === 1) return content;
  return composeRegions(regions, getRegionLinks(regions, options.legend?.position), getBaseNavigationRules(options.orientation));
};
