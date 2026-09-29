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
import { NodeObject, Structure } from 'data-navigator';

import { DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_METRIC, NAVIGATION_ID_SEPARATOR } from '@spectrum-charts/constants';
import { Orientation, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { buildFieldValueParts, buildNodeLabel, orderStackSegments, segmentId } from './buildBarStructure';
import { DEFAULT_DATA_NAVIGATOR_LOCALE, getDataNavigatorIntl } from './dataNavigatorIntl';
import { getBaseNavigationRules } from './navigationRules';

export interface BuildLegendStructureOptions {
  /** The chart data (plain objects). */
  data: SimpleData[];
  /** The bar's category field. */
  dimension?: string;
  /** The series/color field, read as the series' name in labels. */
  color?: string;
  /** The field identifying each row's series (matching chart content's leaf ids and the chart's hidden-series filter). Defaults to `color`. */
  seriesField?: string;
  /** The fields each legend entry value joins with " | " (its facet fields, or `keys`). Defaults to the series field. */
  entryFields?: string[];
  /** For a dodged-and-stacked bar, the fields splitting each category into side-by-side stacks. */
  dodgeFields?: string[];
  /** The bar's metric field. Zero-value rows are excluded, matching chart-content navigation. */
  metric?: string;
  /** Bar layout type. */
  type?: 'dodged' | 'stacked';
  /** The stack sort field, so moving between series follows the rendered segment order. */
  order?: string;
  /** Chart orientation; drives the physical keys for the logical bar-level axes. */
  orientation?: Orientation;
  /** The legend's rendered entries, in layout order. */
  series: string[];
  /** Series toggled off via the legend: still navigable (so they can be toggled back on) but not drillable. */
  hiddenSeries?: string[];
  /** Legend title, used in the root's and series' accessible names. */
  title?: string;
  /** Series value → the label the legend displays for it (`legendLabels`), so the name matches what's on screen. */
  labels?: Record<string, string>;
  /** Series value → its legend description (`descriptions`) and optional tooltip title, read after the series' name. */
  descriptions?: Record<string, LegendSeriesDescription>;
  /** Maps a data field to its axis/legend title for accessible names. */
  fieldLabels?: Record<string, string>;
  /** The original value of each dimension value the chart parsed (keyed by `String(parsed)`), read in labels instead of the parsed value. */
  dimensionLabels?: Map<string, unknown>;
  /** Per-datum color override field used in accessible bar labels. */
  colorOverride?: string;
  /** Locale for accessible names. */
  locale?: string;
  /** Per-series metric-axis titles for dual-metric-axis bars. */
  metricTitleBySeries?: Record<string, string>;
}

export interface LegendSeriesDescription {
  description: string;
  title?: string;
}

export interface LegendStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

/** Which layer of the legend region a node belongs to. */
export type LegendNodeLevel = 'root' | 'series' | 'bar';

export const LEGEND_ROOT_ID = 'root';

export const legendSeriesId = (series: string): string => `series${NAVIGATION_ID_SEPARATOR}${series}`;

export const legendBarId = (dimensionValue: unknown, series: string): string =>
  `bar${NAVIGATION_ID_SEPARATOR}${segmentId(dimensionValue, series)}`;

export const getLegendNodeLevel = (node: NodeObject): LegendNodeLevel | undefined => node.legendLevel as LegendNodeLevel | undefined;

/** The series value a legend series/bar node represents. */
export const getLegendNodeSeries = (node: NodeObject): string | undefined => node.series as string | undefined;

/** Whether a legend series node is currently toggled off. */
export const isLegendNodeHidden = (node: NodeObject): boolean => node.hidden === true;

/** A series node's name for the focus restored right after it was toggled (e.g. "Windows hidden."). */
export const getLegendNodeToggledLabel = (node: NodeObject): string | undefined => node.toggledLabel as string | undefined;

/** The chart-content leaf id a legend bar node mirrors, so the bar's own focus ring and hover state apply. */
export const getLegendNodeContentId = (node: NodeObject): string | undefined => node.contentId as string | undefined;

const addEdge = (structure: Structure, source: string, target: string, navigationRules: string[]): void => {
  const edgeId = `${source}->${target}`;
  structure.edges[edgeId] = { source, target, navigationRules };
  structure.nodes[source].edges.push(edgeId);
  structure.nodes[target].edges.push(edgeId);
};

/** Links a parent to every child for Escape, and to the first child only for Enter. */
const addParentEdges = (structure: Structure, parent: string, children: string[]): void => {
  children.forEach((child, index) => addEdge(structure, parent, child, index === 0 ? ['child', 'parent'] : ['parent']));
};

const uniqueInOrder = (values: unknown[]): unknown[] => [...new Set(values)];

/** Ends a free-text sentence with a period unless it already ends in punctuation. */
const asSentence = (text: string): string => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

/** A row's legend entry value: its entry fields' values joined the way the legend spec joins them. */
const getRowEntryValue = (row: SimpleData, entryFields: string[]): string =>
  entryFields.map((field) => String(row[field])).join(' | ');

/**
 * Builds the legend region: root → series (one per rendered entry) → that series' bars. Series-level
 * arrow keys are resolved live from the legend's rendered grid by the adapter (see `findLegendNeighbor`),
 * so no series↔series edges are built here. Bar-level edges use the same logical axes for stacked and
 * dodged bars: `left`/`right` moves along categories within the series, `up`/`down` to the same category
 * in the adjacent series (in rendered segment order); the chart orientation maps them to physical keys.
 */
export const buildLegendStructure = ({
  data,
  dimension = DEFAULT_CATEGORICAL_DIMENSION,
  color,
  seriesField = color,
  entryFields: entryFieldsOption,
  dodgeFields,
  metric = DEFAULT_METRIC,
  type,
  order,
  orientation = 'vertical',
  series,
  hiddenSeries = [],
  title,
  labels = {},
  descriptions = {},
  fieldLabels = {},
  dimensionLabels,
  colorOverride,
  locale = DEFAULT_DATA_NAVIGATOR_LOCALE,
  metricTitleBySeries,
}: BuildLegendStructureOptions): LegendStructure => {
  const structure: Structure = { nodes: {}, edges: {}, navigationRules: getBaseNavigationRules(orientation) };
  if (!series.length) return { structure, entryPoint: undefined };

  const { formatMessage } = getDataNavigatorIntl(locale);
  if (!seriesField) return { structure, entryPoint: undefined };
  const entryFields = entryFieldsOption?.length ? entryFieldsOption : [seriesField];
  const entryOf = (row: SimpleData) => getRowEntryValue(row, entryFields);
  const seriesOf = (row: SimpleData) => String(row[seriesField]);
  const nonZeroRows = data.filter((row) => Number(row[metric]) !== 0);
  // An entry spanning several series is also hidden when every one of them has been hidden, since none of its bars render.
  const isSeriesHidden = (value: string): boolean => {
    if (hiddenSeries.includes(value)) return true;
    const groupRows = nonZeroRows.filter((row) => entryOf(row) === value);
    return groupRows.length > 0 && groupRows.every((row) => hiddenSeries.includes(seriesOf(row)));
  };
  const hiddenEntries = new Set(series.filter(isSeriesHidden));
  const visibleRows = nonZeroRows.filter(
    (row) => series.includes(entryOf(row)) && !hiddenEntries.has(entryOf(row)) && !hiddenSeries.includes(seriesOf(row))
  );
  // Each entry's bars, and each category's bars across entries, in the order chart content reaches them.
  const segmentOrder = orderStackSegments(visibleRows, dimension, orientation, type ?? 'stacked', order, seriesField, dodgeFields);
  const categories = uniqueInOrder(segmentOrder.map((row) => row[dimension]));
  // A legend bar is reached outside its category, so it always reads the category, even when the axis is untitled.
  const barFieldLabels = Object.keys(fieldLabels).length && !(dimension in fieldLabels) ? { [dimension]: dimension, ...fieldLabels } : fieldLabels;
  const labelOptions = {
    dimension,
    fieldLabels: barFieldLabels,
    dimensionLabels,
    colorOverride,
    order,
    locale,
    metricSeriesLabel: metricTitleBySeries && color ? { metric, color, titleBySeries: metricTitleBySeries } : undefined,
  };

  const seriesFieldName = title ?? entryFields.map((field) => fieldLabels[field] ?? field).join(', ');
  structure.nodes[LEGEND_ROOT_ID] = {
    id: LEGEND_ROOT_ID,
    edges: [],
    dimensionLevel: 1,
    legendLevel: 'root',
    semantics: {
      label: formatMessage('legend.description', { title: seriesFieldName, count: series.length, hidden: hiddenEntries.size }),
    },
  };

  for (const value of series) {
    const isHidden = hiddenEntries.has(value);
    const barIds: string[] = [];
    const barDetails: string[] = [];
    for (const row of isHidden ? [] : segmentOrder.filter((candidate) => entryOf(candidate) === value)) {
      const category = row[dimension];
      const contentId = segmentId(category, row[seriesField]);
      const id = legendBarId(category, seriesOf(row));
      const node: NodeObject = { id, edges: [], data: row, legendLevel: 'bar', series: value, contentId };
      node.semantics = { label: buildNodeLabel(node, labelOptions) };
      structure.nodes[id] = node;
      barIds.push(id);
      const parts = buildFieldValueParts(row as Record<string, unknown>, labelOptions, entryFields);
      if (parts.length) barDetails.push(`${parts.join(', ')}.`);
    }

    const seriesId = legendSeriesId(value);
    // Same "Field: value." header a stack uses, then its description, then its bars itemized like a stack's segments.
    const header = `${seriesFieldName}: ${labels[value] ?? value}.`;
    const seriesDescription = descriptions[value];
    const description = seriesDescription
      ? [seriesDescription.title, seriesDescription.description].filter(Boolean).map((text) => asSentence(text as string)).join(' ')
      : '';
    const details = barDetails.join(' ');
    const state = isHidden ? formatMessage('legend.seriesHidden') : '';
    const label = [header, state, description, details].filter(Boolean).join(' ');
    // Read instead of `label` when focus is restored right after this series was toggled, so the change is announced once.
    const toggledLabel = isHidden ? label : [header, formatMessage('legend.seriesShown'), description, details].filter(Boolean).join(' ');
    structure.nodes[seriesId] = {
      id: seriesId,
      edges: [],
      dimensionLevel: 2,
      legendLevel: 'series',
      series: value,
      hidden: isHidden,
      toggledLabel,
      data: Object.fromEntries(entryFields.map((field, index) => [field, entryFields.length > 1 ? value.split(' | ')[index] : value])),
      semantics: { label },
    };

    addParentEdges(structure, seriesId, barIds);
    for (let index = 0; index < barIds.length - 1; index++) {
      addEdge(structure, barIds[index], barIds[index + 1], ['left', 'right']);
    }
  }
  addParentEdges(structure, LEGEND_ROOT_ID, series.map(legendSeriesId));

  // Across entries, per category, in segment order; bars already linked within their own entry are skipped.
  for (const category of categories) {
    const rows = segmentOrder.filter((row) => row[dimension] === category);
    for (let index = 0; index < rows.length - 1; index++) {
      if (entryOf(rows[index]) === entryOf(rows[index + 1])) continue;
      const from = legendBarId(category, seriesOf(rows[index]));
      const to = legendBarId(category, seriesOf(rows[index + 1]));
      if (structure.nodes[from] && structure.nodes[to]) addEdge(structure, from, to, ['up', 'down']);
    }
  }

  return { structure, entryPoint: LEGEND_ROOT_ID };
};
