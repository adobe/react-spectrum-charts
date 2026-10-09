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
import { EventStream, Signal } from 'vega';

import { ANIMATION_ACTIVE, ANIMATION_THROTTLE, ANIMATION_TIMER } from '@spectrum-charts/core-s2/constants';

import { addAnimationTimerSignal } from './animationTimerUtils.js';

const getTimerFilter = (signals: Signal[]) =>
  (signals.find((s) => s.name === ANIMATION_TIMER)?.on?.[0].events as EventStream).filter;
const getActiveUpdate = (signals: Signal[]) =>
  (signals.find((s) => s.name === ANIMATION_ACTIVE) as { update?: string } | undefined)?.update;
const condition = (name: string) => (clock: string) => `${name}(${clock})`;

describe('addAnimationTimerSignal()', () => {
  test('adds the timer filtered by the now() condition and animationActive using the timer as its clock', () => {
    const signals: Signal[] = [];
    addAnimationTimerSignal(signals, condition('a'));
    expect(signals).toStrictEqual([
      {
        name: ANIMATION_TIMER,
        value: 0,
        on: [{ events: { type: 'timer', throttle: ANIMATION_THROTTLE, filter: '(a(now()))' }, update: 'now()' }],
      },
      { name: ANIMATION_ACTIVE, value: true, update: `(a(${ANIMATION_TIMER}))` },
    ]);
  });

  test('ORs additional conditions into the existing timer filter and animationActive', () => {
    const signals: Signal[] = [];
    addAnimationTimerSignal(signals, condition('a'));
    addAnimationTimerSignal(signals, condition('b'));
    expect(signals).toHaveLength(2);
    expect(getTimerFilter(signals)).toEqual('(a(now())) || (b(now()))');
    expect(getActiveUpdate(signals)).toEqual(`(a(${ANIMATION_TIMER})) || (b(${ANIMATION_TIMER}))`);
  });

  test('does not duplicate a condition that is already present', () => {
    const signals: Signal[] = [];
    addAnimationTimerSignal(signals, condition('a'));
    addAnimationTimerSignal(signals, condition('a'));
    expect(getTimerFilter(signals)).toEqual('(a(now()))');
    expect(getActiveUpdate(signals)).toEqual(`(a(${ANIMATION_TIMER}))`);
  });

  test('leaves the timer unfiltered when the condition reads signals', () => {
    const signals: Signal[] = [];
    addAnimationTimerSignal(signals, condition('a'), true);
    expect(getTimerFilter(signals)).toBeUndefined();
    expect(getActiveUpdate(signals)).toEqual(`(a(${ANIMATION_TIMER}))`);
  });

  test('removes an existing timer filter when a signal-reading condition is added', () => {
    const signals: Signal[] = [];
    addAnimationTimerSignal(signals, condition('a'));
    addAnimationTimerSignal(signals, condition('b'), true);
    expect(getTimerFilter(signals)).toBeUndefined();
    expect(getActiveUpdate(signals)).toEqual(`(a(${ANIMATION_TIMER})) || (b(${ANIMATION_TIMER}))`);
  });

  test('leaves an existing timer without a string filter untouched', () => {
    const signals: Signal[] = [
      { name: ANIMATION_TIMER, value: 0, on: [{ events: { type: 'timer' }, update: 'now()' }] },
    ];
    addAnimationTimerSignal(signals, condition('a'));
    expect(getTimerFilter(signals)).toBeUndefined();
    expect(getActiveUpdate(signals)).toEqual(`(a(${ANIMATION_TIMER}))`);
  });
});
