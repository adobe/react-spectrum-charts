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

import { SERIES_ID } from '@spectrum-charts/core-s2/constants';

import { AxesLayout, AxisResult, axesComponent } from './axes.js';
import { emptyBounds, nodeBounds, union } from './bounds.js';
import { EMPTY_OUTPUT, MarkContext, MarkOutput, getChartType } from './charts/chartType.js';
import { ChartComponent, ComponentContext, ComponentStage, LayoutBounds, LayoutPart } from './component.js';
import { CHART_COMPONENTS } from './components.js';
import { Formatter } from './format.js';
import { LegendResult, legendsComponent } from './legend.js';
import {
  ChartData,
  DimensionScaleType,
  DualMetricScales,
  MetricScales,
  XScale,
  getDimensionScale,
  getDualMetricScales,
  getMetricScale,
  getNamedMetricScales,
} from './scales.js';
import { Bounds } from './text.js';
import { ChartSize, Theme } from './theme.js';
import { ChartState, Datum, HitTarget, ResolvedChartOptions, SupportedMarkOptions } from './types.js';

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Inputs that only change with options or container size; state changes reuse a layout. */
export interface LayoutInput {
  options: ResolvedChartOptions;
  theme: Theme;
  size: ChartSize;
  data: ChartData;
  formatter: Formatter;
  /** View size including padding, like the Vega view's width and height. */
  viewWidth: number;
  viewHeight: number;
  padding: Padding;
}

export interface Layout {
  width: number;
  height: number;
  /** Plot origin within the view, including chart padding. */
  origin: { x: number; y: number };
  xScale: XScale;
  yScale: ScaleLinear<number, number>;
  /** Primary and secondary metric scales when a line uses `dualMetricAxis`. */
  dual?: DualMetricScales;
  /** Metric scales named by marks' `metricAxis`. */
  metricScales: MetricScales;
  axes: AxisResult[];
  legends: LegendResult[];
  /** Chart-level component results in draw order. */
  parts: LayoutPart[];
  /** Pointer targets outside the marks, in draw order so the last hit wins. */
  targets: HitTarget[];
}

const MAX_PASSES = 10;
const NEUTRAL_STATE: ChartState = {};

/**
 * Creates the shared x and y scales for a plot size.
 * @param input
 * @param width
 * @param height
 * @returns scales
 */
export const getScales = (
  input: LayoutInput,
  width: number,
  height: number
): {
  xScale: XScale;
  yScale: ScaleLinear<number, number>;
  xScaleType: DimensionScaleType;
  xField: string;
  dual?: DualMetricScales;
  metricScales: MetricScales;
} => {
  const { options, data } = input;
  const marks = options.marks ?? [];
  const first = marks[0];
  const type = first ? getChartType(first.markType)?.dimensionScaleType(first) ?? 'time' : 'linear';
  const field = first ? getChartType(first.markType)?.dimensionField(first) ?? 'datetime' : 'datetime';
  const fieldsOf = (mark: SupportedMarkOptions) => getChartType(mark.markType)?.metricFields(mark) ?? [];
  const metricFields = marks.flatMap(fieldsOf);
  // like Vega, every vertical axis range (even a named axis's) overrides the default metric scale, so the last wins
  const rangeAxis = options.axes?.findLast(
    (axis) => (axis.position === 'left' || axis.position === 'right') && axis.range
  );
  // like Vega, the last mark that sets padding overrides the shared dimension scale's padding
  const padding = marks.findLast((mark) => mark.padding !== undefined)?.padding;
  return {
    xScaleType: type,
    xField: field,
    xScale: getDimensionScale(type, data.domainTable, field, width, padding),
    yScale: getMetricScale(data.domainTable, metricFields, height, rangeAxis?.range),
    dual: marks.some((mark) => mark.dualMetricAxis)
      ? getDualMetricScales(data, metricFields, height, options.hiddenSeries ?? [])
      : undefined,
    metricScales: getNamedMetricScales(marks, data.domainTable, height, fieldsOf),
  };
};

/**
 * Whether a vertical axis fixes the metric domain with a custom range.
 * @param options
 * @returns boolean
 */
export const hasFixedMetricAxis = (options: ResolvedChartOptions): boolean =>
  (options.axes ?? []).some((axis) => Boolean(axis.range) && (axis.position === 'left' || axis.position === 'right'));

/**
 * Gets the per-row metric scale picker for a dual metric axis.
 * @param dual
 * @returns picker or undefined
 */
export const getYScaleFor = (dual?: DualMetricScales): ((row: Datum) => ScaleLinear<number, number>) | undefined =>
  dual && ((row: Datum) => (row[SERIES_ID] === dual.lastSeriesId ? dual.secondary : dual.primary));

/**
 * Builds every mark for a frame.
 * @param ctx
 * @returns mark outputs in draw order
 */
export const buildMarks = (ctx: MarkContext): MarkOutput[] =>
  (ctx.options.marks ?? []).map((mark, i) => getChartType(mark.markType)?.build(mark, i, ctx) ?? EMPTY_OUTPUT);

/**
 * Gets each mark's hover targets.
 * @param ctx
 * @returns targets per mark index
 */
export const getHoverTargets = (ctx: MarkContext): (Map<string, number> | undefined)[] =>
  (ctx.options.marks ?? []).map((mark, i) => getChartType(mark.markType)?.hoverTargets?.(mark, ctx, i));

/**
 * Runs one Vega layoutGroup pass at a plot size.
 * @returns the pass's layout and the view bounds it occupies
 */
const layoutPass = (
  input: LayoutInput,
  width: number,
  height: number,
  state: ChartState
): { layout: Layout; viewBounds: Bounds; marks: MarkOutput[] } => {
  const { options, theme, size, data } = input;
  const scales = getScales(input, width, height);
  const { xScale, yScale, dual, metricScales } = scales;
  const bounds: LayoutBounds = {
    view: emptyBounds(),
    x: { x1: 0, y1: 0, x2: width, y2: height },
    y: { x1: 0, y1: 0, x2: width, y2: height },
  };
  const ctx: ComponentContext = { ...input, ...scales, width, height, state, bounds };
  const results = new Map<ChartComponent, unknown>();
  const runStage = (stage: ComponentStage) => {
    for (const component of CHART_COMPONENTS) {
      if (component.stage === stage) results.set(component, component.layout(ctx));
    }
  };

  runStage('axes');
  const marks = buildMarks({
    options,
    theme,
    size,
    data,
    width,
    height,
    xScale,
    yScale,
    yScaleFor: getYScaleFor(dual),
    metricScales,
    hasFixedMetricAxis: hasFixedMetricAxis(options),
    state,
  });
  for (const output of marks) {
    for (const node of output.marks) {
      // facet groups are scopes, so like Vega they also count toward the axis-aligned bounds
      if (node.type === 'group' && node.children.some((c) => c.role === 'scope')) {
        const b = nodeBounds(node);
        union(bounds.x, b);
        union(bounds.y, b);
      } else {
        union(bounds.view, nodeBounds(node));
      }
    }
    if (output.interactionBounds) union(bounds.view, output.interactionBounds);
  }
  runStage('plot');
  runStage('outer');
  union(bounds.view, bounds.x);
  union(bounds.view, bounds.y);
  runStage('title');

  const parts: LayoutPart[] = CHART_COMPONENTS.map((component) => ({ component, result: results.get(component) }));
  parts.sort((a, b) => a.component.layer - b.component.layer);
  return {
    layout: {
      width,
      height,
      origin: { x: 0, y: 0 },
      xScale,
      yScale,
      dual,
      metricScales,
      axes: (results.get(axesComponent) as AxesLayout).axes,
      legends: results.get(legendsComponent) as LegendResult[],
      parts,
      targets: parts.flatMap(({ component, result }) => component.targets?.(result) ?? []),
    },
    viewBounds: bounds.view,
    marks,
  };
};

// the marks each layout's final pass built, keyed by layout so they stay internal
const layoutMarks = new WeakMap<Layout, { state: ChartState; marks: MarkOutput[] }>();

/**
 * Gets the marks a layout's final pass built, if they were built for this state.
 * @param layout
 * @param state
 * @returns the marks, or undefined when they need a rebuild
 */
export const getLayoutMarks = (layout: Layout, state: ChartState): MarkOutput[] | undefined => {
  const entry = layoutMarks.get(layout);
  return entry?.state === state ? entry.marks : undefined;
};

/**
 * Lays out the chart like Vega's fit autosize: repeat passes until the plot size is stable.
 * @param input
 * @param state interaction state, since hover emphasis (like a thicker stroke) can change mark bounds
 * @param from plot size to start from; Vega re-fits from the current size when state changes
 * @returns Layout
 */
export const computeLayout = (
  input: LayoutInput,
  state: ChartState = NEUTRAL_STATE,
  from?: { width: number; height: number }
): Layout => {
  const { padding } = input;
  const viewWidth = Math.max(0, input.viewWidth - padding.left - padding.right);
  const viewHeight = Math.max(0, input.viewHeight - padding.top - padding.bottom);
  let width = from?.width ?? viewWidth;
  let height = from?.height ?? viewHeight;
  for (let pass = 0; ; pass++) {
    const { layout, viewBounds: b, marks } = layoutPass(input, width, height, state);
    layoutMarks.set(layout, { state, marks });
    const left = Math.max(0, Math.ceil(-b.x1));
    const top = Math.max(0, Math.ceil(-b.y1));
    const right = Math.max(0, Math.ceil(b.x2 - width));
    const bottom = Math.max(0, Math.ceil(b.y2 - height));
    layout.origin = { x: padding.left + left, y: padding.top + top };
    const nextWidth = Math.max(0, viewWidth - left - right);
    const nextHeight = Math.max(0, viewHeight - top - bottom);
    if ((nextWidth === width && nextHeight === height) || pass >= MAX_PASSES) return layout;
    width = nextWidth;
    height = nextHeight;
  }
};
