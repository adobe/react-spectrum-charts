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
import { FOCUSED_DIMENSION, FOCUSED_REGION, NAVIGATION_ID_SEPARATOR } from '@spectrum-charts/constants';

import { defaultBarOptions, defaultBarOptionsWithSecondayColor } from './barTestUtils';
import { getBarFocusRing, getChartFocusRing, getStackFocusRing } from './barFocusRingUtils';

const { dimension, metric } = defaultBarOptions;

describe('getBarFocusRing()', () => {
  test('sources the ring from the bar mark', () => {
    const ring = getBarFocusRing(defaultBarOptions);
    expect(ring).toHaveProperty('name', 'bar0_focusRing');
    expect(ring.from).toEqual({ data: 'bar0' });
    expect(ring.interactive).toBe(false);
  });

  test('keys a single-color (string) bar on the dimension + series composite', () => {
    // defaultBarOptions.color is a string series field → composite leaf id
    const opacity = JSON.stringify(getBarFocusRing(defaultBarOptions).encode?.update?.opacity);
    expect(opacity).toContain(NAVIGATION_ID_SEPARATOR);
  });

  test('keys a multi-color (array) bar on the dimension value only', () => {
    const opacity = JSON.stringify(getBarFocusRing(defaultBarOptionsWithSecondayColor).encode?.update?.opacity);
    expect(opacity).not.toContain(NAVIGATION_ID_SEPARATOR);
    expect(opacity).toContain(`datum.datum.${dimension}`);
  });

  test('uses metric-sign corner tests for dodged (non-stacked) bars', () => {
    const corners = JSON.stringify(getBarFocusRing({ ...defaultBarOptions, type: 'dodged' }).encode?.enter);
    expect(corners).toContain(`datum.datum.${metric} > 0`);
  });

  test('uses stack-extent corner tests for stacked bars', () => {
    const corners = JSON.stringify(getBarFocusRing(defaultBarOptions).encode?.enter);
    expect(corners).toContain('_stacks');
  });

  test('flattens the rounded corner radius when square corners are requested', () => {
    const ring = getBarFocusRing({ ...defaultBarOptions, hasSquareCorners: true });
    // the "rounded" arm of each corner rule collapses to the flat radius (2)
    expect(ring.encode?.enter?.cornerRadiusTopLeft).toEqual([{ test: expect.any(String), value: 2 }, { value: 2 }]);
  });
});

describe('getChartFocusRing()', () => {
  test('covers the full plot area and keys opacity on the chart region', () => {
    const ring = getChartFocusRing(defaultBarOptions);
    expect(ring).toHaveProperty('name', 'chartFocusRing');
    expect(ring.encode?.update?.x).toEqual({ value: 0 });
    expect(ring.encode?.update?.x2).toEqual({ signal: 'width' });
    expect(ring.encode?.update?.opacity).toEqual([
      { test: `${FOCUSED_REGION} === 'chart'`, value: 1 },
      { value: 0 },
    ]);
  });
});

describe('getStackFocusRing()', () => {
  test('sources from the per-stack data and keys opacity on the focused dimension', () => {
    const ring = getStackFocusRing(defaultBarOptions);
    expect(ring).toHaveProperty('name', 'bar0_stackFocusRing');
    expect(ring.from).toEqual({ data: 'bar0_stacks' });
    expect(ring.encode?.update?.opacity).toEqual([
      { test: `${FOCUSED_DIMENSION} === datum.${dimension}`, value: 1 },
      { value: 0 },
    ]);
  });

  test('positions a vertical stack ring along the y axis', () => {
    const ring = getStackFocusRing(defaultBarOptions);
    // vertical: top edge follows the stack-top metric scale
    expect(JSON.stringify(ring.encode?.update?.y)).toContain(`max_${metric}1`);
  });

  test('positions a horizontal stack ring along the x axis', () => {
    const ring = getStackFocusRing({ ...defaultBarOptions, orientation: 'horizontal' });
    expect(JSON.stringify(ring.encode?.update?.x2)).toContain(`max_${metric}1`);
  });

  test('rounds the metric-end corners unless square corners are requested', () => {
    expect(getStackFocusRing(defaultBarOptions).encode?.enter?.cornerRadiusTopLeft).toEqual({ value: 6 });
    expect(getStackFocusRing({ ...defaultBarOptions, hasSquareCorners: true }).encode?.enter?.cornerRadiusTopLeft).toEqual({
      value: 2,
    });
  });

  test('rounds the trailing corner for a horizontal stack', () => {
    const ring = getStackFocusRing({ ...defaultBarOptions, orientation: 'horizontal' });
    expect(ring.encode?.enter?.cornerRadiusTopRight).toEqual({ value: 6 });
  });
});
