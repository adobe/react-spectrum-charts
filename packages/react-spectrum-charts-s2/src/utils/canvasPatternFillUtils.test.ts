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
import { patchCanvasContextForPatternFill } from './canvasPatternFillUtils';
import {
  clearPatternFillRegistry,
  getColorMatchedPatternFillUrl,
  getPatternFillUrl,
  PatternTileSource,
  registerPatternFill,
} from './patternFillUtils';

const getContext = (): CanvasRenderingContext2D => {
  const canvas = document.createElement('canvas');
  return canvas.getContext('2d') as CanvasRenderingContext2D;
};

const getContextWithPixelScale = (scale: number): CanvasRenderingContext2D => {
  const canvas = document.createElement('canvas');
  Object.defineProperty(canvas, 'clientWidth', { value: 100, configurable: true });
  canvas.width = 100 * scale;
  return canvas.getContext('2d') as CanvasRenderingContext2D;
};

const stripeSource: PatternTileSource = {
  id: 'stripe-blue',
  tileSize: { width: 8, height: 8 },
  draw: jest.fn(),
};

afterEach(() => {
  clearPatternFillRegistry();
  jest.clearAllMocks();
});

describe('patchCanvasContextForPatternFill()', () => {
  test('leaves a plain color fill unaffected', () => {
    const ctx = getContext();
    patchCanvasContextForPatternFill(ctx);

    ctx.fillStyle = '#ff0000';

    expect(ctx.fillStyle).toBe('#ff0000');
  });

  test('resolves a registered pattern-fill reference to a CanvasPattern', () => {
    registerPatternFill(stripeSource);
    const ctx = getContext();
    patchCanvasContextForPatternFill(ctx);

    ctx.fillStyle = getPatternFillUrl('stripe-blue');

    expect(ctx.fillStyle).not.toBe(getPatternFillUrl('stripe-blue'));
    expect(stripeSource.draw).toHaveBeenCalledTimes(1);
  });

  test('caches the CanvasPattern per identity, reusing it across assignments', () => {
    registerPatternFill(stripeSource);
    const ctx = getContext();
    patchCanvasContextForPatternFill(ctx);

    ctx.fillStyle = getPatternFillUrl('stripe-blue');
    const first = ctx.fillStyle;
    ctx.fillStyle = '#00ff00';
    ctx.fillStyle = getPatternFillUrl('stripe-blue');
    const second = ctx.fillStyle;

    expect(second).toBe(first);
    expect(stripeSource.draw).toHaveBeenCalledTimes(1);
  });

  test('resolves distinct pattern identities to distinct cached patterns', () => {
    const otherSource: PatternTileSource = { id: 'stripe-red', tileSize: { width: 8, height: 8 }, draw: jest.fn() };
    registerPatternFill(stripeSource);
    registerPatternFill(otherSource);
    const ctx = getContext();
    patchCanvasContextForPatternFill(ctx);

    ctx.fillStyle = getPatternFillUrl('stripe-blue');
    const blue = ctx.fillStyle;
    ctx.fillStyle = getPatternFillUrl('stripe-red');
    const red = ctx.fillStyle;

    expect(blue).not.toBe(red);
  });

  test('applies a rotation transform on the pattern object when the source specifies one', () => {
    const rotatedSource: PatternTileSource = {
      id: 'stripe-rotated',
      tileSize: { width: 8, height: 8 },
      draw: jest.fn(),
      rotation: 45,
    };
    registerPatternFill(rotatedSource);
    const ctx = getContext();
    patchCanvasContextForPatternFill(ctx);

    ctx.fillStyle = getPatternFillUrl('stripe-rotated');

    const pattern = ctx.fillStyle as unknown as { setTransform: jest.Mock };
    expect(pattern.setTransform).toHaveBeenCalledTimes(1);
  });

  test('does not apply a transform when the source specifies no rotation', () => {
    registerPatternFill(stripeSource);
    const ctx = getContext();
    patchCanvasContextForPatternFill(ctx);

    ctx.fillStyle = getPatternFillUrl('stripe-blue');

    const pattern = ctx.fillStyle as unknown as { setTransform: jest.Mock };
    expect(pattern.setTransform).not.toHaveBeenCalled();
  });

  test('renders the tile at the canvas pixel resolution, not just its logical tile size', () => {
    registerPatternFill(stripeSource);
    const ctx = getContextWithPixelScale(2);
    const createElementSpy = jest.spyOn(document, 'createElement');
    patchCanvasContextForPatternFill(ctx);

    ctx.fillStyle = getPatternFillUrl('stripe-blue');

    const tile = createElementSpy.mock.results.find((r) => r.value.tagName === 'CANVAS')
      ?.value as HTMLCanvasElement;
    expect(tile.width).toBe(16);
    expect(tile.height).toBe(16);
    createElementSpy.mockRestore();
  });

  test('compensates for a high-pixel-density canvas via the pattern transform, even without rotation', () => {
    registerPatternFill(stripeSource);
    const ctx = getContextWithPixelScale(2);
    patchCanvasContextForPatternFill(ctx);

    ctx.fillStyle = getPatternFillUrl('stripe-blue');

    const pattern = ctx.fillStyle as unknown as { setTransform: jest.Mock };
    const transform = pattern.setTransform.mock.calls[0][0];
    expect(transform.a).toBeCloseTo(0.5);
    expect(transform.d).toBeCloseTo(0.5);
  });

  test('resolves a composite (baseId::color) id to a color-matched CanvasPattern via drawWithColor', () => {
    const drawWithColor = jest.fn();
    registerPatternFill({ id: 'colorizable-stripe', tileSize: { width: 8, height: 8 }, draw: jest.fn(), drawWithColor });
    const ctx = getContext();
    patchCanvasContextForPatternFill(ctx);

    ctx.fillStyle = getColorMatchedPatternFillUrl('colorizable-stripe', '#2680eb');

    expect(ctx.fillStyle).not.toBe(getColorMatchedPatternFillUrl('colorizable-stripe', '#2680eb'));
    expect(drawWithColor).toHaveBeenCalledWith(expect.anything(), { width: 8, height: 8 }, '#2680eb');
  });

  test('falls back to native behavior for a composite id whose base source has no drawWithColor', () => {
    registerPatternFill(stripeSource);
    const ctx = getContext();
    patchCanvasContextForPatternFill(ctx);

    ctx.fillStyle = '#0000ff';
    ctx.fillStyle = getColorMatchedPatternFillUrl('stripe-blue', '#2680eb');

    expect(ctx.fillStyle).toBe('#0000ff');
  });

  test('falls back to native behavior for an unregistered pattern id', () => {
    const ctx = getContext();
    patchCanvasContextForPatternFill(ctx);

    ctx.fillStyle = '#0000ff';
    ctx.fillStyle = getPatternFillUrl('not-registered');

    expect(ctx.fillStyle).toBe('#0000ff');
  });

  test('is idempotent - patching the same context twice does not double-wrap or reset the cache', () => {
    registerPatternFill(stripeSource);
    const ctx = getContext();
    patchCanvasContextForPatternFill(ctx);
    ctx.fillStyle = getPatternFillUrl('stripe-blue');
    const first = ctx.fillStyle;

    patchCanvasContextForPatternFill(ctx);
    ctx.fillStyle = getPatternFillUrl('stripe-blue');
    const second = ctx.fillStyle;

    expect(second).toBe(first);
    expect(stripeSource.draw).toHaveBeenCalledTimes(1);
  });

  test('gives independent caches to different contexts', () => {
    registerPatternFill(stripeSource);
    const ctxA = getContext();
    const ctxB = getContext();
    patchCanvasContextForPatternFill(ctxA);
    patchCanvasContextForPatternFill(ctxB);

    ctxA.fillStyle = getPatternFillUrl('stripe-blue');
    ctxB.fillStyle = getPatternFillUrl('stripe-blue');

    expect(ctxA.fillStyle).not.toBe(ctxB.fillStyle);
    expect(stripeSource.draw).toHaveBeenCalledTimes(2);
  });
});
