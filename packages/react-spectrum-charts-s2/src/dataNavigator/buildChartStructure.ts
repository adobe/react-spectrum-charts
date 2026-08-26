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
import { Structure } from 'data-navigator';

import { DEFAULT_CATEGORICAL_DIMENSION } from '@spectrum-charts/constants';
import { Orientation, SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { buildBarStructure, getBarNodeId } from './buildBarStructure';
import { buildLineStructure, getLineNodeId } from './buildLineStructure';

export type NavigableChartType = 'bar' | 'line';

export interface ChartStructureOptions {
  /** The chart type to build a navigation structure for. */
  chartType: NavigableChartType;
  /** Chart data (plain objects). */
  data: SimpleData[];
  /** Primary categorical / x-axis field (e.g. bar category). */
  dimension?: string;
  /** Series / color field. When set on a bar, the chart is stacked. */
  color?: string;
  /** Primary metric / y-axis field. */
  metric?: string;
  /** Display label for the metric total (e.g. the metric axis's title). Bar-only; falls back to the raw metric field name when not given. */
  metricLabel?: string;
  /** Chart orientation. Bar-only; swaps arrow-key bindings for a horizontal bar. Defaults to vertical. */
  orientation?: Orientation;
  /** Whether the dimension field is time-scaled (used by line charts to format dates in labels). */
  isTimeDimension?: boolean;
  /** Optional chart title for the accessible description. */
  title?: string;
}

export interface ChartStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

const structureBuilders: Record<NavigableChartType, (options: ChartStructureOptions) => ChartStructure> = {
  bar: buildBarStructure,
  line: buildLineStructure,
};

export const buildChartStructure = (options: ChartStructureOptions): ChartStructure | undefined =>
  structureBuilders[options.chartType]?.(options);

export type NodeIdOptions = Pick<ChartStructureOptions, 'dimension' | 'color'>;

const nodeIdResolvers: Record<NavigableChartType, (datum: SimpleData, options: NodeIdOptions) => string | undefined> = {
  bar: (datum, { dimension = DEFAULT_CATEGORICAL_DIMENSION, color }) => getBarNodeId(datum, dimension, color),
  line: (datum, { color }) => getLineNodeId(datum, color),
};

/** Resolves the data-navigator leaf node id for a rendered datum — used to move focus on click. */
export const getNodeIdForDatum = (
  chartType: NavigableChartType,
  datum: SimpleData,
  options: NodeIdOptions
): string | undefined => nodeIdResolvers[chartType]?.(datum, options);
