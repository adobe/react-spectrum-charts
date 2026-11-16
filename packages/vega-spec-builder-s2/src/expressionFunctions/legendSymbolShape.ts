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
import * as vega from 'vega';
import { Bounds } from 'vega';

import { VISIBILITY_OFF_PATH } from '@spectrum-charts/core-s2/constants';

interface PathContext {
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  rect(x: number, y: number, width: number, height: number): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, ccw?: boolean): void;
  bezierCurveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number): void;
  quadraticCurveTo(x1: number, y1: number, x: number, y: number): void;
}

interface SymbolDrawer {
  draw(context: unknown, size: number): void;
}

// vega re-exports these from vega-scenegraph, but its typings don't declare them
const { boundContext, pathSymbols } = vega as unknown as {
  boundContext: (bounds: Bounds) => unknown;
  pathSymbols: (shape: string) => SymbolDrawer;
};

// Vega scales symbol paths by sqrt(size) / 2, so size 4 draws them in unit space
const UNIT_SYMBOL_SIZE = 4;

/**
 * Draws a symbol shape (a Vega built-in name or an SVG path) as a unit-space SVG path.
 * @param shape
 * @returns SVG path
 */
const toUnitPath = (shape: string): string => {
  const commands: string[] = [];
  const context: PathContext = {
    beginPath: () => undefined,
    moveTo: (x, y) => commands.push(`M${x} ${y}`),
    lineTo: (x, y) => commands.push(`L${x} ${y}`),
    closePath: () => commands.push('Z'),
    rect: (x, y, width, height) => commands.push(`M${x} ${y}h${width}v${height}h${-width}Z`),
    // only the built-in circle calls arc, with a full turn from (x + r, y)
    arc: (x, y, r) => commands.push(`A${r} ${r} 0 1 1 ${x - r} ${y}A${r} ${r} 0 1 1 ${x + r} ${y}`),
    bezierCurveTo: (x1, y1, x2, y2, x, y) => commands.push(`C${x1} ${y1} ${x2} ${y2} ${x} ${y}`),
    quadraticCurveTo: (x1, y1, x, y) => commands.push(`Q${x1} ${y1} ${x} ${y}`),
  };
  pathSymbols(shape).draw(context, UNIT_SYMBOL_SIZE);
  // vega's path parser drops a Z that's directly followed by another command
  return commands.join(' ');
};

const addBounds = (bounds: Bounds, path: string): Bounds => {
  pathSymbols(path).draw(boundContext(bounds), UNIT_SYMBOL_SIZE);
  return bounds;
};

const legendSymbolPaths = new Map<string, { visible: string; hidden: string }>();

/**
 * Gets a legend symbol path padded so the shape and its hidden-series icon have identical bounds.
 * @param shape - Vega built-in symbol name or SVG path
 * @param hidden - whether the entry's series is hidden
 * @returns SVG path
 */
export const legendSymbolShape = (shape: string, hidden: boolean): string => {
  let paths = legendSymbolPaths.get(shape);
  if (!paths) {
    const visible = toUnitPath(shape);
    const bounds = addBounds(addBounds(new Bounds(), visible), VISIBILITY_OFF_PATH);
    // move-only subpaths extend the bounds without drawing anything
    const padding = ` M${bounds.x1} ${bounds.y1} M${bounds.x2} ${bounds.y2}`;
    paths = { visible: visible + padding, hidden: VISIBILITY_OFF_PATH + padding };
    legendSymbolPaths.set(shape, paths);
  }
  return hidden ? paths.hidden : paths.visible;
};
