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
import { View } from 'vega';

import { Bounds, unionBounds, viewRelativeBounds } from './axisLabelGeometry.js';

export type ArrowKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown';

/** One rendered legend entry: its series value, page-absolute bounds, and raw scene item (for click/tooltip parity). */
export interface LegendEntry {
  value: string;
  bounds: Bounds;
  item: LegendSceneNode;
}

/* Vega scenegraph nodes are loosely typed; narrow the few fields read here. */
export interface LegendSceneNode {
  marktype?: string;
  role?: string;
  name?: string;
  items?: LegendSceneNode[];
  bounds?: Bounds;
  x?: number;
  y?: number;
  datum?: { value?: unknown };
  tooltip?: unknown;
  mark?: { role?: string; name?: string; group?: LegendSceneNode };
  group?: LegendSceneNode;
}

/** Max pixel drift between entries still considered to share a row/column (Vega aligns grid entries exactly). */
const ALIGN_TOLERANCE = 2;

const getSceneRoot = (view: View): LegendSceneNode =>
  (view as unknown as { scenegraph: () => { root: LegendSceneNode } }).scenegraph().root;

/**
 * Every legend's per-entry group mark, in render order (one per symbol legend). Vega nests these (one
 * group item per entry, named `${legend}_legendEntry` when interactive) inside a `legend-entry` container.
 */
const collectLegendEntryMarks = (view: View): LegendSceneNode[] => {
  const marks: LegendSceneNode[] = [];
  const walk = (node: LegendSceneNode | undefined): void => {
    if (!node || typeof node !== 'object') return;
    if (node.marktype === 'group' && node.role === 'legend-entry') {
      for (const container of node.items ?? []) {
        const entriesMark = container.items?.find((mark) => mark.marktype === 'group');
        if (entriesMark) marks.push(entriesMark);
      }
      return;
    }
    node.items?.forEach(walk);
  };
  walk(getSceneRoot(view));
  return marks;
};

/** An entry group's series value; Vega's entry groups only carry an index, so it's read off their symbol/label children. */
const entryValue = (entry: LegendSceneNode): string | undefined => {
  const value = entry.datum?.value ?? entry.items?.flatMap((mark) => mark.items ?? []).find((item) => item.datum)?.datum?.value;
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : undefined;
};

/** Converts view-relative bounds to page-absolute ones (same conversion the axis ring uses). */
const toPageBounds = (view: View, container: HTMLElement, bounds: Bounds): Bounds => {
  const [originX, originY] = view.origin();
  const rect = container.getBoundingClientRect();
  return {
    x1: rect.left + originX + bounds.x1,
    y1: rect.top + originY + bounds.y1,
    x2: rect.left + originX + bounds.x2,
    y2: rect.top + originY + bounds.y2,
  };
};

/** Picks the entry mark for `legendName` when it's named (interactive legends), else the first legend. */
const pickLegendEntryMark = (marks: LegendSceneNode[], legendName?: string): LegendSceneNode | undefined =>
  marks.find((mark) => legendName && mark.name === `${legendName}_legendEntry`) ?? marks[0];

/**
 * The legend's rendered entries in Vega's own layout order, with live page-absolute bounds. Read from
 * the scenegraph on demand so wrapping/resizing (rows, columns, orientation) is always current.
 */
export const getLegendEntries = (view: View, container: HTMLElement, legendName?: string): LegendEntry[] => {
  const mark = pickLegendEntryMark(collectLegendEntryMarks(view), legendName);
  const entries: LegendEntry[] = [];
  for (const item of mark?.items ?? []) {
    const value = entryValue(item);
    const bounds = viewRelativeBounds(item as never);
    if (value === undefined || !bounds) continue;
    entries.push({ value, bounds: toPageBounds(view, container, bounds), item });
  }
  return entries;
};

/** The whole-legend box (title + every entry), page-absolute, or `undefined` if no legend is rendered. */
export const getLegendBounds = (view: View, container: HTMLElement, legendName?: string): Bounds | undefined => {
  const mark = pickLegendEntryMark(collectLegendEntryMarks(view), legendName);
  // entries mark → its `legend-entry` container item → that container's owning legend item (title included).
  const legendGroup = mark?.group?.mark?.group;
  const legendBounds = legendGroup ? viewRelativeBounds(legendGroup as never) : undefined;
  if (legendBounds) return toPageBounds(view, container, legendBounds);
  const entries = getLegendEntries(view, container, legendName);
  return entries.length ? entries.map((entry) => entry.bounds).reduce(unionBounds) : undefined;
};

/** Assigns each value a cluster index, grouping values within `ALIGN_TOLERANCE` of each other. */
const clusterIndices = (values: number[]): number[] => {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const clusterOf = new Map<number, number>();
  let cluster = -1;
  let previous = Number.NEGATIVE_INFINITY;
  for (const value of sorted) {
    if (value - previous > ALIGN_TOLERANCE) cluster += 1;
    clusterOf.set(value, cluster);
    previous = value;
  }
  return values.map((value) => clusterOf.get(value) ?? 0);
};

/**
 * The series one arrow key away from `value`, following the legend's rendered grid. The arrows along
 * the direction entries are laid out in (rows or columns, read from their positions) walk entries in
 * order, wrapping onto the next row/column; the other arrows only move to the directly aligned entry.
 * @returns `undefined` at either end (no wraparound), with no aligned neighbor, or when `value` isn't a rendered entry.
 */
export const findLegendNeighbor = (
  entries: Pick<LegendEntry, 'value' | 'bounds'>[],
  value: string,
  key: ArrowKey
): string | undefined => {
  const index = entries.findIndex((entry) => entry.value === value);
  if (index < 0) return undefined;

  const rows = clusterIndices(entries.map((entry) => entry.bounds.y1));
  const columns = clusterIndices(entries.map((entry) => entry.bounds.x1));
  // Entries are in Vega's layout order, so consecutive entries sharing a row means the grid fills rows.
  const fillsRows = rows.some((row, i) => i > 0 && row === rows[i - 1]);
  const isHorizontalKey = key === 'ArrowLeft' || key === 'ArrowRight';
  const step = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;

  if (isHorizontalKey === fillsRows) return entries[index + step]?.value;

  return entries.find((_, i) =>
    isHorizontalKey
      ? rows[i] === rows[index] && columns[i] === columns[index] + step
      : columns[i] === columns[index] && rows[i] === rows[index] + step
  )?.value;
};
