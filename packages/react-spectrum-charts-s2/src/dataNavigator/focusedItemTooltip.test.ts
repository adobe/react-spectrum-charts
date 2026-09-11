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

import { MARK_ID } from '@spectrum-charts/constants';

import {
  findFocusedBarSceneItem,
  findFocusedDimensionAreaSceneItem,
  hideFocusedItemTooltip,
  showFocusedItemTooltip,
} from './focusedItemTooltip';

const MARK_NAME = 'bar0';
const RING_NAME = `${MARK_NAME}_focusRing`;

let tooltipCallback: jest.Mock;
let container: HTMLElement;

/** Builds a fake View exposing `tooltip()` as a getter (real vega-view behavior) and a scenegraph
 *  containing one `${markName}_focusRing` rect mark with the given rendered items. */
const mockView = (ringItems: object[] = [], origin: [number, number] = [0, 0]) => {
  tooltipCallback = jest.fn();
  return {
    tooltip: jest.fn().mockReturnValue(tooltipCallback),
    scenegraph: () => ({
      root: { items: [{ marktype: 'rect', name: RING_NAME, items: ringItems }] },
    }),
    origin: jest.fn().mockReturnValue(origin),
  } as unknown as View;
};

beforeEach(() => {
  container = document.createElement('div');
  jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0 } as DOMRect);
});

describe('showFocusedItemTooltip()', () => {
  test('does nothing when the view has no registered tooltip callback', () => {
    const view = { tooltip: jest.fn().mockReturnValue(undefined) } as unknown as View;
    expect(() => showFocusedItemTooltip(container, view, MARK_NAME, { value: 1 })).not.toThrow();
  });

  test('hides (calls with a null value) when the given value is null', () => {
    const view = mockView([{ opacity: 1, bounds: { x1: 0, y1: 0, x2: 10, y2: 10 } }]);
    showFocusedItemTooltip(container, view, MARK_NAME, null);
    expect(tooltipCallback).toHaveBeenCalledWith(undefined, undefined, undefined, null);
  });

  test('hides when no ring item is currently visible, even with a real value', () => {
    const view = mockView([]);
    showFocusedItemTooltip(container, view, MARK_NAME, { value: 1 });
    expect(tooltipCallback).toHaveBeenCalledWith(undefined, undefined, undefined, null);
  });

  test('hides when every ring item has zero opacity', () => {
    const view = mockView([{ opacity: 0, bounds: { x1: 0, y1: 0, x2: 10, y2: 10 } }]);
    showFocusedItemTooltip(container, view, MARK_NAME, { value: 1 });
    expect(tooltipCallback).toHaveBeenCalledWith(undefined, undefined, undefined, null);
  });

  test('triggers the real callback with the visible ring item and the given value', () => {
    const ringItem = { opacity: 1, bounds: { x1: 10, y1: 20, x2: 30, y2: 40 } };
    const view = mockView([ringItem]);
    const value = { browser: 'Chrome', rscComponentName: MARK_NAME };
    showFocusedItemTooltip(container, view, MARK_NAME, value);

    expect(tooltipCallback).toHaveBeenCalledTimes(1);
    const [handler, event, item, calledValue] = tooltipCallback.mock.calls[0];
    expect(calledValue).toBe(value);
    expect(item).toBe(ringItem);
    expect(handler).toMatchObject({ _el: container, _origin: [0, 0] });
    expect(event).toMatchObject({ clientX: 20, clientY: 20 });
  });

  test('adds the view origin and the container\'s page offset to the synthetic event position', () => {
    const ringItem = { opacity: 1, bounds: { x1: 10, y1: 20, x2: 30, y2: 40 } };
    const view = mockView([ringItem], [5, 6]);
    jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 200 } as DOMRect);
    showFocusedItemTooltip(container, view, MARK_NAME, { value: 1 });

    const [, event] = tooltipCallback.mock.calls[0];
    expect(event).toMatchObject({ clientX: 100 + 5 + 20, clientY: 200 + 6 + 20 });
  });

  test('adds the owning group\'s offset to the ring item\'s own (group-relative) bounds', () => {
    const ringItem = { opacity: 1, bounds: { x1: 10, y1: 20, x2: 30, y2: 40 }, mark: { group: { x: 100, y: 200 } } };
    const view = mockView([ringItem]);
    showFocusedItemTooltip(container, view, MARK_NAME, { value: 1 });

    // group-relative bounds {x1:10,y1:20,x2:30,y2:40} + group offset {x:100,y:200} = {x1:110,y1:220,x2:130,y2:240};
    // containerRect/origin are both zero in this test, so clientX/clientY are just those bounds.
    const [, event] = tooltipCallback.mock.calls[0];
    expect(event).toMatchObject({ clientX: 120, clientY: 220 });
  });
});

describe('hideFocusedItemTooltip()', () => {
  test('does nothing when there is no view', () => {
    expect(() => hideFocusedItemTooltip(undefined)).not.toThrow();
  });

  test('calls the registered callback with a null value', () => {
    const view = mockView();
    hideFocusedItemTooltip(view);
    expect(tooltipCallback).toHaveBeenCalledWith(undefined, undefined, undefined, null);
  });
});

describe('findFocusedBarSceneItem()', () => {
  const mockBarView = (items: { datum: Record<string, unknown> }[]) =>
    ({
      scenegraph: () => ({ root: { items: [{ marktype: 'rect', name: MARK_NAME, items }] } }),
    }) as unknown as View;

  test('finds the rendered bar item whose datum carries the given MARK_ID', () => {
    const match = { datum: { browser: 'Chrome', [MARK_ID]: 1 } };
    const view = mockBarView([{ datum: { browser: 'Firefox', [MARK_ID]: 0 } }, match]);

    expect(findFocusedBarSceneItem(view, MARK_NAME, 1)).toBe(match);
  });

  test('returns undefined when no rendered item matches the given MARK_ID', () => {
    const view = mockBarView([{ datum: { browser: 'Chrome', [MARK_ID]: 0 } }]);

    expect(findFocusedBarSceneItem(view, MARK_NAME, 99)).toBeUndefined();
  });
});

describe('findFocusedDimensionAreaSceneItem()', () => {
  const DIMENSION_AREA_NAME = `${MARK_NAME}_dimensionHoverArea`;

  const mockDimensionAreaView = (items: { datum: Record<string, unknown> }[]) =>
    ({
      scenegraph: () => ({ root: { items: [{ marktype: 'rect', name: DIMENSION_AREA_NAME, items }] } }),
    }) as unknown as View;

  test('finds the rendered dimension-area item whose datum carries the given dimension value', () => {
    const match = { datum: { browser: 'Chrome' } };
    const view = mockDimensionAreaView([{ datum: { browser: 'Firefox' } }, match]);

    expect(findFocusedDimensionAreaSceneItem(view, MARK_NAME, 'browser', 'Chrome')).toBe(match);
  });

  test('returns undefined when no rendered item matches the given dimension value', () => {
    const view = mockDimensionAreaView([{ datum: { browser: 'Firefox' } }]);

    expect(findFocusedDimensionAreaSceneItem(view, MARK_NAME, 'browser', 'Chrome')).toBeUndefined();
  });
});
