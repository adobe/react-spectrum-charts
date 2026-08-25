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

import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { baseNavigationRules } from './navigationRules';

export interface BuildLegendStructureOptions {
  /** The chart data (plain objects). */
  data: SimpleData[];
  /** The series/color field the legend entries are drawn from. */
  field: string;
  /** Optional legend title (falls back to "Legend" in generated labels). */
  title?: string;
  /** Series removed from the legend entirely — excluded so navigation matches the rendered entries. */
  hiddenEntries?: string[];
}

export interface LegendStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

const uniqueSeriesValues = (data: SimpleData[], field: string): (string | number)[] => {
  const seen = new Set<string>();
  const values: (string | number)[] = [];
  for (const datum of data) {
    const value = datum[field];
    if (value == null) continue;
    const key = String(value);
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(value as string | number);
  }
  return values;
};

const buildLegendNodeLabel = (node: NodeObject, field: string): string => {
  const data = node.data as Record<string, unknown> | undefined;
  if (data && field in data) {
    return `${data[field]}.`;
  }
  return String(node.id);
};

const prepareLegendNodeSemantics = (structure: Structure, field: string): void => {
  for (const node of Object.values(structure.nodes)) {
    if (!node.semantics?.label) {
      node.semantics = { ...node.semantics, label: buildLegendNodeLabel(node, field) };
    }
  }
};

export const buildLegendDescription = (entryCount: number, title?: string): string => {
  const legendName = title || 'Legend';
  return `${legendName}. Contains ${entryCount} series entr${entryCount === 1 ? 'y' : 'ies'}. Use the left and right arrow keys to browse.`;
};

export const buildLegendStructure = ({ data, field, title, hiddenEntries = [] }: BuildLegendStructureOptions): LegendStructure => {
  // Exclude hiddenEntries so navigation only visits entries the legend actually renders (otherwise
  // arrowing onto a hidden series focuses nothing — no ring — which reads as a dead step).
  const values = uniqueSeriesValues(data, field).filter((value) => !hiddenEntries.includes(String(value)));
  const structureData = values.map((value) => ({ [field]: value }));

  const structureOptions: StructureOptions = {
    data: structureData,
    idKey: field,
    navigationRules: baseNavigationRules,
    dimensions: {
      values: [
        {
          dimensionKey: field,
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
      rootNode.semantics = { label: buildLegendDescription(values.length, title) };
    }
  }

  prepareLegendNodeSemantics(structure, field);

  return { structure, entryPoint };
};
