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
  getPatternFillId,
  getPatternFillSource,
  isPatternFillValue,
  PatternFillValue,
  PatternTileSource,
} from './patternFillUtils';

type FillStyleValue = string | CanvasGradient | CanvasPattern;
/** The raw value Vega's canvas renderer may assign to fillStyle before our interception resolves it. */
type InterceptedFillStyleValue = FillStyleValue | PatternFillValue;

const patchedContexts = new WeakSet<CanvasRenderingContext2D>();

interface NativeFillStyleAccessor {
  get: (ctx: CanvasRenderingContext2D) => FillStyleValue;
  set: (ctx: CanvasRenderingContext2D, value: FillStyleValue) => void;
}

/** Serializes a structured pattern-fill value to a cache key; never used as the wire representation. */
const getPatternCacheKey = (id: string, color?: string): string => (color ? `${id}::${color}` : id);

const getNativeFillStyleAccessor = (ctx: CanvasRenderingContext2D): NativeFillStyleAccessor => {
  let proto: unknown = Object.getPrototypeOf(ctx);
  while (proto) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'fillStyle');
    if (descriptor?.get && descriptor.set) {
      const { get, set } = descriptor;
      return { get: (c) => get.call(c), set: (c, value) => set.call(c, value) };
    }
    proto = Object.getPrototypeOf(proto);
  }
  throw new Error('canvasPatternFillUtils: could not locate the native fillStyle accessor');
};

// Vega's canvas renderer draws at canvas.width/height (device pixels) while scaling the context so drawing
// commands stay in CSS-pixel units. Reading the ratio directly off the element (rather than assuming
// window.devicePixelRatio) tracks whatever scale factor this specific canvas actually ended up with.
const getCanvasPixelScale = (canvas: HTMLCanvasElement): number => {
  const cssWidth = canvas.clientWidth;
  return cssWidth > 0 ? canvas.width / cssWidth : 1;
};

const buildPatternTransform = (degrees: number, scale: number): DOMMatrix2DInit => {
  const radians = (degrees * Math.PI) / 180;
  const inverseScale = 1 / scale;
  return {
    a: Math.cos(radians) * inverseScale,
    b: Math.sin(radians) * inverseScale,
    c: -Math.sin(radians) * inverseScale,
    d: Math.cos(radians) * inverseScale,
    e: 0,
    f: 0,
  };
};

const buildCanvasPattern = (ctx: CanvasRenderingContext2D, source: PatternTileSource): CanvasPattern | undefined => {
  const { width, height } = source.tileSize;
  const scale = getCanvasPixelScale(ctx.canvas);

  const tile = document.createElement('canvas');
  tile.width = width * scale;
  tile.height = height * scale;
  const tileCtx = tile.getContext('2d');
  if (!tileCtx) return undefined;
  tileCtx.scale(scale, scale);
  source.draw(tileCtx, source.tileSize);

  const pattern = ctx.createPattern(tile, 'repeat');
  if (pattern && (source.rotation || scale !== 1)) {
    pattern.setTransform(buildPatternTransform(source.rotation ?? 0, scale));
  }
  return pattern ?? undefined;
};

/** Resolves a structured pattern-fill value's sibling color (see resolvePatternFillGroup) to an ad hoc, color-matched tile source. */
const getColorMatchedPatternSource = (id: string, color: string): PatternTileSource | undefined => {
  const baseSource = getPatternFillSource(id);
  if (!baseSource?.drawWithColor) return undefined;

  return {
    id: getPatternCacheKey(id, color),
    tileSize: baseSource.tileSize,
    rotation: baseSource.rotation,
    draw: (ctx, size) => baseSource.drawWithColor!(ctx, size, color),
  };
};

const resolveFillStyleValue = (
  ctx: CanvasRenderingContext2D,
  value: InterceptedFillStyleValue,
  cache: Map<string, CanvasPattern>
): FillStyleValue => {
  const patternId = getPatternFillId(value);
  if (patternId === undefined) return value as FillStyleValue;

  const foreground = isPatternFillValue(value) ? value.foreground : undefined;
  const cacheKey = getPatternCacheKey(patternId, foreground);

  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const source = foreground ? getColorMatchedPatternSource(patternId, foreground) : getPatternFillSource(patternId);
  if (!source) return value as FillStyleValue;

  const pattern = buildCanvasPattern(ctx, source);
  if (!pattern) return value as FillStyleValue;

  cache.set(cacheKey, pattern);
  return pattern;
};

/**
 * Intercepts fillStyle assignment on a canvas context so pattern-fill references resolve to a real,
 * per-identity-cached CanvasPattern. Idempotent and safe to call repeatedly for the same context.
 * @param ctx
 */
export const patchCanvasContextForPatternFill = (ctx: CanvasRenderingContext2D): void => {
  if (patchedContexts.has(ctx)) return;
  patchedContexts.add(ctx);

  const cache = new Map<string, CanvasPattern>();
  const native = getNativeFillStyleAccessor(ctx);

  Object.defineProperty(ctx, 'fillStyle', {
    configurable: true,
    get(): FillStyleValue {
      return native.get(ctx);
    },
    set(value: InterceptedFillStyleValue) {
      native.set(ctx, resolveFillStyleValue(ctx, value, cache));
    },
  });
};
