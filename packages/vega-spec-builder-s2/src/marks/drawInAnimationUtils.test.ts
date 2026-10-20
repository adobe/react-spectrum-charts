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
  DRAW_IN_DONE,
  DRAW_IN_LABEL_FADE_DURATION_MS,
  FILTERED_TABLE,
  S2_EASE_IN_OUT,
  SERIES_ID,
} from '@spectrum-charts/core-s2/constants';

import { defaultBarOptions } from '../bar/barTestUtils.js';
import { cubicBezier } from '../expressionFunctions/expressionFunctions.js';
import { defaultLineOptions } from '../line/lineTestUtils.js';
import {
  addDrawInClockSignals,
  addDrawInDoneSignal,
  addLineDrawInAnimationSignals,
  applyDrawInReveal,
  addDrawInLabelFadeTimer,
  getBarDrawInData,
  getBarDrawInMetricExpr,
  getBarDrawInSettleProgressExpr,
  getBarDrawInStackFields,
  getBarMarkDataSource,
  getCubicBezierExpr,
  getDrawInLabelFadeExpr,
  getInverseCubicBezierExpr,
  getLineDrawInClip,
  getLineDrawInExtentData,
  getLineDrawInVoronoiData,
  getLineDrawInRevealExpr,
  getLineGeometryClip,
} from './drawInAnimationUtils.js';

/** Evaluates a Vega expression with the given signals/datum in scope. */
const evalExpr = (expr: string, scope: Record<string, unknown> = {}): number =>
  // eslint-disable-next-line no-new-func
  new Function(
    ...Object.keys(scope),
    'clamp',
    'cubicBezier',
    `return ${expr};`
  )(...Object.values(scope), (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi), cubicBezier);

describe('getCubicBezierExpr()', () => {
  test('calls the registered cubicBezier function with the curve control points', () => {
    expect(getCubicBezierExpr([0.45, 0, 0.4, 1], 't')).toBe('cubicBezier(0.45, 0, 0.4, 1, t)');
  });
});

describe('getInverseCubicBezierExpr()', () => {
  test('swaps x and y control points so it undoes the curve', () => {
    expect(getInverseCubicBezierExpr([0, 0, 0.4, 1], 'p')).toBe('cubicBezier(0, 0, 1, 0.4, p)');
    [0.1, 0.5, 0.9].forEach((t) => {
      const eased = cubicBezier(...S2_EASE_IN_OUT, t);
      expect(evalExpr(getInverseCubicBezierExpr(S2_EASE_IN_OUT, 'p'), { p: eased })).toBeCloseTo(t, 4);
    });
  });
});

describe('addDrawInClockSignals()', () => {
  test('adds the shared mount-timer chain', () => {
    const signals: Signal[] = [];
    addDrawInClockSignals(signals, 850);
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
      { name: 'drawInDuration', value: 850 },
      {
        name: 'drawInAnimT',
        value: 0,
        update: `clamp((${ANIMATION_TIMER} - drawInStart) / drawInDuration, 0, 1)`,
      },
      { name: 'drawInAnimTEased', value: 0, update: 'cubicBezier(0.45, 0, 0.4, 1, drawInAnimT)' },
    ]);
  });

  test('does not add a second clock chain when one already exists', () => {
    const signals: Signal[] = [];
    addDrawInClockSignals(signals, 850);
    addDrawInClockSignals(signals, 850);
    expect(signals).toHaveLength(6);
  });

  test('keeps the longest duration so mixed marks finish together', () => {
    const signals: Signal[] = [];
    addDrawInClockSignals(signals, 700);
    addDrawInClockSignals(signals, 850);
    addDrawInClockSignals(signals, 750);
    expect(signals.find((s) => s.name === 'drawInDuration')).toHaveProperty('value', 850);
    expect(signals.filter((s) => s.name === 'drawInAnimTEased')).toHaveLength(1);
  });

  test('eases 0 -> 0 and 1 -> 1', () => {
    const signals: Signal[] = [];
    addDrawInClockSignals(signals, 700);
    const eased = signals.find((s) => s.name === 'drawInAnimTEased') as { update: string };
    expect(evalExpr(eased.update, { drawInAnimT: 0 })).toBe(0);
    expect(evalExpr(eased.update, { drawInAnimT: 1 })).toBe(1);
  });
});

describe('addDrawInLabelFadeTimer()', () => {
  test('keeps the timer running until the last label fade finishes', () => {
    const signals: Signal[] = [];
    addDrawInLabelFadeTimer(signals);
    expect(signals.find((s) => s.name === ANIMATION_ACTIVE)).toHaveProperty(
      'update',
      `(animationTimer - drawInStart < drawInDuration + ${DRAW_IN_LABEL_FADE_DURATION_MS})`
    );
  });
});

describe('getDrawInLabelFadeExpr()', () => {
  const scope = (elapsed: number) => ({ animationTimer: 1000 + elapsed, drawInStart: 1000, drawInDuration: 700 });

  test('fades in linearly once the mark settles', () => {
    const expr = getDrawInLabelFadeExpr('1');
    expect(evalExpr(expr, scope(700))).toBeCloseTo(0);
    expect(evalExpr(expr, scope(700 + DRAW_IN_LABEL_FADE_DURATION_MS / 2))).toBeCloseTo(0.5);
    expect(evalExpr(expr, scope(700 + DRAW_IN_LABEL_FADE_DURATION_MS))).toBe(1);
  });

  test('starts earlier for marks that settle partway through the draw-in', () => {
    const expr = getDrawInLabelFadeExpr('0.3');
    const settleTime = 700 * cubicBezier(0, 0.45, 1, 0.4, 0.3);
    expect(evalExpr(expr, scope(settleTime))).toBeCloseTo(0);
    expect(evalExpr(expr, scope(settleTime + DRAW_IN_LABEL_FADE_DURATION_MS))).toBeCloseTo(1);
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
      'drawInDuration',
      'drawInAnimT',
      'drawInAnimTEased',
      'line0_drawInClipX',
    ]);
    expect(signals.find((s) => s.name === 'drawInDuration')).toHaveProperty('value', 850);
    expect(signals[6]).toStrictEqual({
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
    expect(signals).toHaveLength(7);
  });
});

describe('getLineDrawInClip()', () => {
  test('clips to the sweeping edge and covers the whole plot once finished', () => {
    expect(getLineDrawInClip('line0')).toStrictEqual({
      path: {
        signal:
          "'M' + (width + 1000) + ',-1000' + 'M-1000,-1000' + 'H' + (drawInAnimT >= 1 ? width + 1000 : line0_drawInClipX) + 'V' + (height + 1000) + 'H-1000' + 'Z'",
      },
    });
  });

  test('clips vertically at the plot edges when requested', () => {
    expect(getLineDrawInClip('line0', true)).toStrictEqual({
      path: {
        signal:
          "'M' + (width + 1000) + ',0' + 'M-1000,0' + 'H' + (drawInAnimT >= 1 ? width + 1000 : line0_drawInClipX) + 'V' + height + 'H-1000' + 'Z'",
      },
    });
  });
});

describe('getLineGeometryClip()', () => {
  test.each([
    [{}, {}],
    [{ hasFixedMetricAxis: true }, { clip: true }],
    [{ isDrawInAnimate: true }, { clip: getLineDrawInClip('line0') }],
    [{ isDrawInAnimate: true, hasFixedMetricAxis: true }, { clip: getLineDrawInClip('line0', true) }],
  ])('returns the clip for %j', (options, expected) => {
    expect(getLineGeometryClip({ name: 'line0', ...options })).toStrictEqual(expected);
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

/** Evaluates a bar draw-in expression for a given eased progress and datum. */
const evalBarDrawInExpr = (expr: string, eased: number, datum: Record<string, number> = {}): number =>
  // eslint-disable-next-line no-new-func
  new Function('drawInAnimTEased', 'datum', 'clamp', 'min', 'max', `return ${expr};`)(
    eased,
    datum,
    (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi),
    Math.min,
    Math.max
  );

describe('addDrawInDoneSignal()', () => {
  test('adds a single signal that flips once draw-in finishes', () => {
    const signals: Signal[] = [];
    addDrawInDoneSignal(signals);
    addDrawInDoneSignal(signals);
    expect(signals).toStrictEqual([{ name: DRAW_IN_DONE, value: false, update: 'drawInAnimT >= 1' }]);
  });
});

describe('getLineDrawInVoronoiData()', () => {
  test('filters the inspect data until draw-in finishes', () => {
    expect(getLineDrawInVoronoiData('line0')).toStrictEqual({
      name: 'line0_drawInVoronoiData',
      source: `${FILTERED_TABLE}ForInspect`,
      transform: [{ type: 'filter', expr: DRAW_IN_DONE }],
    });
  });

  test('reads from the provided source', () => {
    expect(getLineDrawInVoronoiData('line0', 'line0_visibleHoverData')).toHaveProperty(
      'source',
      'line0_visibleHoverData'
    );
    expect(
      getLineDrawInExtentData(
        { name: 'line0', dimension: 'datetime', metric: 'value', scaleType: 'time' },
        'line0_visibleHoverData'
      )
    ).toHaveProperty('source', 'line0_visibleHoverData');
  });
});

describe('getLineDrawInExtentData()', () => {
  const extentOptions = { name: 'line0', dimension: 'datetime', metric: 'value' };

  test('keeps each series min/max points until draw-in finishes', () => {
    expect(getLineDrawInExtentData({ ...extentOptions, scaleType: 'time' })).toStrictEqual({
      name: 'line0_drawInExtentData',
      source: `${FILTERED_TABLE}ForInspect`,
      transform: [
        {
          type: 'joinaggregate',
          groupby: [SERIES_ID],
          fields: ['value', 'value', DEFAULT_TRANSFORMED_TIME_DIMENSION, DEFAULT_TRANSFORMED_TIME_DIMENSION],
          ops: ['min', 'max', 'min', 'max'],
          as: ['rscDrawInYMin', 'rscDrawInYMax', 'rscDrawInXMin', 'rscDrawInXMax'],
        },
        {
          type: 'filter',
          expr: `!${DRAW_IN_DONE} && (datum.value === datum.rscDrawInYMin || datum.value === datum.rscDrawInYMax || datum.${DEFAULT_TRANSFORMED_TIME_DIMENSION} === datum.rscDrawInXMin || datum.${DEFAULT_TRANSFORMED_TIME_DIMENSION} === datum.rscDrawInXMax)`,
        },
      ],
    });
  });

  test('uses the dimension field for a linear scale', () => {
    const { transform } = getLineDrawInExtentData({ ...extentOptions, dimension: 'x', scaleType: 'linear' });
    expect(transform?.[0]).toHaveProperty('fields', ['value', 'value', 'x', 'x']);
  });

  test('uses the domain position for a point scale', () => {
    const { transform } = getLineDrawInExtentData({ ...extentOptions, dimension: 'category', scaleType: 'point' });
    expect(transform?.[0]).toStrictEqual({
      type: 'formula',
      as: 'rscDrawInXIndex',
      expr: "indexof(domain('xPoint'), datum.category)",
    });
    expect(transform?.[1]).toHaveProperty('fields', ['value', 'value', 'rscDrawInXIndex', 'rscDrawInXIndex']);
  });
});

describe('getBarDrawInStackFields()', () => {
  test('prefixes the stack total fields with the bar name', () => {
    expect(getBarDrawInStackFields('bar0')).toStrictEqual(['bar0_drawInStackMax', 'bar0_drawInStackMin']);
  });
});

describe('getBarDrawInMetricExpr()', () => {
  test('scales the metric by eased progress for non-stacked bars', () => {
    const expr = getBarDrawInMetricExpr('bar0', 'value', false);
    expect(evalBarDrawInExpr(expr, 0.5, { value: 8 })).toBe(4);
    expect(evalBarDrawInExpr(expr, 1, { value: -8 })).toBe(-8);
  });

  test('fills stacked segments bottom to top', () => {
    const expr = getBarDrawInMetricExpr('bar0', 'value', true);
    const stack = { bar0_drawInStackMax: 10, bar0_drawInStackMin: 0 };
    const bottom = { ...stack, value0: 0, value1: 4 };
    const top = { ...stack, value0: 4, value1: 10 };
    // reach = 3: bottom segment is partially drawn, top has not started
    expect(evalBarDrawInExpr(expr, 0.3, bottom)).toBe(3);
    expect(evalBarDrawInExpr(expr, 0.3, top)).toBe(4);
    // reach = 7: bottom is complete, top is partially drawn
    expect(evalBarDrawInExpr(expr, 0.7, bottom)).toBe(4);
    expect(evalBarDrawInExpr(expr, 0.7, top)).toBe(7);
  });

  test('fills negative stacked segments toward the stack minimum', () => {
    const expr = getBarDrawInMetricExpr('bar0', 'value', true);
    const segment = { bar0_drawInStackMax: 0, bar0_drawInStackMin: -10, value0: -4, value1: -10 };
    expect(evalBarDrawInExpr(expr, 0.2, segment)).toBe(-4);
    expect(evalBarDrawInExpr(expr, 0.7, segment)).toBe(-7);
  });
});

describe('getBarDrawInData()', () => {
  test('derives a data source that computes the animated metric once per row', () => {
    expect(getBarDrawInData('bar0', 'value', false)).toStrictEqual({
      name: 'bar0_drawInData',
      source: FILTERED_TABLE,
      transform: [{ type: 'formula', as: 'bar0_drawInValue', expr: 'datum.value * drawInAnimTEased' }],
    });
  });
});

describe('getBarMarkDataSource()', () => {
  test('reads the draw-in data only when draw-in is animated', () => {
    expect(getBarMarkDataSource(defaultBarOptions)).toBe(FILTERED_TABLE);
    expect(getBarMarkDataSource({ ...defaultBarOptions, isDrawInAnimate: true })).toBe('bar0_drawInData');
  });
});

describe('getBarDrawInSettleProgressExpr()', () => {
  test('settles non-stacked bars at the end of the draw-in', () => {
    expect(getBarDrawInSettleProgressExpr('bar0', 'value', false)).toBe('1');
  });

  test('settles stacked segments when the fill reaches their top', () => {
    const expr = getBarDrawInSettleProgressExpr('bar0', 'value', true);
    const stack = { bar0_drawInStackMax: 10, bar0_drawInStackMin: -5 };
    expect(evalBarDrawInExpr(expr, 0, { ...stack, value1: 4 })).toBeCloseTo(0.4);
    expect(evalBarDrawInExpr(expr, 0, { ...stack, value1: -5 })).toBe(1);
    expect(evalBarDrawInExpr(expr, 0, { bar0_drawInStackMax: 0, bar0_drawInStackMin: 0, value1: 0 })).toBe(1);
  });
});
