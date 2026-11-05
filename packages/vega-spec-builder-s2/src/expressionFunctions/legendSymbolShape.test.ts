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

import { ROUNDED_SQUARE_PATH, VISIBILITY_OFF_PATH } from '@spectrum-charts/core-s2/constants';

import { legendSymbolShape } from './legendSymbolShape.js';

const { boundContext, pathParse, pathSymbols } = vega as unknown as {
  boundContext: (bounds: Bounds) => unknown;
  pathParse: (path: string) => [string, ...number[]][];
  pathSymbols: (shape: string) => { draw(context: unknown, size: number): void };
};

const getBounds = (path: string): number[] => {
  const bounds = new Bounds();
  pathSymbols(path).draw(boundContext(bounds), 4);
  return [bounds.x1, bounds.y1, bounds.x2, bounds.y2].map((n) => Math.round(n * 1e6) / 1e6);
};

describe('legendSymbolShape()', () => {
  test.each(['circle', 'square', 'triangle-up', 'diamond', ROUNDED_SQUARE_PATH, 'M -2 -0.5 L 2 -0.5 L 2 0.5 Z'])(
    'visible and hidden paths should have identical bounds for %s',
    (shape) => {
      expect(getBounds(legendSymbolShape(shape, false))).toEqual(getBounds(legendSymbolShape(shape, true)));
    }
  );

  test('bounds should cover both the shape and the hidden icon', () => {
    const [x1, y1, x2, y2] = getBounds(legendSymbolShape('M -2 -0.5 L 2 -0.5 L 2 0.5 Z', false));
    const [iconX1, iconY1, iconX2, iconY2] = getBounds(VISIBILITY_OFF_PATH);
    expect(x1).toBe(-2);
    expect(x2).toBe(2);
    expect(y1).toBeLessThanOrEqual(iconY1);
    expect(y2).toBeGreaterThanOrEqual(iconY2);
    expect(x1).toBeLessThan(iconX1);
    expect(x2).toBeGreaterThan(iconX2);
  });

  test('should keep close-path commands when parsed by vega', () => {
    const commands = pathParse(legendSymbolShape('square', false)).map(([command]) => command);
    expect(commands).toContain('Z');
  });

  test('hidden path should start with the hidden icon', () => {
    expect(legendSymbolShape('circle', true).startsWith(VISIBILITY_OFF_PATH)).toBe(true);
  });

  test('should return the same path for repeated calls', () => {
    expect(legendSymbolShape('diamond', false)).toBe(legendSymbolShape('diamond', false));
  });
});
