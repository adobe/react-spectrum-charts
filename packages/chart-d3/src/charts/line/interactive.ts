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
import { Delaunay } from 'd3-delaunay';

import { COMPONENT_NAME, GROUP_ID, HOVER_SHAPE_COUNT, HOVER_SIZE, MARK_ID } from '@spectrum-charts/core-s2/constants';

import { addPoint, emptyBounds, expand, symbolBounds, union } from '../../bounds.js';
import { getControlledHighlightedRows, getGroupKey } from '../../emphasis.js';
import { SceneNode, SymbolNode, group } from '../../scene.js';
import { Bounds } from '../../text.js';
import { Datum, HitTarget, ItemBounds, LineOptions } from '../../types.js';
import { MarkContext, MarkOutput } from '../chartType.js';
import { buildHoverLabels } from './hoverLabels.js';
import { LinePart } from './parts.js';
import {
  Point,
  getAccessors,
  getColor,
  getGroupFields,
  getHighlightedRows,
  getSelectedGroupFields,
  hasFixedMetricAxis,
  hasSelection,
  highlightsBySeries,
  isInPlot,
  isInteractive,
} from './utils.js';

/** Vega's diamond symbol as a unit path. */
const DIAMOND = 'M-1,0L0,-1L1,0L0,1Z';

/**
 * Adds the hover and selection group ids to rows in place, like Vega's filteredTable formulas.
 * @param mark
 * @param name
 * @param ctx
 */
export const decorateRows = (mark: LineOptions, name: string, ctx: MarkContext): void => {
  const groupFields = getGroupFields(mark);
  const selectedFields = getSelectedGroupFields(mark, ctx);
  if (!groupFields && !selectedFields) return;
  for (const row of ctx.data.filteredTable) {
    if (groupFields) row[`${name}_${GROUP_ID}`] = getGroupKey(row, groupFields);
    if (selectedFields) row[`${name}_selectedGroupId`] = getGroupKey(row, selectedFields);
  }
};

/** Rows in the selected group, like Vega's `${name}_selectedData`. */
const getSelectedRows = (mark: LineOptions, ctx: MarkContext): Datum[] => {
  const fields = getSelectedGroupFields(mark, ctx);
  if (!fields || !hasSelection(mark)) return [];
  const selectedGroup = ctx.state.selectedGroup ?? null;
  return ctx.data.filteredTable.filter((row) => getGroupKey(row, fields) === selectedGroup);
};

const point = (mark: LineOptions, ctx: MarkContext, row: Datum, key: string): SymbolNode => {
  const acc = getAccessors(mark, ctx);
  return {
    type: 'symbol',
    key: `${key}_${String(row[MARK_ID])}`,
    role: 'symbol',
    datum: row,
    x: acc.x(row),
    y: acc.y(row),
    size: mark.pointSize ?? ctx.size.pointSize,
    shape: 'circle',
    fill: ctx.theme.pointFill,
    stroke: getColor(mark, row, ctx),
    strokeWidth: ctx.size.hoverStrokeWidth,
  };
};

/**
 * Builds the hover rule, selection point, highlight point and hover labels in Vega's order.
 * @param mark
 * @param name
 * @param ctx
 * @returns overlay nodes
 */
const buildInteractiveOverlay = (mark: LineOptions, name: string, ctx: MarkContext): SceneNode[] => {
  const highlighted = getHighlightedRows(mark, ctx);
  const selected = getSelectedRows(mark, ctx);
  const bySeries = highlightsBySeries(mark);
  const showsPoints = mark.interpolate !== 'basis' && !bySeries;
  const acc = getAccessors(mark, ctx);
  const nodes: SceneNode[] = [];
  if (!bySeries) {
    const rules = highlighted.map((row): SceneNode => {
      const x = acc.x(row);
      return {
        type: 'rule',
        key: `${name}_hoverRule_${String(row[MARK_ID])}`,
        role: 'rule',
        x,
        y: 0,
        x2: x,
        y2: ctx.height,
        stroke: ctx.theme.ruleColor,
        strokeWidth: 1,
        opacity: selected.length ? 0 : 1,
      };
    });
    nodes.push(group(`${name}_hoverRule`, rules, { role: `${name}_hoverRule` }));
  }
  if (showsPoints && hasSelection(mark)) {
    const key = `${name}_point_select`;
    nodes.push(
      group(
        key,
        selected.map((row) => point(mark, ctx, row, key)),
        { role: key }
      )
    );
  }
  if (showsPoints) {
    const key = `${name}_point_highlight`;
    nodes.push(
      group(
        key,
        highlighted.map((row) => point(mark, ctx, row, key)),
        { role: key }
      )
    );
    const showHoverLabel = mark.chartInspects?.length ? false : mark.showHoverLabel ?? true;
    if (showHoverLabel && highlighted.length) nodes.push(...buildHoverLabels(mark, name, highlighted, ctx));
  }
  return nodes;
};

const getTooltip = (mark: LineOptions, name: string, row: Datum): Datum | null | undefined => {
  const inspects = mark.chartInspects ?? [];
  if (!inspects.length) return undefined;
  if (inspects[0].excludeDataKeys?.some((key) => row[key])) return null;
  return { ...row, [COMPONENT_NAME]: name };
};

const polygonBounds = (polygon: number[][] | null | undefined): ItemBounds => {
  const b = emptyBounds();
  (polygon ?? []).forEach(([x, y]) => addPoint(b, x, y));
  return expand(b, 2);
};

/** Rows that can be hovered, like Vega's `filteredTableForInspect` or `<name>_visibleHoverData` with a fixed axis. */
const getHoverCandidates = (mark: LineOptions, ctx: MarkContext): Point[] => {
  const acc = getAccessors(mark, ctx);
  const fixed = hasFixedMetricAxis(ctx);
  return ctx.data.filteredTable
    .filter((row) => !fixed || isInPlot(mark, row, ctx))
    .map((row) => ({ row, x: acc.x(row), y: acc.y(row) }))
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
};

/** Unions a symbol's bounds at every point, offsetting one measurement since symbol bounds are translation-invariant. */
const unionPointBounds = (target: Bounds, symbol: SymbolNode, points: Point[]): void => {
  const b = symbolBounds(symbol);
  for (const p of points) {
    target.x1 = Math.min(target.x1, b.x1 + p.x);
    target.y1 = Math.min(target.y1, b.y1 + p.y);
    target.x2 = Math.max(target.x2, b.x2 + p.x);
    target.y2 = Math.max(target.y2, b.y2 + p.y);
  }
};

interface VoronoiEntry {
  coords: Float64Array;
  delaunay: Delaunay<Point>;
  voronoi: ReturnType<Delaunay<Point>['voronoi']>;
}
// per prepared data and hover mark, so redraws with unchanged points reuse the triangulation
const voronoiCache = new WeakMap<object, Map<string, VoronoiEntry>>();

const sameCoords = (a: Float64Array, b: Float64Array): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const getVoronoi = (ctx: MarkContext, key: string, points: Point[], width: number, height: number): VoronoiEntry => {
  const coords = new Float64Array(points.length * 2 + 2);
  points.forEach((p, i) => {
    coords[i * 2] = p.x;
    coords[i * 2 + 1] = p.y;
  });
  coords[points.length * 2] = width;
  coords[points.length * 2 + 1] = height;
  let byKey = voronoiCache.get(ctx.data);
  if (!byKey) voronoiCache.set(ctx.data, (byKey = new Map()));
  const cached = byKey.get(key);
  if (cached && sameCoords(cached.coords, coords)) return cached;
  const delaunay = Delaunay.from(
    points,
    (p) => p.x,
    (p) => p.y
  );
  const entry = { coords, delaunay, voronoi: delaunay.voronoi([0, 0, width, height]) };
  byKey.set(key, entry);
  return entry;
};

type Interaction = Pick<MarkOutput, 'interactionBounds' | 'hitTest' | 'hitTarget'>;

/**
 * Builds the hit testing Vega's voronoi or item hover marks provide, plus the bounds the invisible hover marks add to layout.
 * @param mark
 * @param name
 * @param ctx
 * @returns interaction outputs
 */
const buildInteraction = (mark: LineOptions, name: string, ctx: MarkContext): Interaction => {
  const points = getHoverCandidates(mark, ctx);
  const width = Math.max(ctx.width, 1);
  const height = Math.max(ctx.height, 1);
  const inPlot = (x: number, y: number) => points.length > 0 && x >= 0 && y >= 0 && x <= width && y <= height;
  const target = (p: Point, markName: string, itemBounds: ItemBounds, cursor?: string): HitTarget => ({
    datum: p.row,
    mark: markName,
    bounds: itemBounds,
    cursor,
    tooltip: getTooltip(mark, name, p.row),
  });
  const bounds = emptyBounds();
  let hitTarget: (x: number, y: number) => HitTarget | null;

  if (mark.interactionMode === 'item') {
    const scale = width / 1000;
    const radii = Array.from({ length: HOVER_SHAPE_COUNT }, (_, i) => Math.sqrt((HOVER_SIZE / 2 ** i) * scale) / 2);
    const diamond: SymbolNode = {
      type: 'symbol',
      key: 'itemHover',
      x: 0,
      y: 0,
      size: HOVER_SIZE * scale,
      shape: DIAMOND,
      stroke: 'transparent',
    };
    unionPointBounds(bounds, diamond, points);
    // Vega clips the hover group to the plot, which also clips its bounds
    if (points.length) {
      bounds.x1 = Math.max(bounds.x1, 0);
      bounds.y1 = Math.max(bounds.y1, 0);
      bounds.x2 = Math.min(bounds.x2, ctx.width);
      bounds.y2 = Math.min(bounds.y2, ctx.height);
    }
    hitTarget = (x, y) => {
      if (!inPlot(x, y)) return null;
      // the smallest diamonds draw last, and later items draw on top
      for (let i = radii.length - 1; i >= 0; i--) {
        const r = radii[i];
        for (let j = points.length - 1; j >= 0; j--) {
          const p = points[j];
          if (Math.abs(x - p.x) + Math.abs(y - p.y) > r) continue;
          return target(p, `${name}_hover${i}`, expand({ x1: p.x - r, y1: p.y - r, x2: p.x + r, y2: p.y + r }, 2));
        }
      }
      return null;
    };
  } else {
    const probe: SymbolNode = {
      type: 'symbol',
      key: 'voronoi',
      x: 0,
      y: 0,
      size: mark.pointSize ?? ctx.size.pointSize,
      shape: 'circle',
      stroke: 'transparent',
      strokeWidth: ctx.size.hoverStrokeWidth,
    };
    unionPointBounds(bounds, probe, points);
    // the voronoi cells tile the plot, and Vega pads their transparent stroke by width plus miter (2px)
    if (points.length) union(bounds, { x1: -2, y1: -2, x2: width + 2, y2: height + 2 });
    // built on the first hit test, so layout passes never triangulate
    let entry: VoronoiEntry | undefined;
    const cursor = mark.hasOnClick || hasSelection(mark) ? 'pointer' : undefined;
    hitTarget = (x, y) => {
      if (!inPlot(x, y)) return null;
      entry ??= getVoronoi(ctx, name, points, width, height);
      const i = entry.delaunay.find(x, y);
      const p = points[i];
      if (!p) return null;
      return {
        ...target(p, `${name}_voronoi`, polygonBounds(entry.voronoi.cellPolygon(i)), cursor),
        point: { mark: `${name}_pointsForVoronoi`, bounds: symbolBounds({ ...probe, x: p.x, y: p.y }) },
      };
    };
  }
  return {
    interactionBounds: bounds,
    hitTarget,
    hitTest: (x, y) => hitTarget(x, y)?.datum ?? null,
  };
};

/** The line's hover marks and hit testing; interactive lines always emit their hover groups, others only for controlled highlights. */
export const interactionPart: LinePart = {
  name: 'interaction',
  build: ({ mark, name, ctx }) => {
    const interactive = isInteractive(mark);
    const overlay = interactive || getControlledHighlightedRows(ctx).length > 0;
    return {
      overlay: overlay ? buildInteractiveOverlay(mark, name, ctx) : [],
      ...(interactive ? buildInteraction(mark, name, ctx) : {}),
    };
  },
};
