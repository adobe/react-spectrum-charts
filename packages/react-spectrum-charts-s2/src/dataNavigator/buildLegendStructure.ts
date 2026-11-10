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

import { DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_LOCALE, NAVIGATION_ID_SEPARATOR } from '@spectrum-charts/core-s2/constants';
import { Orientation, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { formatMessage } from '../intl/index.js';
import { NodeLabelOptions, buildFieldValueParts, buildNodeLabel } from './buildBarStructure.js';
import { getBaseNavigationRules } from './navigationRules.js';

export interface LegendSeriesDescription {
  description: string;
  title?: string;
}

export interface BuildLegendStructureOptions extends Omit<NodeLabelOptions, 'data' | 'rowsByDimension'> {
  /** The chart content's structure; the legend's items mirror its leaves, in the order content reaches them. */
  content: Structure;
  /** All chart data, so an entry whose rows are all in hidden series reads as hidden. */
  data: SimpleData[];
  /** The field identifying each row's series (matching the chart's hidden-series filter). */
  seriesField: string;
  /** The fields each legend entry value joins with " | ". Defaults to the series field. */
  entryFields?: string[];
  /** Chart orientation; drives the physical keys for the item-level axes. */
  orientation?: Orientation;
  /** The legend's rendered entries, in layout order. */
  series: string[];
  /** Series toggled off via the legend: still navigable (so they can be toggled back on) but not drillable. */
  hiddenSeries?: string[];
  /** Legend title, used in the root's and series' accessible names. */
  title?: string;
  /** Series value → the label the legend displays for it. */
  labels?: Record<string, string>;
  /** Series value → its legend description and optional tooltip title. */
  descriptions?: Record<string, LegendSeriesDescription>;
}

export interface LegendStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

/** Which layer of the legend region a node belongs to. */
export type LegendNodeLevel = 'root' | 'series' | 'item';

export const LEGEND_ROOT_ID = 'root';

export const legendSeriesId = (series: string): string => `series${NAVIGATION_ID_SEPARATOR}${series}`;

export const legendItemId = (contentId: string): string => `item${NAVIGATION_ID_SEPARATOR}${contentId}`;

export const getLegendNodeLevel = (node: NodeObject): LegendNodeLevel | undefined =>
  node.legendLevel as LegendNodeLevel | undefined;

/** The legend entry value a series/item node belongs to. */
export const getLegendNodeSeries = (node: NodeObject): string | undefined => node.series as string | undefined;

/** Whether a legend series node is currently toggled off. */
export const isLegendNodeHidden = (node: NodeObject): boolean => node.hidden === true;

/** A series node's name for the focus restored right after it was toggled (e.g. "Windows. Hidden."). */
export const getLegendNodeToggledLabel = (node: NodeObject): string | undefined =>
  node.toggledLabel as string | undefined;

/** The chart-content leaf id a legend item mirrors, so the mark's own focus ring and hover state apply. */
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

/** Ends a free-text sentence with a period unless it already ends in punctuation. */
const asSentence = (text: string): string => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

/** A row's legend entry value: its entry fields' values joined the way the legend spec joins them. */
const getEntryValue = (row: Record<string, unknown>, entryFields: string[]): string =>
  entryFields.map((field) => String(row[field])).join(' | ');

const groupBy = <T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> => {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
};

/** Content leaves (nodes with data and no dimension level), in the order content built them. */
const getContentLeaves = (content: Structure): NodeObject[] =>
  Object.values(content.nodes).filter((node) => node.dimensionLevel == null && node.data != null);

/** A series' legend description, title first, as sentences. */
const getSeriesDescription = (seriesDescription: { description: string; title?: string } | undefined): string =>
  seriesDescription
    ? [seriesDescription.title, seriesDescription.description]
        .filter((text): text is string => text !== undefined && text.length > 0)
        .map(asSentence)
        .join(' ')
    : '';

interface SeriesNodeOptions {
  value: string;
  isHidden: boolean;
  /** The content leaves the entry covers */
  leaves: NodeObject[];
  entryFields: string[];
  /** The "Field: value." header a division uses */
  header: string;
  description: string;
  itemLabelOptions: NodeLabelOptions;
  locale: string;
}

/** Adds a series node and its items, which mirror its content leaves and link left/right in content order. */
const addSeriesNode = (
  structure: Structure,
  { value, isHidden, leaves, entryFields, header, description, itemLabelOptions, locale }: SeriesNodeOptions
) => {
  const itemIds: string[] = [];
  const itemDetails: string[] = [];
  for (const leaf of leaves) {
    const row = leaf.data as Record<string, unknown>;
    const id = legendItemId(leaf.id);
    const node: NodeObject = { id, edges: [], data: row, legendLevel: 'item', series: value, contentId: leaf.id };
    node.semantics = { label: buildNodeLabel(node, itemLabelOptions) };
    structure.nodes[id] = node;
    itemIds.push(id);
    const parts = buildFieldValueParts(row, itemLabelOptions, entryFields);
    if (parts.length) itemDetails.push(`${parts.join(', ')}.`);
  }

  const details = itemDetails.join(' ');
  const state = isHidden ? formatMessage(locale, 'navigation.legendSeriesHidden') : '';
  const label = [header, state, description, details].filter(Boolean).join(' ');
  // Read instead of `label` when focus is restored right after this series was toggled, so the change is announced once.
  const toggledLabel = isHidden
    ? label
    : [header, formatMessage(locale, 'navigation.legendSeriesShown'), description, details].filter(Boolean).join(' ');
  const seriesId = legendSeriesId(value);
  const entryValues = entryFields.length > 1 ? value.split(' | ') : [value];
  structure.nodes[seriesId] = {
    id: seriesId,
    edges: [],
    dimensionLevel: 2,
    legendLevel: 'series',
    series: value,
    hidden: isHidden,
    toggledLabel,
    data: Object.fromEntries(entryFields.map((field, index) => [field, entryValues[index]])),
    semantics: { label },
  };

  addParentEdges(structure, seriesId, itemIds);
  for (let index = 0; index < itemIds.length - 1; index++) {
    addEdge(structure, itemIds[index], itemIds[index + 1], ['left', 'right']);
  }
};

/** Links items up/down across entries per dimension value, in content order, skipping pairs within one entry. */
const addCrossEntryEdges = (
  structure: Structure,
  leaves: NodeObject[],
  dimension: string,
  entryOf: (row: Record<string, unknown>) => string
) => {
  const leavesByDimension = groupBy(leaves, (leaf) => String((leaf.data as Record<string, unknown>)[dimension]));
  for (const group of leavesByDimension.values()) {
    for (let index = 0; index < group.length - 1; index++) {
      const [from, to] = [group[index], group[index + 1]];
      if (entryOf(from.data as Record<string, unknown>) === entryOf(to.data as Record<string, unknown>)) continue;
      addEdge(structure, legendItemId(from.id), legendItemId(to.id), ['up', 'down']);
    }
  }
};

/**
 * Builds the legend region: root → series (one per rendered entry) → that entry's items, mirroring
 * chart content's leaves. Series-level arrows are resolved live from the rendered legend grid, so no
 * series↔series edges are built here. Within an entry, `left`/`right` move along its items; `up`/`down`
 * move to the same dimension value in the adjacent entry, in content order.
 */
export const buildLegendStructure = ({
  content,
  data,
  seriesField,
  entryFields: entryFieldsOption,
  orientation = 'vertical',
  series,
  hiddenSeries = [],
  title,
  labels = {},
  descriptions = {},
  ...labelOptions
}: BuildLegendStructureOptions): LegendStructure => {
  const structure: Structure = { nodes: {}, edges: {}, navigationRules: getBaseNavigationRules(orientation) };
  if (!series.length) return { structure, entryPoint: undefined };

  const {
    dimension = DEFAULT_CATEGORICAL_DIMENSION,
    fieldLabels = {},
    locale = DEFAULT_LOCALE,
  } = labelOptions;
  const entryFields = entryFieldsOption?.length ? entryFieldsOption : [seriesField];
  const entryOf = (row: Record<string, unknown>) => getEntryValue(row, entryFields);
  const leaves = getContentLeaves(content).filter((leaf) =>
    series.includes(entryOf(leaf.data as Record<string, unknown>))
  );
  const leavesByEntry = groupBy(leaves, (leaf) => entryOf(leaf.data as Record<string, unknown>));
  // An entry spanning several series is also hidden when none of its rows render because their series are hidden.
  const isEntryHidden = (value: string): boolean =>
    hiddenSeries.includes(value) ||
    (!leavesByEntry.has(value) &&
      data.some((row) => entryOf(row) === value && hiddenSeries.includes(String(row[seriesField]))));
  const hiddenEntries = new Set(series.filter(isEntryHidden));

  // An item is reached outside its dimension group, so it always reads the dimension, even when the axis is untitled.
  const itemLabelOptions: NodeLabelOptions = {
    ...labelOptions,
    fieldLabels:
      Object.keys(fieldLabels).length && !(dimension in fieldLabels)
        ? { [dimension]: dimension, ...fieldLabels }
        : fieldLabels,
  };

  const seriesFieldName = title ?? entryFields.map((field) => fieldLabels[field] ?? field).join(', ');
  structure.nodes[LEGEND_ROOT_ID] = {
    id: LEGEND_ROOT_ID,
    edges: [],
    dimensionLevel: 1,
    legendLevel: 'root',
    semantics: {
      label: formatMessage(
        locale,
        hiddenEntries.size ? 'navigation.legendDescriptionWithHidden' : 'navigation.legendDescription',
        { title: seriesFieldName, count: series.length, hidden: hiddenEntries.size }
      ),
    },
  };

  for (const value of series) {
    const isHidden = hiddenEntries.has(value);
    addSeriesNode(structure, {
      value,
      isHidden,
      leaves: isHidden ? [] : leavesByEntry.get(value) ?? [],
      entryFields,
      header: `${seriesFieldName}: ${labels[value] ?? value}.`,
      description: getSeriesDescription(descriptions[value]),
      itemLabelOptions,
      locale,
    });
  }
  addParentEdges(structure, LEGEND_ROOT_ID, series.map(legendSeriesId));

  const visibleLeaves = leaves.filter((leaf) => !hiddenEntries.has(entryOf(leaf.data as Record<string, unknown>)));
  addCrossEntryEdges(structure, visibleLeaves, dimension, entryOf);

  return { structure, entryPoint: LEGEND_ROOT_ID };
};
