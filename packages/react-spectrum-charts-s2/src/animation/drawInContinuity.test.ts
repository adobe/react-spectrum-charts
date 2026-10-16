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
import { Spec, View, parse } from 'vega';

import { ANIMATION_TIMER, DRAW_IN_START, TABLE } from '@spectrum-charts/core-s2/constants';

import { getDrawInStart, hasDrawIn, hasTableRows, restoreDrawInStart } from './drawInContinuity.js';

const drawInSpec = (rows: object[] = [{ x: 1 }]): Spec => ({
  data: [{ name: TABLE, values: rows }],
  signals: [
    { name: ANIMATION_TIMER, value: 0 },
    { name: DRAW_IN_START, value: 0 },
  ],
});

const viewWithStart = async (spec: Spec, start: number): Promise<View> => {
  const view = new View(parse(spec), { renderer: 'none' });
  await view.signal(DRAW_IN_START, start).runAsync();
  return view;
};

const signalValue = (spec: Spec, name: string) => {
  const signal = spec.signals?.find((s) => s.name === name);
  return signal && 'value' in signal ? signal.value : undefined;
};

describe('hasDrawIn()', () => {
  test('detects the draw-in clock', () => {
    expect(hasDrawIn(drawInSpec())).toBe(true);
    expect(hasDrawIn({ signals: [{ name: ANIMATION_TIMER, value: 0 }] })).toBe(false);
    expect(hasDrawIn({})).toBe(false);
  });
});

describe('hasTableRows()', () => {
  test('detects table rows', () => {
    expect(hasTableRows(drawInSpec())).toBe(true);
  });

  test('is false for an empty or missing table', () => {
    expect(hasTableRows(drawInSpec([]))).toBe(false);
    expect(hasTableRows({})).toBe(false);
  });
});

describe('restoreDrawInStart()', () => {
  test('seeds the start and the timer', () => {
    const spec = drawInSpec();
    restoreDrawInStart(spec, 1000, 1500);
    expect(signalValue(spec, DRAW_IN_START)).toBe(1000);
    expect(signalValue(spec, ANIMATION_TIMER)).toBe(1500);
  });

  test('leaves the spec untouched without a start', () => {
    const spec = drawInSpec();
    restoreDrawInStart(spec, undefined, 1500);
    expect(spec).toStrictEqual(drawInSpec());
  });
});

describe('getDrawInStart()', () => {
  test('returns the latched start', async () => {
    const spec = drawInSpec();
    expect(getDrawInStart(await viewWithStart(spec, 1000), spec, 900)).toBe(1000);
  });

  test('falls back to the embed time before the start latches', async () => {
    const spec = drawInSpec();
    expect(getDrawInStart(await viewWithStart(spec, 0), spec, 900)).toBe(900);
  });

  test('falls back to the embed time when the embed never resolved', () => {
    expect(getDrawInStart(undefined, drawInSpec(), 900)).toBe(900);
  });

  test('returns undefined when the spec has no data to draw in', async () => {
    const spec = drawInSpec([]);
    expect(getDrawInStart(await viewWithStart(spec, 1000), spec, 900)).toBeUndefined();
  });

  test('returns undefined when the spec has no draw-in', () => {
    const spec: Spec = { data: [{ name: TABLE, values: [{ x: 1 }] }], signals: [{ name: ANIMATION_TIMER, value: 1 }] };
    expect(getDrawInStart(undefined, spec, 900)).toBeUndefined();
  });
});
