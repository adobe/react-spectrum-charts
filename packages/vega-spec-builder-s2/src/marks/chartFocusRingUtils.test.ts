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
import { Mark } from 'vega';

import { FOCUSED_REGION } from '@spectrum-charts/constants';

import { addChartFocusRing, CHART_FOCUS_RING_NAME, FOCUS_RING_ROUNDED_RADIUS, FOCUS_RING_STROKE_WIDTH, getChartFocusRing } from './chartFocusRingUtils';

describe('getChartFocusRing()', () => {
  test('covers the full plot area and keys opacity on the chart region, regardless of mark type', () => {
    const ring = getChartFocusRing({ colorScheme: 'light' });
    expect(ring).toHaveProperty('name', 'chartFocusRing');
    expect(ring).toHaveProperty('type', 'rect');
    expect(ring.encode?.update?.x).toEqual({ value: 0 });
    expect(ring.encode?.update?.x2).toEqual({ signal: 'width' });
    expect(ring.encode?.update?.y).toEqual({ value: 0 });
    expect(ring.encode?.update?.y2).toEqual({ signal: 'height' });
    expect(ring.encode?.update?.opacity).toEqual([
      { test: `${FOCUSED_REGION} === 'chart'`, value: 1 },
      { value: 0 },
    ]);
    expect(ring.encode?.enter).toHaveProperty('strokeWidth', { value: FOCUS_RING_STROKE_WIDTH });
    expect(ring.encode?.enter).toHaveProperty('cornerRadius', { value: FOCUS_RING_ROUNDED_RADIUS });
  });

  test('accepts any options object with a colorScheme field (used by both Bar and Line spec options)', () => {
    // Exercises the shape both LineSpecOptions and BarSpecOptions actually pass in.
    const lineShaped = { colorScheme: 'dark' as const, name: 'line0', dimension: 'x', metric: 'y' };
    const barShaped = { colorScheme: 'dark' as const, name: 'bar0', orientation: 'vertical' as const };
    expect(getChartFocusRing(lineShaped)).toHaveProperty('name', 'chartFocusRing');
    expect(getChartFocusRing(barShaped)).toHaveProperty('name', 'chartFocusRing');
  });
});

describe('addChartFocusRing()', () => {
  test('adds the chart focus ring to an empty marks array', () => {
    const marks: Mark[] = [];
    addChartFocusRing(marks, { colorScheme: 'light' });
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveProperty('name', CHART_FOCUS_RING_NAME);
  });

  test('does not add a second copy when called again, e.g. for a second navigable mark on the same chart', () => {
    const marks: Mark[] = [];
    addChartFocusRing(marks, { colorScheme: 'light' });
    addChartFocusRing(marks, { colorScheme: 'light' });
    expect(marks.filter((mark) => mark.name === CHART_FOCUS_RING_NAME)).toHaveLength(1);
  });
});
