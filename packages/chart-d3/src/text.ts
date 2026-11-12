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
import { TextNode } from './scene.js';

export interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const ELLIPSIS = '\u2026';
const CACHE_MAX = 5000;
const widthCache = new Map<string, number>();
let context: CanvasRenderingContext2D | null | undefined;

const getContext = (): CanvasRenderingContext2D | null => {
  if (context === undefined) {
    context = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
    if (typeof document !== 'undefined') {
      document.fonts?.addEventListener?.('loadingdone', () => widthCache.clear());
    }
  }
  return context;
};

/**
 * Builds a CSS font shorthand, so measurements match.
 * @param fontSize
 * @param font
 * @param fontWeight
 * @returns font string
 */
export const fontString = (fontSize: number, font: string, fontWeight: string | number = 'normal'): string =>
  `${fontWeight} ${fontSize}px ${font}`;

/**
 * Measures text width with a cached canvas context, falling back to an estimate without one.
 * @param text
 * @param fontSize
 * @param font
 * @param fontWeight
 * @returns width in pixels
 */
export const measureText = (text: string, fontSize: number, font: string, fontWeight?: string | number): number => {
  const fontKey = fontString(fontSize, font, fontWeight);
  const key = `${fontKey}|${text}`;
  const cached = widthCache.get(key);
  if (cached !== undefined) return cached;
  const ctx = getContext();
  let width: number;
  if (ctx) {
    ctx.font = fontKey;
    width = ctx.measureText(text).width;
  } else {
    width = 0.8 * fontSize * text.length;
  }
  if (widthCache.size >= CACHE_MAX) widthCache.clear();
  widthCache.set(key, width);
  return width;
};

/**
 * Truncates text with an ellipsis so it fits within `limit` pixels.
 * @param text
 * @param limit
 * @param fontSize
 * @param font
 * @param fontWeight
 * @returns truncated text
 */
export const truncate = (
  text: string,
  limit: number | undefined,
  fontSize: number,
  font: string,
  fontWeight?: string | number
): string => {
  if (!limit || measureText(text, fontSize, font, fontWeight) <= limit) return text;
  const available = limit - measureText(ELLIPSIS, fontSize, font, fontWeight);
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = 1 + ((lo + hi) >>> 1);
    if (measureText(text.slice(0, mid), fontSize, font, fontWeight) < available) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + ELLIPSIS;
};

/**
 * Gets the pixel offset from the anchor to the alphabetic baseline.
 * @param baseline
 * @param fontSize
 * @returns offset in pixels
 */
export const baselineOffset = (baseline: TextNode['baseline'], fontSize: number): number => {
  switch (baseline) {
    case 'top':
      return Math.round(0.79 * fontSize);
    case 'middle':
      return Math.round(0.3 * fontSize);
    case 'bottom':
      return Math.round(-0.21 * fontSize);
    default:
      return 0;
  }
};

/**
 * Gets the distance between lines of multi-line text.
 * @param fontSize
 * @returns line height in pixels
 */
export const lineHeight = (fontSize: number): number => fontSize + 2;

const DEG_TO_RAD = Math.PI / 180;

/**
 * Gets the bounding box of a text node.
 * @param node
 * @returns Bounds
 */
export const textBounds = (node: TextNode): Bounds => {
  const lines = node.lines ?? [node.text];
  const h = node.fontSize + lineHeight(node.fontSize) * (lines.length - 1);
  const w = Math.max(...lines.map((line) => measureText(line, node.fontSize, node.font, node.fontWeight)));
  let dx = 0;
  if (node.align === 'center') dx = -w / 2;
  else if (node.align === 'right') dx = -w;
  const dy = baselineOffset(node.baseline, node.fontSize) - Math.round(0.8 * node.fontSize);
  const x1 = node.x + dx;
  const y1 = node.y + dy;
  if (!node.angle) return { x1, y1, x2: x1 + w, y2: y1 + h };
  return rotateBounds({ x1, y1, x2: x1 + w, y2: y1 + h }, node.angle * DEG_TO_RAD, node.x, node.y);
};

/** Rotates bounds about (x, y). */
const rotateBounds = ({ x1, y1, x2, y2 }: Bounds, angle: number, x: number, y: number): Bounds => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const cx = x - x * cos + y * sin;
  const cy = y - x * sin - y * cos;
  const xs = [cos * x1 - sin * y1 + cx, cos * x1 - sin * y2 + cx, cos * x2 - sin * y1 + cx, cos * x2 - sin * y2 + cx];
  const ys = [sin * x1 + cos * y1 + cy, sin * x1 + cos * y2 + cy, sin * x2 + cos * y1 + cy, sin * x2 + cos * y2 + cy];
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
};

/**
 * Unions bounds, ignoring undefined entries.
 * @param boxes
 * @returns Bounds
 */
export const unionBounds = (...boxes: (Bounds | undefined)[]): Bounds => {
  const out = {
    x1: Number.POSITIVE_INFINITY,
    y1: Number.POSITIVE_INFINITY,
    x2: Number.NEGATIVE_INFINITY,
    y2: Number.NEGATIVE_INFINITY,
  };
  for (const b of boxes) {
    if (!b) continue;
    out.x1 = Math.min(out.x1, b.x1);
    out.y1 = Math.min(out.y1, b.y1);
    out.x2 = Math.max(out.x2, b.x2);
    out.y2 = Math.max(out.y2, b.y2);
  }
  return out;
};

export const offsetBounds = (b: Bounds, dx: number, dy: number): Bounds => ({
  x1: b.x1 + dx,
  y1: b.y1 + dy,
  x2: b.x2 + dx,
  y2: b.y2 + dy,
});
