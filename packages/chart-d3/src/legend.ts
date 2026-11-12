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

import { emptyBounds, isEmpty, nodeBounds, pathBounds, symbolBounds, translate, union } from './bounds.js';
import { defineComponent } from './component.js';
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

/** A built legend; `node.x`/`node.y` are set by `placeLegends`. */
export interface LegendResult {
  position: Position;
  node: GroupNode;
  width: number;
  height: number;
  entries: LegendEntry[];
  /** Entry hit areas in legend coordinates, sized like Vega's legend entry groups. */
  hits: LegendHit[];
}

export interface LegendHit extends Bounds {
  entry: LegendEntry;
  /** Bounds of the entry's symbol and label, like Vega's entry group item bounds. */
  item: Bounds;
}

export interface LegendContext {
  theme: Theme;
  data: ChartData;
  plotWidth: number;
  hiddenSeries: string[];
  options: ResolvedChartOptions;
}

/** Vega grid layout options (subset used by legends). */
interface GridOptions {
  columns: number;
  padCol: number;
  padRow: number;
  center: boolean;
  anchor: { x: number; y: number; column?: 'start' | 'middle' | 'end'; row?: 'start' | 'middle' | 'end' };
}

/**
 * Port of Vega's `gridLayout` with `align: each` and full bounds; boxes are relative to each item's origin.
 * @param boxes
 * @param opt
 * @returns item offsets and the union of their translated boxes
 */
export const gridLayout = (
  boxes: Bounds[],
  opt: GridOptions
): { offsets: { x: number; y: number }[]; bounds: Bounds } => {
  const n = boxes.length;
  const ncols = opt.columns || n;
  const nrows = ncols <= 0 ? 1 : Math.ceil(n / ncols);
  const safe = boxes.map((b) => (isEmpty(b) ? { x1: 0, y1: 0, x2: 0, y2: 0 } : b));
  const grid: Grid = { n, ncols, nrows, ...measureGrid(safe, ncols, nrows, opt) };
  alignGridOffsets(grid);
  const { dx, dy } = accumulateGridOffsets(grid);
  if (opt.center) centerGridCells(grid, safe, dx, dy);

  const total = emptyBounds();
  for (let i = 0; i < n; ++i) union(total, translate(safe[i], dx[i], dy[i]));
  const { ax, ay } = getGridAnchor(total, opt.anchor);
  const offsets = dx.map((value, i) => ({ x: value + ax, y: dy[i] + ay }));
  const bounds = emptyBounds();
  offsets.forEach((o, i) => union(bounds, translate(safe[i], o.x, o.y)));
  return { offsets, bounds };
};

interface Grid {
  n: number;
  ncols: number;
  nrows: number;
  xExtent: number[];
  yExtent: number[];
  xOffset: number[];
  yOffset: number[];
}

const offsetValue = (v: number) => (v < 0 ? Math.ceil(-v) : 0);

const measureGrid = (safe: Bounds[], ncols: number, nrows: number, opt: GridOptions) => {
  const n = safe.length;
  const xExtent = new Array<number>(ncols).fill(0);
  const yExtent = new Array<number>(nrows).fill(0);
  const xOffset = new Array<number>(n);
  const yOffset = new Array<number>(n);
  for (let i = 0; i < n; ++i) {
    const b = safe[i];
    const c = i % ncols;
    const r = Math.floor(i / ncols);
    xExtent[c] = Math.max(xExtent[c], Math.ceil(b.x2));
    yExtent[r] = Math.max(yExtent[r], Math.ceil(b.y2));
    xOffset[i] = opt.padCol + offsetValue(b.x1);
    yOffset[i] = opt.padRow + offsetValue(b.y1);
  }
  return { xExtent, yExtent, xOffset, yOffset };
};

/** Aligns each column and row to its widest padding plus the previous extent. */
const alignGridOffsets = ({ n, ncols, nrows, xExtent, yExtent, xOffset, yOffset }: Grid): void => {
  for (let i = 0; i < n; ++i) {
    if (i % ncols === 0) xOffset[i] = 0;
    if (i < ncols) yOffset[i] = 0;
  }
  for (let c = 1; c < ncols; ++c) {
    let offset = 0;
    for (let i = c; i < n; i += ncols) offset = Math.max(offset, xOffset[i]);
    for (let i = c; i < n; i += ncols) xOffset[i] = offset + xExtent[c - 1];
  }
  for (let r = 1; r < nrows; ++r) {
    let offset = 0;
    const m = Math.min(n, r * ncols + ncols);
    for (let i = r * ncols; i < m; ++i) offset = Math.max(offset, yOffset[i]);
    for (let i = r * ncols; i < m; ++i) yOffset[i] = offset + yExtent[r - 1];
  }
};

const accumulateGridOffsets = ({ n, ncols, xOffset, yOffset }: Grid): { dx: number[]; dy: number[] } => {
  const dx = new Array<number>(n).fill(0);
  const dy = new Array<number>(n).fill(0);
  let x = 0;
  for (let i = 0; i < n; ++i) {
    x = xOffset[i] + (i % ncols ? x : 0);
    dx[i] += x;
  }
  for (let c = 0; c < ncols; ++c) {
    let y = 0;
    for (let i = c; i < n; i += ncols) {
      y += yOffset[i];
      dy[i] += y;
    }
  }
  return { dx, dy };
};

const centerGridCells = ({ n, ncols, nrows, xExtent, yExtent }: Grid, safe: Bounds[], dx: number[], dy: number[]) => {
  if (nrows > 1) {
    for (let i = 0; i < n; ++i) {
      const gap = xExtent[i % ncols] - safe[i].x2 - dx[i];
      if (gap > 0) dx[i] += gap / 2;
    }
  }
  if (ncols !== 1) {
    for (let i = 0; i < n; ++i) {
      const gap = yExtent[Math.floor(i / ncols)] - safe[i].y2 - dy[i];
      if (gap > 0) dy[i] += gap / 2;
    }
  }
};

const ANCHOR_SHIFT: Record<string, number> = { end: 1, middle: 0.5 };

const shiftAnchor = (value: number, size: number, align?: string): number => {
  const shift = ANCHOR_SHIFT[align ?? ''];
  return shift ? value - size * shift : value;
};

const getGridAnchor = (total: Bounds, anchor: GridOptions['anchor']): { ax: number; ay: number } => ({
  ax: Math.round(shiftAnchor(anchor.x, total.x2 - total.x1, anchor.column)),
  ay: Math.round(shiftAnchor(anchor.y, total.y2 - total.y1, anchor.row)),
});

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
 * Resolves one facet like Vega's legend: a legend value wins, then a legend field or the chart's facet field.
 * @param facet legend facet option
 * @param markField the chart scale's first domain field
 * @param domainFields every field in the chart scale's domain
 * @param table
 * @param range scale range
 * @param toValue converts a legend static value
 * @returns lookup, or undefined when Vega leaves the encoding unset
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
  // like Vega's getFacetsFromKeys, a keys legend only uses scales whose domain field is one of its keys
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
  // keys legends gray out groups with no visible rows, like Vega's `<legend>_rscGroupId` hidden test
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
 * Creates a cached padder; like legendSymbolShape, move-only subpaths give visible and hidden icons identical bounds.
 * @returns padder that returns the padded symbol path
 */
const createShapePadder = () => {
  const paddings = new Map<string, string>();
  return (shape: string, hidden: boolean): string => {
    if (!paddings.has(shape)) {
      const pb = pathBounds(`${shape} ${VISIBILITY_OFF_PATH}`);
      paddings.set(shape, ` M${pb.x1} ${pb.y1} M${pb.x2} ${pb.y2}`);
    }
    return (hidden ? VISIBILITY_OFF_PATH : shape) + paddings.get(shape);
  };
};

/**
 * Builds a symbol legend with Vega's entry sizing, entry grid and padding.
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
  const padded = createShapePadder();
  const strokeWidthOf = (row: Datum) => facets.strokeWidth?.(row) ?? lt.symbolStrokeWidth;
  const maxStroke = Math.max(...entries.map(({ row }) => strokeWidthOf(row)));
  const size = Math.max(Math.ceil(Math.sqrt(lt.symbolSize) + maxStroke), lt.labelFontSize);
  const offset = size;

  const entryNodes: GroupNode[] = [];
  const boxes: Bounds[] = [];
  for (const entry of entries) {
    const color = facets.color(entry.row);
    const hiddenColor = theme.color(legend.isToggleable ? 'gray-700' : 'gray-500');
    const symbol: SymbolNode = {
      type: 'symbol',
      key: `${key}-symbol-${entry.value}`,
      role: 'legend-symbol',
      x: offset / 2,
      y: size / 2,
      size: lt.symbolSize,
      shape: padded(facets.shape?.(entry.row) ?? lt.symbolShape, entry.hidden),
      fill: entry.hidden ? hiddenColor : color,
      fillOpacity: facets.opacity?.(entry.row),
      stroke: entry.hidden ? 'transparent' : color,
      strokeWidth: strokeWidthOf(entry.row),
      strokeDash: facets.lineType?.(entry.row),
    };
    const label: TextNode = {
      type: 'text',
      key: `${key}-label-${entry.value}`,
      role: 'legend-label',
      x: offset + LABEL_OFFSET,
      y: size / 2,
      text: truncate(entry.label, labelLimit, lt.labelFontSize, theme.font),
      fill: entry.hidden && !legend.isToggleable ? theme.color('gray-500') : lt.labelColor,
      font: theme.font,
      fontSize: lt.labelFontSize,
      fontWeight: 'normal',
      align: 'left',
      baseline: 'middle',
    };
    const box = union(symbolBounds(symbol), nodeBounds(label));
    boxes.push(box);
    entryNodes.push(group(`${key}-entry-${entry.value}`, [symbol, label], { role: 'scope', datum: entry.row }));
  }

  const maxLabelWidth = Math.max(
    ...entries.map(({ label }) => measureText(label, lt.labelFontSize, theme.font, 'normal'))
  );
  const columns = getColumnCount(vertical, ctx.plotWidth, Math.min(maxLabelWidth, labelLimit));
  // like Vega's legendEntryLayout: entry groups span their column's widest entry, which settles the grid's centering
  const colWidths: number[] = [];
  boxes.forEach((box, i) => (colWidths[i % columns] = Math.max(colWidths[i % columns] ?? 0, box.x2)));
  const entryBoxes = boxes.map((box, i) => ({ ...box, x2: colWidths[i % columns] }));
  const grid = gridLayout(entryBoxes, {
    columns,
    padCol: lt.columnPadding,
    padRow: lt.rowPadding,
    center: !vertical,
    anchor: { x: 0, y: 0 },
  });
  grid.offsets.forEach((o, i) => {
    entryNodes[i].x = o.x;
    entryNodes[i].y = o.y;
  });

  const pad = lt.padding;
  const children: (GroupNode | TextNode)[] = [];
  let entriesY = pad;
  const title = getLegendTitle(legend, key, theme);
  if (title) {
    const tb = nodeBounds(title);
    entriesY += tb.y2 - tb.y1 + lt.titlePadding;
    children.push(title);
  }
  const container = group(`${key}-entries`, entryNodes, { role: 'legend-entry', x: pad, y: entriesY });
  const hits = entries.map((entry, i) => {
    const x1 = pad + (entryNodes[i].x ?? 0);
    const y1 = entriesY + (entryNodes[i].y ?? 0);
    const item = translate(nodeBounds(entryNodes[i]), pad, entriesY);
    return { entry, item, x1, y1, x2: x1 + colWidths[i % columns], y2: y1 + boxes[i].y2 };
  });
  children.unshift(container);

  const b = emptyBounds();
  for (const child of children) union(b, nodeBounds(child));
  b.x1 = pad;
  b.y1 = pad;
  const width = isEmpty(b) ? 2 * pad : Math.ceil(b.x2 - b.x1 + 2 * pad);
  const height = isEmpty(b) ? 2 * pad : Math.ceil(b.y2 - b.y1 + 2 * pad);

  return { position, node: group(key, children, { role: 'legend' }), width, height, entries, hits };
};

/**
 * Positions legends around the plot like Vega's `legendParams` + `gridLayout`, returning their bounds.
 * @param legends
 * @param xBounds bounds of the plot and vertical axes
 * @param yBounds bounds of the plot and horizontal axes
 * @param width plot width
 * @param height plot height
 * @param theme
 * @returns bounds per legend
 */
export const placeLegends = (
  legends: LegendResult[],
  xBounds: Bounds,
  yBounds: Bounds,
  width: number,
  height: number,
  theme: Theme
): Bounds[] => {
  const out: Bounds[] = [];
  const byOrient = new Map<Position, LegendResult[]>();
  legends.forEach((legend) => byOrient.set(legend.position, [...(byOrient.get(legend.position) ?? []), legend]));
  for (const [orient, group] of byOrient) {
    const vertical = orient === 'left' || orient === 'right';
    const anchorName = vertical ? 'middle' : 'start';
    const mult = anchorName === 'middle' ? 0.5 : 0;
    const margin = vertical ? 24 : 48;
    const offset = theme.legend.offset;
    let anchor: GridOptions['anchor'];
    switch (orient) {
      case 'left':
        anchor = { x: Math.floor(xBounds.x1) - offset, column: 'end', y: mult * height, row: anchorName };
        break;
      case 'right':
        anchor = { x: Math.ceil(xBounds.x2) + offset, y: mult * height, row: anchorName };
        break;
      case 'top':
        anchor = { y: Math.floor(yBounds.y1) - offset, row: 'end', x: mult * width, column: anchorName };
        break;
      default:
        anchor = { y: Math.ceil(yBounds.y2) + offset, x: mult * width, column: anchorName };
    }
    const grid = gridLayout(
      group.map((l) => ({ x1: 0, y1: 0, x2: l.width, y2: l.height })),
      { columns: vertical ? 1 : group.length, padCol: margin, padRow: margin, center: true, anchor }
    );
    group.forEach((legend, i) => {
      legend.node.x = grid.offsets[i].x;
      legend.node.y = grid.offsets[i].y;
      out.push({
        x1: legend.node.x,
        y1: legend.node.y,
        x2: legend.node.x + legend.width,
        y2: legend.node.y + legend.height,
      });
    });
  }
  return out;
};

/** A legend entry under the pointer, with its entry group bounds in plot coordinates. */
export interface LegendHitResult {
  index: number;
  entryIndex: number;
  entry: LegendEntry;
  bounds: Bounds;
}

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
    const entryIndex = hits.findIndex((h) => x - ox >= h.x1 && x - ox <= h.x2 && y - oy >= h.y1 && y - oy <= h.y2);
    if (entryIndex < 0) continue;
    const { entry, item } = hits[entryIndex];
    return { index, entryIndex, entry, bounds: translate(item, ox, oy) };
  }
  return undefined;
};

/**
 * Whether clicking a legend's entries does anything, like Vega's legend entry pointer cursor.
 * @param legend
 * @returns boolean
 */
export const isLegendClickable = (legend: LegendOptions | undefined): boolean =>
  Boolean(
    legend && ((legend.isToggleable && !legend.keys?.length) || legend.hasOnClick || legend.chartPopovers?.length)
  );

/**
 * Gets the pointer target for a legend entry, like Vega's `legend{i}_legendEntry` group item.
 * @param legend
 * @param hit
 * @returns hit target with the entry value, plus a description tooltip when the legend has descriptions
 */
export const getLegendTarget = (legend: LegendOptions | undefined, hit: LegendHitResult): HitTarget => {
  const name = `legend${hit.index}`;
  const vegaDatum = { index: hit.entryIndex, count: 1 };
  return {
    datum: { ...vegaDatum, value: hit.entry.value },
    mark: `${name}_legendEntry`,
    role: 'legend-symbol',
    bounds: hit.bounds,
    cursor: isLegendClickable(legend) ? 'pointer' : undefined,
    tooltip: legend?.descriptions ? { ...vegaDatum, rscComponentName: name } : undefined,
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
    const value = legend.entries[i].value;
    const o = opacity(value);
    return o === 1
      ? entryGroup
      : { ...entryGroup, children: entryGroup.children.map((child) => ({ ...child, opacity: o })) };
  });
  return { ...legend.node, children: [{ ...container, children: entries }, ...rest] };
};

/** Legends, placed around the axis-aligned bounds like Vega's legend layout. */
export const legendsComponent = defineComponent<LegendResult[]>({
  name: 'legends',
  stage: 'outer',
  layer: 5,
  layout: (ctx) => {
    const { options, bounds } = ctx;
    const legends = (options.legends ?? []).flatMap((legend, i) => {
      const hiddenSeries = options.hiddenSeries ?? [];
      const result = buildLegend(legend, i, { ...ctx, plotWidth: ctx.width, hiddenSeries });
      return result ? [result] : [];
    });
    const placed = placeLegends(legends, bounds.x, bounds.y, ctx.width, ctx.height, ctx.theme);
    legends.forEach((legend, i) => {
      const b = placed[i];
      // with fit autosize, Vega only lets a legend grow the view in the dimension it stacks along
      if (legend.position === 'left' || legend.position === 'right') {
        bounds.view.x1 = Math.min(bounds.view.x1, b.x1);
        bounds.view.x2 = Math.max(bounds.view.x2, b.x2);
      } else {
        bounds.view.y1 = Math.min(bounds.view.y1, b.y1);
        bounds.view.y2 = Math.max(bounds.view.y2, b.y2);
      }
    });
    return legends;
  },
  scene: (legends, frame) => legends.map((legend, i) => withLegendOpacity(legend, frame.legendOpacity(i))),
});
