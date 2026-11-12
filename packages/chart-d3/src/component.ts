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
import type { ScaleLinear } from 'd3-scale';

import type { MarkContext } from './charts/chartType.js';
import type { LayoutInput } from './layout.js';
import type { DimensionScaleType, DualMetricScales, MetricScales, XScale } from './scales.js';
import type { SceneNode } from './scene.js';
import type { Bounds } from './text.js';
import type { ChartState, HitTarget } from './types.js';

/** Bounds a layout pass accumulates, like Vega's view bounds and the axis-aligned bounds legends place against. */
export interface LayoutBounds {
  view: Bounds;
  /** Plot plus vertical axes. */
  x: Bounds;
  /** Plot plus horizontal axes. */
  y: Bounds;
}

/** Everything a component reads to lay out at one plot size. */
export interface ComponentContext extends LayoutInput {
  width: number;
  height: number;
  state: ChartState;
  xScale: XScale;
  xScaleType: DimensionScaleType;
  xField: string;
  yScale: ScaleLinear<number, number>;
  dual?: DualMetricScales;
  metricScales: MetricScales;
  bounds: LayoutBounds;
}

/** Per-frame inputs a component's scene reads. */
export interface FrameContext {
  state: ChartState;
  marks: MarkContext;
  /** Entry opacity per legend index, with hover emphasis applied. */
  legendOpacity: (index: number) => (value: string) => number;
}

/**
 * When a component lays out in a pass:
 * - `axes` before the marks; grows the axis-aligned bounds
 * - `plot` after the marks; grows the view bounds
 * - `outer` once the axis-aligned bounds are final, like legends
 * - `title` last, once the view bounds are final
 */
export type ComponentStage = 'axes' | 'plot' | 'outer' | 'title';

/** A chart-level feature that lays out, draws and takes pointer input. Marks draw at layer 0. */
export interface ChartComponent<R = unknown> {
  name: string;
  stage: ComponentStage;
  /** Draw order relative to the marks (layer 0); lower draws first. */
  layer: number;
  /** Builds the component at the pass's plot size and adds its bounds to `ctx.bounds`. */
  layout(ctx: ComponentContext): R;
  scene(result: R, frame: FrameContext): SceneNode[];
  /** Pointer targets in draw order, relative to the plot origin. */
  targets?(result: R): HitTarget[];
}

/** A component's layout result. */
export interface LayoutPart {
  component: ChartComponent;
  result: unknown;
}

/**
 * Defines a component, keeping its result type.
 * @param component
 * @returns component
 */
export const defineComponent = <R>(component: ChartComponent<R>): ChartComponent<R> => component;
