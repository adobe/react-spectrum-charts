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
import {
  BACKGROUND_COLOR,
  FILTERED_TABLE,
  FOCUSED_DIMENSION,
  FOCUSED_ITEM,
  FOCUSED_REGION,
  NAVIGATION_ID_SEPARATOR,
  NAVIGATION_INDEX_FIELD,
} from '@spectrum-charts/constants';

import { defaultLineOptions } from './lineTestUtils';
import {
  getChartFocusRing,
  getLineFocusRingGap,
  getLineFocusRingOuter,
  getLineGroupZIndexEncoding,
  getPointFocusRing,
} from './lineFocusRingUtils';

// defaultLineOptions.color is the string field 'series' → a multi-line chart
const singleLineOptions = { ...defaultLineOptions, color: { value: 'categorical-100' } };

describe('getLineFocusRingOuter()', () => {
  test('sources the ring from the provided data and keys strokeWidth on the focused dimension', () => {
    const ring = getLineFocusRingOuter(defaultLineOptions, 'line0_facet');
    expect(ring).toHaveProperty('name', 'line0_focusRingOuter');
    expect(ring.from).toEqual({ data: 'line0_facet' });
    expect(ring.interactive).toBe(false);
    expect(ring.encode?.update?.strokeWidth).toEqual([
      { test: `${FOCUSED_DIMENSION} === datum.series`, value: 12 },
      { value: 0 },
    ]);
  });
});

describe('getLineFocusRingGap()', () => {
  test('sources the ring from the provided data, uses the background color, and is narrower than the outer ring', () => {
    const ring = getLineFocusRingGap(defaultLineOptions, 'line0_facet');
    expect(ring).toHaveProperty('name', 'line0_focusRingGap');
    expect(ring.from).toEqual({ data: 'line0_facet' });
    expect(ring.encode?.enter?.stroke).toEqual({ signal: BACKGROUND_COLOR });
    expect(ring.encode?.update?.strokeWidth).toEqual([
      { test: `${FOCUSED_DIMENSION} === datum.series`, value: 8 },
      { value: 0 },
    ]);
  });
});

describe('getLineGroupZIndexEncoding()', () => {
  test('raises the focused line above every other line, whether the line or one of its points is focused', () => {
    expect(getLineGroupZIndexEncoding('series')).toEqual([
      {
        test: `${FOCUSED_DIMENSION} === datum.series || (isValid(${FOCUSED_ITEM}) && indexof(${FOCUSED_ITEM}, datum.series + "${NAVIGATION_ID_SEPARATOR}") === 0)`,
        value: 1,
      },
      { value: 0 },
    ]);
  });
});

describe('getPointFocusRing()', () => {
  test('sources the ring from the filtered table', () => {
    const ring = getPointFocusRing(defaultLineOptions);
    expect(ring).toHaveProperty('name', 'line0_pointFocusRing');
    expect(ring.from).toEqual({ data: FILTERED_TABLE });
    expect(ring.interactive).toBe(false);
  });

  test('keys a multi-line chart on the series + per-line index composite', () => {
    const ring = getPointFocusRing(defaultLineOptions);
    expect(ring.encode?.update?.opacity).toEqual([
      {
        test: `${FOCUSED_ITEM} === datum.series + "${NAVIGATION_ID_SEPARATOR}" + datum.${NAVIGATION_INDEX_FIELD}`,
        value: 1,
      },
      { value: 0 },
    ]);
  });

  test('keys a single-line chart on the per-line index only', () => {
    const ring = getPointFocusRing(singleLineOptions);
    expect(ring.encode?.update?.opacity).toEqual([
      { test: `${FOCUSED_ITEM} === '' + datum.${NAVIGATION_INDEX_FIELD}`, value: 1 },
      { value: 0 },
    ]);
  });
});

describe('getChartFocusRing()', () => {
  test('covers the full plot area and keys opacity on the chart region', () => {
    const ring = getChartFocusRing(defaultLineOptions);
    expect(ring).toHaveProperty('name', 'chartFocusRing');
    expect(ring.encode?.update?.x).toEqual({ value: 0 });
    expect(ring.encode?.update?.x2).toEqual({ signal: 'width' });
    expect(ring.encode?.update?.opacity).toEqual([
      { test: `${FOCUSED_REGION} === 'chart'`, value: 1 },
      { value: 0 },
    ]);
  });
});
