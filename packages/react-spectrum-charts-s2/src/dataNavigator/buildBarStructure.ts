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
import dataNavigator, { NodeObject, Structure, StructureOptions } from 'data-navigator';
import { parseColor } from 'react-stately';

import { DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_METRIC, NAVIGATION_ID_SEPARATOR } from '@spectrum-charts/constants';
import { Orientation, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { addSiblingKeySynonyms, getBaseNavigationRules } from './navigationRules';

export interface BuildBarStructureOptions {
  /** The chart data (plain objects). */
  data: SimpleData[];
  /** The bar's category field (the stack/column for a stacked bar). Defaults to the standard categorical dimension. */
  dimension?: string;
  /** The series/color field. When set, the bar is multi-series (each column holds multiple segments). */
  color?: string;
  /** A per-datum color override field whose values are raw color strings. */
  colorOverride?: string;
  /** The bar's metric field. Rows with a value of exactly 0 are excluded from navigation — they render invisibly, so a mouse could never reach them either. */
  metric?: string;
  /** The stack sort field (matches the `order` prop on `<Bar>`) — determines which segment is reached first within a stack, mirroring Vega's own stack sort. */
  order?: string;
  /** Chart orientation. Swaps which arrow keys move between stacks vs. within a stack, since a horizontal bar's stacks run top-to-bottom. Defaults to vertical. */
  orientation?: Orientation;
  /** Already-localized label for the chart-root node, read verbatim from the consumer's `Chart.title` — this module never constructs narration strings itself. */
  title?: string;
  /** Maps a data field to its display label (axis/legend title). When set, a leaf's accessible name lists only these fields, labeled by their titles, instead of every raw field. */
  fieldLabels?: Record<string, string>;
  /** Locale used when converting color values to accessible names. */
  locale?: string;
  /** Maps series values to their metric-axis titles for dual-metric-axis bars. */
  metricTitleBySeries?: Record<string, string>;
}

interface MetricSeriesLabel {
  metric: string;
  color: string;
  titleBySeries: Record<string, string>;
}

/** Data field that carries the composite leaf id for multi-series (stacked/dodged) bars. */
const SEGMENT_ID_KEY = '_dnId';

export const segmentId = (dimensionValue: unknown, seriesValue: unknown): string =>
  `${dimensionValue}${NAVIGATION_ID_SEPARATOR}${seriesValue}`;

export interface BarStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

/** Orders each stack's own segments (never the column order) so Enter reaches the reading-order-first one: the topmost segment for a vertical bar, the leftmost/origin segment for a horizontal bar. */
const orderStackSegments = (
  data: SimpleData[],
  dimension: string,
  orientation: Orientation,
  order?: string
): SimpleData[] => {
  const groups = new Map<unknown, SimpleData[]>();
  for (const row of data) {
    const key = row[dimension];
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      groups.set(key, [row]);
    }
  }
  const isHorizontal = orientation === 'horizontal';
  const result: SimpleData[] = [];
  for (const rows of groups.values()) {
    let ordered: SimpleData[];
    if (order) {
      // Vega stacks a higher `order` further from the baseline; vertical reads from that (top) end, horizontal from the origin (left).
      ordered = [...rows].sort((a, b) =>
        isHorizontal ? Number(a[order]) - Number(b[order]) : Number(b[order]) - Number(a[order])
      );
    } else {
      // No order field: Vega stacks the last-encountered row furthest out — reverse for vertical's top-first, keep as-is for horizontal's origin-first.
      ordered = isHorizontal ? [...rows] : [...rows].reverse();
    }
    result.push(...ordered);
  }
  return result;
};

/** Links a segment to the matching-series segment in the neighbouring stack via a Left/Right sibling edge attached to both nodes. */
const addSameSeriesStackEdge = (structure: Structure, a: string, b: string): void => {
  const edgeId = `${a}<->${b}`;
  if (a === b || structure.edges[edgeId]) return;
  structure.edges[edgeId] = { source: a, target: b, navigationRules: ['left', 'right'] };
  structure.nodes[a]?.edges.push(edgeId);
  structure.nodes[b]?.edges.push(edgeId);
};

/** Rebinds segment-level Left/Right to cross into the same series in the adjacent stack, leaving Up/Down to move within the stack. */
const wireSameSeriesStackNavigation = (
  structure: Structure,
  orderedData: SimpleData[],
  dimension: string,
  color: string
): void => {
  // Up/Down already cover within-stack movement (addSiblingKeySynonyms added them), so free Left/Right
  // from the library's within-stack segment sibling edges for cross-stack use below.
  for (const edge of Object.values(structure.edges)) {
    const source = typeof edge.source === 'string' ? structure.nodes[edge.source] : undefined;
    const target = typeof edge.target === 'string' ? structure.nodes[edge.target] : undefined;
    const isSegmentSibling =
      source?.dimensionLevel == null && !!source?.data && target?.dimensionLevel == null && !!target?.data;
    if (isSegmentSibling && edge.navigationRules.includes('left')) {
      edge.navigationRules = edge.navigationRules.filter((rule) => rule !== 'left' && rule !== 'right');
    }
  }

  // Stacks in first-seen (column) order, each mapping its series value to that segment's node id.
  const columns = new Map<unknown, Map<unknown, string>>();
  for (const row of orderedData) {
    const columnKey = row[dimension];
    const seriesToSegment = columns.get(columnKey) ?? new Map<unknown, string>();
    seriesToSegment.set(row[color], segmentId(columnKey, row[color]));
    columns.set(columnKey, seriesToSegment);
  }

  // Adjacent columns only (no wraparound): connect each series to its counterpart one column over.
  const columnList = [...columns.values()];
  for (let index = 0; index < columnList.length - 1; index++) {
    for (const [series, segId] of columnList[index]) {
      const neighbourSegId = columnList[index + 1].get(series);
      if (neighbourSegId && structure.nodes[segId] && structure.nodes[neighbourSegId]) {
        addSameSeriesStackEdge(structure, segId, neighbourSegId);
      }
    }
  }
};

export const buildBarStructure = ({
  data,
  dimension = DEFAULT_CATEGORICAL_DIMENSION,
  color,
  colorOverride,
  metric = DEFAULT_METRIC,
  order,
  orientation = 'vertical',
  title,
  fieldLabels = {},
  locale = 'en-US',
  metricTitleBySeries,
}: BuildBarStructureOptions): BarStructure => {
  const isMultiSeries = color !== undefined;
  const idKey = isMultiSeries ? SEGMENT_ID_KEY : dimension;
  // Excluded so a zero-value row never gets a leaf node here — it's invisible, so a mouse can't reach it either.
  const visibleData = data.filter((d) => Number(d[metric]) !== 0);
  const orderedData = isMultiSeries ? orderStackSegments(visibleData, dimension, orientation, order) : visibleData;
  const structureData = color
    ? orderedData.map((d) => ({ ...d, [SEGMENT_ID_KEY]: segmentId(d[dimension], d[color]) }))
    : orderedData;

  const navigationRules = getBaseNavigationRules(orientation);
  const structureOptions: StructureOptions = {
    data: structureData,
    idKey,
    navigationRules,
    dimensions: {
      values: [
        {
          dimensionKey: dimension,
          type: 'categorical',
          // 'terminal': no wraparound; segment Left/Right is rebound to cross stacks in wireSameSeriesStackNavigation.
          behavior: { extents: 'terminal' },
          operations: { compressSparseDivisions: !isMultiSeries },
          navigationRules: {
            sibling_sibling: ['left', 'right'],
            parent_child: ['parent', 'child'],
          },
        },
      ],
    },
  };

  const structure = dataNavigator.structure(structureOptions);
  // Carry the oriented key mapping on the structure itself — the adapter reads it for keydown handling
  // and the no-axis path returns this structure directly (composeRegions overrides for the axis path).
  structure.navigationRules = navigationRules;
  addSiblingKeySynonyms(structure);
  if (isMultiSeries && color) {
    wireSameSeriesStackNavigation(structure, orderedData, dimension, color);
  }

  let entryPoint: string | undefined;
  if (structure.dimensions) {
    const firstKey = Object.keys(structure.dimensions)[0];
    const rootNodeId = structure.dimensions[firstKey]?.nodeId;
    entryPoint = rootNodeId;
    const rootNode = rootNodeId ? structure.nodes[rootNodeId] : undefined;
    if (rootNode && title) {
      rootNode.semantics = { label: title };
    }
  }

  // Every node rendered in keyboard mode needs an aria-label.
  prepareNodeSemantics(structure, {
    dimension,
    data: orderedData,
    fieldLabels,
    colorOverride,
    order,
    metricSeriesLabel: metricTitleBySeries && color ? { metric, color, titleBySeries: metricTitleBySeries } : undefined,
    locale,
  });

  return { structure, entryPoint };
};

/** Resolves a raw color value (e.g. a hex string) to a locale-aware human-readable name, falling back to the raw value if it can't be parsed as a color. */
const getAccessibleColorName = (value: unknown, locale: string): string => {
  try {
    return parseColor(String(value)).getColorName(locale);
  } catch {
    return String(value);
  }
};

export interface NodeLabelOptions {
  /** The bar's category field. Needed to look up a division (stack/group) node's own rows and to exclude it from each segment's own field list, since it's already stated once in the group's own label. */
  dimension?: string;
  /** The chart's visible, ordered rows. Needed to build a division (stack/group) node's itemized segment summary — a division's own `node.data` is data-navigator's internal bookkeeping, not the real rows. */
  data?: SimpleData[];
  /** Maps a data field to its display label. When set, a leaf's accessible name lists only these fields, labeled by their titles, instead of every raw field. */
  fieldLabels?: Record<string, string>;
  /** A per-datum color override field whose values are raw color strings, rendered via a locale-aware accessible color name instead of the raw value. */
  colorOverride?: string;
  /** The stack sort field (matches the `order` prop on `<Bar>`) — excluded from the label, since it's an internal sort key rather than a displayable value. */
  order?: string;
  /** Maps a leaf's series value to its metric-axis title, for dual-metric-axis bars. */
  metricSeriesLabel?: MetricSeriesLabel;
  /** Locale used when converting color values to accessible names. */
  locale?: string;
}

/** A row's `field: value` parts, limited to `fieldLabels` (and labeled by them) when provided, with color/metric-series overrides applied. `excludeFields` drops fields already stated elsewhere (e.g. a division's own dimension value). */
const buildFieldValueParts = (
  data: Record<string, unknown>,
  { fieldLabels = {}, colorOverride, order, metricSeriesLabel, locale = 'en-US' }: NodeLabelOptions,
  excludeFields: string[] = []
): string[] => {
  const labeledFields = Object.keys(fieldLabels).filter((field) => !excludeFields.includes(field));
  const includedFields = [
    ...new Set([...labeledFields, colorOverride, metricSeriesLabel?.metric].filter((field): field is string => field != null)),
  ].filter((field) => !excludeFields.includes(field));
  const entries: [string, unknown][] = labeledFields.length
    ? includedFields.filter((field) => data[field] != null).map((field) => [field, data[field]])
    : Object.entries(data).filter(
        ([key, value]) =>
          !excludeFields.includes(key) && !key.startsWith('_') && value != null && typeof value !== 'object' && typeof value !== 'function'
      );
  return entries
    .filter(([key]) => key !== order)
    .map(([key, value]) => {
      if (key === colorOverride) return `${fieldLabels[key] ?? 'Color'}: ${getAccessibleColorName(value, locale)}`;
      if (metricSeriesLabel && key === metricSeriesLabel.metric) {
        const seriesTitle = metricSeriesLabel.titleBySeries[String(data[metricSeriesLabel.color])];
        if (seriesTitle) return `${seriesTitle}: ${value}`;
      }
      return `${fieldLabels[key] ?? key}: ${value}`;
    });
};

/**
 * Fallback label for a node with no consumer-supplied semantics: a leaf's `field: value` pairs, a
 * division's dimension value plus an itemized summary of its own segments, or the bare node id for
 * the whole-chart root (no synthesized narration).
 */
export const buildNodeLabel = (node: NodeObject, options: NodeLabelOptions = {}): string => {
  if (node.dimensionLevel === 1) return String(node.id);

  if (node.dimensionLevel != null) {
    const { dimension, data: rows, fieldLabels = {} } = options;
    if (!dimension || !rows) return String(node.id);
    // The division's own id is a data-navigator-internal composite, not the dimension value itself.
    const dimensionValue = node.derivedNode ? (node.data as Record<string, unknown> | undefined)?.[node.derivedNode] : undefined;
    if (dimensionValue == null) return String(node.id);
    const groupRows = rows.filter((row) => String(row[dimension]) === String(dimensionValue));
    if (groupRows.length === 0) return String(node.id);
    const header = `${fieldLabels[dimension] ?? dimension}: ${dimensionValue}.`;
    const segments = groupRows
      .map((row) => buildFieldValueParts(row as Record<string, unknown>, options, [dimension]))
      .filter((parts) => parts.length > 0)
      .map((parts) => `${parts.join(', ')}.`);
    return segments.length > 0 ? `${header} ${segments.join(' ')}` : header;
  }

  const data = node.data as Record<string, unknown> | undefined;
  if (!data) return String(node.id);
  const parts = buildFieldValueParts(data, options);
  return parts.length > 0 ? `${parts.join('. ')}.` : String(node.id);
};

export const prepareNodeSemantics = (structure: Structure, options: NodeLabelOptions = {}): void => {
  for (const node of Object.values(structure.nodes)) {
    if (!node.semantics?.label) {
      node.semantics = { ...node.semantics, label: buildNodeLabel(node, options) };
    }
  }
};
