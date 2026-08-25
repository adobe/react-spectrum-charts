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
import { ticks } from 'd3-array';
import dataNavigator, { NodeObject, Structure, StructureOptions } from 'data-navigator';

import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { baseNavigationRules } from './navigationRules';

/** Approximate tick count for a numerical axis; the live Vega scale may render a different count. */
const APPROXIMATE_TICK_COUNT = 5;

/**
 * Data field carrying a stringified copy of the tick value, used as data-navigator's idKey.
 * data-navigator keeps a leaf node's `id` as whatever raw value idKey resolves to; for a numerical
 * axis that's a number, and the library's own edge-building code assumes ids are always strings
 * (or functions) elsewhere, throwing when it tries to call a numeric id as a function.
 */
const AXIS_ID_KEY = '_dnId';

export type AxisFieldType = 'categorical' | 'numerical';

export interface BuildAxisStructureOptions {
  /** The chart data (plain objects). */
  data: SimpleData[];
  /** The field this axis represents (the dimension for a categorical/x axis, the metric for a numerical/y axis). */
  field: string;
  /** Whether the field's tick nodes are discrete category values or generated numerical steps. */
  type: AxisFieldType;
  /** Optional axis title (falls back to the field name in generated labels). */
  title?: string;
  /**
   * The values Vega actually rendered (from the scenegraph), used to skip overlap-hidden ticks so
   * navigation only visits labels that are on screen. When omitted/empty, all values are navigable.
   */
  visibleValues?: string[];
}

export interface AxisStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

const uniqueCategoricalValues = (data: SimpleData[], field: string): (string | number)[] => {
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

/**
 * Approximate "nice" tick values from the data's numerical extent. The live Vega scale computes
 * the actual rendered tick count from container width at render time, so this is a static stand-in
 * rather than a read of the real rendered ticks.
 */
const approximateNumericalTicks = (data: SimpleData[], field: string): number[] => {
  const values = data.map((datum) => Number(datum[field])).filter((value) => !Number.isNaN(value));
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [min];
  return ticks(min, max, APPROXIMATE_TICK_COUNT);
};

const buildAxisNodeLabel = (node: NodeObject, field: string, title?: string): string => {
  const axisName = title || field;
  const data = node.data as Record<string, unknown> | undefined;
  if (data && field in data) {
    return `${axisName}: ${data[field]}.`;
  }
  return String(node.id);
};

const prepareAxisNodeSemantics = (structure: Structure, field: string, title?: string): void => {
  for (const node of Object.values(structure.nodes)) {
    if (!node.semantics?.label) {
      node.semantics = { ...node.semantics, label: buildAxisNodeLabel(node, field, title) };
    }
  }
};

export const buildAxisDescription = (tickCount: number, field: string, title?: string): string => {
  const axisName = title || field;
  return `${axisName} axis. Contains ${tickCount} tick value${tickCount === 1 ? '' : 's'}. Use the left and right arrow keys to browse.`;
};

export const buildAxisStructure = ({ data, field, type, title, visibleValues }: BuildAxisStructureOptions): AxisStructure => {
  const allValues = type === 'categorical' ? uniqueCategoricalValues(data, field) : approximateNumericalTicks(data, field);
  // Restrict to the labels actually painted (overlap-hidden ones are excluded), preserving axis order.
  const values = visibleValues?.length ? allValues.filter((value) => visibleValues.includes(String(value))) : allValues;
  const structureData = values.map((value) => ({ [field]: value, [AXIS_ID_KEY]: String(value) }));

  const structureOptions: StructureOptions = {
    data: structureData,
    idKey: AXIS_ID_KEY,
    navigationRules: baseNavigationRules,
    dimensions: {
      values: [
        {
          dimensionKey: field,
          // Always a flat, discrete list of tick nodes navigation-wise, regardless of the underlying field type.
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
      rootNode.semantics = { label: buildAxisDescription(values.length, field, title) };
    }
  }

  prepareAxisNodeSemantics(structure, field, title);

  return { structure, entryPoint };
};
