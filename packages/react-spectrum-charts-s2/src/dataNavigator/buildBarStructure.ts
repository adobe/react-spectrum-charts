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
import dataNavigator, { Edges, NavigationRules, NodeObject, Nodes, Structure, StructureOptions } from 'data-navigator';

import { DEFAULT_BAR_ORIENTATION, DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_METRIC } from '@spectrum-charts/constants';
import { Orientation, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { addOneSidedEdge, addSiblingEdge } from './graphEdgeUtils';
import { applyDefaultLabels } from './nodeSemanticsUtils';
import { segmentId } from './segmentId';

export interface BuildBarStructureOptions {
  /** The chart data (plain objects). */
  data: SimpleData[];
  /** The bar's category field (the stack/column for a stacked bar). Defaults to the standard categorical dimension. */
  dimension?: string;
  /** The series/color field. When set, the bar is multi-series (each column holds multiple segments). */
  color?: string;
  /** The metric/value field. When set on a stacked bar, each stack's label includes the summed total across its segments. */
  metric?: string;
  /** Display label for the metric total (e.g. the metric axis's title, like "Downloads"). Falls back to the raw metric field name when not given. */
  metricLabel?: string;
  /** Chart orientation. Swaps which arrow keys move between stacks/bars vs. within a stack, since a horizontal bar's stacks run top-to-bottom instead of left-to-right. Defaults to vertical. */
  orientation?: Orientation;
  /** Optional chart title used to open the accessible description. */
  title?: string;
}

/** Internal-only stack-node data fields carrying the summed metric total, read back by buildNodeLabel. */
const STACK_METRIC_LABEL_KEY = '_dnMetricLabel';
const STACK_METRIC_TOTAL_KEY = '_dnMetricTotal';

export { segmentId };

export interface BarStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

const CHART_ROOT_ID = 'barChartRoot';

/**
 * The keyboard navigation rules for a basic (single-series) bar chart: left/right between bars,
 * Enter to drill in, Escape to drill out (and exit once past the chart root). For a horizontal
 * bar, bars run top-to-bottom rather than left-to-right, so sibling movement binds to up/down instead.
 */
export const getBaseNavigationRules = (orientation: Orientation): NavigationRules =>
  orientation === 'horizontal'
    ? {
        left: { key: 'ArrowUp', direction: 'source' },
        right: { key: 'ArrowDown', direction: 'target' },
        child: { key: 'Enter', direction: 'target' },
        parent: { key: 'Escape', direction: 'source' },
      }
    : {
        left: { key: 'ArrowLeft', direction: 'source' },
        right: { key: 'ArrowRight', direction: 'target' },
        child: { key: 'Enter', direction: 'target' },
        parent: { key: 'Escape', direction: 'source' },
      };

/**
 * At the segment level, left/right jump to the same-color segment in the adjacent stack, while
 * up/down move through every segment in the chart, crossing stack boundaries. At the stack level
 * (not yet drilled into a segment), left/right move between stacks instead. For a horizontal bar,
 * stacks run top-to-bottom and segments run left-to-right, so these key bindings swap accordingly.
 */
const getStackedBarNavigationRules = (orientation: Orientation): NavigationRules =>
  orientation === 'horizontal'
    ? {
        up: { key: 'ArrowRight', direction: 'source' },
        down: { key: 'ArrowLeft', direction: 'target' },
        left: { key: 'ArrowUp', direction: 'source' },
        right: { key: 'ArrowDown', direction: 'target' },
        child: { key: 'Enter', direction: 'target' },
        parent: { key: 'Escape', direction: 'source' },
      }
    : {
        up: { key: 'ArrowUp', direction: 'source' },
        down: { key: 'ArrowDown', direction: 'target' },
        left: { key: 'ArrowLeft', direction: 'source' },
        right: { key: 'ArrowRight', direction: 'target' },
        child: { key: 'Enter', direction: 'target' },
        parent: { key: 'Escape', direction: 'source' },
      };

/** The data-navigator leaf id for a rendered bar/segment's datum — used to move focus on click. */
export const getBarNodeId = (datum: SimpleData, dimension: string, color?: string): string | undefined => {
  const dimensionValue = datum[dimension];
  if (dimensionValue == null) return undefined;
  return color ? segmentId(dimensionValue, datum[color]) : String(dimensionValue);
};

interface Stack {
  key: unknown;
  stackId: string;
  segmentIds: string[];
  rows: SimpleData[];
}

/** Sums a numeric metric field across a stack's rows, for the stack node's aria label. */
const sumMetric = (rows: SimpleData[], metric: string): number =>
  rows.reduce((total, row) => total + (Number(row[metric]) || 0), 0);

const groupIntoStacks = (data: SimpleData[], dimension: string, color: string): Stack[] => {
  const stacks: Stack[] = [];
  const stackByKey = new Map<string, Stack>();

  for (const row of data) {
    const key = row[dimension];
    const mapKey = String(key);
    let stack = stackByKey.get(mapKey);
    if (!stack) {
      stack = { key, stackId: mapKey, segmentIds: [], rows: [] };
      stackByKey.set(mapKey, stack);
      stacks.push(stack);
    }
    stack.rows.push(row);
    stack.segmentIds.push(segmentId(key, row[color]));
  }

  return stacks;
};

/** Builds a multi-series (stacked) bar's structure as a manual node/edge graph — the mirror image of buildLineStructure's lines/points graph, with stacks/segments and left-right/up-down swapped. */
const buildStackedBarStructure = (
  data: SimpleData[],
  dimension: string,
  color: string,
  metric: string | undefined,
  metricLabel: string | undefined,
  orientation: Orientation,
  title: string | undefined
): BarStructure => {
  const stacks = groupIntoStacks(data, dimension, color);

  const nodes: Nodes = {};
  const edges: Edges = {};

  // Pass 1: create every node first, since a cross-stack edge (e.g. stack A's segment to stack B's segment) needs both nodes to already exist.
  nodes[CHART_ROOT_ID] = {
    id: CHART_ROOT_ID,
    edges: [],
    dimensionLevel: 1,
    semantics: { label: buildChartDescription(data, dimension, color, title, orientation) },
  };
  stacks.forEach((stack) => {
    const metricTotal = metric
      ? { [STACK_METRIC_LABEL_KEY]: metricLabel ?? metric, [STACK_METRIC_TOTAL_KEY]: sumMetric(stack.rows, metric) }
      : {};
    nodes[stack.stackId] = {
      id: stack.stackId,
      edges: [],
      dimensionLevel: 2,
      derivedNode: dimension,
      data: {
        [dimension]: stack.key,
        values: Object.fromEntries(stack.segmentIds.map((id) => [id, {}])),
        ...metricTotal,
      },
    };
    stack.rows.forEach((row, segmentIndex) => {
      const id = stack.segmentIds[segmentIndex];
      nodes[id] = { id, edges: [], data: row };
    });
  });

  // Pass 2: wire up every edge now that all nodes exist.
  if (stacks.length) {
    // root -> first stack only (one-sided; every stack gets its own edge back up)
    addOneSidedEdge(edges, nodes, CHART_ROOT_ID, CHART_ROOT_ID, stacks[0].stackId, ['child']);
  }
  stacks.forEach((stack, i) => {
    addOneSidedEdge(edges, nodes, stack.stackId, CHART_ROOT_ID, stack.stackId, ['parent']);

    // stack <-> adjacent stack (left/right), circular — skipped when there's nothing to wrap to
    if (stacks.length > 1) {
      const nextStack = stacks[(i + 1) % stacks.length];
      addSiblingEdge(edges, nodes, stack.stackId, nextStack.stackId, ['left', 'right']);
    }

    // 'up' resolves via the edge's source (see getStackedBarNavigationRules), reversed relative to 'child'/'down', which resolve via target — so stack -> first segment via child/down, stack -> last segment via up.
    if (stack.segmentIds.length) {
      addOneSidedEdge(edges, nodes, stack.stackId, stack.stackId, stack.segmentIds[0], ['child', 'down']);
      addOneSidedEdge(edges, nodes, stack.stackId, stack.segmentIds[stack.segmentIds.length - 1], stack.stackId, [
        'up',
      ]);
    }
    stack.segmentIds.forEach((id) => {
      addOneSidedEdge(edges, nodes, id, stack.stackId, id, ['parent']);
    });

    // segment <-> same-color segment in the adjacent stack (left/right)
    if (stacks.length > 1) {
      const nextStack = stacks[(i + 1) % stacks.length];
      stack.rows.forEach((row, segmentIndex) => {
        const id = stack.segmentIds[segmentIndex];
        const nextStackIndex = nextStack.rows.findIndex((nextRow) => nextRow[color] === row[color]);
        if (nextStackIndex !== -1) addSiblingEdge(edges, nodes, id, nextStack.segmentIds[nextStackIndex], ['left', 'right']);
      });
    }
  });

  // segment <-> adjacent segment across the whole chart (up/down), circular — every stack's
  // segments in order, so up/down keeps moving past a stack boundary into the next stack.
  const allSegmentIds = stacks.flatMap((stack) => stack.segmentIds);
  if (allSegmentIds.length > 1) {
    allSegmentIds.forEach((id, segmentIndex) => {
      const nextId = allSegmentIds[(segmentIndex + 1) % allSegmentIds.length];
      addSiblingEdge(edges, nodes, id, nextId, ['up', 'down']);
    });
  }

  const structure: Structure = { nodes, edges, navigationRules: getStackedBarNavigationRules(orientation) };

  applyDefaultLabels(structure, buildNodeLabel);

  return { structure, entryPoint: CHART_ROOT_ID };
};

export const buildBarStructure = ({
  data,
  dimension = DEFAULT_CATEGORICAL_DIMENSION,
  color,
  metric = DEFAULT_METRIC,
  metricLabel,
  orientation = DEFAULT_BAR_ORIENTATION,
  title,
}: BuildBarStructureOptions): BarStructure => {
  if (color !== undefined) {
    return buildStackedBarStructure(data, dimension, color, metric, metricLabel, orientation, title);
  }

  const structureOptions: StructureOptions = {
    data,
    idKey: dimension,
    navigationRules: getBaseNavigationRules(orientation),
    dimensions: {
      values: [
        {
          dimensionKey: dimension,
          type: 'categorical',
          behavior: { extents: 'circular' },
          operations: { compressSparseDivisions: true },
          navigationRules: {
            sibling_sibling: ['left', 'right'],
            parent_child: ['parent', 'child'],
          },
        },
      ],
    },
  };

  const structure = dataNavigator.structure(structureOptions);

  let entryPoint: string | undefined;
  if (structure.dimensions) {
    const firstKey = Object.keys(structure.dimensions)[0];
    const rootNodeId = structure.dimensions[firstKey]?.nodeId;
    entryPoint = rootNodeId;
    const rootNode = rootNodeId ? structure.nodes[rootNodeId] : undefined;
    if (rootNode) {
      rootNode.semantics = { label: buildChartDescription(data, dimension, color, title, orientation) };
    }
  }

  applyDefaultLabels(structure, buildNodeLabel);

  return { structure, entryPoint };
};

export const buildChartDescription = (
  data: SimpleData[],
  dimension: string,
  color?: string,
  title?: string,
  orientation: Orientation = DEFAULT_BAR_ORIENTATION
): string => {
  const count = new Set(data.map((d) => d[dimension])).size;
  const opening = title ? `${title}. ` : '';
  const isHorizontal = orientation === 'horizontal';
  const siblingKeys = isHorizontal ? 'up and down' : 'left and right';
  const withinKeys = isHorizontal ? 'left and right' : 'up and down';
  const firstDrillKey = isHorizontal ? 'left' : 'down';
  const lastDrillKey = isHorizontal ? 'right' : 'up';
  if (color) {
    return `${opening}Stacked bar chart. ${dimension} along the category axis, stacked by ${color}. Contains ${count} stack${
      count === 1 ? '' : 's'
    }. Use the ${siblingKeys} arrow keys to move between stacks, and Enter, ${lastDrillKey}, or ${firstDrillKey} to drill into a stack's segments (${firstDrillKey} or Enter focuses the first segment, ${lastDrillKey} focuses the last); once drilled in, ${withinKeys} move through every segment in the chart, and ${siblingKeys} jump to the same segment in the adjacent stack.`;
  }
  return `${opening}Bar chart. ${dimension} along the category axis. Contains ${count} bar${count === 1 ? '' : 's'}. Use the ${siblingKeys} arrow keys to navigate.`;
};

export const buildNodeLabel = (node: NodeObject): string => {
  const data = node.data as Record<string, unknown> | undefined;
  if (!data) return String(node.id);

  if (typeof data.dimensionKey === 'string' && data.divisions != null) {
    const divisionCount = Object.keys(data.divisions).length;
    return `${data.dimensionKey} dimension. Contains ${divisionCount} division${divisionCount === 1 ? '' : 's'}.`;
  }

  if (data.values != null && typeof data.values === 'object' && !Array.isArray(data.values)) {
    const childCount = Object.keys(data.values).length;
    const metricLabel = data[STACK_METRIC_LABEL_KEY];
    const metricTotal = data[STACK_METRIC_TOTAL_KEY];
    const totalSuffix =
      typeof metricLabel === 'string' && typeof metricTotal === 'number'
        ? `, ${metricTotal.toLocaleString()} ${metricLabel}`
        : '';
    return `${String(node.id)}. Contains ${childCount} bar${childCount === 1 ? '' : 's'}${totalSuffix}.`;
  }

  const parts = Object.entries(data)
    .filter(([key, value]) => !key.startsWith('_') && value != null && typeof value !== 'object' && typeof value !== 'function')
    .map(([key, value]) => `${key}: ${value}`);
  return parts.length > 0 ? `${parts.join('. ')}.` : String(node.id);
};
