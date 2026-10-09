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
import { Signal } from 'vega';

import {
  ANIMATION_ACTIVE,
  ANIMATION_THROTTLE,
  ANIMATION_TIMER,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  DRAW_IN_ANIMATION_DURATION_MS,
} from '@spectrum-charts/core-s2/constants';

import { defaultLineOptions } from '../line/lineTestUtils.js';
import {
  addDrawInClockSignals,
  addLineDrawInAnimationSignals,
  applyDrawInReveal,
  getLineDrawInClip,
  getLineDrawInRevealExpr,
} from './drawInAnimationUtils.js';

describe('addDrawInClockSignals()', () => {
  test('adds the shared mount-timer chain', () => {
    const signals: Signal[] = [];
    addDrawInClockSignals(signals);
    expect(signals).toStrictEqual([
      {
        name: ANIMATION_TIMER,
        value: 0,
        on: [{ events: { type: 'timer', throttle: ANIMATION_THROTTLE }, update: 'now()' }],
      },
      { name: ANIMATION_ACTIVE, value: true, update: '(drawInAnimT < 1)' },
      {
        name: 'drawInStart',
        value: 0,
        on: [{ events: { signal: ANIMATION_TIMER }, update: 'drawInStart || animationTimer' }],
      },
      {
        name: 'drawInAnimT',
        value: 0,
        update: `clamp((${ANIMATION_TIMER} - drawInStart) / ${DRAW_IN_ANIMATION_DURATION_MS}, 0, 1)`,
      },
      {
        name: 'drawInAnimTEased',
        update: 'drawInAnimT < 0.5 ? 2 * pow(drawInAnimT, 2) : 1 - pow(-2 * drawInAnimT + 2, 2) / 2',
      },
    ]);
  });

  test('does not add a second clock chain when one already exists', () => {
    const signals: Signal[] = [];
    addDrawInClockSignals(signals);
    addDrawInClockSignals(signals);
    expect(signals).toHaveLength(5);
  });

  test('eases 0 -> 0, 1 -> 1, and the midpoint -> 0.5', () => {
    const signals: Signal[] = [];
    addDrawInClockSignals(signals);
    const eased = signals.find((s) => s.name === 'drawInAnimTEased') as { update: string } | undefined;
    const evalEased = (t: number): number => {
      // eslint-disable-next-line no-new-func
      return new Function('drawInAnimT', 'pow', `return ${eased?.update};`)(t, Math.pow);
    };
    expect(evalEased(0)).toBe(0);
    expect(evalEased(1)).toBe(1);
    expect(evalEased(0.5)).toBeCloseTo(0.5);
  });
});

describe('addLineDrawInAnimationSignals()', () => {
  test('adds the clock chain and a clip edge sweeping the time scale range', () => {
    const signals: Signal[] = [];
    addLineDrawInAnimationSignals(signals, defaultLineOptions);
    expect(signals.map((s) => s.name)).toEqual([
      ANIMATION_TIMER,
      ANIMATION_ACTIVE,
      'drawInStart',
      'drawInAnimT',
      'drawInAnimTEased',
      'line0_drawInClipX',
    ]);
    expect(signals[5]).toStrictEqual({
      name: 'line0_drawInClipX',
      update:
        "lerp([scale('xTime', extent(domain('xTime'))[0]), scale('xTime', extent(domain('xTime'))[1])], drawInAnimTEased)",
    });
  });

  test('uses the first and last domain values for point scales', () => {
    const signals: Signal[] = [];
    addLineDrawInAnimationSignals(signals, { ...defaultLineOptions, scaleType: 'point' });
    expect(signals.at(-1)).toHaveProperty(
      'update',
      "lerp([scale('xPoint', domain('xPoint')[0]), scale('xPoint', peek(domain('xPoint')))], drawInAnimTEased)"
    );
  });

  test('does not add duplicate signals', () => {
    const signals: Signal[] = [];
    addLineDrawInAnimationSignals(signals, defaultLineOptions);
    addLineDrawInAnimationSignals(signals, defaultLineOptions);
    expect(signals).toHaveLength(6);
  });
});

describe('getLineDrawInClip()', () => {
  test('clips to the sweeping edge and covers the whole plot once finished', () => {
    expect(getLineDrawInClip('line0')).toStrictEqual({
      path: {
        signal:
          "'M-1000,-1000' + 'H' + (drawInAnimT >= 1 ? width + 1000 : line0_drawInClipX) + 'V' + (height + 1000) + 'H-1000' + 'Z'",
      },
    });
  });
});

describe('getLineDrawInRevealExpr()', () => {
  test('uses the transformed time field for time scales', () => {
    expect(getLineDrawInRevealExpr('line0', 'time', 'datetime')).toBe(
      `(line0_drawInClipX >= scale('xTime', datum.${DEFAULT_TRANSFORMED_TIME_DIMENSION}) - 0.5 ? 1 : 0)`
    );
  });

  test('uses the dimension for other scales', () => {
    expect(getLineDrawInRevealExpr('line0', 'linear', 'x')).toBe(
      "(line0_drawInClipX >= scale('xLinear', datum.x) - 0.5 ? 1 : 0)"
    );
  });
});

describe('applyDrawInReveal()', () => {
  test('multiplies signal and value refs and leaves other refs alone', () => {
    expect(
      applyDrawInReveal([{ test: 'a', signal: 'b' }, { test: 'c', value: 0.5 }, { field: 'd' }], 'r')
    ).toStrictEqual([{ test: 'a', signal: '(b) * r' }, { test: 'c', signal: '0.5 * r' }, { field: 'd' }]);
  });

  test('handles a single ref', () => {
    expect(applyDrawInReveal({ value: 1 }, 'r')).toStrictEqual({ signal: '1 * r' });
  });
});

