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

import { AxisResult, buildAxes, getDualAxisColors } from './axes.js';
import { getBaselines } from './baselines.js';
import { EMPTY_OUTPUT, MarkContext, MarkOutput, getChartType } from './charts/chartType.js';
import { Formatter } from './format.js';
import { LegendResult, buildLegend } from './legend.js';
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
import { GroupNode, SceneNode } from './scene.js';
import { ChartSize, Theme } from './theme.js';
import { TitleResult, buildTitle, placeTitle } from './title.js';
import { Datum, HitTarget, Position, ResolvedChartOptions, SupportedMarkOptions } from './types.js';

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Inputs that only change with options or container size. */
export interface LayoutInput {
  options: ResolvedChartOptions;
  theme: Theme;
  size: ChartSize;
  data: ChartData;
  formatter: Formatter;
  /** View size including padding. */
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
  xScaleType: DimensionScaleType;
  yScale: ScaleLinear<number, number>;
  /** Primary and secondary metric scales when a line uses `dualMetricAxis`. */
  dual?: DualMetricScales;
  /** Metric scales named by marks' `metricAxis`. */
  metricScales: MetricScales;
  axes: AxisResult[];
  legends: LegendResult[];
  title?: GroupNode;
  /** Baselines drawn under the marks (non-zero offsets) and over them (zero). */
  baselines: { under: SceneNode[]; over: SceneNode[] };
  /** Axis label pointer targets, in draw order so the last hit wins. */
  targets: HitTarget[];
}

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
  // every vertical axis range (even a named axis's) applies to the default metric scale, so the last wins
  const rangeAxis = options.axes?.findLast(
    (axis) => (axis.position === 'left' || axis.position === 'right') && axis.range
  );
  // the last mark that sets padding sets the shared dimension scale's padding
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

type Sides = Record<Position, number>;

const sides = (): Sides => ({ top: 0, right: 0, bottom: 0, left: 0 });

const thickest = (axes: AxisResult[], position: Position): number =>
  Math.max(0, ...axes.filter((axis) => axis.position === position).map((axis) => axis.thickness));

const overhang = (axes: AxisResult[], vertical: boolean, end: 0 | 1): number =>
  Math.max(
    0,
    ...axes
      .filter((axis) => (axis.position === 'left' || axis.position === 'right') === vertical)
      .map((axis) => axis.overhang[end])
  );

/** Space a plot side needs: its thickest axis, label overhang from perpendicular axes, or the mark inset. */
const edgeSpace = (axes: AxisResult[], side: Position, markInset: number): number => {
  // top/bottom space holds vertical axes' label overhang, and left/right holds horizontal axes'
  const vertical = side === 'top' || side === 'bottom';
  const end = side === 'top' || side === 'left' ? 0 : 1;
  return Math.max(thickest(axes, side), overhang(axes, vertical, end), markInset);
};

/** Space the title and legends take on each side, outside the axes. */
const getOuterSpace = (title: TitleResult | undefined, legends: LegendResult[], theme: Theme): Sides => {
  const outer = sides();
  if (title) outer[title.orient] += title.thickness + theme.title.offset;
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const sizes = legends
      .filter((legend) => legend.position === side)
      .map((legend) => (side === 'left' || side === 'right' ? legend.width : legend.height));
    const space = Math.max(0, ...sizes);
    if (space) outer[side] += space + theme.legend.offset;
  }
  return outer;
};

/**
 * Places legends just outside the axes: left/right legends stack and center on the plot height,
 * top/bottom legends sit side by side from the plot's left edge.
 * @param legends
 * @param axisSpace space the axes take on each side
 * @param width plot width
 * @param height plot height
 * @param theme
 */
const placeLegends = (legends: LegendResult[], axisSpace: Sides, width: number, height: number, theme: Theme) => {
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const group = legends.filter((legend) => legend.position === side);
    const vertical = side === 'left' || side === 'right';
    const gap = vertical ? 24 : 48;
    const length = (l: LegendResult) => (vertical ? l.height : l.width);
    const total = group.reduce((sum, l) => sum + length(l), gap * (group.length - 1));
    const out = axisSpace[side] + theme.legend.offset;
    const across: Record<Position, (l: LegendResult) => number> = {
      left: (l) => -out - l.width,
      right: () => width + out,
      top: (l) => -out - l.height,
      bottom: () => height + out,
    };
    let along = vertical ? Math.round((height - total) / 2) : 0;
    for (const legend of group) {
      legend.node.x = vertical ? across[side](legend) : along;
      legend.node.y = vertical ? along : across[side](legend);
      along += length(legend) + gap;
    }
  }
};

/**
 * Lays out the chart in one pass: the title and legends take space first, then horizontal axes set the plot
 * height, vertical axes (measured with real y ticks) set the plot width, and the axes are built at the final size.
 * @param input
 * @returns Layout
 */
export const computeLayout = (input: LayoutInput): Layout => {
  const { options, theme, size, padding, data } = input;
  const availWidth = Math.max(0, input.viewWidth - padding.left - padding.right);
  const availHeight = Math.max(0, input.viewHeight - padding.top - padding.bottom);

  const title = buildTitle(options, theme);
  const legends = (options.legends ?? []).flatMap((legend, i) => {
    const ctx = { ...input, plotWidth: availWidth, hiddenSeries: options.hiddenSeries ?? [] };
    return buildLegend(legend, i, ctx) ?? [];
  });
  const outer = getOuterSpace(title, legends, theme);

  // marks never affect layout; this keeps strokes and points at the plot edge from clipping
  const markInset = Math.ceil(Math.sqrt(size.pointSize) / 2 + size.hoverStrokeWidth / 2);
  const build = (width: number, height: number) => {
    const scales = getScales(input, width, height);
    const { dual } = scales;
    const axes = buildAxes(options.axes ?? [], {
      ...input,
      ...scales,
      width,
      height,
      dual: dual && { primary: dual.primary, secondary: dual.secondary, ...getDualAxisColors(data, dual, theme) },
    });
    return { scales, axes };
  };
  const width0 = Math.max(0, availWidth - outer.left - outer.right);
  const height0 = Math.max(0, availHeight - outer.top - outer.bottom);
  const axisSpace = sides();
  const first = build(width0, height0);
  axisSpace.top = edgeSpace(first.axes, 'top', markInset);
  axisSpace.bottom = edgeSpace(first.axes, 'bottom', markInset);
  const height = Math.max(0, height0 - axisSpace.top - axisSpace.bottom);
  const second = build(width0, height);
  axisSpace.left = edgeSpace(second.axes, 'left', markInset);
  axisSpace.right = edgeSpace(second.axes, 'right', markInset);
  const width = Math.max(0, width0 - axisSpace.left - axisSpace.right);
  const { scales, axes } = build(width, height);

  placeLegends(legends, axisSpace, width, height, theme);
  const inset = (side: Position) => outer[side] + axisSpace[side];
  if (title) placeTitle(title, width, height, inset(title.orient));
  const baselineCtx = { options, theme, width, height, ...scales };
  return {
    width,
    height,
    origin: { x: padding.left + inset('left'), y: padding.top + inset('top') },
    xScale: scales.xScale,
    xScaleType: scales.xScaleType,
    yScale: scales.yScale,
    dual: scales.dual,
    metricScales: scales.metricScales,
    axes,
    legends,
    title: title?.node,
    baselines: { under: getBaselines(baselineCtx, true), over: getBaselines(baselineCtx, false) },
    targets: axes.flatMap((axis) => axis.labelTargets ?? []),
  };
};
