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
import { Scene, SceneGroup, View, parse } from 'vega';

import { Datum } from '../types/index.js';
import { getAdaptiveLineHover } from './adaptiveHoverUtils.js';

const rows: Datum[] = [
  { id: 'a1', rscMarkId: 1, rscSeriesId: 'a', x: 10, y: 20 },
  { id: 'a2', rscMarkId: 2, rscSeriesId: 'a', x: 90, y: 30 },
  { id: 'b1', rscMarkId: 3, rscSeriesId: 'b', x: 20, y: 70 },
  { id: 'b2', rscMarkId: 4, rscSeriesId: 'b', x: 80, y: 60 },
];

const canvasContext = document.createElement('canvas').getContext('2d');
if (!canvasContext) throw new Error('Expected a mocked Canvas 2D context.');

describe('getAdaptiveLineHover()', () => {
  let view: View;
  let group: SceneGroup;
  let stroke: jest.SpyInstance;

  beforeEach(async () => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext);
    stroke = jest.spyOn(canvasContext, 'isPointInStroke').mockReset().mockReturnValue(false);
    view = new View(
      parse({
        width: 100,
        height: 100,
        data: [{ name: 'table', values: rows }],
        marks: [
          {
            name: 'line0_group',
            type: 'group',
            from: { facet: { name: 'series', data: 'table', groupby: 'rscSeriesId' } },
            marks: [
              {
                name: 'line0',
                type: 'line',
                from: { data: 'series' },
                encode: { update: { x: { field: 'x' }, y: { field: 'y' }, stroke: { value: 'blue' } } },
              },
            ],
          },
        ],
      }),
      { renderer: 'none' }
    );
    await view.runAsync();
    const scene: Scene & { root?: Scene } = view.scenegraph();
    if (!scene.root) throw new Error('Expected the Vega scenegraph root.');
    group = scene.root.items[0];
  });

  afterEach(() => {
    view.finalize();
    jest.restoreAllMocks();
  });

  test('uses the nearest date on the plot background and returns the eligible datum', () => {
    const eligible = rows.map((row) => ({ ...row, label: 'eligible' }));
    expect(getAdaptiveLineHover(group, 79, 45, 'line0', eligible, 'id')).toEqual({
      ...eligible[3],
      rscHoverTarget: 'dimension',
      rscHoverPoint: { x: 80, y: 60 },
    });
    expect(stroke).toHaveBeenCalledTimes(2);
  });

  test('prefers the hit curve over a closer date on another curve', () => {
    stroke.mockReturnValueOnce(true);
    expect(getAdaptiveLineHover(group, 79, 29, 'line0', rows, 'id')).toEqual({
      ...rows[1],
      rscHoverTarget: 'item',
      rscHoverPoint: { x: 90, y: 30 },
    });
    expect(stroke).toHaveBeenCalledWith(expect.any(Path2D), 79, 29);
    expect(canvasContext.lineWidth).toBe(8);
    expect(canvasContext.lineCap).toBe('round');
  });

  test('uses the last hit curve when curves overlap', () => {
    stroke.mockReturnValue(true);
    expect(getAdaptiveLineHover(group, 11, 20, 'line0', rows, 'id')).toMatchObject({
      id: 'b1',
      rscHoverTarget: 'item',
    });
  });

  test.each([undefined, null, ['a']] as const)('supports the primary series filter %p', (primarySeries) => {
    const selected = getAdaptiveLineHover(group, 79, 45, 'line0', rows, 'id', primarySeries && [...primarySeries]);
    expect(selected?.id).toBe(primarySeries ? 'a2' : 'b2');
  });

  test('excludes ineligible points and series even if their curve is hit', () => {
    stroke.mockReturnValue(true);
    expect(getAdaptiveLineHover(group, 79, 45, 'line0', [rows[0], rows[2]], 'id', ['a'])).toMatchObject({
      id: 'a1',
      rscHoverTarget: 'item',
    });
    expect(stroke).toHaveBeenCalledTimes(1);
    expect(getAdaptiveLineHover(group, 79, 45, 'line0', rows, 'id', [])).toBeNull();
    expect(getAdaptiveLineHover(group, 79, 45, 'line0', [], 'id')).toBeNull();
  });

  test.each([
    [-1, 50],
    [50, -1],
    [101, 50],
    [50, 101],
  ])('does not pick outside the plot at (%s, %s)', (x, y) => {
    expect(getAdaptiveLineHover(group, x, y, 'line0', rows, 'id')).toBeNull();
    expect(stroke).not.toHaveBeenCalled();
  });

  test.each([
    [0, 0],
    [100, 100],
  ])('allows picking at the plot boundary (%s, %s)', (x, y) => {
    expect(getAdaptiveLineHover(group, x, y, 'line0', rows, 'id')).not.toBeNull();
  });

  test('ignores missing groups, unrelated marks, empty lines, and points without data', () => {
    expect(getAdaptiveLineHover(group, 50, 50, 'missing', rows, 'id')).toBeNull();
    const facets = group.items[0].items;
    facets[0].items.push({ ...facets[0].items[0], name: 'unrelated' });
    facets[0].items[0].marktype = 'symbol';
    facets[1].items[0].items = [];
    expect(getAdaptiveLineHover(group, 50, 50, 'line0', rows, 'id')).toBeNull();
    facets[0].items[0].marktype = 'line';
    facets[0].items[0].items[0].datum = undefined;
    expect(getAdaptiveLineHover(group, 10, 20, 'line0', rows, 'id')).toMatchObject({ id: 'a2' });
  });

  test('reuses unchanged paths and rebuilds them when curve geometry changes', () => {
    getAdaptiveLineHover(group, 50, 50, 'line0', rows, 'id');
    const firstPath = stroke.mock.calls[0][0];
    getAdaptiveLineHover(group, 50, 50, 'line0', rows, 'id');
    expect(stroke.mock.calls[2][0]).toBe(firstPath);
    group.items[0].items[0].items[0].items[0].y += 10;
    getAdaptiveLineHover(group, 50, 50, 'line0', rows, 'id');
    expect(stroke.mock.calls[4][0]).not.toBe(firstPath);
  });

  test('fails explicitly when Canvas 2D is unavailable', () => {
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    jest.isolateModules(() => {
      const isolated = jest.requireActual<typeof import('./adaptiveHoverUtils.js')>('./adaptiveHoverUtils.js');
      expect(() => isolated.getAdaptiveLineHover(group, 50, 50, 'line0', rows, 'id')).toThrow(
        'Adaptive Line hover requires a Canvas 2D context and Path2D.'
      );
    });
  });

  test.each([undefined, {}, { line: undefined }, { line: { attr: null } }])(
    'fails explicitly when the Vega line renderer is unavailable: %p',
    (registry) => {
      jest.isolateModules(() => {
        const runtime = jest.requireActual<typeof import('vega') & { Marks?: unknown }>('vega');
        jest.replaceProperty(runtime, 'Marks', registry);
        const isolated = jest.requireActual<typeof import('./adaptiveHoverUtils.js')>('./adaptiveHoverUtils.js');
        expect(() => isolated.getAdaptiveLineHover(group, 50, 50, 'line0', rows, 'id')).toThrow(
          'Adaptive Line hover requires the Vega line renderer.'
        );
      });
    }
  );
});
