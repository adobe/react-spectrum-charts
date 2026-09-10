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
import { fireEvent } from '@testing-library/react';
import { View } from 'vega';

import { FOCUSED_DIMENSION, FOCUSED_ITEM, FOCUSED_REGION, INTERACTION_MODALITY } from '@spectrum-charts/constants';

import { NavigableChartType } from './buildChartStructure';
import { attachDataNavigator } from './dataNavigatorAdapter';

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
let addEventListenerMock: jest.Mock;
let removeEventListenerMock: jest.Mock;
let view: View;

const mockView = () => {
  signal = jest.fn();
  addEventListenerMock = jest.fn();
  removeEventListenerMock = jest.fn();
  return {
    signal,
    runAsync: jest.fn(),
    addEventListener: addEventListenerMock,
    removeEventListener: removeEventListenerMock,
  } as unknown as View;
};

const signaledWith = (name: string, value: unknown): boolean =>
  signal.mock.calls.some(([n, v]) => n === name && v === value);

const getClickHandler = (): ((event: unknown, item?: unknown) => void) | undefined =>
  addEventListenerMock.mock.calls.find(([type]) => type === 'click')?.[1];

const getMouseOutHandler = (): ((event: unknown, item?: unknown) => void) | undefined =>
  addEventListenerMock.mock.calls.find(([type]) => type === 'mouseout')?.[1];

const getMouseOverHandler = (): ((event: unknown, item?: unknown) => void) | undefined =>
  addEventListenerMock.mock.calls.find(([type]) => type === 'mouseover')?.[1];

const entryButton = (): HTMLButtonElement => container.querySelector('button') as HTMLButtonElement;
// data-navigator renders exactly one node element (class `dn-node`) at a time; it carries the
// keydown listener. jsdom does not reliably track activeElement for it, so target it directly.
const focused = (): HTMLElement => container.querySelector('.dn-node') as HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  view = mockView();
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
    expect(signaledWith(INTERACTION_MODALITY, 'keyboard')).toBe(true);
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
    expect(signaledWith(INTERACTION_MODALITY, 'keyboard')).toBe(true);
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

  describe('focus leaves the navigator entirely (tab out, click outside)', () => {
    // The node and `current` are deliberately kept (not removed/cleared) on this kind of blur —
    // only the visual signals clear — so shift+Tab back into the chart lands on the same,
    // still-tabbable element and its own 'focus' listener naturally re-applies them.
    test('blurring to another focusable element outside the container clears the visual focus signals but keeps the node', async () => {
      attach();
      entryButton().click();
      const node = focused();
      expect(node).toBeTruthy();

      signal.mockClear();
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      node.blur();
      outside.focus();
      await new Promise((r) => setTimeout(r, 0));

      expect(focused()).toBe(node);
      expect(signaledWith(FOCUSED_REGION, null)).toBe(true);
      expect(signaledWith(FOCUSED_ITEM, null)).toBe(true);
      outside.remove();
    });

    test('shift+Tab landing on the entry button (still inside the container) also clears the visual focus signals', async () => {
      // The entry button lives inside `container` too — landing there isn't a pointer at any
      // specific structural node, so it must be treated the same as leaving the navigator
      // entirely, not mistaken for an internal navigation transition.
      attach();
      entryButton().click();
      const node = focused();
      expect(node).toBeTruthy();

      signal.mockClear();
      node.blur();
      entryButton().focus();
      await new Promise((r) => setTimeout(r, 0));

      expect(focused()).toBe(node);
      expect(signaledWith(FOCUSED_REGION, null)).toBe(true);
      expect(signaledWith(FOCUSED_ITEM, null)).toBe(true);
    });

    test('a blur caused by the popover autofocusing into itself does not clear the visual focus signals', async () => {
      // Activating a leaf opens its popover, which autofocuses into itself (react-aria's
      // FocusScope) — that blurs this node too, but it isn't "left the navigator": the point is
      // still conceptually focused for as long as the dialog it opened is showing.
      attach({ getPopoverInfo: () => ({ isOpen: true, closedAt: null }) });
      entryButton().click();
      const node = focused();
      signal.mockClear();

      node.blur();
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      outside.focus();
      await new Promise((r) => setTimeout(r, 0));

      expect(signal).not.toHaveBeenCalled();
      outside.remove();
    });

    test('blurring with nothing else to focus (falls back to document.body) also clears the visual focus signals', async () => {
      attach();
      entryButton().click();
      const node = focused();
      signal.mockClear();

      node.blur();
      await new Promise((r) => setTimeout(r, 0));

      expect(focused()).toBe(node);
      expect(signaledWith(FOCUSED_ITEM, null)).toBe(true);
    });

    test('shift+Tab back onto the same node re-applies its focus signals via its own focus listener', async () => {
      attach();
      entryButton().click();
      const node = focused();

      node.blur();
      await new Promise((r) => setTimeout(r, 0));
      expect(signaledWith(FOCUSED_REGION, null)).toBe(true);

      signal.mockClear();
      node.focus();

      expect(signal.mock.calls.some(([n, v]) => n === FOCUSED_REGION && v === 'chart')).toBe(true);
    });

    test('an internal blur immediately followed by refocus during normal navigation does not clear focus', async () => {
      attach();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
      signal.mockClear();

      // arrowing removes the old (focused) node and synchronously focuses a newly rendered one —
      // exactly the internal transition this check must not mistake for "left the navigator".
      fireEvent.keyDown(focused(), { key: 'ArrowRight', code: 'ArrowRight' });
      await new Promise((r) => setTimeout(r, 0));

      expect(focused()).toBeTruthy();
      expect(signal.mock.calls.some(([n, v]) => n === FOCUSED_ITEM && v === null)).toBe(false);
    });

    test('does not throw and does not act on a pending blur check after destroy', async () => {
      const handle = attach();
      entryButton().click();
      focused().blur();
      handle.destroy();
      signal.mockClear();

      await expect(new Promise((r) => setTimeout(r, 0))).resolves.not.toThrow();
      expect(signal).not.toHaveBeenCalled();
    });
  });

  describe('leaf activation and focus callbacks', () => {
    test('Enter activates a focused leaf via onActivate', () => {
      const onActivate = jest.fn();
      attach({ onActivate });
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' }); // drills to the first leaf bar
      onActivate.mockClear();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' }); // now activates it
      expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ browser: 'Chrome' }));
    });

    test('Space activates a focused leaf via onActivate', () => {
      const onActivate = jest.fn();
      attach({ onActivate });
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
      onActivate.mockClear();
      fireEvent.keyDown(focused(), { key: ' ', code: 'Space' });
      expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ browser: 'Chrome' }));
    });

    test('does not call onActivate for a non-leaf node — Enter still drills in as before', () => {
      const onActivate = jest.fn();
      attach({ onActivate });
      entryButton().click(); // chart root, not a leaf
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' }); // drills in, does not activate
      expect(onActivate).not.toHaveBeenCalled();
    });

    test('onLeafFocus fires with the datum when focus lands on a leaf', () => {
      const onLeafFocus = jest.fn();
      attach({ onLeafFocus });
      entryButton().click();
      onLeafFocus.mockClear();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
      expect(onLeafFocus).toHaveBeenCalledWith(expect.objectContaining({ browser: 'Chrome' }));
    });

    test('onLeafFocus fires with undefined when focus moves off a leaf', () => {
      const onLeafFocus = jest.fn();
      attach({ onLeafFocus });
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
      onLeafFocus.mockClear();
      fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' });
      expect(onLeafFocus).toHaveBeenCalledWith(undefined);
    });

    test('Escape dismisses a visible ChartInspect tooltip instead of drilling out (no ChartPopover involved)', () => {
      // ChartInspect has no tracked "open" boolean like ChartPopover does — vega-tooltip just
      // toggles a class on its own DOM element — so this is a direct visibility check.
      attach();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' }); // now on the leaf

      const tooltipEl = document.createElement('div');
      tooltipEl.id = 'vg-tooltip-element';
      tooltipEl.classList.add('visible');
      document.body.appendChild(tooltipEl);

      signal.mockClear();
      fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' });

      expect(tooltipEl.classList.contains('visible')).toBe(false);
      expect(signal).not.toHaveBeenCalled(); // did not drill out

      fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' }); // now dismissed, drills out
      expect(signaledWith(FOCUSED_REGION, 'chart')).toBe(true);

      tooltipEl.remove();
    });

    test('Escape drills out normally when there is no visible ChartInspect tooltip', () => {
      attach();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

      signal.mockClear();
      fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' });
      expect(signaledWith(FOCUSED_REGION, 'chart')).toBe(true);
    });

    test('Escape does nothing here while the popover is open — it belongs to the popover alone', () => {
      const onLeafFocus = jest.fn();
      attach({ onLeafFocus, getPopoverInfo: () => ({ isOpen: true, closedAt: null }) });
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' }); // now on the leaf
      onLeafFocus.mockClear();
      signal.mockClear();
      fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' });
      expect(onLeafFocus).not.toHaveBeenCalled();
      expect(signal).not.toHaveBeenCalled();
    });

    test('Escape drills out normally once the popover is closed', () => {
      let isPopoverOpen = true;
      attach({ getPopoverInfo: () => ({ isOpen: isPopoverOpen, closedAt: null }) });
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
      fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' }); // swallowed, popover still open
      isPopoverOpen = false;
      signal.mockClear();
      fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' });
      expect(signaledWith(FOCUSED_REGION, 'chart')).toBe(true);
    });

    test('a fast Escape right after the popover closes is swallowed, not treated as a drill-out', () => {
      attach({ getPopoverInfo: () => ({ isOpen: false, closedAt: Date.now() }) });
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' }); // now on the leaf

      signal.mockClear();
      fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' });

      expect(signal).not.toHaveBeenCalled();
      expect(focused()).toBeTruthy(); // still on the same leaf, not drilled out
    });

    test('an Escape pressed after the suppression window has elapsed drills out as normal', () => {
      const longAgo = Date.now() - 10_000;
      attach({ getPopoverInfo: () => ({ isOpen: false, closedAt: longAgo }) });
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' }); // now on the leaf

      signal.mockClear();
      fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' });

      expect(signaledWith(FOCUSED_REGION, 'chart')).toBe(true);
    });

    test('Escape drills out normally when the popover has never closed (closedAt is null)', () => {
      attach({ getPopoverInfo: () => ({ isOpen: false, closedAt: null }) });
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });

      signal.mockClear();
      fireEvent.keyDown(focused(), { key: 'Escape', code: 'Escape' });

      expect(signaledWith(FOCUSED_REGION, 'chart')).toBe(true);
    });
  });

  describe('refocusCurrent()', () => {
    test('re-focuses the currently tracked node', () => {
      const handle = attach();
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
      const focusSpy = jest.spyOn(focused(), 'focus');
      handle.refocusCurrent();
      expect(focusSpy).toHaveBeenCalled();
    });

    test('does nothing when nothing is focused', () => {
      const handle = attach();
      expect(() => handle.refocusCurrent()).not.toThrow();
    });
  });

  describe('click moves focus', () => {
    test('registers a click listener on the view', () => {
      attach();
      expect(getClickHandler()).toBeDefined();
    });

    test('clicking a rendered datum moves focus to the matching bar without requiring keyboard entry first', () => {
      attach();
      getClickHandler()?.(undefined, { datum: { browser: 'Firefox' } });
      expect(signaledWith(FOCUSED_ITEM, 'Firefox')).toBe(true);
    });

    test('unwraps one level of nesting for overlay marks (e.g. a voronoi cell)', () => {
      attach();
      getClickHandler()?.(undefined, { datum: { datum: { browser: 'Safari' } } });
      expect(signaledWith(FOCUSED_ITEM, 'Safari')).toBe(true);
    });

    test('does nothing when the clicked datum does not resolve to a node', () => {
      attach();
      getClickHandler()?.(undefined, { datum: { unrelated: true } });
      expect(signal).not.toHaveBeenCalled();
    });

    test('does nothing when there is no item under the click', () => {
      attach();
      getClickHandler()?.(undefined, undefined);
      expect(signal).not.toHaveBeenCalled();
    });

    test('removes the click listener on cleanup', () => {
      const handle = attach();
      const handler = getClickHandler();
      handle.destroy();
      expect(removeEventListenerMock).toHaveBeenCalledWith('click', handler);
    });
  });

  describe('mouse leaves the chart', () => {
    test('registers a mouseout listener on the view', () => {
      attach();
      expect(getMouseOutHandler()).toBeDefined();
    });

    test('leaving every mark (no item) restores keyboard modality', () => {
      attach();
      getMouseOutHandler()?.(undefined, undefined);
      expect(signaledWith(INTERACTION_MODALITY, 'keyboard')).toBe(true);
    });

    test('does nothing while still over a mark', () => {
      attach();
      getMouseOutHandler()?.(undefined, { datum: { browser: 'Firefox' } });
      expect(signal).not.toHaveBeenCalled();
    });

    test('a native mouseleave on the container restores keyboard modality even when Vega still reports a hovered item', () => {
      // Vega's own mouseout `item` is ambiguous right at a mark's edge — the exiting cursor can
      // still be reported as over a mark, which is exactly what the container-level fallback below
      // is for; it doesn't depend on Vega's item at all.
      attach();
      getMouseOutHandler()?.(undefined, { datum: { browser: 'Firefox' } });
      signal.mockClear();
      fireEvent.mouseLeave(container);
      expect(signaledWith(INTERACTION_MODALITY, 'keyboard')).toBe(true);
    });

    test('mouseleave also clears the mark hovered-item signal', () => {
      const specSignalNames = new Set(['bar0_hoveredItem']);
      attach({ getHoverClearInfo: () => ({ markName: 'bar0', specSignalNames }) });
      fireEvent.mouseLeave(container);
      expect(signaledWith('bar0_hoveredItem', null)).toBe(true);
    });

    test('removes the mouseleave listener on cleanup', () => {
      const handle = attach();
      handle.destroy();
      signal.mockClear();
      fireEvent.mouseLeave(container);
      expect(signal).not.toHaveBeenCalled();
    });

    test('clears the mark hovered-item signal so a faded focused line is restored', () => {
      const specSignalNames = new Set(['bar0_hoveredItem', 'bar0_hoveredSeries']);
      attach({ getHoverClearInfo: () => ({ markName: 'bar0', specSignalNames }) });
      getMouseOutHandler()?.(undefined, undefined);
      expect(signaledWith('bar0_hoveredItem', null)).toBe(true);
    });

    test('reads hover-clear info fresh on every mouseout rather than at attach time', () => {
      const specSignalNames = new Set(['bar0_hoveredItem']);
      let markName = 'bar0';
      attach({ getHoverClearInfo: () => ({ markName, specSignalNames }) });
      markName = 'bar1';
      specSignalNames.add('bar1_hoveredItem');
      getMouseOutHandler()?.(undefined, undefined);
      expect(signaledWith('bar1_hoveredItem', null)).toBe(true);
    });

    test('does not attempt to clear hover signals when getHoverClearInfo is not provided', () => {
      attach();
      getMouseOutHandler()?.(undefined, undefined);
      expect(signaledWith(INTERACTION_MODALITY, 'keyboard')).toBe(true);
      expect(signal.mock.calls.every(([n]) => n === INTERACTION_MODALITY)).toBe(true);
    });

    test('removes the mouseout listener on cleanup', () => {
      const handle = attach();
      const handler = getMouseOutHandler();
      handle.destroy();
      expect(removeEventListenerMock).toHaveBeenCalledWith('mouseout', handler);
    });
  });

  describe('mouse moves onto something that is not one of our own marks (e.g. the legend)', () => {
    // Moving from a data mark straight onto the legend (or an axis label, or empty background)
    // never leaves the chart's container and Vega's own mark-level mouseout can be ambiguous too —
    // so without this, HOVERED_ITEM can get stuck set to whatever was hovered last, leaving the
    // focused line's opacity faded indefinitely.
    test('restores keyboard modality when hovering an item with no datum', () => {
      attach();
      getMouseOverHandler()?.(undefined, undefined);
      expect(signaledWith(INTERACTION_MODALITY, 'keyboard')).toBe(true);
    });

    test('restores keyboard modality when hovering a datum that does not resolve to one of our nodes (e.g. a legend symbol)', () => {
      attach();
      getMouseOverHandler()?.(undefined, { datum: { index: 0, count: 1 } });
      expect(signaledWith(INTERACTION_MODALITY, 'keyboard')).toBe(true);
    });

    test('clears the mark hovered-item signal too, so a faded focused line is restored', () => {
      const specSignalNames = new Set(['bar0_hoveredItem']);
      attach({ getHoverClearInfo: () => ({ markName: 'bar0', specSignalNames }) });
      getMouseOverHandler()?.(undefined, { datum: { index: 0, count: 1 } });
      expect(signaledWith('bar0_hoveredItem', null)).toBe(true);
    });

    test('does nothing when hovering one of our own navigable marks', () => {
      attach();
      getMouseOverHandler()?.(undefined, { datum: { browser: 'Firefox' } });
      expect(signal).not.toHaveBeenCalled();
    });

    test('unwraps one level of nesting for overlay marks (e.g. a voronoi cell) before deciding', () => {
      attach();
      getMouseOverHandler()?.(undefined, { datum: { datum: { browser: 'Safari' } } });
      expect(signal).not.toHaveBeenCalled();
    });

    test('removes the mouseover listener on cleanup', () => {
      const handle = attach();
      const handler = getMouseOverHandler();
      handle.destroy();
      expect(removeEventListenerMock).toHaveBeenCalledWith('mouseover', handler);
    });
  });

  describe('attachViewListeners() (view resolves asynchronously)', () => {
    test('registers no listeners at attach time when the view is not yet available', () => {
      attach({ getView: () => undefined });
      expect(addEventListenerMock).not.toHaveBeenCalled();
    });

    test('registers the click/mouseout listeners once the view becomes available, without rebuilding the structure', () => {
      const viewRef: { current: View | undefined } = { current: undefined };
      const handle = attach({ getView: () => viewRef.current });
      expect(addEventListenerMock).not.toHaveBeenCalled();

      viewRef.current = view;
      handle.attachViewListeners();
      expect(getClickHandler()).toBeDefined();
      expect(getMouseOutHandler()).toBeDefined();
    });

    test('preserves the tracked focus position across a late view-ready call (no structure rebuild)', () => {
      const viewRef: { current: View | undefined } = { current: undefined };
      const handle = attach({ getView: () => viewRef.current });
      entryButton().click();
      fireEvent.keyDown(focused(), { key: 'Enter', code: 'Enter' });
      const focusedNode = focused();

      viewRef.current = view;
      handle.attachViewListeners();

      const focusSpy = jest.spyOn(focusedNode, 'focus');
      handle.refocusCurrent();
      expect(focusSpy).toHaveBeenCalled();
    });

    test('calling attachViewListeners again with the same view does not double-register', () => {
      const handle = attach();
      addEventListenerMock.mockClear();
      handle.attachViewListeners();
      expect(addEventListenerMock).not.toHaveBeenCalled();
    });

    test('destroy() removes listeners from whichever view was actually registered, not the initial getView() snapshot', () => {
      const viewRef: { current: View | undefined } = { current: undefined };
      const handle = attach({ getView: () => viewRef.current });
      viewRef.current = view;
      handle.attachViewListeners();
      const clickHandler = getClickHandler();
      const mouseOutHandler = getMouseOutHandler();

      handle.destroy();
      expect(removeEventListenerMock).toHaveBeenCalledWith('click', clickHandler);
      expect(removeEventListenerMock).toHaveBeenCalledWith('mouseout', mouseOutHandler);
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
  });
});
