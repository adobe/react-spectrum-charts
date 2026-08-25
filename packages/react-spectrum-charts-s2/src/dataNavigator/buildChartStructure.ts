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
import { buildLegendStructure } from './buildLegendStructure';
import { composeRegions, NamedRegion } from './composeRegions';

export type NavigableChartType = 'bar';

export interface AxisRegionOptions {
  /** The field this axis represents (the dimension for a categorical axis, the metric for a numerical axis). */
  field: string;
  /** Whether the axis's tick nodes are discrete category values or generated numerical steps. */
  type: AxisFieldType;
  /** Optional axis title (falls back to the field name in generated labels). */
  title?: string;
  /** The rendered (non-overlap-hidden) tick values from the scenegraph; navigation is restricted to these. */
  visibleValues?: string[];
  /**
   * The bar's dimension-hover signal (e.g. `bar0_dimensionHoverArea_hoveredItem`). Focusing a label
   * drives it so the same bar highlight as MOUSE hover activates (keyboard focus doesn't fire mouseover).
   */
  dimensionHoverSignal?: string;
}

export interface LegendRegionOptions {
  /** The series/color field the legend entries are drawn from. */
  field: string;
  /** Optional legend title (falls back to "Legend" in generated labels). */
  title?: string;
  /** Series removed from the legend entirely — excluded from navigation so focus never lands on a missing entry. */
  hiddenEntries?: string[];
  /** Legend name (drives the `${name}_hoveredSeries` highlight signal). */
  name?: string;
  /** Whether the legend has highlight enabled — if so, focusing an entry also activates the highlight. */
  highlight?: boolean;
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
  /** Optional chart title for the accessible description. */
  title?: string;
  /** When provided, adds a top-level, sibling-navigable x-axis region alongside chart content. */
  xAxis?: AxisRegionOptions;
  /** When provided, adds a top-level, sibling-navigable y-axis region alongside chart content. */
  yAxis?: AxisRegionOptions;
  /** When provided, adds a top-level, sibling-navigable legend region alongside chart content. */
  legend?: LegendRegionOptions;
  /** When false, the chart-content (bar) region is omitted so only auxiliary regions are navigable. Defaults to true. */
  content?: boolean;
}

export interface ChartStructure {
  structure: Structure;
  entryPoint: string | undefined;
}

const contentStructureBuilders: Record<NavigableChartType, (options: ChartStructureOptions) => ChartStructure> = {
  bar: buildBarStructure,
};

export const buildChartStructure = (options: ChartStructureOptions): ChartStructure | undefined => {
  const regions: NamedRegion[] = [];
  let content: ChartStructure | undefined;

  if (options.content !== false) {
    const buildContent = contentStructureBuilders[options.chartType];
    if (!buildContent) return undefined;
    content = buildContent(options);
    regions.push({ name: 'content', structure: content.structure, entryPoint: content.entryPoint, namespace: false });
  }

  if (options.xAxis) {
    const { structure, entryPoint } = buildAxisStructure({ data: options.data, ...options.xAxis });
    regions.push({ name: 'xAxis', structure, entryPoint });
  }
  if (options.yAxis) {
    const { structure, entryPoint } = buildAxisStructure({ data: options.data, ...options.yAxis });
    regions.push({ name: 'yAxis', structure, entryPoint });
  }
  if (options.legend) {
    const { structure, entryPoint } = buildLegendStructure({ data: options.data, ...options.legend });
    regions.push({ name: 'legend', structure, entryPoint });
  }

  if (regions.length === 0) return undefined;

  // Content-only: return the raw (un-namespaced, untagged) structure so its ids match Vega directly.
  if (regions.length === 1 && content) return content;

  return composeRegions(regions);
};
