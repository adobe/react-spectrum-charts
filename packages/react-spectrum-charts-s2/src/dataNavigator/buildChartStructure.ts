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

import { AxisFieldType, buildAxisStructure } from './buildAxisStructure';
import { buildBarStructure, segmentId } from './buildBarStructure';
import { composeRegions, NamedRegion } from './composeRegions';
import { getBaseNavigationRules } from './navigationRules';

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
  /** Bar layout type. */
  type?: 'dodged' | 'stacked';
  /** Per-datum color override field used in accessible bar labels. */
  colorOverride?: string;
  /** Locale used for accessible color names. */
  locale?: string;
  /** Primary metric / y-axis field. */
  metric?: string;
  /** The stack sort field. When set on a stacked bar, determines which segment is reached first, mirroring Vega's own stack sort. */
  order?: string;
  /** Chart orientation. Swaps which arrow keys move between stacks vs. within a stack. Defaults to vertical. */
  orientation?: Orientation;
  /** Optional chart title for the accessible description. */
  title?: string;
  /** Maps a data field to its axis/legend title, so a focused leaf's accessible name reads as the chart's titles. */
  fieldLabels?: Record<string, string>;
  /** Per-series metric-axis titles for dual-metric-axis bars. */
  metricTitleBySeries?: Record<string, string>;
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

/**
 * The leaf node id for a clicked mark's datum, matching how the content builder keys its leaves — so a
 * mouse click can move keyboard focus to the same node. Returns undefined when the datum isn't a
 * navigable leaf (e.g. an axis label or a stack's padding area).
 */
export const getNodeIdForDatum = (
  chartType: NavigableChartType,
  datum: SimpleData,
  { dimension = DEFAULT_CATEGORICAL_DIMENSION, color }: { dimension?: string; color?: string }
): string | undefined => {
  if (chartType !== 'bar') return undefined;
  const dimensionValue = datum[dimension];
  if (dimensionValue == null) return undefined;
  // Stacked leaves are keyed by dimension+series; a padding-area datum has no series, so it won't match.
  if (color !== undefined) {
    return datum[color] == null ? undefined : segmentId(dimensionValue, datum[color]);
  }
  return String(dimensionValue);
};

export const buildChartStructure = (options: ChartStructureOptions): ChartStructure | undefined => {
  const buildContent = contentStructureBuilders[options.chartType];
  if (!buildContent) return undefined;
  const content = buildContent(options);

  if (!options.xAxis) return content;

  const xAxis = buildAxisStructure({ data: options.data, ...options.xAxis });
  // No navigable ticks (e.g. none of the axis's values are currently painted, or the region was wired
  // to a mismatched axis): skip the axis region rather than letting composeRegions throw on it.
  if (!xAxis.entryPoint) return content;
  const regions: NamedRegion[] = [
    { name: 'content', structure: content.structure, entryPoint: content.entryPoint, namespace: false },
    { name: 'xAxis', structure: xAxis.structure, entryPoint: xAxis.entryPoint },
  ];
  const composed = composeRegions(regions);
  // composeRegions defaults to the vertical rules; carry the chart's actual orientation onto the result.
  composed.structure.navigationRules = getBaseNavigationRules(options.orientation);
  return composed;
};
