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
import { Data, Signal, ValuesData } from 'vega';

import {
  ANIMATION_HOVER_SPEED,
  ANIMATION_THROTTLE,
  FILTERED_TABLE,
  HOVER_ACTIVE_TIMER,
  HOVER_ANIMATING,
  HOVER_ANIM_LAST_CHANGE_DATA,
  HOVER_IDLE_TICKS,
  HOVER_NEUTRAL_TARGET,
  HOVER_TARGETS,
  HOVER_TIMER,
  MARK_ID,
  SERIES_ID,
} from '@spectrum-charts/constants';

import {
  addHoverAnimLastChangeData,
  addHoverAnimationSignals,
  getDeemphasisRamp,
  getEmphasisRamp,
  getHoverAnimStateData,
  getHoverFractionData,
  getHoverFractionSignal,
  getHoverTargetData,
} from './hoverAnimationUtils';

describe('getHoverTargetData()', () => {
  test('aggregates by the identity field, adds one formula per rule, and composes the target', () => {
    const result = getHoverTargetData({
      name: 'line0',
      groupby: [SERIES_ID],
      rules: [{ as: 'hoveredMatch', expr: 'HOVER_EXPR' }],
    });
    expect(result).toStrictEqual({
      name: 'line0_hoverTargetData',
      source: FILTERED_TABLE,
      transform: [
        { type: 'aggregate', groupby: [SERIES_ID] },
        { type: 'formula', as: 'hoveredMatch', expr: 'HOVER_EXPR' },
        { type: 'formula', as: 'target', expr: `isValid(datum.hoveredMatch) ? datum.hoveredMatch : ${HOVER_NEUTRAL_TARGET}` },
      ],
    });
  });

  test('composes multiple rules as a first-non-null chain, falling back to the neutral target', () => {
    const result = getHoverTargetData({
      name: 'line0',
      groupby: [SERIES_ID],
      rules: [
        { as: 'a', expr: 'EXPR_A' },
        { as: 'b', expr: 'EXPR_B' },
      ],
    });
    const targetTransform = result.transform?.at(-1);
    expect(targetTransform).toStrictEqual({
      type: 'formula',
      as: 'target',
      expr: `isValid(datum.a) ? datum.a : isValid(datum.b) ? datum.b : ${HOVER_NEUTRAL_TARGET}`,
    });
  });

  test('honors a custom groupby (e.g. mark-id identity) and custom source', () => {
    const result = getHoverTargetData({
      name: 'bar0',
      groupby: [MARK_ID, SERIES_ID],
      rules: [{ as: 'hoveredMatch', expr: 'E' }],
      source: 'someOtherData',
    });
    expect(result.source).toEqual('someOtherData');
    expect(result.transform?.[0]).toStrictEqual({ type: 'aggregate', groupby: [MARK_ID, SERIES_ID] });
  });
});

describe('getHoverAnimStateData()', () => {
  test('creates one row per key with the default series identity field, seeded at rest', () => {
    const result = getHoverAnimStateData({ name: 'line0', keys: ['a', 'b'] });
    expect(result.name).toEqual('line0_hoverAnimStateData');
    expect(result.values).toStrictEqual([
      { [SERIES_ID]: 'a', startTime: 0, startValue: 1, target: 1 },
      { [SERIES_ID]: 'b', startTime: 0, startValue: 1, target: 1 },
    ]);
  });

  test('honors a custom keyField', () => {
    const result = getHoverAnimStateData({ name: 'bar0', keys: ['x'], keyField: MARK_ID });
    expect(result.values).toStrictEqual([{ [MARK_ID]: 'x', startTime: 0, startValue: 1, target: 1 }]);
  });

  test('has no values or triggers when there are no keys', () => {
    const result = getHoverAnimStateData({ name: 'line0', keys: [] });
    expect(result.values).toStrictEqual([]);
    expect(result.on).toStrictEqual([]);
  });

  test('adds one on-trigger per key, keyed to the targets signal and modifying the matching row', () => {
    const result = getHoverAnimStateData({ name: 'line0', keys: ['a', 'b'] });
    expect(result.on).toHaveLength(2);
    const [first, second] = result.on ?? [];
    expect(first.trigger).toEqual(`line0_${HOVER_TARGETS}`);
    expect(first.modify).toEqual(`data('line0_hoverAnimStateData')[0]`);
    expect(second.modify).toEqual(`data('line0_hoverAnimStateData')[1]`);
  });

  test('on-trigger restarts the clock (now()) and captures the current fraction as startValue when the target changes', () => {
    const { on } = getHoverAnimStateData({ name: 'line0', keys: ['a'] });
    const values = (on?.[0] as { values: string }).values;
    // restart time from now() and set the new target
    expect(values).toContain('now()');
    expect(values).toContain(`target: line0_${HOVER_TARGETS}[0]`);
    // startValue is snapshotted from the live fraction so mid-animation reversals are smooth
    // the outer `|| []` guards against `data(...)` itself resolving before hoverFractionData's
    // first computation, not just an out-of-range index
    expect(values).toContain(`((data('line0_hoverFractionData') || [])[0] || {fraction: 1}).fraction`);
  });
});

describe('getHoverFractionData()', () => {
  test('lerps startValue -> target over the animation duration, driven by the gated active timer', () => {
    expect(getHoverFractionData('line0')).toStrictEqual({
      name: 'line0_hoverFractionData',
      source: 'line0_hoverAnimStateData',
      transform: [
        {
          type: 'formula',
          as: 'fraction',
          expr: `lerp([datum.startValue, datum.target], datum.target === datum.startValue ? 1 : clamp((${HOVER_ACTIVE_TIMER} - datum.startTime) / (${ANIMATION_HOVER_SPEED} * abs(datum.target - datum.startValue)), 0, 1))`,
        },
      ],
    });
  });
});

describe('getHoverFractionSignal()', () => {
  test('looks up the row for datum by series identity, defaulting to the neutral level when absent', () => {
    expect(getHoverFractionSignal('line0')).toEqual(
      `(data('line0_hoverFractionData')[indexof(pluck(data('line0_hoverFractionData'), '${SERIES_ID}'), datum.${SERIES_ID})] || {fraction: ${HOVER_NEUTRAL_TARGET}}).fraction`
    );
  });

  test('honors a custom keyField', () => {
    expect(getHoverFractionSignal('bar0', MARK_ID)).toEqual(
      `(data('bar0_hoverFractionData')[indexof(pluck(data('bar0_hoverFractionData'), '${MARK_ID}'), datum.${MARK_ID})] || {fraction: ${HOVER_NEUTRAL_TARGET}}).fraction`
    );
  });
});

describe('emphasis-level ramps', () => {
  test('getDeemphasisRamp / getEmphasisRamp produce the expected clamp expressions', () => {
    expect(getDeemphasisRamp('F')).toEqual(`clamp(F / ${HOVER_NEUTRAL_TARGET}, 0, 1)`);
    expect(getEmphasisRamp('F')).toEqual(`clamp((F - ${HOVER_NEUTRAL_TARGET}) / (1 - ${HOVER_NEUTRAL_TARGET}), 0, 1)`);
  });

  // Evaluate the generated Vega expressions numerically to lock in the actual mapping (clamp is the
  // only function involved, so a JS shim is faithful).
  const evalRamp = (ramp: (expr: string) => string, fraction: number): number => {
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
    // eslint-disable-next-line no-new-func
    return new Function('clamp', `return ${ramp(String(fraction))};`)(clamp);
  };

  test('deemphasis ramp reacts only below neutral: 0 -> 0, neutral -> 1, 1 -> 1', () => {
    expect(evalRamp(getDeemphasisRamp, 0)).toBe(0);
    expect(evalRamp(getDeemphasisRamp, HOVER_NEUTRAL_TARGET)).toBe(1);
    expect(evalRamp(getDeemphasisRamp, 1)).toBe(1);
  });

  test('emphasis ramp reacts only above neutral: 0 -> 0, neutral -> 0, 1 -> 1', () => {
    expect(evalRamp(getEmphasisRamp, 0)).toBe(0);
    expect(evalRamp(getEmphasisRamp, HOVER_NEUTRAL_TARGET)).toBe(0);
    expect(evalRamp(getEmphasisRamp, 1)).toBe(1);
  });

  test('the two ramps are complementary at neutral (0 vs 1) and split the range symmetrically', () => {
    expect(evalRamp(getDeemphasisRamp, HOVER_NEUTRAL_TARGET / 2)).toBeCloseTo(0.5);
    expect(evalRamp(getEmphasisRamp, HOVER_NEUTRAL_TARGET + (1 - HOVER_NEUTRAL_TARGET) / 2)).toBeCloseTo(0.5);
  });
});

describe('addHoverAnimationSignals()', () => {
  test('adds the shared timer, the idle gate signals, and a per-mark targets signal', () => {
    const signals: Signal[] = [];
    addHoverAnimationSignals(signals, 'line0');
    expect(signals).toStrictEqual([
      {
        name: HOVER_TIMER,
        value: 0,
        on: [{ events: { type: 'timer', throttle: ANIMATION_THROTTLE }, update: 'now()' }],
      },
      {
        name: HOVER_ANIMATING,
        value: false,
        update: `(${HOVER_TIMER} - data('${HOVER_ANIM_LAST_CHANGE_DATA}')[0].lastChange) < ${
          ANIMATION_HOVER_SPEED + ANIMATION_THROTTLE
        }`,
      },
      {
        name: HOVER_IDLE_TICKS,
        value: 0,
        update: `${HOVER_ANIMATING} ? 0 : min(${HOVER_TIMER} - ${HOVER_TIMER} + ${HOVER_IDLE_TICKS} + 1, 2)`,
      },
      {
        name: HOVER_ACTIVE_TIMER,
        value: 0,
        update: `${HOVER_ANIMATING} || ${HOVER_IDLE_TICKS} <= 1 ? ${HOVER_TIMER} : ${HOVER_ACTIVE_TIMER}`,
      },
      {
        name: `line0_${HOVER_TARGETS}`,
        update: `pluck(data('line0_hoverTargetData'), 'target')`,
      },
    ]);
  });

  test('does not add a second timer or gate signal when one already exists', () => {
    const signals: Signal[] = [];
    addHoverAnimationSignals(signals, 'line0');
    addHoverAnimationSignals(signals, 'line1');
    // one shared timer, one shared gate pair, one targets signal per mark
    expect(signals.filter((s) => s.name === HOVER_TIMER)).toHaveLength(1);
    expect(signals.filter((s) => s.name === HOVER_ANIMATING)).toHaveLength(1);
    expect(signals.filter((s) => s.name === HOVER_IDLE_TICKS)).toHaveLength(1);
    expect(signals.filter((s) => s.name === HOVER_ACTIVE_TIMER)).toHaveLength(1);
    expect(signals.map((s) => s.name)).toEqual([
      HOVER_TIMER,
      HOVER_ANIMATING,
      HOVER_IDLE_TICKS,
      HOVER_ACTIVE_TIMER,
      `line0_${HOVER_TARGETS}`,
      `line1_${HOVER_TARGETS}`,
    ]);
  });

  test('hoverAnimating goes false once elapsed time since the last change exceeds speed + throttle', () => {
    const signals: Signal[] = [];
    addHoverAnimationSignals(signals, 'line0');
    const animating = signals.find((s) => s.name === HOVER_ANIMATING) as { update: string } | undefined;
    const evalUpdate = (elapsed: number): boolean => {
      const dataFn = () => [{ lastChange: 0 }];
      // eslint-disable-next-line no-new-func
      return new Function(HOVER_TIMER, 'data', `return ${animating?.update};`)(elapsed, dataFn);
    };
    expect(evalUpdate(0)).toBe(true);
    expect(evalUpdate(ANIMATION_HOVER_SPEED + ANIMATION_THROTTLE - 1)).toBe(true);
    expect(evalUpdate(ANIMATION_HOVER_SPEED + ANIMATION_THROTTLE)).toBe(false);
  });

  test('hoverIdleTicks resets to 0 while animating and counts up otherwise, capped at 2', () => {
    const signals: Signal[] = [];
    addHoverAnimationSignals(signals, 'line0');
    const idleTicks = signals.find((s) => s.name === HOVER_IDLE_TICKS) as { update: string } | undefined;
    const evalUpdate = (animating: boolean, previous: number, timer = 0): number => {
      // eslint-disable-next-line no-new-func
      return new Function(HOVER_ANIMATING, HOVER_IDLE_TICKS, HOVER_TIMER, 'min', `return ${idleTicks?.update};`)(
        animating,
        previous,
        timer,
        Math.min
      );
    };
    expect(evalUpdate(true, 3)).toBe(0);
    expect(evalUpdate(false, 0)).toBe(1);
    expect(evalUpdate(false, 1)).toBe(2);
    expect(evalUpdate(false, 2)).toBe(2); // stays capped, doesn't grow unbounded
  });

  test('hoverIdleTicks depends on hoverTimer so it keeps getting scheduled once hoverAnimating stabilizes', () => {
    // regression guard: hoverAnimating stops pulsing once its value stops changing (Vega skips
    // propagation for unchanged operator values), so hoverIdleTicks needs its own dependency on
    // something that always pulses every tick -- otherwise it gets stuck at 1 forever and
    // hoverActiveTimer's `<= 1` freeze condition never advances past true. See design doc §3f.
    const signals: Signal[] = [];
    addHoverAnimationSignals(signals, 'line0');
    const idleTicks = signals.find((s) => s.name === HOVER_IDLE_TICKS) as { update: string } | undefined;
    expect(idleTicks?.update).toContain(HOVER_TIMER);
  });

  test('hoverActiveTimer tracks hoverTimer while animating, for one tick past that, and freezes otherwise', () => {
    const signals: Signal[] = [];
    addHoverAnimationSignals(signals, 'line0');
    const activeTimer = signals.find((s) => s.name === HOVER_ACTIVE_TIMER) as { update: string } | undefined;
    const evalUpdate = (animating: boolean, idleTicks: number, timer: number, previous: number): number => {
      // eslint-disable-next-line no-new-func
      return new Function(
        HOVER_ANIMATING,
        HOVER_IDLE_TICKS,
        HOVER_TIMER,
        HOVER_ACTIVE_TIMER,
        `return ${activeTimer?.update};`
      )(animating, idleTicks, timer, previous);
    };
    // still animating: tracks the timer regardless of idle tick count
    expect(evalUpdate(true, 0, 500, 300)).toBe(500);
    // just went idle this tick (hoverIdleTicks is 1): still tracks the timer one last time, so a
    // delayed frame that jumps straight from mid-transition to idle can't skip the resting value
    expect(evalUpdate(false, 1, 500, 300)).toBe(500);
    // idle for a second consecutive tick: frozen at whatever value it last tracked
    expect(evalUpdate(false, 2, 500, 300)).toBe(300);
  });
});

describe('addHoverAnimLastChangeData()', () => {
  test('creates the shared tracker data source, seeded at rest, with an on-trigger for the mark', () => {
    const data: Data[] = [];
    addHoverAnimLastChangeData(data, 'line0');
    expect(data).toStrictEqual([
      {
        name: HOVER_ANIM_LAST_CHANGE_DATA,
        values: [{ lastChange: 0 }],
        on: [
          {
            trigger: `line0_${HOVER_TARGETS}`,
            modify: `data('${HOVER_ANIM_LAST_CHANGE_DATA}')[0]`,
            values: '{lastChange: now()}',
          },
        ],
      },
    ]);
  });

  test('extends the existing tracker with another on-trigger instead of duplicating the data source', () => {
    const data: Data[] = [];
    addHoverAnimLastChangeData(data, 'line0');
    addHoverAnimLastChangeData(data, 'line1');
    expect(data.filter((d) => d.name === HOVER_ANIM_LAST_CHANGE_DATA)).toHaveLength(1);
    const [tracker] = data as ValuesData[];
    expect(tracker.on).toHaveLength(2);
    expect(tracker.on?.[0].trigger).toEqual(`line0_${HOVER_TARGETS}`);
    expect(tracker.on?.[1].trigger).toEqual(`line1_${HOVER_TARGETS}`);
  });

  test('initializes `on` when an existing entry was constructed without one', () => {
    const data: Data[] = [{ name: HOVER_ANIM_LAST_CHANGE_DATA, values: [{ lastChange: 0 }] }];
    addHoverAnimLastChangeData(data, 'line0');
    const [tracker] = data as ValuesData[];
    expect(tracker.on).toHaveLength(1);
    expect(tracker.on?.[0].trigger).toEqual(`line0_${HOVER_TARGETS}`);
  });
});