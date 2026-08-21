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

import { getFocusedItemBounds, getFocusedItemClientPosition } from './focusedItemGeometry';

const datum = { datetime: 1000, value: 42 };
const fields = { dimension: 'datetime', metric: 'value', scaleType: 'time' };

const mockView = (xScaleName: string): View => {
  const scales: Record<string, (v: unknown) => number> = {
    [xScaleName]: (v) => (v as number) / 10,
    yLinear: (v) => (v as number) * 2,
  };
  return {
    scale: (name: string) => {
      const scale = scales[name];
      if (!scale) throw new Error(`Unrecognized scale: ${name}`);
      return scale;
    },
    origin: () => [5, 7],
  } as unknown as View;
};

describe('getFocusedItemBounds()', () => {
  test('centers a small box on the scaled point using the xTime/yLinear scale names', () => {
    const bounds = getFocusedItemBounds(mockView('xTime'), datum, fields);
    // x = 1000/10 = 100, y = 42*2 = 84
    expect(bounds).toStrictEqual({ x1: 96, x2: 104, y1: 80, y2: 88 });
  });

  test('uses metricAxis as the y scale name when provided', () => {
    const view = {
      scale: (name: string) => (name === 'xLinear' ? (v: unknown) => v as number : name === 'y2' ? (v: unknown) => (v as number) + 1000 : undefined),
      origin: () => [0, 0],
    } as unknown as View;
    const bounds = getFocusedItemBounds(view, { x: 1, y: 1 }, { dimension: 'x', metric: 'y', scaleType: 'linear', metricAxis: 'y2' });
    expect(bounds.y1).toBe(1000 + 1 - 4);
  });

  test('returns a zeroed box when dimension/metric are missing', () => {
    expect(getFocusedItemBounds(mockView('xTime'), datum, {})).toStrictEqual({ x1: 0, x2: 0, y1: 0, y2: 0 });
  });

  test('returns a zeroed box when the named scale does not exist', () => {
    const bounds = getFocusedItemBounds(mockView('xTime'), datum, { ...fields, scaleType: 'point' });
    expect(bounds).toStrictEqual({ x1: 0, x2: 0, y1: 0, y2: 0 });
  });

  test('warns (outside production) when the named scale does not exist, so a misconfigured scale is diagnosable', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    getFocusedItemBounds(mockView('xTime'), datum, { ...fields, scaleType: 'point' });
    expect(warnSpy).toHaveBeenCalledWith('Unable to resolve scale for focused item position', expect.any(Error));
    warnSpy.mockRestore();
  });

  describe('bar (orientation set)', () => {
    const mockBarView = (): View => {
      const band = (v: unknown) => (v as number) * 10;
      band.bandwidth = () => 6;
      const linear = (v: unknown) => (v as number) * 2;
      const scales: Record<string, unknown> = { xBand: band, yBand: band, xLinear: linear, yLinear: linear };
      return {
        scale: (name: string) => {
          const scale = scales[name];
          if (!scale) throw new Error(`Unrecognized scale: ${name}`);
          return scale;
        },
        origin: () => [0, 0],
      } as unknown as View;
    };

    test('centers on the band midpoint for the dimension axis and reads the raw metric for a non-stacked bar', () => {
      const bounds = getFocusedItemBounds(mockBarView(), { category: 2, value: 42 }, {
        dimension: 'category',
        metric: 'value',
        orientation: 'vertical',
      });
      // x = 2*10 + 6/2 = 23, y = 42*2 = 84
      expect(bounds).toStrictEqual({ x1: 19, x2: 27, y1: 80, y2: 88 });
    });

    test('reads the cumulative `${metric}1` field for a stacked bar', () => {
      const bounds = getFocusedItemBounds(
        mockBarView(),
        { category: 2, value: 10, value1: 42 },
        { dimension: 'category', metric: 'value', orientation: 'vertical', type: 'stacked' }
      );
      // y = value1*2 = 84, not value*2 = 20
      expect(bounds).toStrictEqual({ x1: 19, x2: 27, y1: 80, y2: 88 });
    });

    test('swaps dimension/metric onto y/x for a horizontal bar', () => {
      const bounds = getFocusedItemBounds(mockBarView(), { category: 2, value: 42 }, {
        dimension: 'category',
        metric: 'value',
        orientation: 'horizontal',
      });
      // dimension (band) now drives y, metric (linear) now drives x
      expect(bounds).toStrictEqual({ x1: 80, x2: 88, y1: 19, y2: 27 });
    });
  });
});

describe('getFocusedItemClientPosition()', () => {
  const container = document.createElement('div');
  beforeEach(() => {
    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 20,
      top: 30,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  test('combines container rect, view origin, and the scaled point', () => {
    const position = getFocusedItemClientPosition(mockView('xTime'), container, datum, fields);
    // clientX = 20 (rect.left) + 5 (origin) + 100 (scaled x) = 125
    // clientY = 30 (rect.top) + 7 (origin) + 84 (scaled y) = 121
    expect(position).toStrictEqual({ clientX: 125, clientY: 121 });
  });

  test('falls back to rect + origin only when the scale lookup fails', () => {
    const position = getFocusedItemClientPosition(mockView('xTime'), container, datum, { ...fields, scaleType: 'point' });
    expect(position).toStrictEqual({ clientX: 25, clientY: 37 });
  });
});
