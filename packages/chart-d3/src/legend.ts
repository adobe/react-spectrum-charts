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
import {
  DEFAULT_LEGEND_COLUMN_PADDING,
  DEFAULT_LEGEND_SYMBOL_WIDTH,
  ROUNDED_SQUARE_PATH,
  VISIBILITY_OFF_PATH,
} from '@spectrum-charts/core-s2/constants';

import { getGroupKey } from './emphasis.js';
import { ChartData, getLineTypeRange, getOpacityRange, getStrokeDash, ordinal, unique } from './scales.js';
import { BUILTIN_SYMBOLS, GroupNode, SymbolNode, TextNode, group } from './scene.js';
import { Bounds, measureText, truncate } from './text.js';
import { Theme } from './theme.js';
import { Datum, FacetRef, HitTarget, LegendOptions, LineWidth, Position, ResolvedChartOptions } from './types.js';

const LABEL_OFFSET = 4;

export interface LegendEntry {
  value: string;
  label: string;
  row: Datum;
  hidden: boolean;
}

/** A built legend; the layout sets `node.x`/`node.y`. */
export interface LegendResult {
  position: Position;
  node: GroupNode;
  width: number;
  height: number;
  entries: LegendEntry[];
  /** Entry hit areas in legend coordinates, spanning their column. */
  hits: LegendHit[];
}

export interface LegendHit extends Bounds {
  entry: LegendEntry;
  /** Bounds of the entry's symbol and label. */
  item: Bounds;
}

export interface LegendContext {
  theme: Theme;
  data: ChartData;
  plotWidth: number;
  hiddenSeries: string[];
  options: ResolvedChartOptions;
}

type Lookup<T> = ((row: Datum) => T) | undefined;

/** Symbol encodings resolved from the chart's facet scales and the legend's own facet options. */
interface LegendFacets {
  fields: string[];
  color: (row: Datum) => string;
  lineType: Lookup<number[]>;
  opacity: Lookup<number>;
  shape: Lookup<string>;
  strokeWidth: Lookup<number>;
}

const LINE_WIDTHS: Record<string, number> = { XS: 1, S: 1.5, M: 2, L: 3, XL: 4 };

const getLineWidthPixels = (lineWidth: LineWidth): number =>
  typeof lineWidth === 'number' ? lineWidth : LINE_WIDTHS[lineWidth] ?? 2;

const getSymbolPath = (shape: string): string =>
  shape === 'rounded-square' ? ROUNDED_SQUARE_PATH : BUILTIN_SYMBOLS[shape] ?? shape;

const firstOf = <T>(value: T | T[]): T => (Array.isArray(value) ? value[0] : value);

/**
 * Resolves one facet: a legend value wins, then a legend field or the chart's facet field.
 * @param facet legend facet option
 * @param markField the chart scale's first domain field
 * @param domainFields every field in the chart scale's domain
 * @param table
 * @param range scale range
 * @param toValue converts a legend static value
 * @returns lookup, or undefined when the encoding is unset
 */
const resolveFacet = <T, V>(
  facet: FacetRef<V> | undefined,
  markField: string | undefined,
  domainFields: string[],
  table: Datum[],
  range: T[],
  toValue: (value: V) => T
): { lookup: Lookup<T>; field?: string } => {
  if (facet && typeof facet === 'object') {
    const value = toValue(facet.value);
    return { lookup: () => value, field: markField };
  }
  const fields = typeof facet === 'string' && !domainFields.includes(facet) ? [...domainFields, facet] : domainFields;
  const field = markField ?? fields[0];
  const lookupField = typeof facet === 'string' ? facet : field;
  if (!lookupField) return { lookup: undefined };
  const domain = [...new Set(fields.flatMap((f) => unique(table, f)))];
  const scale = ordinal(lookupField, domain, range, range[0]);
  return { lookup: scale.get, field };
};

const getLegendFacets = (legend: LegendOptions, ctx: LegendContext): LegendFacets => {
  const { data, options, theme } = ctx;
  const table = data.table;
  const fieldsOf = (field?: string) => (field ? [field] : []);
  // a keys legend only uses scales whose domain field is one of its keys
  const keyed = (field?: string) =>
    !legend.keys?.length || (field && legend.keys.includes(field)) ? field : undefined;
  const colorField = keyed(data.color.field);
  const lineTypeField = keyed(data.lineType.field);
  const opacityField = keyed(data.opacity.field);
  const colorRes = resolveFacet(legend.color, colorField, fieldsOf(colorField), table, data.colorRange, theme.color);
  const lineTypeRes = resolveFacet(
    legend.lineType,
    lineTypeField,
    fieldsOf(lineTypeField),
    table,
    getLineTypeRange(options.lineTypes),
    getStrokeDash
  );
  const opacityFields = fieldsOf(opacityField);
  if (typeof legend.opacity === 'string' && !opacityFields.includes(legend.opacity)) opacityFields.push(legend.opacity);
  const opacityCount = new Set(opacityFields.flatMap((f) => unique(table, f))).size;
  const opacityRes = resolveFacet(
    legend.opacity,
    opacityField,
    fieldsOf(opacityField),
    table,
    getOpacityRange(options.opacities, opacityCount),
    (v) => v
  );
  const shapes = (options.symbolShapes ?? ['rounded-square']).map((shape) => getSymbolPath(firstOf(shape)));
  const shapeRes = resolveFacet(legend.symbolShape, undefined, [], table, shapes, getSymbolPath);
  const widths = (options.lineWidths ?? ['M']).map(getLineWidthPixels);
  const widthRes = resolveFacet(legend.lineWidth, undefined, [], table, widths, getLineWidthPixels);
  const fields = [colorRes.field, lineTypeRes.field, opacityRes.field, shapeRes.field].filter(
    (f, i, all): f is string => !!f && all.indexOf(f) === i
  );
  const defaultColor = theme.color('categorical-100');
  return {
    fields,
    color: colorRes.lookup ?? (() => defaultColor),
    lineType: lineTypeRes.lookup,
    opacity: opacityRes.lookup,
    shape: shapeRes.lookup,
    strokeWidth: widthRes.lookup,
  };
};

const getEntries = (legend: LegendOptions, ctx: LegendContext, fields: string[]): LegendEntry[] => {
  const { data, hiddenSeries } = ctx;
  const keys = legend.keys?.length ? legend.keys : undefined;
  // keys legends gray out groups with no visible rows
  const visibleGroups = keys && new Set(data.filteredTable.map((row) => String(getGroupKey(row, keys))));
  const isHidden = (value: string) => (visibleGroups ? !visibleGroups.has(value) : hiddenSeries.includes(value));
  const hiddenEntries = new Set(legend.hiddenEntries ?? []);
  const labels = new Map((legend.legendLabels ?? []).map(({ seriesName, label }) => [String(seriesName), label]));
  const seen = new Set<string>();
  const entries: LegendEntry[] = [];
  if (!fields.length) return entries;
  for (const row of data.table) {
    const value = fields.map((f) => row[f]).join(' | ');
    if (seen.has(value)) continue;
    seen.add(value);
    if (hiddenEntries.has(value)) continue;
    entries.push({ value, label: labels.get(value) ?? value, row, hidden: isHidden(value) });
  }
  return entries;
};

/**
 * Gets the legend title node, placed at the legend padding.
 * @param legend
 * @param key
 * @param theme
 * @returns TextNode, or undefined without a title
 */
const getLegendTitle = (legend: LegendOptions, key: string, theme: Theme): TextNode | undefined => {
  if (!legend.title) return undefined;
  const { legend: lt } = theme;
  return {
    type: 'text',
    key: `${key}-title`,
    role: 'legend-title',
    x: lt.padding,
    y: lt.padding,
    text: truncate(legend.title, legend.titleLimit ?? lt.titleLimit, lt.labelFontSize, theme.font, 'bold'),
    fill: lt.titleColor,
    font: theme.font,
    fontSize: lt.labelFontSize,
    fontWeight: 'bold',
    align: 'left',
    baseline: 'top',
  };
};

const getColumnCount = (vertical: boolean, plotWidth: number, labelWidth: number): number =>
  vertical
    ? 1
    : Math.max(1, Math.floor(plotWidth / (labelWidth + DEFAULT_LEGEND_SYMBOL_WIDTH + DEFAULT_LEGEND_COLUMN_PADDING)));

/**
 * Builds a symbol legend: an optional title over a grid of symbol + label entries.
 * @param legend
 * @param index
 * @param ctx
 * @returns LegendResult, or undefined when there are no entries
 */
export const buildLegend = (legend: LegendOptions, index: number, ctx: LegendContext): LegendResult | undefined => {
  const facets = getLegendFacets(legend, ctx);
  const entries = getEntries(legend, ctx, facets.fields);
  if (!entries.length) return undefined;
  const { theme } = ctx;
  const { legend: lt } = theme;
  const labelLimit = legend.labelLimit ?? lt.labelLimit;
  const position = legend.position ?? 'bottom';
  const vertical = position === 'left' || position === 'right';
  const key = `legend${index}`;
  const strokeWidthOf = (row: Datum) => facets.strokeWidth?.(row) ?? lt.symbolStrokeWidth;
  const maxStroke = Math.max(...entries.map(({ row }) => strokeWidthOf(row)));
  const size = Math.max(Math.ceil(Math.sqrt(lt.symbolSize) + maxStroke), lt.labelFontSize);
  const labels = entries.map(({ label }) => truncate(label, labelLimit, lt.labelFontSize, theme.font));
  const widths = labels.map((text) => size + LABEL_OFFSET + measureText(text, lt.labelFontSize, theme.font));
  const maxLabelWidth = Math.max(...entries.map(({ label }) => measureText(label, lt.labelFontSize, theme.font)));
  const columns = getColumnCount(vertical, ctx.plotWidth, Math.min(maxLabelWidth, labelLimit));
  const colWidths: number[] = [];
  widths.forEach((w, i) => (colWidths[i % columns] = Math.max(colWidths[i % columns] ?? 0, Math.ceil(w))));
  const colX = colWidths.map((_, c) => colWidths.slice(0, c).reduce((sum, w) => sum + w + lt.columnPadding, 0));

  const pad = lt.padding;
  const title = getLegendTitle(legend, key, theme);
  const entriesY = pad + (title ? lt.labelFontSize + lt.titlePadding : 0);
  const hits: LegendHit[] = [];
  const entryNodes = entries.map((entry, i): GroupNode => {
    const x = colX[i % columns];
    const y = Math.floor(i / columns) * (size + lt.rowPadding);
    const x1 = pad + x;
    const y1 = entriesY + y;
    hits.push({
      entry,
      x1,
      y1,
      x2: x1 + colWidths[i % columns],
      y2: y1 + size,
      item: { x1, y1, x2: x1 + widths[i], y2: y1 + size },
    });
    const color = facets.color(entry.row);
    const hiddenFill = theme.color(legend.isToggleable ? 'gray-700' : 'gray-500');
    const symbol: SymbolNode = {
      type: 'symbol',
      key: `${key}-symbol-${entry.value}`,
      role: 'legend-symbol',
      x: size / 2,
      y: size / 2,
      size: lt.symbolSize,
      shape: entry.hidden ? VISIBILITY_OFF_PATH : facets.shape?.(entry.row) ?? lt.symbolShape,
      fill: entry.hidden ? hiddenFill : color,
      fillOpacity: facets.opacity?.(entry.row),
      stroke: entry.hidden ? 'transparent' : color,
      strokeWidth: strokeWidthOf(entry.row),
      strokeDash: facets.lineType?.(entry.row),
    };
    const label: TextNode = {
      type: 'text',
      key: `${key}-label-${entry.value}`,
      role: 'legend-label',
      x: size + LABEL_OFFSET,
      y: size / 2,
      text: labels[i],
      fill: entry.hidden && !legend.isToggleable ? theme.color('gray-500') : lt.labelColor,
      font: theme.font,
      fontSize: lt.labelFontSize,
      fontWeight: 'normal',
      align: 'left',
      baseline: 'middle',
    };
    return group(`${key}-entry-${entry.value}`, [symbol, label], { role: 'scope', datum: entry.row, x, y });
  });
  const rows = Math.ceil(entries.length / columns);
  const gridWidth = (colX.at(-1) ?? 0) + (colWidths.at(-1) ?? 0);
  const container = group(`${key}-entries`, entryNodes, { role: 'legend-entry', x: pad, y: entriesY });
  return {
    position,
    node: group(key, title ? [container, title] : [container], { role: 'legend' }),
    width: Math.ceil(gridWidth + 2 * pad),
    height: Math.ceil(entriesY + rows * size + (rows - 1) * lt.rowPadding + pad),
    entries,
    hits,
  };
};

/** A legend entry under the pointer, with its entry bounds in plot coordinates. */
export interface LegendHitResult {
  index: number;
  entryIndex: number;
  entry: LegendEntry;
  bounds: Bounds;
}

const contains = (b: Bounds, x: number, y: number) => x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2;

/**
 * Finds the legend entry under a point in plot coordinates.
 * @param legends
 * @param x
 * @param y
 * @returns the legend index, entry and bounds, or undefined
 */
export const legendHitTest = (legends: LegendResult[], x: number, y: number): LegendHitResult | undefined => {
  for (let index = legends.length - 1; index >= 0; index--) {
    const { node, hits } = legends[index];
    const ox = node.x ?? 0;
    const oy = node.y ?? 0;
    const entryIndex = hits.findIndex((h) => contains(h, x - ox, y - oy));
    if (entryIndex < 0) continue;
    const { entry, item } = hits[entryIndex];
    return {
      index,
      entryIndex,
      entry,
      bounds: { x1: item.x1 + ox, y1: item.y1 + oy, x2: item.x2 + ox, y2: item.y2 + oy },
    };
  }
  return undefined;
};

/**
 * Whether clicking a legend's entries does anything.
 * @param legend
 * @returns boolean
 */
export const isLegendClickable = (legend: LegendOptions | undefined): boolean =>
  Boolean(
    legend && ((legend.isToggleable && !legend.keys?.length) || legend.hasOnClick || legend.chartPopovers?.length)
  );

/**
 * Gets the pointer target for a legend entry.
 * @param legend
 * @param hit
 * @returns hit target with the entry value, plus a description tooltip when the legend has descriptions
 */
export const getLegendTarget = (legend: LegendOptions | undefined, hit: LegendHitResult): HitTarget => {
  const name = `legend${hit.index}`;
  const datum = { index: hit.entryIndex, count: 1 };
  return {
    datum: { ...datum, value: hit.entry.value },
    mark: `${name}_legendEntry`,
    role: 'legend-symbol',
    bounds: hit.bounds,
    cursor: isLegendClickable(legend) ? 'pointer' : undefined,
    tooltip: legend?.descriptions ? { ...datum, rscComponentName: name } : undefined,
  };
};

/**
 * Copies a legend node with per-entry symbol and label opacity.
 * @param legend
 * @param opacity entry value to opacity
 * @returns legend node
 */
export const withLegendOpacity = (legend: LegendResult, opacity: (value: string) => number): GroupNode => {
  const [container, ...rest] = legend.node.children as GroupNode[];
  const entries = container.children.map((node, i) => {
    const entryGroup = node as GroupNode;
    const o = opacity(legend.entries[i].value);
    return o === 1
      ? entryGroup
      : { ...entryGroup, children: entryGroup.children.map((child) => ({ ...child, opacity: o })) };
  });
  return { ...legend.node, children: [{ ...container, children: entries }, ...rest] };
};
