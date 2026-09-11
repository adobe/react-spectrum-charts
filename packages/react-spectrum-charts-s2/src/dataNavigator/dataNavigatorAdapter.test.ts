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
import { RefObject } from 'react';

import { fireEvent } from '@testing-library/react';
import { View } from 'vega';

import {
  COMPONENT_NAME,
  DIMENSION_HOVER_AREA,
  FOCUSED_DIMENSION,
  FOCUSED_ITEM,
  FOCUSED_REGION,
  MARK_ID,
} from '@spectrum-charts/constants';
import { Datum, MarkBounds } from '@spectrum-charts/vega-spec-builder-s2';

import { getItemBounds, triggerPopover } from '../utils/markClickUtils';
import { NavigableChartType } from './buildChartStructure';
import { attachDataNavigator } from './dataNavigatorAdapter';

jest.mock('../utils/markClickUtils', () => ({
  ...jest.requireActual('../utils/markClickUtils'),
  // Defaults to a real button existing (matches a chart with a ChartPopover configured); override
  // per-test with mockReturnValueOnce(false) to simulate no popover being configured.
  triggerPopover: jest.fn(() => true),
  getItemBounds: jest.fn(() => ({ x1: 1, y1: 2, x2: 3, y2: 4 })),
}));

const data = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
  { browser: 'Safari', downloads: 4000 },
];

const stackedData = [
  { browser: 'Chrome', os: 'Windows', downloads: 18000 },
  { browser: 'Chrome', os: 'Mac', downloads: 9000 },
  { browser: 'Firefox', os: 'Windows', downloads: 5000 },
  { browser: 'Firefox', os: 'Mac', downloads: 3000 },
];

let container: HTMLElement;
let signal: jest.Mock;
let view: View;
let tooltipCallback: jest.Mock;
// The one rendered `bar0_focusRing`/`bar0_stackFocusRing` instance; tests flip opacity/bounds to simulate it becoming visible.
let ringItem: { opacity: number; bounds?: { x1: number; y1: number; x2: number; y2: number } };
let stackRingItem: { opacity: number; bounds?: { x1: number; y1: number; x2: number; y2: number } };
// The rendered `bar0` rect items themselves (not their focus ring) — Space-triggered popovers
// anchor to these, matched by MARK_ID, the same as a real click would.
let barItems: { datum: Record<string, unknown> }[];

const mockView = () => {
  const values: Record<string, unknown> = {};
  signal = jest.fn((name: string, ...rest: unknown[]) => {
    if (rest.length === 0) return values[name];
    values[name] = rest[0];
  });
  ringItem = { opacity: 0 };
  stackRingItem = { opacity: 0 };
  barItems = [];
  tooltipCallback = jest.fn();
  return {
    signal,
    runAsync: jest.fn().mockResolvedValue(undefined),
    origin: jest.fn().mockReturnValue([0, 0]),
    data: jest.fn().mockReturnValue([]),
    // Real vega-view's tooltip() is a getter when called with no args — see focusedItemTooltip.ts.
    tooltip: jest.fn().mockReturnValue(tooltipCallback),
    scenegraph: () => ({
      root: {
        items: [
          { marktype: 'rect', name: 'bar0_focusRing', items: [ringItem] },
          { marktype: 'rect', name: 'bar0_stackFocusRing', items: [stackRingItem] },
          { marktype: 'rect', name: 'bar0', items: barItems },
        ],
      },
    }),
  } as unknown as View;
};

/** Populates the fake `bar0` rect mark's rendered items for `findFocusedBarSceneItem` to match against. */
const setBarItems = (rows: Record<string, unknown>[]): void => {
  barItems.length = 0;
  barItems.push(...rows.map((datum) => ({ datum })));
};

/** The last non-null value the fake tooltip callback was triggered with, if any. */
const lastTooltipValue = (): unknown => {
  const call = [...tooltipCallback.mock.calls].reverse().find(([, , , value]) => value != null);
  return call?.[3];
};

const setRingBounds = (bounds: { x1: number; y1: number; x2: number; y2: number }): void => {
  ringItem.opacity = 1;
  ringItem.bounds = bounds;
};

const setStackRingBounds = (bounds: { x1: number; y1: number; x2: number; y2: number }): void => {
  stackRingItem.opacity = 1;
  stackRingItem.bounds = bounds;
};

const signaledWith = (name: string, value: unknown): boolean =>
  signal.mock.calls.some(([n, v]) => n === name && v === value);

const entryButton = (): HTMLButtonElement => container.querySelector('button') as HTMLButtonElement;
// data-navigator renders exactly one node element (class `dn-node`) at a time; it carries the
// keydown listener. jsdom does not reliably track activeElement for it, so target it directly.
const focused = (): HTMLElement => container.querySelector('.dn-node') as HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  view = mockView();
  (triggerPopover as jest.Mock).mockClear();
  (getItemBounds as jest.Mock).mockClear();
});

afterEach(() => {
  container.remove();
});

describe('attachDataNavigator()', () => {
  const attach = (overrides = {}) =>
    attachDataNavigator({
      container,
      chartType: 'bar',
      data,
      dimension: 'browser',
      chartId: 'test-chart',
      getView: () => view,
      ...overrides,
    });

  test('renders an entry button into the container', () => {
    attach();
    expect(entryButton()).toBeTruthy();
  });

  test('does nothing for an unsupported chart type', () => {
    attach({ chartType: 'pie' as unknown as NavigableChartType });
    expect(entryButton()).toBeFalsy();
    expect(signal).not.toHaveBeenCalled();
  });

  test('namespaces the container id when one is not already set', () => {
    attach();
    expect(container.id).toBe('dn-root-test-chart');
  });

  test('leaves an existing container id untouched', () => {
    container.id = 'preset-id';
    attach();
    expect(container.id).toBe('preset-id');
  });

  test('entering the navigation focuses the chart region', () => {
    attach();
    entryButton().click();
    expect(signaledWith(FOCUSED_REGION, 'chart')).toBe(true);
  });

  test('does not throw when there is no live view to signal', () => {
    attach({ getView: () => undefined });
    expect(() => entryButton().click()).not.toThrow();
  });

  test('drilling in and arrowing focuses individual bars', () => {
    attach();
    entryButton().click();

    // data-navigator's keydownValidator matches on event.code, not event.key.
    fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
    const itemCall = signal.mock.calls.find(([n, v]) => n === FOCUSED_ITEM && v !== null);
    expect(itemCall).toBeDefined();

    signal.mockClear();
    fireEvent.keyDown(focused(), { key: 'ArrowRight', code: 'ArrowRight' });
    expect(signal.mock.calls.some(([n, v]) => n === FOCUSED_ITEM && v !== null)).toBe(true);
  });

  test('drilling into a bar triggers the real tooltip callback with a non-null value', async () => {
    (view.data as jest.Mock).mockReturnValue(data);
    attach({ markName: 'bar0' });
    setRingBounds({ x1: 10, y1: 20, x2: 30, y2: 40 });
    entryButton().click();
    fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
    await Promise.resolve(); // flush the .then() chained after view.runAsync()

    expect(lastTooltipValue()).not.toBeUndefined();
  });

  test('does not trigger the tooltip while focused on the chart root (not a leaf)', async () => {
    attach();
    setRingBounds({ x1: 10, y1: 20, x2: 30, y2: 40 });
    entryButton().click();
    await Promise.resolve();

    expect(lastTooltipValue()).toBeUndefined();
  });

  test('Escape hides the tooltip (calls it with null) along with clearing focus', async () => {
    (view.data as jest.Mock).mockReturnValue(data);
    attach({ markName: 'bar0' });
    setRingBounds({ x1: 10, y1: 20, x2: 30, y2: 40 });
    entryButton().click();
    fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
    await Promise.resolve();
    expect(lastTooltipValue()).not.toBeUndefined();

    tooltipCallback.mockClear();
    fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' });
    expect(tooltipCallback).toHaveBeenCalledWith(undefined, undefined, undefined, null);
  });

  test('ArrowDown moves to the next bar, the same as ArrowRight', () => {
    attach();
    entryButton().click();
    fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
    const firstItem = signal.mock.calls.find(([n, v]) => n === FOCUSED_ITEM && v !== null)?.[1];

    signal.mockClear();
    fireEvent.keyDown(focused(), { key: 'ArrowDown', code: 'ArrowDown' });
    const nextItem = signal.mock.calls.find(([n, v]) => n === FOCUSED_ITEM && v !== null)?.[1];
    expect(nextItem).toBeDefined();
    expect(nextItem).not.toBe(firstItem);
  });

  test('ArrowUp moves to the previous bar, the same as ArrowLeft', () => {
    attach();
    entryButton().click();
    fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
    signal.mockClear();
    fireEvent.keyDown(focused(), { key: 'ArrowRight', code: 'ArrowRight' });
    const secondItem = signal.mock.calls.find(([n, v]) => n === FOCUSED_ITEM && v !== null)?.[1];

    signal.mockClear();
    fireEvent.keyDown(focused(), { key: 'ArrowUp', code: 'ArrowUp' });
    const previousItem = signal.mock.calls.find(([n, v]) => n === FOCUSED_ITEM && v !== null)?.[1];
    expect(previousItem).toBeDefined();
    expect(previousItem).not.toBe(secondItem);
  });

  test('Escape at the chart root drills out and clears focus', () => {
    attach();
    entryButton().click();
    // entry focuses the chart root, which is also the entry point, so Escape exits.
    expect(focused()).toBeTruthy();

    signal.mockClear();
    fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' });

    // the focused node is removed on drill-out and every focus signal is cleared
    expect(focused()).toBeNull();
    expect(signaledWith(FOCUSED_REGION, null)).toBe(true);
    expect(signaledWith(FOCUSED_ITEM, null)).toBe(true);
  });

  test('focus leaving the widget (tab/click away) clears focus and removes the node', () => {
    attach();
    entryButton().click();
    expect(focused()).toBeTruthy();

    signal.mockClear();
    // relatedTarget outside the container === focus left the navigator entirely.
    fireEvent.focusOut(focused(), { relatedTarget: document.body });

    expect(focused()).toBeNull();
    expect(signaledWith(FOCUSED_REGION, null)).toBe(true);
  });

  test('focus moving within the widget does not clear (relatedTarget stays inside)', () => {
    attach();
    entryButton().click();
    fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' }); // drill to a bar

    signal.mockClear();
    // A focusout whose relatedTarget is still inside the container is an internal move, not a leave.
    const insideTarget = focused();
    fireEvent.focusOut(focused(), { relatedTarget: insideTarget });
    expect(focused()).not.toBeNull();
    expect(signaledWith(FOCUSED_REGION, null)).toBe(false);
    expect(signaledWith(FOCUSED_ITEM, null)).toBe(false);
  });

  describe('entry button tab order (Shift+Tab should leave the widget, not land back on it)', () => {
    test('removes the entry button from tab order once a bar is focused', () => {
      attach();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' }); // drill to a bar

      expect(entryButton().tabIndex).toBe(-1);
    });

    test('restores the entry button to tab order once focus leaves the widget', () => {
      attach();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

      // relatedTarget outside the container === focus left the navigator entirely (e.g. Shift+Tab).
      fireEvent.focusOut(focused(), { relatedTarget: document.body });

      expect(entryButton().tabIndex).toBe(0);
    });

    test('leaves the entry button tabbable while focus stays inside (an internal move)', () => {
      attach();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

      const insideTarget = focused();
      fireEvent.focusOut(focused(), { relatedTarget: insideTarget });

      expect(entryButton().tabIndex).toBe(-1);
    });
  });

  describe('stacked bars (series present)', () => {
    const attachStacked = () =>
      attachDataNavigator({
        container,
        chartType: 'bar',
        data: stackedData,
        dimension: 'browser',
        color: 'os',
        chartId: 'stacked-chart',
        getView: () => view,
      });

    test('drilling into a stack focuses the dimension group, then a segment', () => {
      attachStacked();
      entryButton().click();
      expect(signaledWith(FOCUSED_REGION, 'chart')).toBe(true);

      // Enter the chart root → a per-column stack (dimension group).
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
      const dimensionCall = signal.mock.calls.find(([n, v]) => n === FOCUSED_DIMENSION && v !== null);
      expect(dimensionCall).toBeDefined();

      // Enter the stack → an individual segment.
      signal.mockClear();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
      expect(signal.mock.calls.some(([n, v]) => n === FOCUSED_ITEM && v !== null)).toBe(true);
    });

    test('drilling into a stack (not yet a segment) triggers the dimension-area tooltip', async () => {
      const stackRows = [
        { browser: 'Chrome', min_value1: 0, max_value1: 27000 },
        { browser: 'Firefox', min_value1: 0, max_value1: 13000 },
      ];
      (view.data as jest.Mock).mockImplementation((name: string) => (name === 'bar0_stacks' ? stackRows : []));
      setStackRingBounds({ x1: 0, y1: 0, x2: 10, y2: 10 });

      attachDataNavigator({
        container,
        chartType: 'bar',
        data: stackedData,
        dimension: 'browser',
        color: 'os',
        markName: 'bar0',
        chartId: 'stacked-tooltip-chart',
        getView: () => view,
      });

      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' }); // drill into the first stack
      await Promise.resolve();

      expect(lastTooltipValue()).toMatchObject({
        browser: 'Chrome',
        [COMPONENT_NAME]: `bar0_${DIMENSION_HOVER_AREA}`,
        dimension: 'browser',
      });
    });
  });

  describe('mouse-hover parity (markName provided)', () => {
    const rows = [
      { browser: 'Chrome', downloads: 27000 },
      { browser: 'Firefox', downloads: 8000 },
      { browser: 'Safari', downloads: 4000 },
    ];

    const attachWithMarkName = () => {
      (view.data as jest.Mock).mockReturnValue(rows);
      return attachDataNavigator({
        container,
        chartType: 'bar',
        data,
        dimension: 'browser',
        markName: 'bar0',
        chartId: 'hover-parity-chart',
        getView: () => view,
      });
    };

    test('focusing a bar sets the same bar0_hoveredItem signal real mouse hover sets', () => {
      attachWithMarkName();
      entryButton().click();
      signal.mockClear();

      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

      expect(signal).toHaveBeenCalledWith('bar0_hoveredItem', rows[0]);
      expect(signal).toHaveBeenCalledWith('bar0_dimensionHoverArea_hoveredItem', rows[0]);
    });

    test('does not touch hover signals when markName is not provided', () => {
      attach();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

      expect(signal.mock.calls.some(([n]) => n === 'bar0_hoveredItem')).toBe(false);
    });

    test('clearing focus clears the hover signals too', () => {
      attachWithMarkName();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

      signal.mockClear();
      fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' });
      fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' });

      expect(signal).toHaveBeenCalledWith('bar0_hoveredItem', null);
      expect(signal).toHaveBeenCalledWith('bar0_dimensionHoverArea_hoveredItem', null);
    });
  });

  describe('Space opens a popover on a focused leaf bar', () => {
    const rows = [
      { browser: 'Chrome', downloads: 27000, [MARK_ID]: 0 },
      { browser: 'Firefox', downloads: 8000, [MARK_ID]: 1 },
    ];

    let selectedData: RefObject<Datum | null>;
    let selectedDataBounds: RefObject<MarkBounds>;
    let selectedDataName: RefObject<string>;

    const attachWithPopoverRefs = (overrides = {}) => {
      (view.data as jest.Mock).mockReturnValue(rows);
      setBarItems(rows);
      selectedData = { current: null };
      selectedDataBounds = { current: { x1: 0, y1: 0, x2: 0, y2: 0 } };
      selectedDataName = { current: '' };
      return attachDataNavigator({
        container,
        chartType: 'bar',
        data,
        dimension: 'browser',
        markName: 'bar0',
        chartId: 'popover-chart',
        getView: () => view,
        selectedData,
        selectedDataBounds,
        selectedDataName,
        ...overrides,
      });
    };

    test('sets the same context refs a real click sets, anchored to the bar (not its focus ring)', () => {
      attachWithPopoverRefs();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' }); // drill to the first bar (a leaf)

      fireEvent.keyDown(focused(), { key: ' ', code: 'Space' });

      expect(selectedData.current).toMatchObject({ browser: 'Chrome', [COMPONENT_NAME]: 'bar0' });
      expect(selectedDataName.current).toBe('bar0');
    });

    test('triggers the same popover-button click a real click uses', () => {
      attachWithPopoverRefs();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

      fireEvent.keyDown(focused(), { key: ' ', code: 'Space' });

      expect(triggerPopover).toHaveBeenCalledWith('popover-chart', 'bar0', 'click');
    });

    test('hides the keyboard focus ring so it does not double up with the popover selection ring', () => {
      attachWithPopoverRefs();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
      signal.mockClear();

      fireEvent.keyDown(focused(), { key: ' ', code: 'Space' });

      expect(signaledWith(FOCUSED_ITEM, null)).toBe(true);
    });

    test('leaves the hover-parity dimming signal active (mirrors a real click happening mid-hover)', () => {
      attachWithPopoverRefs();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
      signal.mockClear();

      fireEvent.keyDown(focused(), { key: ' ', code: 'Space' });

      expect(signal.mock.calls.some(([n, v]) => n === 'bar0_hoveredItem' && v === null)).toBe(false);
    });

    test('anchors to the real bar mark bounds via getItemBounds, not the focus ring', () => {
      attachWithPopoverRefs();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

      fireEvent.keyDown(focused(), { key: ' ', code: 'Space' });

      expect(getItemBounds).toHaveBeenCalledWith(barItems[0]);
      expect(selectedDataBounds.current).toEqual({ x1: 1, y1: 2, x2: 3, y2: 4 });
    });

    test('does not open a popover while focused on the chart root (not a leaf)', () => {
      attachWithPopoverRefs();
      entryButton().click(); // focus lands on the chart root, not a leaf

      fireEvent.keyDown(focused(), { key: ' ', code: 'Space' });

      expect(triggerPopover).not.toHaveBeenCalled();
    });

    test('does not throw when selectedData refs are not provided', () => {
      attachWithPopoverRefs({ selectedData: undefined, selectedDataBounds: undefined, selectedDataName: undefined });
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

      expect(() => fireEvent.keyDown(focused(), { key: ' ', code: 'Space' })).not.toThrow();
      expect(triggerPopover).not.toHaveBeenCalled();
    });

    describe('focus retention while the popover is open (so Escape can return to it)', () => {
      // Opening the popover moves DOM focus into its own dialog, which fires a focusout on the
      // navigated node whose relatedTarget (the popover) is outside `container` — simulated here
      // the same way the real popover's portal would look to the wrapper's focusout listener.
      const focusOutToPopover = () => fireEvent.focusOut(focused(), { relatedTarget: document.body });

      test('does not clear focus/remove the node for the focusout caused by opening the popover', () => {
        attachWithPopoverRefs();
        entryButton().click();
        fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

        fireEvent.keyDown(focused(), { key: ' ', code: 'Space' }); // opens the popover
        signal.mockClear();
        focusOutToPopover();

        expect(focused()).not.toBeNull();
        expect(signaledWith(FOCUSED_REGION, null)).toBe(false);
        expect(signaledWith(FOCUSED_ITEM, null)).toBe(false);
      });

      test('clears focus normally the next time focus actually leaves the widget', () => {
        attachWithPopoverRefs();
        entryButton().click();
        fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

        fireEvent.keyDown(focused(), { key: ' ', code: 'Space' });
        focusOutToPopover(); // suppressed (opening the popover)

        signal.mockClear();
        focusOutToPopover(); // a second, genuine leave — not suppressed this time

        expect(focused()).toBeNull();
        expect(signaledWith(FOCUSED_REGION, null)).toBe(true);
      });

      test('does not suppress the next focusout when there was no popover button to click', () => {
        (triggerPopover as jest.Mock).mockReturnValueOnce(false);
        attachWithPopoverRefs();
        entryButton().click();
        fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

        fireEvent.keyDown(focused(), { key: ' ', code: 'Space' }); // no button found, nothing opened
        signal.mockClear();
        focusOutToPopover();

        expect(focused()).toBeNull();
        expect(signaledWith(FOCUSED_REGION, null)).toBe(true);
      });
    });

    describe('stacked bars', () => {
      const stackRows = [
        { browser: 'Chrome', os: 'Windows', downloads: 18000, [MARK_ID]: 0 },
        { browser: 'Chrome', os: 'Mac', downloads: 9000, [MARK_ID]: 1 },
      ];

      test('does not open a popover while focused on a whole stack (not yet a segment)', () => {
        (view.data as jest.Mock).mockReturnValue(stackRows);
        setBarItems(stackRows);
        const selectedData: RefObject<Datum | null> = { current: null };
        attachDataNavigator({
          container,
          chartType: 'bar',
          data: stackedData,
          dimension: 'browser',
          color: 'os',
          markName: 'bar0',
          chartId: 'stacked-popover-chart',
          getView: () => view,
          selectedData,
          selectedDataBounds: { current: { x1: 0, y1: 0, x2: 0, y2: 0 } },
          selectedDataName: { current: '' },
        });

        entryButton().click();
        fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' }); // drill into the first stack (not a segment)

        fireEvent.keyDown(focused(), { key: ' ', code: 'Space' });

        expect(triggerPopover).not.toHaveBeenCalled();
      });
    });
  });
});
