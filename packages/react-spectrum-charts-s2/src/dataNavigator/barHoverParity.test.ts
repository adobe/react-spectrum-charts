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
import { NodeObject } from 'data-navigator';
import { View } from 'vega';

import { applyHoverParitySignals, findFocusedStackRow } from './barHoverParity';

const rows = [
  { browser: 'Chrome', os: 'Windows', value: 18000, rscMarkId: 0 },
  { browser: 'Chrome', os: 'Mac', value: 9000, rscMarkId: 1 },
  { browser: 'Firefox', os: 'Windows', value: 5000, rscMarkId: 2 },
];

const mockView = () => {
  const signal = jest.fn();
  return { view: { signal, data: jest.fn().mockReturnValue(rows) } as unknown as View, signal };
};

describe('applyHoverParitySignals()', () => {
  test('a leaf node sets both hoveredItem and dimensionHoverArea_hoveredItem to the matching row', () => {
    const { view, signal } = mockView();
    const node = { id: 'Chrome__rsc__Windows', data: { browser: 'Chrome', os: 'Windows', value: 18000 } } as unknown as NodeObject;

    applyHoverParitySignals(view, { markName: 'bar0', dimension: 'browser', color: 'os' }, node);

    expect(signal).toHaveBeenCalledWith('bar0_hoveredItem', rows[0]);
    expect(signal).toHaveBeenCalledWith('bar0_dimensionHoverArea_hoveredItem', rows[0]);
  });

  test('a division (stack) node sets only dimensionHoverArea_hoveredItem, not hoveredItem', () => {
    const { view, signal } = mockView();
    const node = { id: 'Chrome', dimensionLevel: 2, derivedNode: 'browser', data: { browser: 'Chrome' } } as unknown as NodeObject;

    applyHoverParitySignals(view, { markName: 'bar0', dimension: 'browser', color: 'os' }, node);

    expect(signal).toHaveBeenCalledWith('bar0_hoveredItem', null);
    expect(signal).toHaveBeenCalledWith('bar0_dimensionHoverArea_hoveredItem', rows[0]);
  });

  test('clears both signals when node is null (focus left the chart)', () => {
    const { view, signal } = mockView();
    applyHoverParitySignals(view, { markName: 'bar0', dimension: 'browser', color: 'os' }, null);

    expect(signal).toHaveBeenCalledWith('bar0_hoveredItem', null);
    expect(signal).toHaveBeenCalledWith('bar0_dimensionHoverArea_hoveredItem', null);
  });

  test('clears both signals for the chart-root (overview) node — no dimension value to match', () => {
    const { view, signal } = mockView();
    const node = { id: '_browser', dimensionLevel: 1, data: { dimensionKey: 'browser', divisions: {} } } as unknown as NodeObject;

    applyHoverParitySignals(view, { markName: 'bar0', dimension: 'browser', color: 'os' }, node);

    expect(signal).toHaveBeenCalledWith('bar0_hoveredItem', null);
    expect(signal).toHaveBeenCalledWith('bar0_dimensionHoverArea_hoveredItem', null);
  });

  test('works for a basic (non-stacked) bar with no color field', () => {
    const { view, signal } = mockView();
    const basicRows = [{ browser: 'Firefox', value: 5000 }];
    (view.data as jest.Mock).mockReturnValue(basicRows);
    const node = { id: 'Firefox', data: { browser: 'Firefox', value: 5000 } } as unknown as NodeObject;

    applyHoverParitySignals(view, { markName: 'bar0', dimension: 'browser' }, node);

    expect(signal).toHaveBeenCalledWith('bar0_hoveredItem', basicRows[0]);
    expect(signal).toHaveBeenCalledWith('bar0_dimensionHoverArea_hoveredItem', basicRows[0]);
  });
});

describe('findFocusedStackRow()', () => {
  const stackRows = [
    { browser: 'Chrome', min_value1: 0, max_value1: 27000 },
    { browser: 'Firefox', min_value1: 0, max_value1: 8000 },
  ];

  const mockStackView = () => ({ data: jest.fn().mockReturnValue(stackRows) }) as unknown as View;

  test('finds the stack aggregate row matching a division node\'s dimension value', () => {
    const view = mockStackView();
    const node = { id: 'Chrome', dimensionLevel: 2, derivedNode: 'browser', data: { browser: 'Chrome' } } as unknown as NodeObject;

    expect(findFocusedStackRow(view, node, 'browser', 'bar0')).toBe(stackRows[0]);
    expect(view.data).toHaveBeenCalledWith('bar0_stacks');
  });

  test('returns undefined when the node has no resolvable dimension value', () => {
    const view = mockStackView();
    const node = { id: '_browser', dimensionLevel: 1, data: {} } as unknown as NodeObject;

    expect(findFocusedStackRow(view, node, 'browser', 'bar0')).toBeUndefined();
  });

  test('returns undefined when no stack row matches', () => {
    const view = mockStackView();
    const node = { id: 'Safari', dimensionLevel: 2, derivedNode: 'browser', data: { browser: 'Safari' } } as unknown as NodeObject;

    expect(findFocusedStackRow(view, node, 'browser', 'bar0')).toBeUndefined();
  });
});
