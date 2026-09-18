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

import { clearAxisFocusRing, getVisibleAxisLabelColumns, setAxisFocusRing } from './axisLabelGeometry';

interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface FakeGroup {
  x?: number;
  y?: number;
  orient?: string;
  mark?: { group?: FakeGroup };
}

interface FakeLabelItem {
  opacity?: number;
  datum?: { value?: unknown };
  bounds?: Bounds;
  mark?: { group?: FakeGroup };
}

/** A bottom-axis `text`/`axis-label` scenegraph node, matching what `collectAxisLabelItems()` walks. */
const axisLabelNode = (orient: string, items: FakeLabelItem[]) => ({
  marktype: 'text',
  role: 'axis-label',
  // `orient` must survive even when an item supplies its own `mark.group` (e.g. a nested owning-group
  // chain) — merge it in rather than letting the item's own `mark` field replace the default outright.
  items: items.map((item) => ({ ...item, mark: { group: { orient, ...item.mark?.group } } })),
});

const mockView = (
  nodes: ReturnType<typeof axisLabelNode>[],
  origin: [number, number] = [0, 0]
): View =>
  ({
    origin: jest.fn().mockReturnValue(origin),
    scenegraph: () => ({ root: { items: nodes } }),
  }) as unknown as View;

const mockContainer = (rect: { left: number; top: number }): HTMLElement => {
  const container = document.createElement('div');
  jest.spyOn(container, 'getBoundingClientRect').mockReturnValue(rect as DOMRect);
  return container;
};

describe('getVisibleAxisLabelColumns()', () => {
  test('returns each visible label as its own column, in axis order', () => {
    const view = mockView([
      axisLabelNode('bottom', [
        { datum: { value: 'Chrome' }, bounds: { x1: 50, y1: 0, x2: 90, y2: 10 } },
        { datum: { value: 'Firefox' }, bounds: { x1: 0, y1: 0, x2: 40, y2: 10 } },
      ]),
    ]);
    const container = mockContainer({ left: 0, top: 0 });

    const columns = getVisibleAxisLabelColumns(view, container, 'bottom');

    expect(columns.map((c) => c.value)).toEqual(['Firefox', 'Chrome']);
  });

  test('excludes overlap-hidden labels (opacity 0)', () => {
    const view = mockView([
      axisLabelNode('bottom', [
        { opacity: 0, datum: { value: 'Hidden' }, bounds: { x1: 0, y1: 0, x2: 10, y2: 10 } },
        { opacity: 1, datum: { value: 'Visible' }, bounds: { x1: 20, y1: 0, x2: 30, y2: 10 } },
      ]),
    ]);
    const container = mockContainer({ left: 0, top: 0 });

    const columns = getVisibleAxisLabelColumns(view, container, 'bottom');

    expect(columns.map((c) => c.value)).toEqual(['Visible']);
  });

  test('excludes labels belonging to a different orient', () => {
    const view = mockView([
      axisLabelNode('bottom', [{ datum: { value: 'Bottom' }, bounds: { x1: 0, y1: 0, x2: 10, y2: 10 } }]),
      axisLabelNode('top', [{ datum: { value: 'Top' }, bounds: { x1: 0, y1: 0, x2: 10, y2: 10 } }]),
    ]);
    const container = mockContainer({ left: 0, top: 0 });

    const columns = getVisibleAxisLabelColumns(view, container, 'bottom');

    expect(columns.map((c) => c.value)).toEqual(['Bottom']);
  });

  test('unions a primary label with its sublabel at the same tick, keeping the primary row\'s value', () => {
    const view = mockView([
      axisLabelNode('bottom', [
        { datum: { value: 'Jan' }, bounds: { x1: 0, y1: 0, x2: 20, y2: 10 } },
        { datum: { value: '2024' }, bounds: { x1: 2, y1: 15, x2: 18, y2: 25 } },
      ]),
    ]);
    const container = mockContainer({ left: 0, top: 0 });

    const columns = getVisibleAxisLabelColumns(view, container, 'bottom');

    expect(columns).toEqual([{ value: 'Jan', bounds: { x1: 0, y1: 0, x2: 20, y2: 25 } }]);
  });

  test('adopts a later-seen row as the primary value when it starts higher up than the first-seen row', () => {
    // Sublabel scanned first this time — the primary row is only discovered on the second pass.
    const view = mockView([
      axisLabelNode('bottom', [
        { datum: { value: '2024' }, bounds: { x1: 2, y1: 15, x2: 18, y2: 25 } },
        { datum: { value: 'Jan' }, bounds: { x1: 0, y1: 0, x2: 20, y2: 10 } },
      ]),
    ]);
    const container = mockContainer({ left: 0, top: 0 });

    const columns = getVisibleAxisLabelColumns(view, container, 'bottom');

    expect(columns).toEqual([{ value: 'Jan', bounds: { x1: 0, y1: 0, x2: 20, y2: 25 } }]);
  });

  test('groups by y (not x) for a vertical (left/right) orient', () => {
    const view = mockView([
      axisLabelNode('left', [
        { datum: { value: 'High' }, bounds: { x1: 0, y1: 0, x2: 30, y2: 10 } },
        { datum: { value: 'Low' }, bounds: { x1: 0, y1: 50, x2: 30, y2: 60 } },
      ]),
    ]);
    const container = mockContainer({ left: 0, top: 0 });

    const columns = getVisibleAxisLabelColumns(view, container, 'left');

    expect(columns.map((c) => c.value)).toEqual(['High', 'Low']);
  });

  test('accumulates offsets through a nested owning-group chain', () => {
    const view = mockView([
      axisLabelNode('bottom', [
        {
          datum: { value: 'Chrome' },
          bounds: { x1: 0, y1: 0, x2: 10, y2: 10 },
          mark: { group: { x: 10, y: 20, mark: { group: { x: 100, y: 200 } } } },
        },
      ]),
    ]);
    const container = mockContainer({ left: 0, top: 0 });

    const columns = getVisibleAxisLabelColumns(view, container, 'bottom');

    expect(columns[0].bounds).toEqual({ x1: 110, y1: 220, x2: 120, y2: 230 });
  });

  test('adds the view origin and the container\'s own page position', () => {
    const view = mockView(
      [axisLabelNode('bottom', [{ datum: { value: 'Chrome' }, bounds: { x1: 0, y1: 0, x2: 10, y2: 10 } }])],
      [50, 60]
    );
    const container = mockContainer({ left: 1000, top: 2000 });

    const columns = getVisibleAxisLabelColumns(view, container, 'bottom');

    expect(columns[0].bounds).toEqual({ x1: 1050, y1: 2060, x2: 1060, y2: 2070 });
  });
});

describe('setAxisFocusRing()', () => {
  test('pads the ring symmetrically around the label bounds, uncapped by any surrounding content', () => {
    const element = document.createElement('div');

    setAxisFocusRing(element, { x1: 350, y1: 20, x2: 620, y2: 40 });

    expect(element.style.display).toBe('block');
    expect(element.style.left).toBe('344px');
    expect(element.style.width).toBe('282px');
    expect(element.style.height).toBe('32px');
  });

  test('clears the ring for an inverted (malformed) box', () => {
    const element = document.createElement('div');

    setAxisFocusRing(element, { x1: 100, y1: 100, x2: 0, y2: 0 });

    expect(element.style.display).toBe('none');
  });
});

describe('clearAxisFocusRing()', () => {
  test('hides the element', () => {
    const element = document.createElement('div');
    element.style.display = 'block';

    clearAxisFocusRing(element);

    expect(element.style.display).toBe('none');
  });

  test('does nothing when the element is undefined', () => {
    expect(() => clearAxisFocusRing(undefined)).not.toThrow();
  });
});
