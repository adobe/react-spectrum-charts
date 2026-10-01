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

import { ANIMATION_ACTIVE, ANIMATION_THROTTLE, ANIMATION_TIMER } from '@spectrum-charts/constants';

/** Builds a data-only vega expression that is true while an animation still needs ticks, given a clock expression. */
export type AnimationActiveCondition = (clock: string) => string;

/**
 * Appends `condition` to an OR-chain expression unless it is already present.
 * @param expr - the existing expression
 * @param condition - the parenthesized condition to OR in
 * @returns string
 */
const orCondition = (expr: string, condition: string): string =>
  expr.includes(condition) ? expr : `${expr} || ${condition}`;

/**
 * Adds the shared animation timer and `animationActive` signals (if missing) and ORs `getCondition` into both.
 * @param signals - the signals array to add the animation timer to
 * @param getCondition - builds the active condition; event filters cannot read signals, so it may only reference data
 */
export const addAnimationTimerSignal = (signals: Signal[], getCondition: AnimationActiveCondition): void => {
  const filterCondition = `(${getCondition('now()')})`;
  const activeCondition = `(${getCondition(ANIMATION_TIMER)})`;

  const timer = signals.find((signal) => signal.name === ANIMATION_TIMER);
  if (!timer) {
    signals.push({
      name: ANIMATION_TIMER,
      value: 0,
      on: [{ events: { type: 'timer', throttle: ANIMATION_THROTTLE, filter: filterCondition }, update: 'now()' }],
    });
  } else {
    const events = timer.on?.[0]?.events as EventStream | undefined;
    if (events && typeof events.filter === 'string') {
      events.filter = orCondition(events.filter, filterCondition);
    }
  }

  const active = signals.find((signal) => signal.name === ANIMATION_ACTIVE);
  if (!active) {
    signals.push({ name: ANIMATION_ACTIVE, value: true, update: activeCondition });
  } else if ('update' in active && typeof active.update === 'string') {
    active.update = orCondition(active.update, activeCondition);
  }
};
