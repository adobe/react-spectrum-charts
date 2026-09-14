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

import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { AxisFieldType, buildAxisStructure } from './buildAxisStructure';
import { buildBarStructure } from './buildBarStructure';
import { composeRegions, NamedRegion } from './composeRegions';

export type NavigableChartType = 'bar';

export interface AxisRegionOptions {
  /** The field this axis represents — the dimension for a categorical x-axis. */
  field: string;
  /** Whether the axis's tick nodes are discrete category values or generated numerical steps. */
  type: AxisFieldType;
  /** Optional axis title (falls back to the field name in generated labels). */
  title?: string;
  /** The rendered (non-overlap-hidden) tick values from the scenegraph; navigation is restricted to these. */
  visibleValues?: string[];
}

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
  /** The stack sort field. When set on a stacked bar, determines which segment is reached first, mirroring Vega's own stack sort. */
  order?: string;
  /** Optional chart title for the accessible description. */
  title?: string;
  /** When provided, adds a sibling-navigable x-axis region alongside chart content (Left/Right moves between them). */
  xAxis?: AxisRegionOptions;
}

export interface ChartStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

const contentStructureBuilders: Record<NavigableChartType, (options: ChartStructureOptions) => ChartStructure> = {
  bar: buildBarStructure,
};

export const buildChartStructure = (options: ChartStructureOptions): ChartStructure | undefined => {
  const buildContent = contentStructureBuilders[options.chartType];
  if (!buildContent) return undefined;
  const content = buildContent(options);

  if (!options.xAxis) return content;

  const xAxis = buildAxisStructure({ data: options.data, ...options.xAxis });
  const regions: NamedRegion[] = [
    { name: 'content', structure: content.structure, entryPoint: content.entryPoint, namespace: false },
    { name: 'xAxis', structure: xAxis.structure, entryPoint: xAxis.entryPoint },
  ];
  return composeRegions(regions);
};
