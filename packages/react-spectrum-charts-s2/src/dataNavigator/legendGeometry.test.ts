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

import { Bounds } from './axisLabelGeometry';
import { findLegendNeighbor, getLegendBounds, getLegendEntries } from './legendGeometry';

/** Entries laid out on a grid of `columns` columns, each 40x10 with 10px gaps, in reading order. */
const grid = (values: string[], columns: number, byColumn = false) =>
  values.map((value, index) => {
    const row = byColumn ? index % Math.ceil(values.length / columns) : Math.floor(index / columns);
    const column = byColumn ? Math.floor(index / Math.ceil(values.length / columns)) : index % columns;
    const bounds: Bounds = { x1: column * 50, y1: row * 20, x2: column * 50 + 40, y2: row * 20 + 10 };
    return { value, bounds };
  });

describe('findLegendNeighbor()', () => {
  describe('single row', () => {
    const entries = grid(['A', 'B', 'C'], 3);

    test('left/right walk entries in order', () => {
      expect(findLegendNeighbor(entries, 'A', 'ArrowRight')).toBe('B');
      expect(findLegendNeighbor(entries, 'B', 'ArrowLeft')).toBe('A');
    });

    test('up/down do nothing, since there is no other row', () => {
      expect(findLegendNeighbor(entries, 'A', 'ArrowDown')).toBeUndefined();
      expect(findLegendNeighbor(entries, 'C', 'ArrowUp')).toBeUndefined();
    });

    test('does not wrap around at either end', () => {
      expect(findLegendNeighbor(entries, 'A', 'ArrowLeft')).toBeUndefined();
      expect(findLegendNeighbor(entries, 'C', 'ArrowRight')).toBeUndefined();
    });
  });

  describe('single column (left/right legend, or a narrow top/bottom one)', () => {
    const entries = grid(['A', 'B', 'C'], 1);

    test('up/down walk entries top to bottom', () => {
      expect(findLegendNeighbor(entries, 'A', 'ArrowDown')).toBe('B');
      expect(findLegendNeighbor(entries, 'C', 'ArrowUp')).toBe('B');
    });

    test('left/right do nothing, since there is no other column', () => {
      expect(findLegendNeighbor(entries, 'A', 'ArrowRight')).toBeUndefined();
      expect(findLegendNeighbor(entries, 'B', 'ArrowLeft')).toBeUndefined();
    });
  });

  test('a legend laid out in rows walks with left/right regardless of its position', () => {
    // e.g. a right legend Vega laid out as a row-filled grid.
    const entries = grid(['A', 'B', 'C', 'D'], 2);
    expect(findLegendNeighbor(entries, 'B', 'ArrowRight')).toBe('C');
    expect(findLegendNeighbor(entries, 'A', 'ArrowDown')).toBe('C');
  });

  describe('wrapped rows', () => {
    // A B C
    // D E
    const entries = grid(['A', 'B', 'C', 'D', 'E'], 3);

    test('left/right follow reading order, wrapping onto the next row', () => {
      expect(findLegendNeighbor(entries, 'C', 'ArrowRight')).toBe('D');
      expect(findLegendNeighbor(entries, 'D', 'ArrowLeft')).toBe('C');
    });

    test('up/down move to the entry directly above/below', () => {
      expect(findLegendNeighbor(entries, 'B', 'ArrowDown')).toBe('E');
      expect(findLegendNeighbor(entries, 'E', 'ArrowUp')).toBe('B');
    });

    test('down does nothing when the next row has no entry below', () => {
      expect(findLegendNeighbor(entries, 'C', 'ArrowDown')).toBeUndefined();
    });

    test('up/down stop at the first/last row', () => {
      expect(findLegendNeighbor(entries, 'A', 'ArrowUp')).toBeUndefined();
      expect(findLegendNeighbor(entries, 'D', 'ArrowDown')).toBeUndefined();
    });
  });

  describe('wrapped columns (entries filled column by column)', () => {
    // A D
    // B E
    // C
    const entries = grid(['A', 'B', 'C', 'D', 'E'], 2, true);

    test('up/down follow reading order down each column, wrapping onto the next column', () => {
      expect(findLegendNeighbor(entries, 'C', 'ArrowDown')).toBe('D');
      expect(findLegendNeighbor(entries, 'D', 'ArrowUp')).toBe('C');
    });

    test('left/right move to the nearest entry in the adjacent column', () => {
      expect(findLegendNeighbor(entries, 'B', 'ArrowRight')).toBe('E');
      expect(findLegendNeighbor(entries, 'E', 'ArrowLeft')).toBe('B');
      expect(findLegendNeighbor(entries, 'A', 'ArrowLeft')).toBeUndefined();
    });

    test('right does nothing when the next column has no entry beside it', () => {
      expect(findLegendNeighbor(entries, 'C', 'ArrowRight')).toBeUndefined();
    });
  });

  test('tolerates sub-pixel misalignment within a row', () => {
    const entries = [
      { value: 'A', bounds: { x1: 0, y1: 0, x2: 40, y2: 10 } },
      { value: 'B', bounds: { x1: 50, y1: 0.5, x2: 90, y2: 10.5 } },
    ];
    expect(findLegendNeighbor(entries, 'A', 'ArrowRight')).toBe('B');
    expect(findLegendNeighbor(entries, 'A', 'ArrowDown')).toBeUndefined();
  });

  test('returns undefined for a value that is not rendered', () => {
    expect(findLegendNeighbor(grid(['A'], 1), 'Z', 'ArrowRight')).toBeUndefined();
  });
});

interface FakeEntry {
  value?: string;
  bounds?: Bounds;
}

/** Vega's legend scene: legend item → `legend-entry` container mark/item → per-entry group mark → one group per entry. */
const legendScene = (name: string | undefined, entries: FakeEntry[]) => {
  const legendItem = { x: 100, y: 200, bounds: { x1: 0, y1: 0, x2: 300, y2: 40 } };
  const container: Record<string, unknown> = { x: 0, y: 0, mark: { role: 'legend-entry', group: legendItem } };
  const entriesMark = { marktype: 'group', role: 'scope', name, group: container, items: [] as unknown[] };
  entriesMark.items = entries.map(({ value, bounds }) => ({
    datum: { index: 0 },
    bounds,
    mark: { role: 'scope', name, group: container },
    items: [{ marktype: 'symbol', role: 'legend-symbol', items: [{ datum: { value } }] }],
  }));
  container.items = [entriesMark];
  return { marktype: 'group', role: 'legend', items: [{ ...legendItem, items: [{ marktype: 'group', role: 'legend-entry', items: [container] }] }] };
};

const mockView = (marks: unknown[]): View =>
  ({
    origin: () => [0, 0],
    scenegraph: () => ({ root: { items: [{ marktype: 'group', items: marks }] } }),
  }) as unknown as View;

const mockContainer = (): HTMLElement => {
  const container = document.createElement('div');
  jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({ left: 10, top: 20 } as DOMRect);
  return container;
};

describe('getLegendEntries()', () => {
  test('reads each entry value and page-absolute bounds in render order', () => {
    const view = mockView([
      legendScene('legend0_legendEntry', [
        { value: 'Windows', bounds: { x1: 0, y1: 0, x2: 40, y2: 10 } },
        { value: 'Mac', bounds: { x1: 50, y1: 0, x2: 90, y2: 10 } },
      ]),
    ]);

    const entries = getLegendEntries(view, mockContainer(), 'legend0');

    expect(entries.map((entry) => entry.value)).toEqual(['Windows', 'Mac']);
    // Container (10, 20) + legend group offset (100, 200).
    expect(entries[1].bounds).toEqual({ x1: 160, y1: 220, x2: 200, y2: 230 });
  });

  test('skips entries without a value', () => {
    const view = mockView([legendScene(undefined, [{ bounds: { x1: 0, y1: 0, x2: 1, y2: 1 } }, { value: 'Linux', bounds: { x1: 0, y1: 0, x2: 1, y2: 1 } }])]);

    expect(getLegendEntries(view, mockContainer()).map((entry) => entry.value)).toEqual(['Linux']);
  });

  test('prefers the named legend over other legends', () => {
    const view = mockView([
      legendScene('legend1_legendEntry', [{ value: 'Other', bounds: { x1: 0, y1: 0, x2: 1, y2: 1 } }]),
      legendScene('legend0_legendEntry', [{ value: 'Mine', bounds: { x1: 0, y1: 0, x2: 1, y2: 1 } }]),
    ]);

    expect(getLegendEntries(view, mockContainer(), 'legend0').map((entry) => entry.value)).toEqual(['Mine']);
  });

  test('returns no entries when no legend is rendered', () => {
    expect(getLegendEntries(mockView([]), mockContainer(), 'legend0')).toEqual([]);
  });
});

describe('getLegendBounds()', () => {
  test("uses the legend group's own bounds (title included)", () => {
    const view = mockView([legendScene('legend0_legendEntry', [{ value: 'A', bounds: { x1: 0, y1: 0, x2: 1, y2: 1 } }])]);

    expect(getLegendBounds(view, mockContainer(), 'legend0')).toEqual({ x1: 10, y1: 20, x2: 310, y2: 60 });
  });

  test('is undefined when no legend is rendered', () => {
    expect(getLegendBounds(mockView([]), mockContainer(), 'legend0')).toBeUndefined();
  });
});
