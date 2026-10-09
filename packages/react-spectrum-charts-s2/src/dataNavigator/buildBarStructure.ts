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

import { DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_METRIC, NAVIGATION_ID_SEPARATOR, SERIES_ID } from '@spectrum-charts/core-s2/constants';
import { Orientation, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { getSeriesKey } from './barSeries.js';
import { addSiblingKeySynonyms, getBaseNavigationRules } from './navigationRules.js';
import { DEFAULT_DATA_NAVIGATOR_LOCALE, getDataNavigatorIntl } from './dataNavigatorIntl.js';

export interface BuildBarStructureOptions {
  /** The chart data (plain objects). */
  data: SimpleData[];
  /** The bar's category field (the stack/column for a stacked bar). Defaults to the standard categorical dimension. */
  dimension?: string;
  /** The series/color field, read as the series' name in labels. */
  color?: string;
  /** The field identifying each row's series (e.g. the series id joining every series facet). Defaults to `color`; when set, the bar is multi-series. */
  seriesField?: string;
  /** For a dodged-and-stacked bar, the fields splitting each category into side-by-side stacks. */
  dodgeFields?: string[];
  /** For a dodged-and-stacked bar, the fields that tell a stack's segments apart. */
  stackFields?: string[];
  /** Bar layout type. */
  type?: 'dodged' | 'stacked';
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
  /** The original value of each dimension value the chart parsed (keyed by `String(parsed)`), read in labels instead of the parsed value. */
  dimensionLabels?: Map<string, unknown>;
  /** Locale used when converting color values to accessible names. */
  locale?: string;
  /** Maps series values to their metric-axis titles for dual-metric-axis bars. */
  metricTitleBySeries?: Record<string, string>;
  /** Series toggled off via the legend. Their rows are excluded, since they aren't rendered. */
  hiddenSeries?: string[];
}

interface MetricSeriesLabel {
  metric: string;
  color: string;
  titleBySeries: Record<string, string>;
}

/** Data field that carries each bar's leaf id, always a string (data-navigator skips falsy ids such as a 0 dimension). */
const SEGMENT_ID_KEY = '_dnId';

/**
 * Converts a value to the string navigation keys it by; the spec's focus rings compare against `"" + value`, which matches.
 * @param value
 * @returns string
 */
export const toNavigationKey: (value: unknown) => string = String;

/**
 * The leaf id of a bar without a series; an empty dimension falls back to the separator, since data-navigator skips empty ids.
 * @param dimensionValue
 * @returns string
 */
export const barId = (dimensionValue: unknown): string => toNavigationKey(dimensionValue) || NAVIGATION_ID_SEPARATOR;

export const segmentId = (dimensionValue: unknown, seriesValue: unknown): string =>
  `${toNavigationKey(dimensionValue)}${NAVIGATION_ID_SEPARATOR}${toNavigationKey(seriesValue)}`;

/**
 * Converts a dimension value to its navigator key, or undefined if it can't be one.
 * @param value
 * @returns string | undefined
 */
export const toDimensionKey = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || value instanceof Date) return String(value);
  return undefined;
};

export interface BarStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

/** Orders one stack's segments in reading order: the topmost first for a vertical bar, the origin segment first for a horizontal bar. */
const orderStack = (rows: SimpleData[], orientation: Orientation, type: 'dodged' | 'stacked' | undefined, order?: string): SimpleData[] => {
  const isHorizontal = orientation === 'horizontal';
  if (order) {
    // Vega stacks a higher `order` further from the baseline; vertical reads from that (top) end, horizontal from the origin (left).
    const ascending = isHorizontal && type !== 'dodged';
    return [...rows].sort((a, b) => (ascending ? Number(a[order]) - Number(b[order]) : Number(b[order]) - Number(a[order])));
  }
  // No order field: Vega stacks the last-encountered row furthest out — reverse for vertical's top-first, keep as-is for horizontal's origin-first.
  return isHorizontal ? [...rows] : [...rows].reverse();
};

/** Groups rows by a key, keeping first-seen group order. */
const groupRows = (data: SimpleData[], keyOf: (row: SimpleData) => unknown): SimpleData[][] => {
  const groups = new Map<unknown, SimpleData[]>();
  for (const row of data) {
    const key = keyOf(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()];
};

/** Orders each stack's own segments (never the column order) so Enter reaches the reading-order-first one: the topmost segment for a vertical bar, the leftmost/origin segment for a horizontal bar. A dodged-and-stacked bar orders each category's side-by-side stacks by `dodgeFields`, then each stack's segments. */
export const orderStackSegments = (
  data: SimpleData[],
  dimension: string,
  orientation: Orientation,
  type: 'dodged' | 'stacked' | undefined,
  order?: string,
  seriesField?: string,
  dodgeFields?: string[]
): SimpleData[] => {
  if (dodgeFields?.length) return orderDodgedStacks(data, dimension, orientation, order, dodgeFields);
  if (type === 'dodged' && seriesField !== undefined) return orderDodgedBars(data, dimension, seriesField);
  return groupRows(data, (row) => row[dimension]).flatMap((rows) => orderStack(rows, orientation, type, order));
};

/** Orders each dodge group's bars by their series' first appearance in the data, the order Vega's `_position` band scale lays them out in (left-to-right, or top-to-bottom when horizontal). */
const orderDodgedBars = (data: SimpleData[], dimension: string, seriesField: string): SimpleData[] => {
  const seriesRank = new Map<unknown, number>();
  for (const row of data) {
    if (!seriesRank.has(row[seriesField])) seriesRank.set(row[seriesField], seriesRank.size);
  }
  return groupRows(data, (row) => row[dimension]).flatMap((rows) =>
    [...rows].sort((a, b) => (seriesRank.get(a[seriesField]) ?? 0) - (seriesRank.get(b[seriesField]) ?? 0))
  );
};

/** Orders each category's side-by-side stacks by their dodge group's first appearance (Vega's `_position` order), then each stack's segments. */
const orderDodgedStacks = (
  data: SimpleData[],
  dimension: string,
  orientation: Orientation,
  order: string | undefined,
  dodgeFields: string[]
): SimpleData[] => {
  const dodgeKey = (row: SimpleData) => getSeriesKey(row, dodgeFields);
  const dodgeRank = new Map<unknown, number>();
  for (const row of data) {
    if (!dodgeRank.has(dodgeKey(row))) dodgeRank.set(dodgeKey(row), dodgeRank.size);
  }
  return groupRows(data, (row) => row[dimension]).flatMap((rows) =>
    groupRows(rows, dodgeKey)
      .sort((a, b) => (dodgeRank.get(dodgeKey(a[0])) ?? 0) - (dodgeRank.get(dodgeKey(b[0])) ?? 0))
      .flatMap((stack) => orderStack(stack, orientation, 'stacked', order))
  );
};

/** Links two nodes with the supplied logical navigation directions. */
const addNavigationEdge = (structure: Structure, a: string, b: string, navigationRules: string[]): void => {
  const edgeId = `${a}<->${b}`;
  if (a === b) return;
  const reverseEdgeId = `${b}<->${a}`;
  const existingEdge = structure.edges[edgeId] ?? structure.edges[reverseEdgeId];
  if (existingEdge) {
    existingEdge.navigationRules = [...new Set([...existingEdge.navigationRules, ...navigationRules])];
    return;
  }
  structure.edges[edgeId] = { source: a, target: b, navigationRules: [...navigationRules] };
  structure.nodes[a]?.edges.push(edgeId);
  structure.nodes[b]?.edges.push(edgeId);
};

const hasNavigationEdge = (structure: Structure, a: string, b: string): boolean =>
  Boolean(structure.edges[`${a}<->${b}`] ?? structure.edges[`${b}<->${a}`]);

/** Keeps leaf-to-leaf group edges on the group-local logical axis. */
const applyWithinGroupNavigationRules = (structure: Structure, dimension: string, withinGroupRules: string[]): void => {
  for (const edge of Object.values(structure.edges)) {
    const source = typeof edge.source === 'string' ? structure.nodes[edge.source] : undefined;
    const target = typeof edge.target === 'string' ? structure.nodes[edge.target] : undefined;
    const isWithinGroup =
      source?.dimensionLevel == null &&
      target?.dimensionLevel == null &&
      source?.data?.[dimension] === target?.data?.[dimension];
    if (isWithinGroup) {
      edge.navigationRules = withinGroupRules;
    }
  }
};

/** Stacks in first-seen (column) order, each mapping its series value to that segment's node id. */
const buildColumnsBySeries = (
  orderedData: SimpleData[],
  dimension: string,
  color: string
): Map<unknown, Map<unknown, string>> => {
  const columns = new Map<unknown, Map<unknown, string>>();
  for (const row of orderedData) {
    const columnKey = row[dimension];
    const seriesToSegment = columns.get(columnKey) ?? new Map<unknown, string>();
    seriesToSegment.set(row[color], segmentId(columnKey, row[color]));
    columns.set(columnKey, seriesToSegment);
  }
  return columns;
};

/** Adjacent columns only (no wraparound): connects each series to its counterpart one column over. */
const wireAdjacentColumnNavigation = (
  structure: Structure,
  columns: Map<unknown, Map<unknown, string>>,
  type: 'dodged' | 'stacked',
  withinGroupRules: string[],
  betweenGroupRules: string[]
): void => {
  const columnList = [...columns.values()];
  for (let index = 0; index < columnList.length - 1; index++) {
    for (const [series, segId] of columnList[index]) {
      const neighbourSegId = columnList[index + 1].get(series);
      if (neighbourSegId && structure.nodes[segId] && structure.nodes[neighbourSegId]) {
        addNavigationEdge(structure, segId, neighbourSegId, betweenGroupRules);
      }
    }
    const currentSegments = [...columnList[index].values()];
    const nextSegments = [...columnList[index + 1].values()];
    const lastSegment = currentSegments.at(-1);
    const firstNextSegment = nextSegments[0];
    if (type === 'dodged' && lastSegment && firstNextSegment && !hasNavigationEdge(structure, lastSegment, firstNextSegment)) {
      addNavigationEdge(structure, lastSegment, firstNextSegment, withinGroupRules);
    }
  }
};

/** Adds within-group and cross-group navigation for multi-series bars. */
const wireSameSeriesStackNavigation = (
  structure: Structure,
  orderedData: SimpleData[],
  dimension: string,
  seriesField: string,
  type: 'dodged' | 'stacked'
): void => {
  // Logical left/right and up/down are mapped to physical keys by the chart orientation rules.
  const withinGroupRules = type === 'dodged' ? ['left', 'right'] : ['up', 'down'];
  const betweenGroupRules = type === 'dodged' ? ['up', 'down'] : ['left', 'right'];

  applyWithinGroupNavigationRules(structure, dimension, withinGroupRules);

  const columns = buildColumnsBySeries(orderedData, dimension, seriesField);
  wireAdjacentColumnNavigation(structure, columns, type, withinGroupRules, betweenGroupRules);
};

const removeEdge = (structure: Structure, edgeId: string): void => {
  const edge = structure.edges[edgeId];
  if (!edge) return;
  delete structure.edges[edgeId];
  for (const end of [edge.source, edge.target]) {
    const node = typeof end === 'string' ? structure.nodes[end] : undefined;
    if (node) node.edges = node.edges.filter((id) => id !== edgeId);
  }
};

/** Removes every edge between two leaf bars, keeping the dimension edges. */
const removeLeafEdges = (structure: Structure): void => {
  for (const [edgeId, edge] of Object.entries(structure.edges)) {
    const source = typeof edge.source === 'string' ? structure.nodes[edge.source] : undefined;
    const target = typeof edge.target === 'string' ? structure.nodes[edge.target] : undefined;
    if (source && target && source.dimensionLevel == null && target.dimensionLevel == null) removeEdge(structure, edgeId);
  }
};

interface StackSegment {
  id: string;
  stackKey: unknown;
}

/** Links each segment to the same segment in the next stack; stacks sharing none are still linked, so left/right never dead-ends. */
const linkAdjacentStacks = (structure: Structure, stack: StackSegment[], next: StackSegment[]): void => {
  let linked = false;
  for (const { id, stackKey } of stack) {
    const counterpart = next.find((candidate) => candidate.stackKey === stackKey);
    if (counterpart) {
      addNavigationEdge(structure, id, counterpart.id, ['left', 'right']);
      linked = true;
    }
  }
  if (!linked) addNavigationEdge(structure, stack[0].id, next[0].id, ['left', 'right']);
};

/** Dodged-and-stacked bars: logical up/down moves within a stack, left/right to the same segment in the next stack (across categories too). */
const wireDodgedStackNavigation = (
  structure: Structure,
  orderedData: SimpleData[],
  dimension: string,
  seriesField: string,
  dodgeFields: string[],
  stackFields: string[]
): void => {
  removeLeafEdges(structure);
  const stacks = groupRows(orderedData, (row) => `${row[dimension]}${NAVIGATION_ID_SEPARATOR}${getSeriesKey(row, dodgeFields)}`).map(
    (rows) => rows.map((row) => ({ id: segmentId(row[dimension], row[seriesField]), stackKey: getSeriesKey(row, stackFields) }))
  );
  for (const [index, stack] of stacks.entries()) {
    for (let segment = 0; segment < stack.length - 1; segment++) {
      addNavigationEdge(structure, stack[segment].id, stack[segment + 1].id, ['up', 'down']);
    }
    const next = stacks[index + 1];
    if (next) linkAdjacentStacks(structure, stack, next);
  }
};

export const buildBarStructure = ({
  data,
  dimension = DEFAULT_CATEGORICAL_DIMENSION,
  color,
  seriesField = color,
  dodgeFields,
  stackFields = [],
  type,
  colorOverride,
  metric = DEFAULT_METRIC,
  order,
  orientation = 'vertical',
  title,
  fieldLabels = {},
  dimensionLabels,
  locale = 'en-US',
  metricTitleBySeries,
  hiddenSeries = [],
}: BuildBarStructureOptions): BarStructure => {
  const effectiveType = type ?? 'stacked';
  const isMultiSeries = seriesField !== undefined;
  const isDodgedStacked = isMultiSeries && Boolean(dodgeFields?.length);
  // Zero-value and legend-hidden rows render nothing, so a mouse can't reach them and neither can navigation.
  const visibleData = data.filter(
    (d) => Number(d[metric]) !== 0 && !(seriesField !== undefined && hiddenSeries.includes(String(d[seriesField])))
  );
  const orderedData = isMultiSeries
    ? orderStackSegments(visibleData, dimension, orientation, effectiveType, order, seriesField, dodgeFields)
    : visibleData;
  const structureData = orderedData.map((d) => ({
    ...d,
    [SEGMENT_ID_KEY]: seriesField ? segmentId(d[dimension], d[seriesField]) : barId(d[dimension]),
  }));

  const navigationRules = getBaseNavigationRules(orientation);
  const structureOptions: StructureOptions = {
    data: structureData,
    idKey: SEGMENT_ID_KEY,
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
  if (isDodgedStacked && seriesField && dodgeFields) {
    wireDodgedStackNavigation(structure, orderedData, dimension, seriesField, dodgeFields, stackFields);
  } else if (isMultiSeries && seriesField) {
    wireSameSeriesStackNavigation(structure, orderedData, dimension, seriesField, effectiveType);
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
    metric,
    color,
    data: orderedData,
    rowsByDimension: orderedData.reduce((groups, row) => {
      const key = String(row[dimension]);
      const group = groups.get(key) ?? [];
      group.push(row);
      groups.set(key, group);
      return groups;
    }, new Map<string, SimpleData[]>()),
    fieldLabels,
    dimensionLabels,
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
  /** The bar's category field. Needed to look up a division (stack/group) node's own rows and to exclude it from each segment's own field list, since it's already stated once in the group's own label. Also used, with `metric`, to build the whole-chart root's fallback label. */
  dimension?: string;
  /** The bar's metric field. Used, with `dimension`, to build the whole-chart root's fallback label (e.g. "Downloads by Browser chart.") when the consumer doesn't supply an explicit `title`. */
  metric?: string;
  /** The bar's series/color field. When set, the whole-chart root's fallback label also names the series field and counts groups instead of bars. */
  color?: string;
  /** The chart's visible, ordered rows. Needed to build a division (stack/group) node's itemized segment summary, and to count bars/groups for the whole-chart root — a division's own `node.data` is data-navigator's internal bookkeeping, not the real rows. */
  data?: SimpleData[];
  /** Rows grouped by dimension value for division labels. */
  rowsByDimension?: Map<string, SimpleData[]>;
  /** Maps a data field to its display label. When set, a leaf's accessible name lists only these fields, labeled by their titles, instead of every raw field. */
  fieldLabels?: Record<string, string>;
  /** The original value of each dimension value the chart parsed (keyed by `String(parsed)`), read in labels instead of the parsed value. */
  dimensionLabels?: Map<string, unknown>;
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
export const buildFieldValueParts = (
  data: Record<string, unknown>,
  { dimension, fieldLabels = {}, dimensionLabels, colorOverride, order, metricSeriesLabel, locale = 'en-US' }: NodeLabelOptions,
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
          !excludeFields.includes(key) &&
          !key.startsWith('_') &&
          key !== SERIES_ID &&
          value != null &&
          typeof value !== 'object' &&
          typeof value !== 'function'
      );
  return entries
    .filter(([key]) => key !== order)
    .map(([key, value]) => {
      if (key === colorOverride) return `${fieldLabels[key] ?? 'Color'}: ${getAccessibleColorName(value, locale)}`;
      if (key === metricSeriesLabel?.metric) {
        const seriesTitle = metricSeriesLabel.titleBySeries[String(data[metricSeriesLabel.color])];
        if (seriesTitle) return `${seriesTitle}: ${value}`;
      }
      return `${fieldLabels[key] ?? key}: ${key === dimension ? getDimensionLabel(value, dimensionLabels) : value}`;
    });
};

/** A dimension value as the consumer supplied it, before the chart parsed it (e.g. a time dimension's date string). */
export const getDimensionLabel = (value: unknown, dimensionLabels?: Map<string, unknown>): unknown =>
  dimensionLabels?.has(String(value)) ? dimensionLabels.get(String(value)) : value;

/** Fallback label for the whole-chart root: a "metric by dimension" summary. */
const buildRootLabel = (node: NodeObject, options: NodeLabelOptions): string => {
  const { dimension, metric, color, data: rows, fieldLabels = {}, locale = DEFAULT_DATA_NAVIGATOR_LOCALE } = options;
  if (!dimension || !metric) return String(node.id);
  const { formatMessage } = getDataNavigatorIntl(locale);
  const count = rows ? new Set(rows.map((row) => row[dimension])).size : 0;
  const variables = { dimension: fieldLabels[dimension] ?? dimension, count, metricLabel: fieldLabels[metric] ?? metric };
  if (color) return formatMessage('bar.stackedDescription', { ...variables, color: fieldLabels[color] ?? color });
  return formatMessage('bar.description', variables);
};

/** Fallback label for a division (stack/group): its dimension value plus an itemized summary of its own segments. */
const buildDivisionLabel = (node: NodeObject, options: NodeLabelOptions): string => {
  const { dimension, data: rows, rowsByDimension, fieldLabels = {}, dimensionLabels } = options;
  if (!dimension || !rows) return String(node.id);
  // The division's own id is a data-navigator-internal composite, not the dimension value itself.
  const dimensionValue = node.derivedNode ? (node.data as Record<string, unknown> | undefined)?.[node.derivedNode] : undefined;
  const dimensionKey = toDimensionKey(dimensionValue);
  if (dimensionKey === undefined) return String(node.id);
  const groupRows = rowsByDimension?.get(dimensionKey) ?? rows.filter((row) => toDimensionKey(row[dimension]) === dimensionKey);
  if (groupRows.length === 0) return String(node.id);
  const header = `${fieldLabels[dimension] ?? dimension}: ${getDimensionLabel(dimensionKey, dimensionLabels)}.`;
  const segments = groupRows
    .map((row) => buildFieldValueParts(row as Record<string, unknown>, options, [dimension]))
    .filter((parts) => parts.length > 0)
    .map((parts) => `${parts.join(', ')}.`);
  return segments.length > 0 ? `${header} ${segments.join(' ')}` : header;
};

/** Fallback label for a leaf: its `field: value` pairs. */
const buildLeafLabel = (node: NodeObject, options: NodeLabelOptions): string => {
  const data = node.data as Record<string, unknown> | undefined;
  if (!data) return String(node.id);
  const parts = buildFieldValueParts(data, options);
  return parts.length > 0 ? `${parts.join('. ')}.` : String(node.id);
};

/**
 * Fallback label for a node with no consumer-supplied semantics (root, division, or leaf).
 * @param node
 * @param options
 * @returns string
 */
export const buildNodeLabel = (node: NodeObject, options: NodeLabelOptions = {}): string => {
  if (node.dimensionLevel === 1) return buildRootLabel(node, options);
  if (node.dimensionLevel != null) return buildDivisionLabel(node, options);
  return buildLeafLabel(node, options);
};

export const prepareNodeSemantics = (structure: Structure, options: NodeLabelOptions = {}): void => {
  for (const node of Object.values(structure.nodes)) {
    if (!node.semantics?.label) {
      node.semantics = { ...node.semantics, label: buildNodeLabel(node, options) };
    }
  }
};

export const isDualMetricAxisNavigation = (fields: {
  color?: unknown;
  lineType?: unknown;
  opacity?: unknown;
  dualMetricAxis?: boolean;
  trellis?: unknown;
  type?: string;
}): boolean => {
  const isDodgedAndStacked = [fields.color, fields.lineType, fields.opacity].some(
    (facet) => Array.isArray(facet) && facet.length === 2
  );
  return Boolean(fields.dualMetricAxis && !fields.trellis && fields.type === 'dodged' && !isDodgedAndStacked);
};
