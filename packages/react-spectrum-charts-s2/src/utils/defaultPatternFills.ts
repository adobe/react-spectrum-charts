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
import { PatternTileSource, registerPatternFill } from './patternFillUtils';

const TILE_SIZE = { width: 10, height: 10 };
const BASE_COLOR = '#ffffff';
const TEXTURE_COLOR = '#404040';

type TileSize = { width: number; height: number };
type ShapeDraw = (ctx: CanvasRenderingContext2D, size: TileSize, inkColor: string, baseColor: string | null) => void;

const drawStripe: ShapeDraw = (ctx, { width, height }, inkColor, baseColor) => {
  if (baseColor) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = inkColor;
  ctx.fillRect(0, 0, width, height / 2);
};

const drawDots: ShapeDraw = (ctx, { width, height }, inkColor, baseColor) => {
  if (baseColor) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = inkColor;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) / 4, 0, Math.PI * 2);
  ctx.fill();
};

const drawCrosshatch: ShapeDraw = (ctx, { width, height }, inkColor, baseColor) => {
  if (baseColor) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
};

const drawGrid: ShapeDraw = (ctx, { width, height }, inkColor, baseColor) => {
  if (baseColor) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);
};

const toTileSource = (
  id: string,
  shape: ShapeDraw,
  rotation?: number
): PatternTileSource => ({
  id,
  tileSize: TILE_SIZE,
  rotation,
  draw: (ctx, size) => shape(ctx, size, TEXTURE_COLOR, BASE_COLOR),
  // Transparent base: the shape's ink color is meant to match a sibling series color, so the tile shouldn't
  // impose its own background over whatever the mark would otherwise show.
  drawWithColor: (ctx, size, color) => shape(ctx, size, color, null),
});

// The built-in, colorScheme-independent tile palette used as PATTERN_SCALE's default range - registered once
// at module load. Rotation is expressed as a pattern transform (not baked into the tile), per
// planning/specs/chart/pattern-fill-rendering.json's requirements. Each shape also has a drawWithColor variant,
// used when a `patterns` group pairs a built-in name with a sibling literal color (see resolvePatternFillGroup).
registerPatternFill(toTileSource('diagonal-stripe', drawStripe, 45));
registerPatternFill(toTileSource('diagonal-stripe-reverse', drawStripe, 135));
registerPatternFill(toTileSource('horizontal-stripe', drawStripe));
registerPatternFill(toTileSource('dots', drawDots));
registerPatternFill(toTileSource('crosshatch', drawCrosshatch));
registerPatternFill(toTileSource('grid', drawGrid));
