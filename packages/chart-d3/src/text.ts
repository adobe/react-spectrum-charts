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
const metricsCache = new Map<string, FontMetrics>();
let context: CanvasRenderingContext2D | null | undefined;

const getContext = (): CanvasRenderingContext2D | null => {
  if (context === undefined) {
    context = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
    if (typeof document !== 'undefined') {
      document.fonts?.addEventListener?.('loadingdone', () => {
        widthCache.clear();
        metricsCache.clear();
      });
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
    // average glyph width when there's no canvas to measure with (e.g. jsdom)
    width = 0.6 * fontSize * text.length;
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

/** Ascent and descent of a font in pixels, measured from the alphabetic baseline. */
export interface FontMetrics {
  ascent: number;
  descent: number;
}

/**
 * Measures a font's ascender and descender extents, estimating them without a canvas.
 * @param fontSize
 * @param font
 * @param fontWeight
 * @returns FontMetrics
 */
export const fontMetrics = (fontSize: number, font: string, fontWeight?: string | number): FontMetrics => {
  const fontKey = fontString(fontSize, font, fontWeight);
  const cached = metricsCache.get(fontKey);
  if (cached) return cached;
  const ctx = getContext();
  let metrics = { ascent: 0.75 * fontSize, descent: 0.25 * fontSize };
  if (ctx) {
    ctx.font = fontKey;
    const m = ctx.measureText('Hdgy');
    if (m.actualBoundingBoxAscent || m.actualBoundingBoxDescent) {
      metrics = { ascent: m.actualBoundingBoxAscent, descent: m.actualBoundingBoxDescent };
    }
  }
  metricsCache.set(fontKey, metrics);
  return metrics;
};

/**
 * Gets the offset from a text node's anchor y to its first line's alphabetic baseline.
 * @param node
 * @returns offset in pixels
 */
export const baselineOffset = (node: Pick<TextNode, 'baseline' | 'fontSize' | 'font' | 'fontWeight'>): number => {
  const { ascent, descent } = fontMetrics(node.fontSize, node.font, node.fontWeight);
  if (node.baseline === 'top') return Math.round(ascent);
  if (node.baseline === 'middle') return Math.round((ascent - descent) / 2);
  if (node.baseline === 'bottom') return -Math.round(descent);
  return 0;
};

/**
 * Gets the distance between baselines of multi-line text.
 * @param fontSize
 * @returns line height in pixels
 */
export const lineHeight = (fontSize: number): number => Math.round(fontSize * 1.2);

const rotatePoint = (px: number, py: number, cx: number, cy: number, radians: number): [number, number] => {
  const dx = px - cx;
  const dy = py - cy;
  return [cx + dx * Math.cos(radians) - dy * Math.sin(radians), cy + dx * Math.sin(radians) + dy * Math.cos(radians)];
};

/**
 * Gets the bounding box of a text node.
 * @param node
 * @returns Bounds
 */
export const textBounds = (node: TextNode): Bounds => {
  const lines = node.lines ?? [node.text];
  const { ascent, descent } = fontMetrics(node.fontSize, node.font, node.fontWeight);
  const w = Math.max(...lines.map((line) => measureText(line, node.fontSize, node.font, node.fontWeight)));
  const h = ascent + descent + lineHeight(node.fontSize) * (lines.length - 1);
  let left = 0;
  if (node.align === 'center') left = -w / 2;
  else if (node.align === 'right') left = -w;
  const top = baselineOffset(node) - ascent;
  if (!node.angle) return { x1: node.x + left, y1: node.y + top, x2: node.x + left + w, y2: node.y + top + h };
  // rotate the corners about the anchor and take their extent
  const radians = (node.angle * Math.PI) / 180;
  const corners = [
    [left, top],
    [left + w, top],
    [left, top + h],
    [left + w, top + h],
  ].map(([x, y]) => rotatePoint(node.x + x, node.y + y, node.x, node.y, radians));
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
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
