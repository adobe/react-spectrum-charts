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
import { Edges, NavigationRules, NodeObject, Nodes, Structure } from 'data-navigator';

import { DEFAULT_TIME_DIMENSION, NAVIGATION_INDEX_FIELD } from '@spectrum-charts/constants';
import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { addOneSidedEdge, addSiblingEdge } from './graphEdgeUtils';
import { applyDefaultLabels } from './nodeSemanticsUtils';
import { segmentId } from './segmentId';

export interface BuildLineStructureOptions {
  /** The chart data (plain objects). */
  data: SimpleData[];
  /** The line's x/time field. Defaults to the standard time dimension. */
  dimension?: string;
  /** The series/color field. When set, the chart has multiple lines. */
  color?: string;
  /** Whether the dimension field is time-scaled; formats it as a date in accessible labels. Defaults to true. */
  isTimeDimension?: boolean;
  /** Optional chart title for the accessible description. */
  title?: string;
}

export interface LineStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

const CHART_ROOT_ID = 'lineChartRoot';
const SINGLE_LINE_VALUE = 'line';

/**
 * Left/Right always stay within the current line (matching the Vega interactive-line-chart
 * example this mirrors); Up/Down jump to the point at the same position in the adjacent line
 * while drilled into a point, or to the adjacent line itself while at the line level.
 */
const lineNavigationRules: NavigationRules = {
  up: { key: 'ArrowUp', direction: 'source' },
  down: { key: 'ArrowDown', direction: 'target' },
  left: { key: 'ArrowLeft', direction: 'source' },
  right: { key: 'ArrowRight', direction: 'target' },
  child: { key: 'Enter', direction: 'target' },
  parent: { key: 'Escape', direction: 'source' },
};

/** The data-navigator leaf id for a rendered point's datum — the inverse of the per-line indexing below. */
export const getLineNodeId = (datum: SimpleData, color?: string): string | undefined => {
  const index = datum[NAVIGATION_INDEX_FIELD];
  if (index == null) return undefined;
  return color ? segmentId(datum[color], index) : String(index);
};

interface Line {
  /** The line's grouping value (the raw color field value), or undefined for a single-line chart. */
  key: string | undefined;
  divisionId: string;
  pointIds: string[];
  rows: SimpleData[];
}

const groupIntoLines = (data: SimpleData[], color: string | undefined): Line[] => {
  const lines: Line[] = [];
  const lineByKey = new Map<string, Line>();

  for (const row of data) {
    const key = color ? String(row[color]) : undefined;
    const mapKey = key ?? SINGLE_LINE_VALUE;
    let line = lineByKey.get(mapKey);
    if (!line) {
      line = { key, divisionId: color ? `line_${mapKey}` : SINGLE_LINE_VALUE, pointIds: [], rows: [] };
      lineByKey.set(mapKey, line);
      lines.push(line);
    }
    const index = line.rows.length + 1;
    const pointId = color ? segmentId(key, index) : String(index);
    line.rows.push({ ...row, [NAVIGATION_INDEX_FIELD]: index });
    line.pointIds.push(pointId);
  }

  return lines;
};

export const buildLineStructure = ({
  data,
  dimension = DEFAULT_TIME_DIMENSION,
  color,
  isTimeDimension = true,
  title,
}: BuildLineStructureOptions): LineStructure => {
  const lines = groupIntoLines(data, color);

  const nodes: Nodes = {};
  const edges: Edges = {};

  // Pass 1: create every node first, since a cross-line edge (e.g. line A's point to line B's point) needs both nodes to already exist.
  nodes[CHART_ROOT_ID] = {
    id: CHART_ROOT_ID,
    edges: [],
    dimensionLevel: 1,
    semantics: { label: buildChartDescription(data, dimension, color, title) },
  };
  lines.forEach((line) => {
    nodes[line.divisionId] = {
      id: line.divisionId,
      edges: [],
      dimensionLevel: 2,
      derivedNode: color,
      data: { ...(color ? { [color]: line.key } : {}), values: Object.fromEntries(line.pointIds.map((id) => [id, {}])) },
    };
    line.rows.forEach((row, pointIndex) => {
      const pointId = line.pointIds[pointIndex];
      nodes[pointId] = { id: pointId, edges: [], data: row };
    });
  });

  // Pass 2: wire up every edge now that all nodes exist.
  if (lines.length) {
    // root -> first line only (one-sided; every line gets its own edge back up)
    addOneSidedEdge(edges, nodes, CHART_ROOT_ID, CHART_ROOT_ID, lines[0].divisionId, ['child']);
  }
  // Each element needs its own edge to resolve both directions per side, so for exactly 2 elements the forward and backward edges below are both still required, not redundant.
  lines.forEach((line, i) => {
    addOneSidedEdge(edges, nodes, line.divisionId, CHART_ROOT_ID, line.divisionId, ['parent']);

    // line <-> adjacent line (up/down), circular — skipped when there's nothing to wrap to
    if (lines.length > 1) {
      const nextLine = lines[(i + 1) % lines.length];
      addSiblingEdge(edges, nodes, line.divisionId, nextLine.divisionId, ['up', 'down']);
    }

    // 'left' resolves via the edge's source (see lineNavigationRules), reversed relative to 'child'/'right', which resolve via target — so line -> first point via child/right, line -> last point via left.
    if (line.pointIds.length) {
      addOneSidedEdge(edges, nodes, line.divisionId, line.divisionId, line.pointIds[0], ['child', 'right']);
      addOneSidedEdge(edges, nodes, line.divisionId, line.pointIds[line.pointIds.length - 1], line.divisionId, [
        'left',
      ]);
    }
    line.pointIds.forEach((pointId) => {
      addOneSidedEdge(edges, nodes, pointId, line.divisionId, pointId, ['parent']);
    });

    // point <-> adjacent point within the same line (left/right), circular
    if (line.pointIds.length > 1) {
      line.pointIds.forEach((pointId, pointIndex) => {
        const nextPointId = line.pointIds[(pointIndex + 1) % line.pointIds.length];
        addSiblingEdge(edges, nodes, pointId, nextPointId, ['left', 'right']);
      });
    }

    // point <-> same-position point in the adjacent line (up/down)
    if (lines.length > 1) {
      const nextLine = lines[(i + 1) % lines.length];
      line.pointIds.forEach((pointId, pointIndex) => {
        const nextLinePointId = nextLine.pointIds[pointIndex];
        if (nextLinePointId) addSiblingEdge(edges, nodes, pointId, nextLinePointId, ['up', 'down']);
      });
    }
  });

  const structure: Structure = { nodes, edges, navigationRules: lineNavigationRules };

  applyDefaultLabels(structure, (node) => buildNodeLabel(node, dimension, isTimeDimension));

  return { structure, entryPoint: CHART_ROOT_ID };
};

export const buildChartDescription = (data: SimpleData[], dimension: string, color?: string, title?: string): string => {
  const opening = title ? `${title}. ` : '';
  if (color) {
    const count = new Set(data.map((d) => d[color])).size;
    return `${opening}Multi-series line chart. ${dimension} along the x-axis, stacked by ${color}. Contains ${count} line${
      count === 1 ? '' : 's'
    }. Use the up and down arrow keys to move between lines, and Enter or the right arrow key to drill into a line's points.`;
  }
  return `${opening}Line chart. ${dimension} along the x-axis. Contains ${data.length} point${
    data.length === 1 ? '' : 's'
  }. Use Enter or the right arrow key to drill into the line's points, then the left and right arrow keys to navigate.`;
};

/** Formats a raw dimension value as a readable date/time, falling back to the raw value if it isn't a valid date. */
const formatDateValue = (value: unknown): string => {
  const date = new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return String(value);
  const hasTimeComponent = date.getHours() || date.getMinutes() || date.getSeconds();
  return hasTimeComponent
    ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
};

export const buildNodeLabel = (node: NodeObject, dimension: string, isTimeDimension: boolean): string => {
  const data = node.data as Record<string, unknown> | undefined;
  if (!data) return String(node.id);

  if (data.values != null && typeof data.values === 'object' && !Array.isArray(data.values)) {
    const childCount = Object.keys(data.values).length;
    const pointWord = `point${childCount === 1 ? '' : 's'}`;
    if (!node.derivedNode) return `Line. Contains ${childCount} ${pointWord}.`;
    const lineValue = data[node.derivedNode];
    return `Line ${String(lineValue)}. Contains ${childCount} ${pointWord}.`;
  }

  const parts = Object.entries(data)
    .filter(([key, value]) => !key.startsWith('_') && value != null && typeof value !== 'object' && typeof value !== 'function')
    .map(([key, value]) => `${key}: ${key === dimension && isTimeDimension ? formatDateValue(value) : value}`);
  return parts.length > 0 ? `${parts.join('. ')}.` : String(node.id);
};
