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
import { ScaleLinear } from 'd3-scale';

import { NavigationSeries } from '../navigation.js';
import { ChartData, DimensionScaleType, MetricScales, XScale } from '../scales.js';
import { SceneNode } from '../scene.js';
import { Bounds } from '../text.js';
import { ChartSize, Theme } from '../theme.js';
import { ChartState, Datum, HitTarget, ResolvedChartOptions, SupportedMarkOptions } from '../types.js';

/** Everything a chart type needs to build its scene for one frame. */
export interface MarkContext {
  options: ResolvedChartOptions;
  theme: Theme;
  size: ChartSize;
  data: ChartData;
  width: number;
  height: number;
  xScale: XScale;
  yScale: ScaleLinear<number, number>;
  /** Picks the metric scale for a row when a dual metric axis splits series across scales. */
  yScaleFor?: (row: Datum) => ScaleLinear<number, number>;
  /** Metric scales named by marks' `metricAxis`, keyed by name. */
  metricScales?: MetricScales;
  state: ChartState;
  /** Clips marks to the plot because a metric axis has a fixed range. */
  hasFixedMetricAxis?: boolean;
}

/** The scene and interaction surface one mark contributes. */
export interface MarkOutput {
  /** Data marks (e.g. line paths); counted in plot bounds like Vega's scope groups. */
  marks: SceneNode[];
  /** Hover/selection marks drawn above everything; rebuilt on state changes only. */
  overlay: SceneNode[];
  /** Bounds of invisible interaction marks that Vega still counts in layout (e.g. voronoi points). */
  interactionBounds?: Bounds;
  /** Finds the item under a plot-relative point. */
  hitTest?: (x: number, y: number) => Datum | null;
  /** Finds the interactive item under a plot-relative point, with plot-relative bounds. */
  hitTarget?: (x: number, y: number) => HitTarget | null;
}

/** Output for marks with no registered chart type. */
export const EMPTY_OUTPUT: MarkOutput = { marks: [], overlay: [] };

/** A chart type plugin; adding a chart means adding one of these, not touching the engine. */
export interface ChartType<M extends SupportedMarkOptions = SupportedMarkOptions> {
  markType: M['markType'];
  /** Dimension scale type for the shared x scale. */
  dimensionScaleType: (mark: M) => DimensionScaleType;
  dimensionField: (mark: M) => string;
  /** Fields that drive the shared metric (y) domain. */
  metricFields: (mark: M) => string[];
  build: (mark: M, index: number, ctx: MarkContext) => MarkOutput;
  /** Whether the mark reacts to pointer hover; legends fade to the hovered item's series only for interactive marks. */
  isInteractive?: (mark: M) => boolean;
  /** Hovered group id when hover highlights a group, like Vega's `highlightedGroup` signal. */
  highlightedGroup?: (mark: M, ctx: MarkContext) => unknown;
  /** Hover emphasis target per key (0 faded, 0.5 neutral, 1 emphasized) that hover animations tween toward. */
  hoverTargets?: (mark: M, ctx: MarkContext, index: number) => Map<string, number>;
  /** Navigable series and points in plot coordinates, for keyboard navigation and focus rings. */
  navigation?: (mark: M, index: number, ctx: MarkContext) => NavigationSeries[];
}

const registry = new Map<string, ChartType>();

/**
 * Registers a chart type plugin.
 * @param type
 */
export const registerChartType = <M extends SupportedMarkOptions>(type: ChartType<M>): void => {
  registry.set(type.markType, type as unknown as ChartType);
};

/**
 * Gets a registered chart type.
 * @param markType
 * @returns ChartType or undefined
 */
export const getChartType = (markType: string): ChartType | undefined => registry.get(markType);
