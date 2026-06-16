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
// Prevent the full Vega bundle from loading — View is only used as a type cast in this test.
jest.mock('vega', () => ({}));

import { act, renderHook } from '@testing-library/react';
import type { View } from 'vega';

import { useLegendIconPositions } from './useLegendIconPositions';

// Build a minimal legend DOM tree:
//   .rsc-container > vegaContainer > scope > (role-legend-symbol + role-legend-label > text)
function buildLegendDOM(series: string[]) {
  const rscContainer = document.createElement('div');
  rscContainer.className = 'rsc-container';

  const vegaContainer = document.createElement('div');
  rscContainer.appendChild(vegaContainer);

  for (const name of series) {
    const scope = document.createElement('g');

    const symbolGroup = document.createElement('g');
    symbolGroup.className = 'mark-symbol role-legend-symbol';
    scope.appendChild(symbolGroup);

    const labelGroup = document.createElement('g');
    labelGroup.className = 'mark-text role-legend-label';
    const text = document.createElement('text');
    text.textContent = name;
    labelGroup.appendChild(text);
    scope.appendChild(labelGroup);

    vegaContainer.appendChild(scope);
  }

  document.body.appendChild(rscContainer);
  return {
    vegaContainer,
    cleanup: () => document.body.removeChild(rscContainer),
  };
}

function makeMockView(container: HTMLElement) {
  return {
    container: () => container,
    runAsync: jest.fn().mockResolvedValue(undefined),
    addResizeListener: jest.fn(),
    removeResizeListener: jest.fn(),
    finalize: jest.fn(),
  } as unknown as View;
}

function makeViewRef(view?: View) {
  return { current: view };
}

// Stable empty array — avoids re-triggering the legendHiddenSeries effect on every re-render.
const NO_HIDDEN: string[] = [];

describe('useLegendIconPositions', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns empty positions when legendHiddenSeries is empty', () => {
    // viewRef must be stable to avoid re-running effects on every render.
    const viewRef = makeViewRef();
    const { result } = renderHook(() => useLegendIconPositions(viewRef, NO_HIDDEN));
    expect(result.current.positions).toEqual([]);
  });

  test('returns empty positions when no view is set', () => {
    const viewRef = makeViewRef(undefined);
    // Array must be stable to avoid triggering the legendHiddenSeries effect on every render.
    const hiddenSeries = ['Windows'];
    const { result } = renderHook(() => useLegendIconPositions(viewRef, hiddenSeries));
    expect(result.current.positions).toEqual([]);
  });

  test('clears positions when legendHiddenSeries becomes empty', async () => {
    const { vegaContainer, cleanup } = buildLegendDOM(['Windows']);
    const mockView = makeMockView(vegaContainer);
    const viewRef = makeViewRef(mockView);

    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 10, top: 20, width: 12, height: 12, right: 22, bottom: 32, x: 10, y: 20, toJSON: () => {},
    } as DOMRect);

    // initialProps creates a stable reference for the hidden array so the effect dep
    // comparison is stable between renders until rerender() is called explicitly.
    const { result, rerender } = renderHook(
      ({ hidden }: { hidden: string[] }) => useLegendIconPositions(viewRef, hidden),
      { initialProps: { hidden: ['Windows'] } }
    );

    await act(async () => {
      result.current.onViewReady();
    });
    await act(async () => { await Promise.resolve(); });

    rerender({ hidden: NO_HIDDEN });
    await act(async () => { await Promise.resolve(); });

    expect(result.current.positions).toEqual([]);
    cleanup();
  });

  test('computes positions for hidden series after onViewReady is called', async () => {
    const { vegaContainer, cleanup } = buildLegendDOM(['Windows', 'Mac']);
    const mockView = makeMockView(vegaContainer);
    const viewRef = makeViewRef(mockView);

    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 10, top: 20, width: 12, height: 12, right: 22, bottom: 32, x: 10, y: 20, toJSON: () => {},
    } as DOMRect);

    // Stable reference — must not be recreated inside the renderHook callback.
    const hiddenSeries = ['Windows'];
    const { result } = renderHook(() => useLegendIconPositions(viewRef, hiddenSeries));

    await act(async () => {
      result.current.onViewReady();
    });
    await act(async () => { await Promise.resolve(); });

    expect(result.current.positions).toHaveLength(1);
    expect(result.current.positions[0].name).toBe('Windows');
    expect(result.current.positions[0].style.position).toBe('absolute');
    cleanup();
  });

  test('skips symbol groups where getBoundingClientRect returns zero dimensions', async () => {
    const { vegaContainer, cleanup } = buildLegendDOM(['Windows']);
    const mockView = makeMockView(vegaContainer);
    const viewRef = makeViewRef(mockView);

    // JSDOM default: width and height are 0
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {},
    } as DOMRect);

    const hiddenSeries = ['Windows'];
    const { result } = renderHook(() => useLegendIconPositions(viewRef, hiddenSeries));

    await act(async () => {
      result.current.onViewReady();
    });
    await act(async () => { await Promise.resolve(); });

    expect(result.current.positions).toHaveLength(0);
    cleanup();
  });

  test('pairs label and symbol within the same scope group, not by global index', async () => {
    // Two entries: 'Windows' and 'Mac'. Only 'Mac' is hidden.
    // A global-index-based pairing would misalign if multiple legends were present.
    const { vegaContainer, cleanup } = buildLegendDOM(['Windows', 'Mac']);
    const mockView = makeMockView(vegaContainer);
    const viewRef = makeViewRef(mockView);

    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 5, top: 5, width: 10, height: 10, right: 15, bottom: 15, x: 5, y: 5, toJSON: () => {},
    } as DOMRect);

    const hiddenSeries = ['Mac'];
    const { result } = renderHook(() => useLegendIconPositions(viewRef, hiddenSeries));

    await act(async () => {
      result.current.onViewReady();
    });
    await act(async () => { await Promise.resolve(); });

    expect(result.current.positions).toHaveLength(1);
    expect(result.current.positions[0].name).toBe('Mac');
    cleanup();
  });

  test('registers and removes resize listener on the active view', async () => {
    const { vegaContainer, cleanup } = buildLegendDOM(['Windows']);
    const mockView = makeMockView(vegaContainer);
    const viewRef = makeViewRef(mockView);
    const hiddenSeries = ['Windows'];

    const { result, unmount } = renderHook(() => useLegendIconPositions(viewRef, hiddenSeries));

    await act(async () => {
      result.current.onViewReady();
    });

    expect(mockView.addResizeListener).toHaveBeenCalledTimes(1);

    unmount();
    expect(mockView.removeResizeListener).toHaveBeenCalledTimes(1);
    cleanup();
  });

  test('cancels in-flight runAsync via active flag on cleanup', async () => {
    const { vegaContainer, cleanup } = buildLegendDOM(['Windows']);

    let resolveRunAsync!: () => void;
    const pendingRunAsync = new Promise<void>((resolve) => { resolveRunAsync = resolve; });

    const mockView = {
      container: () => vegaContainer,
      runAsync: jest.fn().mockReturnValue(pendingRunAsync),
      addResizeListener: jest.fn(),
      removeResizeListener: jest.fn(),
    } as unknown as View;

    const viewRef = makeViewRef(mockView);

    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 10, top: 20, width: 12, height: 12, right: 22, bottom: 32, x: 10, y: 20, toJSON: () => {},
    } as DOMRect);

    const hiddenSeries = ['Windows'];
    const { result, unmount } = renderHook(() => useLegendIconPositions(viewRef, hiddenSeries));

    await act(async () => {
      result.current.onViewReady();
    });

    // Unmount before runAsync resolves — the active guard should prevent a setState call.
    unmount();

    await act(async () => {
      resolveRunAsync();
      await Promise.resolve();
    });

    // No error thrown from setState on unmounted component.
    expect(result.current.positions).toEqual([]);
    cleanup();
  });
});
