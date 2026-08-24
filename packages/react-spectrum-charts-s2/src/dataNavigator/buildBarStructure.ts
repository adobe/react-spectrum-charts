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

import { DEFAULT_CATEGORICAL_DIMENSION } from '@spectrum-charts/constants';
import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

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
  /** Optional chart title used to open the accessible description. */
  title?: string;
}

export { segmentId };

export interface BarStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

const CHART_ROOT_ID = 'barChartRoot';

/**
 * The keyboard navigation rules for a basic (single-series) bar chart: left/right between bars,
 * Enter to drill in, Escape to drill out (and exit once past the chart root).
 */
export const baseNavigationRules: NavigationRules = {
  left: { key: 'ArrowLeft', direction: 'source' },
  right: { key: 'ArrowRight', direction: 'target' },
  child: { key: 'Enter', direction: 'target' },
  parent: { key: 'Escape', direction: 'source' },
};

/**
 * At the segment level, Left/Right jump to the same-color segment in the adjacent stack, while
 * Up/Down move through every segment in the chart, crossing stack boundaries. At the stack level
 * (not yet drilled into a segment), Left/Right move between stacks instead.
 */
const stackedBarNavigationRules: NavigationRules = {
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
    semantics: { label: buildChartDescription(data, dimension, color, title) },
  };
  stacks.forEach((stack) => {
    nodes[stack.stackId] = {
      id: stack.stackId,
      edges: [],
      dimensionLevel: 2,
      derivedNode: dimension,
      data: { [dimension]: stack.key, values: Object.fromEntries(stack.segmentIds.map((id) => [id, {}])) },
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

    // 'up' resolves via the edge's source (see stackedBarNavigationRules), reversed relative to 'child'/'down', which resolve via target — so stack -> first segment via child/down, stack -> last segment via up.
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

  const structure: Structure = { nodes, edges, navigationRules: stackedBarNavigationRules };

  applyDefaultLabels(structure, buildNodeLabel);

  return { structure, entryPoint: CHART_ROOT_ID };
};

export const buildBarStructure = ({
  data,
  dimension = DEFAULT_CATEGORICAL_DIMENSION,
  color,
  title,
}: BuildBarStructureOptions): BarStructure => {
  if (color !== undefined) {
    return buildStackedBarStructure(data, dimension, color, title);
  }

  const structureOptions: StructureOptions = {
    data,
    idKey: dimension,
    navigationRules: baseNavigationRules,
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
      rootNode.semantics = { label: buildChartDescription(data, dimension, color, title) };
    }
  }

  applyDefaultLabels(structure, buildNodeLabel);

  return { structure, entryPoint };
};

export const buildChartDescription = (data: SimpleData[], dimension: string, color?: string, title?: string): string => {
  const count = new Set(data.map((d) => d[dimension])).size;
  const opening = title ? `${title}. ` : '';
  if (color) {
    return `${opening}Stacked bar chart. ${dimension} along the category axis, stacked by ${color}. Contains ${count} stack${
      count === 1 ? '' : 's'
    }. Use the left and right arrow keys to move between stacks, and Enter, up, or down to drill into a stack's segments (down or Enter focuses the first segment, up focuses the last); once drilled in, up and down move through every segment in the chart, and left and right jump to the same segment in the adjacent stack.`;
  }
  return `${opening}Bar chart. ${dimension} along the category axis. Contains ${count} bar${count === 1 ? '' : 's'}. Use the left and right arrow keys to navigate.`;
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
    return `${String(node.id)}. Contains ${childCount} bar${childCount === 1 ? '' : 's'}.`;
  }

  const parts = Object.entries(data)
    .filter(([key, value]) => !key.startsWith('_') && value != null && typeof value !== 'object' && typeof value !== 'function')
    .map(([key, value]) => `${key}: ${value}`);
  return parts.length > 0 ? `${parts.join('. ')}.` : String(node.id);
};
