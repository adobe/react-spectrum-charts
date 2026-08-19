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

import { FOCUSED_DIMENSION, FOCUSED_ITEM, FOCUSED_REGION } from '@spectrum-charts/constants';

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
let view: View;

const mockView = () => {
  signal = jest.fn();
  return { signal, runAsync: jest.fn() } as unknown as View;
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
