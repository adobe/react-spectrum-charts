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
import dataNavigator, { NavigationRules, NodeObject, Structure, StructureOptions } from 'data-navigator';

import { DEFAULT_CATEGORICAL_DIMENSION, NAVIGATION_ID_SEPARATOR } from '@spectrum-charts/constants';
import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

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

/** Data field that carries the composite leaf id for multi-series (stacked/dodged) bars. */
const SEGMENT_ID_KEY = '_dnId';

export const segmentId = (dimensionValue: unknown, seriesValue: unknown): string =>
  `${dimensionValue}${NAVIGATION_ID_SEPARATOR}${seriesValue}`;

export interface BarStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

/**
 * The keyboard navigation rules for a basic bar chart: left/right between bars,
 * Enter to drill in, Escape to drill out (and exit once past the chart root).
 */
const baseNavigationRules: NavigationRules = {
  left: { key: 'ArrowLeft', direction: 'source' },
  right: { key: 'ArrowRight', direction: 'target' },
  child: { key: 'Enter', direction: 'target' },
  parent: { key: 'Escape', direction: 'source' },
};

export const buildBarStructure = ({
  data,
  dimension = DEFAULT_CATEGORICAL_DIMENSION,
  color,
  title,
}: BuildBarStructureOptions): BarStructure => {
  const isMultiSeries = color !== undefined;
  const idKey = isMultiSeries ? SEGMENT_ID_KEY : dimension;
  const structureData = color
    ? data.map((d) => ({ ...d, [SEGMENT_ID_KEY]: segmentId(d[dimension], d[color]) }))
    : data;

  const structureOptions: StructureOptions = {
    data: structureData,
    idKey,
    navigationRules: baseNavigationRules,
    dimensions: {
      values: [
        {
          dimensionKey: dimension,
          type: 'categorical',
          behavior: isMultiSeries ? { extents: 'bridgedCousins' } : { extents: 'circular' },
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

  // Every node rendered in keyboard mode needs an aria-label.
  prepareNodeSemantics(structure);

  return { structure, entryPoint };
};

// Placeholder for initial implementation
export const buildChartDescription = (data: SimpleData[], dimension: string, color?: string, title?: string): string => {
  const count = new Set(data.map((d) => d[dimension])).size;
  const opening = title ? `${title}. ` : '';
  if (color) {
    return `${opening}Stacked bar chart. ${dimension} along the category axis, stacked by ${color}. Contains ${count} stack${count === 1 ? '' : 's'}. Use the left and right arrow keys to move between stacks and Enter to drill into a stack's segments.`;
  }  return `${opening}Bar chart. ${dimension} along the category axis. Contains ${count} bar${count === 1 ? '' : 's'}. Use the left and right arrow keys to navigate.`;
};

// Placeholder for initial implementation
export const buildNodeLabel = (node: NodeObject): string => {
  const data = node.data as Record<string, unknown> | undefined;
  if (!data) return String(node.id);

  if (typeof data.dimensionKey === 'string' && data.divisions != null) {
    const divisionCount = Object.keys(data.divisions as object).length;
    return `${data.dimensionKey} dimension. Contains ${divisionCount} division${divisionCount === 1 ? '' : 's'}.`;
  }

  if (data.values != null && typeof data.values === 'object' && !Array.isArray(data.values)) {
    const childCount = Object.keys(data.values as object).length;
    return `${String(node.id)}. Contains ${childCount} bar${childCount === 1 ? '' : 's'}.`;
  }

  const parts = Object.entries(data)
    .filter(([key, value]) => !key.startsWith('_') && value != null && typeof value !== 'object' && typeof value !== 'function')
    .map(([key, value]) => `${key}: ${value}`);
  return parts.length > 0 ? `${parts.join('. ')}.` : String(node.id);
};

export const prepareNodeSemantics = (structure: Structure): void => {
  for (const node of Object.values(structure.nodes)) {
    if (!node.semantics?.label) {
      node.semantics = { ...(node.semantics ?? {}), label: buildNodeLabel(node) };
    }
  }
};
