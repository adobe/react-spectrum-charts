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
import { FADE_FACTOR, MARK_ID, SERIES_ID } from '@spectrum-charts/core-s2/constants';

import { deemphasisOpacity } from './animation.js';
import { ChartData } from './scales.js';
import { ChartState, Datum, LegendOptions, ResolvedChartOptions } from './types.js';

/**
 * Emphasis is a match per subject: 1 emphasized, 0 de-emphasized, undefined when a source doesn't apply.
 * Sources are checked and the first defined match wins.
 */
export type Match = number | undefined;

/** The inputs every emphasis source reads. */
export interface EmphasisContext {
  options: ResolvedChartOptions;
  state: ChartState;
  data: ChartData;
}

export const isValid = (value: unknown): boolean => value !== null && value !== undefined && !Number.isNaN(value);

/** Gets the first defined match) ? a : isValid(b) ? b : ...` rules. */
export const firstMatch = (...matches: (() => Match)[]): Match => {
  for (const match of matches) {
    const value = match();
    if (value !== undefined) return value;
  }
  return undefined;
};

/** Compares a signal value to a subject value after string coercion of ids. */
export const matches = (value: unknown, target: unknown): number => Number(String(value) === String(target));

export const getIdKey = (options: ResolvedChartOptions): string => options.idKey ?? MARK_ID;

/** Gets a row's group key joins multiple fields with " | " and a single field keeps its raw value. */
export const getGroupKey = (row: Datum, fields: string[]): unknown =>
  fields.length === 1 ? row[fields[0]] : fields.map((field) => String(row[field])).join(' | ');

/** Gets the value a legend entry stands for in a row: its `keys` group id, otherwise the series id. */
export const getLegendValue = (legend: LegendOptions | undefined, row: Datum | undefined): unknown => {
  if (!row) return undefined;
  return legend?.keys?.length ? getGroupKey(row, legend.keys) : row[SERIES_ID];
};

/** Chart highlightedItem as a list, or undefined when not controlled. */
const getHighlightedItems = ({ options }: EmphasisContext): unknown[] | undefined => {
  const { highlightedItem } = options;
  if (highlightedItem === undefined) return undefined;
  return Array.isArray(highlightedItem) ? highlightedItem : [highlightedItem];
};

/** Gets the rows matched by the chart's controlled highlightedItem. */
export const getControlledHighlightedRows = (ctx: EmphasisContext): Datum[] => {
  const items = getHighlightedItems(ctx);
  if (!items) return [];
  const idKey = getIdKey(ctx.options);
  return ctx.data.filteredTable.filter((row) => items.includes(row[idKey]));
};

/** Gets the legend whose entry is hovered, when that legend highlights. */
const getHoveredLegend = ({ options, state }: EmphasisContext): LegendOptions | undefined => {
  if (!isValid(state.hoveredSeries) || state.hoveredLegend === undefined || state.hoveredLegend === null) return;
  const legend = options.legends?.[state.hoveredLegend];
  return legend?.highlight ? legend : undefined;
};

/**
 * Gets the legend hover match for a series, comparing the hovered entry to the series' legend value.
 * @param ctx
 * @param seriesId
 * @returns match
 */
export const getLegendHoverMatch = (ctx: EmphasisContext, seriesId: string): Match => {
  const legend = getHoveredLegend(ctx);
  if (!legend) return undefined;
  return matches(ctx.state.hoveredSeries, getLegendValue(legend, ctx.data.seriesRows.get(seriesId)));
};

/**
 * Gets the keyboard-focused series match; D3's navigator emphasizes a focused series like a legend hover.
 * @param ctx
 * @param seriesId
 * @returns match
 */
export const getFocusedSeriesMatch = ({ state }: EmphasisContext, seriesId: string): Match =>
  isValid(state.focusedSeries) ? matches(state.focusedSeries, seriesId) : undefined;

/**
 * Gets the controlled highlight match for a series: highlightedItem rows, then highlightedSeries.
 * @param ctx
 * @param seriesId
 * @returns match
 */
export const getControlledMatch = (ctx: EmphasisContext, seriesId: string): Match => {
  const rows = getControlledHighlightedRows(ctx);
  if (rows.length) return Number(rows.some((row) => String(row[SERIES_ID]) === seriesId));
  const { highlightedSeries } = ctx.options;
  return isValid(highlightedSeries) ? matches(highlightedSeries, seriesId) : undefined;
};

/** Inputs the legend reads from marks: whether any mark is interactive and the hovered group of grouped marks. */
export interface LegendEmphasisInputs {
  hasInteractiveMarks: boolean;
  /** Item hovered on any mark's interactive target. */
  hoveredItem?: Datum;
  highlightedGroup?: unknown;
  /** Animated hover fraction per legend value; set when a mark animates hover. */
  fraction?: (value: string) => number;
}

const fade = (match: number): number => (match ? 1 : FADE_FACTOR);

/**
 * Gets a legend entry's opacity: animated fractions when hover animates, otherwise the
 * selection, legend hover, controlled highlight and hovered item rules.
 * @param ctx
 * @param legendIndex
 * @param inputs
 * @returns entry value to opacity
 */
export const getLegendEntryOpacity =
  (ctx: EmphasisContext, legendIndex: number, inputs: LegendEmphasisInputs) =>
  (value: string): number => {
    if (inputs.fraction) return deemphasisOpacity(inputs.fraction(value));
    const { options, state } = ctx;
    const legend = options.legends?.[legendIndex];
    const grouped = Boolean(legend?.keys?.length);
    const selected = grouped ? state.selectedGroup : state.selectedSeries;
    const highlighted = grouped ? inputs.highlightedGroup : options.highlightedSeries;
    const match = firstMatch(
      () => (legend?.chartPopovers?.length && isValid(selected) ? matches(selected, value) : undefined),
      () =>
        legend?.highlight && state.hoveredLegend === legendIndex && isValid(state.hoveredSeries)
          ? matches(state.hoveredSeries, value)
          : undefined,
      // legend entries have no series id, so every entry fades
      () => (getControlledHighlightedRows(ctx).length ? 0 : undefined),
      () => (isValid(highlighted) ? matches(highlighted, value) : undefined),
      () => {
        const hovered = inputs.hoveredItem;
        return inputs.hasInteractiveMarks && hovered ? matches(hovered[SERIES_ID], value) : undefined;
      }
    );
    return match === undefined ? 1 : fade(match);
  };

/**
 * Groups per-series hover fractions by legend value, taking the max.
 * @param ctx
 * @param legendIndex
 * @param seriesFraction fraction per series id, or undefined for series without an animation row
 * @returns fraction per legend value
 */
export const getLegendFraction = (
  ctx: EmphasisContext,
  legendIndex: number,
  seriesFraction: (seriesId: string) => number | undefined
): ((value: string) => number) => {
  const legend = ctx.options.legends?.[legendIndex];
  if (!legend?.keys?.length) return (value) => seriesFraction(value) ?? FADE_FACTOR;
  const groups = new Map<string, number>();
  for (const seriesId of ctx.data.seriesIds) {
    const fraction = seriesFraction(seriesId);
    if (fraction === undefined) continue;
    const key = String(getLegendValue(legend, ctx.data.seriesRows.get(seriesId)));
    groups.set(key, Math.max(groups.get(key) ?? 0, fraction));
  }
  return (value) => groups.get(value) ?? FADE_FACTOR;
};
