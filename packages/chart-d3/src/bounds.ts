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
import { BUILTIN_SYMBOLS, GroupNode, PathNode, SceneNode, SymbolNode } from './scene.js';
import { Bounds, textBounds } from './text.js';

export const emptyBounds = (): Bounds => ({
  x1: Number.POSITIVE_INFINITY,
  y1: Number.POSITIVE_INFINITY,
  x2: Number.NEGATIVE_INFINITY,
  y2: Number.NEGATIVE_INFINITY,
});

export const isEmpty = (b: Bounds): boolean => !(b.x2 >= b.x1 && b.y2 >= b.y1);

/**
 * Adds a point to bounds in place.
 * @param b
 * @param x
 * @param y
 * @returns bounds
 */
export const addPoint = (b: Bounds, x: number, y: number): Bounds => {
  if (x < b.x1) b.x1 = x;
  if (y < b.y1) b.y1 = y;
  if (x > b.x2) b.x2 = x;
  if (y > b.y2) b.y2 = y;
  return b;
};

/**
 * Unions `other` into `b` in place.
 * @param b
 * @param other
 * @returns bounds
 */
export const union = (b: Bounds, other: Bounds): Bounds => {
  if (isEmpty(other)) return b;
  addPoint(b, other.x1, other.y1);
  return addPoint(b, other.x2, other.y2);
};

export const translate = (b: Bounds, dx: number, dy: number): Bounds =>
  isEmpty(b) ? b : { x1: b.x1 + dx, y1: b.y1 + dy, x2: b.x2 + dx, y2: b.y2 + dy };

export const expand = (b: Bounds, d: number): Bounds =>
  isEmpty(b) ? b : { x1: b.x1 - d, y1: b.y1 - d, x2: b.x2 + d, y2: b.y2 + d };

const cubicExtrema = (p0: number, p1: number, p2: number, p3: number): number[] => {
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;
  const roots: number[] = [];
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) roots.push(-c / b);
  } else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sq = Math.sqrt(disc);
      roots.push((-b + sq) / (2 * a), (-b - sq) / (2 * a));
    }
  }
  return roots.filter((t) => t > 0 && t < 1);
};

const cubicAt = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
};

const addCubic = (b: Bounds, x0: number, y0: number, c: number[]) => {
  const [x1, y1, x2, y2, x3, y3] = c;
  addPoint(b, x3, y3);
  for (const t of [...cubicExtrema(x0, x1, x2, x3), ...cubicExtrema(y0, y1, y2, y3)]) {
    addPoint(b, cubicAt(x0, x1, x2, x3, t), cubicAt(y0, y1, y2, y3, t));
  }
};

const pathBoundsCache = new Map<string, Bounds>();

/**
 * Gets the geometric bounds of an SVG path, including bezier extrema; arcs contribute their end points.
 * @param path
 * @returns Bounds
 */
export const pathBounds = (path: string): Bounds => {
  const cached = pathBoundsCache.get(path);
  if (cached) return cached;
  const b = emptyBounds();
  const tokens = path.match(/[a-z]|-?[\d.]+(?:e[-+]?\d+)?/gi) ?? [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[a-z]/i.test(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'M':
        x = ox + num();
        y = oy + num();
        sx = x;
        sy = y;
        addPoint(b, x, y);
        cmd = rel ? 'l' : 'L';
        break;
      case 'L':
      case 'T':
        x = ox + num();
        y = oy + num();
        addPoint(b, x, y);
        break;
      case 'H':
        x = ox + num();
        addPoint(b, x, y);
        break;
      case 'V':
        y = oy + num();
        addPoint(b, x, y);
        break;
      case 'C': {
        const c = [ox + num(), oy + num(), ox + num(), oy + num(), ox + num(), oy + num()];
        addCubic(b, x, y, c);
        x = c[4];
        y = c[5];
        break;
      }
      case 'S':
      case 'Q':
        num();
        num();
        x = ox + num();
        y = oy + num();
        addPoint(b, x, y);
        break;
      case 'A':
        i += 5;
        x = ox + num();
        y = oy + num();
        addPoint(b, x, y);
        break;
      case 'Z':
        x = sx;
        y = sy;
        break;
      default:
        i++;
    }
  }
  pathBoundsCache.set(path, b);
  return b;
};

/**
 * Gets symbol bounds the way Vega does: shape scaled by sqrt(size)/2, expanded by the full stroke width.
 * @param node
 * @param boundShape optional shape used only for bounds (e.g. a union of the visible and hidden icons)
 * @returns Bounds
 */
export const symbolBounds = (node: SymbolNode, boundShape?: string): Bounds => {
  const r = Math.sqrt(node.size) / 2;
  const shape = boundShape ?? node.shape;
  const unit = shape === 'circle' ? { x1: -1, y1: -1, x2: 1, y2: 1 } : pathBounds(BUILTIN_SYMBOLS[shape] ?? shape);
  const b = { x1: node.x + unit.x1 * r, y1: node.y + unit.y1 * r, x2: node.x + unit.x2 * r, y2: node.y + unit.y2 * r };
  return node.stroke && node.opacity !== 0 && node.strokeOpacity !== 0 ? expand(b, node.strokeWidth ?? 1) : b;
};

/**
 * Gets the bounds of a scene node (relative to its parent), matching Vega's item bounds.
 * @param node
 * @returns Bounds
 */
export const nodeBounds = (node: SceneNode): Bounds => {
  switch (node.type) {
    case 'text':
      return node.text ? textBounds(node) : emptyBounds();
    case 'symbol':
      return symbolBounds(node);
    case 'rule': {
      const b = addPoint(addPoint(emptyBounds(), node.x, node.y), node.x2, node.y2);
      return node.stroke ? expand(b, node.strokeWidth ?? 1) : b;
    }
    case 'rect':
    case 'image':
      return { x1: node.x, y1: node.y, x2: node.x + node.width, y2: node.y + node.height };
    case 'path':
      return pathNodeBounds(node);
    case 'group':
      return groupBounds(node);
  }
};

const pathNodeBounds = (node: PathNode): Bounds => {
  const b = { ...pathBounds(node.d) };
  if (!node.stroke) return b;
  const sw = node.strokeWidth ?? 1;
  return expand(b, node.miterBounds ? sw * 2 : sw);
};

const groupBounds = (node: GroupNode): Bounds => {
  const b = emptyBounds();
  for (const child of node.children) union(b, nodeBounds(child));
  const { clip } = node;
  const clipped = clip
    ? {
        x1: Math.max(b.x1, clip.x),
        y1: Math.max(b.y1, clip.y),
        x2: Math.min(b.x2, clip.x + clip.width),
        y2: Math.min(b.y2, clip.y + clip.height),
      }
    : b;
  return isEmpty(clipped) ? emptyBounds() : translate(clipped, node.x ?? 0, node.y ?? 0);
};
