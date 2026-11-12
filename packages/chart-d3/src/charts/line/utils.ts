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
import { HOVER_NEUTRAL_TARGET, SERIES_ID } from '@spectrum-charts/core-s2/constants';

import { deemphasisOpacity } from '../../animation.js';
import {
  Match,
  getControlledHighlightedRows,
  getControlledMatch,
  getFocusedSeriesMatch,
  getGroupKey,
  getIdKey,
  getLegendHoverMatch,
  isValid,
  matches,
} from '../../emphasis.js';
import { DimensionScaleType, FacetScale, TRANSFORMED_TIME, getStrokeDash, isDiscreteScaleType } from '../../scales.js';
import { Datum, FacetRef, HighlightBy, LineOptions } from '../../types.js';
import { MarkContext } from '../chartType.js';

/** Plot-relative pixel position of a row. */
export type Point = { row: Datum; x: number; y: number };

export const isInteractive = (mark: LineOptions): boolean =>
  Boolean(
    mark.hasOnClick ||
      mark.hasOnContextMenu ||
      mark.chartInspects?.length ||
      mark.chartPopovers?.length ||
      mark.chartActionBars?.length
  );

/**
 * Gets the dimension scale type; band is not a documented Line scale, so it is drawn as point (tracked in parity coverage).
 * @param mark
 * @returns dimension scale type
 */
export const getDimensionScaleType = (mark: LineOptions): DimensionScaleType => mark.scaleType ?? 'time';

export const xField = (mark: LineOptions): string =>
  (mark.scaleType ?? 'time') === 'time' ? TRANSFORMED_TIME : mark.dimension ?? 'datetime';

/** Swaps in the line's named `metricAxis` scale. */
export const withMetricAxis = (mark: LineOptions, ctx: MarkContext): MarkContext => {
  const scale = mark.metricAxis ? ctx.metricScales?.[mark.metricAxis] : undefined;
  return scale ? { ...ctx, yScale: scale } : ctx;
};

/** Creates the row -> pixel accessors for a line. */
export const getAccessors = (mark: LineOptions, ctx: MarkContext) => {
  const field = xField(mark);
  const metric = mark.metric ?? 'value';
  const scale = ctx.xScale as (value: unknown) => number | undefined;
  const isPoint = isDiscreteScaleType(mark.scaleType);
  return {
    x: (row: Datum) => scale(isPoint ? String(row[field]) : row[field]) ?? Number.NaN,
    y: (row: Datum) => (ctx.yScaleFor?.(row) ?? ctx.yScale)(row[metric] as number),
    defined: (row: Datum) => row[metric] !== null && row[metric] !== undefined && !Number.isNaN(Number(row[metric])),
  };
};

/** Groups rows by series in first-appearance order. */
export const getSeries = (rows: Datum[]): Datum[][] => {
  const series = new Map<unknown, Datum[]>();
  for (const row of rows) {
    const key = row[SERIES_ID];
    const list = series.get(key);
    if (list) list.push(row);
    else series.set(key, [row]);
  }
  return [...series.values()];
};

/** Resolves a mark's facet: its static value, or the shared scale looked up with the mark's own field. */
const resolveFacet = <T, V>(
  facet: FacetRef<V> | undefined,
  scale: FacetScale<T>,
  row: Datum,
  fromValue: (value: V) => T
): T => {
  if (typeof facet === 'object') return fromValue(facet.value);
  if (facet === undefined || !scale.field || facet === scale.field) return scale.get(row);
  return scale.get({ [scale.field]: row[facet] });
};

/** The mark's color for a row. */
export const getColor = (mark: LineOptions, row: Datum, ctx: MarkContext): string =>
  resolveFacet(mark.color, ctx.data.color, row, (value) => ctx.theme.color(value));

/** The mark's stroke dash for a row. */
export const getDash = (mark: LineOptions, row: Datum, ctx: MarkContext): number[] =>
  resolveFacet(mark.lineType, ctx.data.lineType, row, getStrokeDash);

/** The mark's facet opacity for a row. */
export const getFacetOpacity = (mark: LineOptions, row: Datum, ctx: MarkContext): number =>
  resolveFacet(mark.opacity, ctx.data.opacity, row, (value) => value);

/** Whether hovering highlights every series at the hovered dimension. */
const isHighlightedByDimension = (mark: LineOptions): boolean =>
  Boolean(mark.dimensionHover) ||
  Boolean(mark.chartInspects?.some(({ highlightBy }) => highlightBy === 'dimension')) ||
  Boolean(mark.chartPopovers?.some(({ UNSAFE_highlightBy }) => UNSAFE_highlightBy === 'dimension'));

/** Whether hover highlights a group of rows (dimension, series or keys) instead of a single item. */
export const isHighlightedByGroup = (mark: LineOptions): boolean =>
  Boolean(mark.dimensionHover) ||
  Boolean(mark.chartInspects?.some(({ highlightBy }) => highlightBy && highlightBy !== 'item'));

/** Whether hover emphasizes whole series, so the hover rule, points and labels are hidden. */
export const highlightsBySeries = (mark: LineOptions): boolean =>
  isHighlightedByGroup(mark) && !isHighlightedByDimension(mark);

const toGroupFields = (highlightBy: HighlightBy | undefined, dimension: string): string[] | undefined => {
  if (highlightBy === 'dimension') return [dimension];
  if (highlightBy === 'series') return [SERIES_ID];
  if (Array.isArray(highlightBy)) return highlightBy;
  return undefined;
};

/** Fields of the hover group id. */
export const getGroupFields = (mark: LineOptions): string[] | undefined => {
  const dimension = mark.dimension ?? 'datetime';
  let fields: string[] | undefined;
  for (const { highlightBy = 'item' } of mark.chartInspects ?? []) {
    if (highlightBy === 'item') break;
    fields = toGroupFields(highlightBy, dimension) ?? fields;
  }
  return fields ?? (mark.dimensionHover ? [dimension] : undefined);
};

/** Fields of the selection group id. */
export const getSelectedGroupFields = (mark: LineOptions, ctx: MarkContext): string[] | undefined => {
  let fields: string[] | undefined;
  for (const { UNSAFE_highlightBy } of mark.chartPopovers ?? []) {
    fields = toGroupFields(UNSAFE_highlightBy, mark.dimension ?? 'datetime') ?? [getIdKey(ctx.options)];
  }
  return fields ?? (mark.chartActionBars?.length ? [getIdKey(ctx.options)] : undefined);
};

/** Whether the mark can be selected by a popover or action bar. */
export const hasSelection = (mark: LineOptions): boolean =>
  Boolean(mark.chartPopovers?.length || mark.chartActionBars?.length);

/** The hovered row when the mark is interactive; non-interactive lines never hover. */
export const getHoveredItem = (mark: LineOptions, ctx: MarkContext): Datum | undefined =>
  (isInteractive(mark) && ctx.state.hoveredItem) || undefined;

/** Rows that get hover marks: the popover selection, else controlled items, plus hovered rows. */
export const getHighlightedRows = (mark: LineOptions, ctx: MarkContext): Datum[] => {
  const idKey = getIdKey(ctx.options);
  const { selectedId } = ctx.state;
  const selected = isInteractive(mark) && Boolean(mark.chartPopovers?.length) && isValid(selectedId);
  const controlled = selected ? [] : getControlledHighlightedRows(ctx);
  const hovered = getHoveredItem(mark, ctx);
  const fields = (isHighlightedByGroup(mark) && getGroupFields(mark)) || [idKey];
  const hoveredKey = hovered ? getGroupKey(hovered, fields) : undefined;
  return ctx.data.filteredTable.filter(
    (row) =>
      (selected && row[idKey] === selectedId) ||
      controlled.includes(row) ||
      (hovered !== undefined && getGroupKey(row, fields) === hoveredKey)
  );
};

/** Selection match for a series from the selectedSeries state, or undefined when nothing is selected. */
const getSelectedMatch = (mark: LineOptions, seriesId: string, ctx: MarkContext): Match => {
  const { selectedSeries } = ctx.state;
  return hasSelection(mark) && isValid(selectedSeries) ? matches(selectedSeries, seriesId) : undefined;
};

const seriesMatch = (rows: Datum[], seriesId: string): number =>
  Number(rows.some((row) => String(row[SERIES_ID]) === seriesId));

/** Hover-driven match for a series (1 match, 0 non-match), or undefined when no hover rule applies. */
const getHoveredMatch = (mark: LineOptions, seriesId: string, ctx: MarkContext): Match => {
  if (isInteractive(mark) && isHighlightedByGroup(mark)) {
    const rows = getHighlightedRows(mark, ctx);
    return rows.length ? seriesMatch(rows, seriesId) : undefined;
  }
  const hovered = getHoveredItem(mark, ctx);
  return hovered ? matches(hovered[SERIES_ID], seriesId) : undefined;
};

/** Hovered group id for grouped hover. */
export const getHighlightedGroup = (mark: LineOptions, ctx: MarkContext): unknown => {
  const hovered = getHoveredItem(mark, ctx);
  const fields = isHighlightedByGroup(mark) ? getGroupFields(mark) : undefined;
  return hovered && fields ? getGroupKey(hovered, fields) : undefined;
};

/** Hover emphasis target per series (1 emphasized, 0 faded, neutral otherwise). */
export const getHoverTarget = (mark: LineOptions, seriesId: string, ctx: MarkContext): number =>
  getHoveredMatch(mark, seriesId, ctx) ??
  getFocusedSeriesMatch(ctx, seriesId) ??
  getLegendHoverMatch(ctx, seriesId) ??
  getControlledMatch(ctx, seriesId) ??
  getSelectedMatch(mark, seriesId, ctx) ??
  HOVER_NEUTRAL_TARGET;

/** Series opacity at its hover target; the runtime animates it through the node's emphasis trait. */
export const getSeriesOpacity = (mark: LineOptions, seriesId: string, ctx: MarkContext): number =>
  deemphasisOpacity(getHoverTarget(mark, seriesId, ctx));

/** Line stroke width; a single series never thickens and dimension hover doesn't thicken the hovered line. */
export const getStrokeWidth = (mark: LineOptions, seriesId: string, ctx: MarkContext): number => {
  const { strokeWidth, hoverStrokeWidth } = ctx.size;
  if (ctx.data.seriesIds.length <= 1) return strokeWidth;
  const hovered = isHighlightedByDimension(mark) ? undefined : getHoveredMatch(mark, seriesId, ctx);
  const match =
    hovered ??
    getFocusedSeriesMatch(ctx, seriesId) ??
    getLegendHoverMatch(ctx, seriesId) ??
    getControlledMatch(ctx, seriesId) ??
    getSelectedMatch(mark, seriesId, ctx);
  return match === 1 ? hoverStrokeWidth : strokeWidth;
};

/** Whether an axis fixes the metric range, so hover skips rows outside the plot. */
export const hasFixedMetricAxis = (ctx: MarkContext): boolean =>
  Boolean(ctx.options.axes?.some((axis) => axis.range && (axis.position === 'left' || axis.position === 'right')));

/** Keeps rows whose metric is finite and inside the plot. */
export const isInPlot = (mark: LineOptions, row: Datum, ctx: MarkContext): boolean => {
  const value = row[mark.metric ?? 'value'];
  if (!isValid(value) || !Number.isFinite(Number(value))) return false;
  const y = ctx.yScale(value as number);
  return y >= 0 && y <= ctx.height;
};
