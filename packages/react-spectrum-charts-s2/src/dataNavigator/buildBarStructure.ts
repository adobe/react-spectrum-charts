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

import { DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_METRIC, NAVIGATION_ID_SEPARATOR } from '@spectrum-charts/constants';
import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { addSiblingKeySynonyms, baseNavigationRules } from './navigationRules';

export interface BuildBarStructureOptions {
  /** The chart data (plain objects). */
  data: SimpleData[];
  /** The bar's category field (the stack/column for a stacked bar). Defaults to the standard categorical dimension. */
  dimension?: string;
  /** The series/color field. When set, the bar is multi-series (each column holds multiple segments). */
  color?: string;
  /** The bar's metric field. Rows with a value of exactly 0 are excluded from navigation — they render invisibly, so a mouse could never reach them either. */
  metric?: string;
  /** Already-localized label for the chart-root node, read verbatim from the consumer's `Chart.title` — this module never constructs narration strings itself. */
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

export const buildBarStructure = ({
  data,
  dimension = DEFAULT_CATEGORICAL_DIMENSION,
  color,
  metric = DEFAULT_METRIC,
  title,
}: BuildBarStructureOptions): BarStructure => {
  const isMultiSeries = color !== undefined;
  const idKey = isMultiSeries ? SEGMENT_ID_KEY : dimension;
  // Excluded so a zero-value row never gets a leaf node here — it's invisible, so a mouse can't reach it either.
  const visibleData = data.filter((d) => Number(d[metric]) !== 0);
  const structureData = color
    ? visibleData.map((d) => ({ ...d, [SEGMENT_ID_KEY]: segmentId(d[dimension], d[color]) }))
    : visibleData;

  const structureOptions: StructureOptions = {
    data: structureData,
    idKey,
    navigationRules: baseNavigationRules,
    dimensions: {
      values: [
        {
          dimensionKey: dimension,
          type: 'categorical',
          // 'terminal': no wraparound at the first/last stack, and segments stay within their own stack.
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
  addSiblingKeySynonyms(structure);

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
  prepareNodeSemantics(structure);

  return { structure, entryPoint };
};

/** Fallback label for a node with no consumer-supplied semantics: a leaf's own `field: value` pairs, or the bare node id for a structural (dimension/division) node. */
export const buildNodeLabel = (node: NodeObject): string => {
  if (node.dimensionLevel != null) return String(node.id);

  const data = node.data as Record<string, unknown> | undefined;
  if (!data) return String(node.id);

  const parts = Object.entries(data)
    .filter(([key, value]) => !key.startsWith('_') && value != null && typeof value !== 'object' && typeof value !== 'function')
    .map(([key, value]) => `${key}: ${value}`);
  return parts.length > 0 ? `${parts.join('. ')}.` : String(node.id);
};

export const prepareNodeSemantics = (structure: Structure): void => {
  for (const node of Object.values(structure.nodes)) {
    if (!node.semantics?.label) {
      node.semantics = { ...node.semantics, label: buildNodeLabel(node) };
    }
  }
};
