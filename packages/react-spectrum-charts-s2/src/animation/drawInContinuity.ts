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
import { Spec, View } from 'vega';

import { ANIMATION_TIMER, DRAW_IN_START, TABLE } from '@spectrum-charts/core-s2/constants';

// Interim until prop changes are classified by whether they should replay draw-in: a chart draws in once per mount.

/**
 * Checks whether a spec contains the draw-in clock.
 * @param spec - vega spec
 * @returns boolean
 */
export const hasDrawIn = (spec: Spec): boolean => Boolean(spec.signals?.some((signal) => signal.name === DRAW_IN_START));

/**
 * Seeds a rebuilt view with an earlier view's draw-in start so draw-in continues instead of replaying.
 * @param spec - vega spec, mutated in place
 * @param start - draw-in start captured from the previous view
 * @param now - current wall-clock time, so the first paint already reflects the elapsed draw-in
 */
export const restoreDrawInStart = (spec: Spec, start: number | undefined, now: number): void => {
  if (!start) return;
  for (const signal of spec.signals ?? []) {
    if (!('value' in signal)) continue;
    if (signal.name === DRAW_IN_START) signal.value = start;
    else if (signal.name === ANIMATION_TIMER) signal.value = now;
  }
};

/**
 * Checks whether a spec's table has any data rows.
 * @param spec - vega spec
 * @returns boolean
 */
export const hasTableRows = (spec: Spec): boolean => {
  const table = spec.data?.find((data) => data.name === TABLE);
  return Boolean(table && 'values' in table && Array.isArray(table.values) && table.values.length);
};

/**
 * Gets the draw-in start to carry into the next view; undefined until the view latches one, so an unstarted draw-in plays fresh.
 * @param view - vega view, if the embed resolved
 * @param spec - the spec the view was built from
 * @returns start time, or undefined when nothing has started drawing in
 */
export const getDrawInStart = (view: View | undefined, spec: Spec): number | undefined => {
  if (!hasDrawIn(spec) || !hasTableRows(spec)) return undefined;
  const latched = Number(view?.signal(DRAW_IN_START));
  return latched > 0 ? latched : undefined;
};
