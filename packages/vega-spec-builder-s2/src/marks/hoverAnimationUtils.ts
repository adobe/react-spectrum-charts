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
import { AggregateTransform, Data, FormulaTransform, OnTrigger, Signal, SourceData, ValuesData } from 'vega';

import {
  ANIMATION_HOVER_SPEED,
  ANIMATION_THROTTLE,
  HOVER_ACTIVE_TIMER,
  HOVER_ANIMATING,
  HOVER_ANIM_LAST_CHANGE_DATA,
  HOVER_ANIM_STATE_DATA,
  HOVER_FRACTION_DATA,
  HOVER_IDLE_TICKS,
  HOVER_NEUTRAL_TARGET,
  HOVER_TARGET_DATA,
  HOVER_TARGETS,
  HOVER_TIMER,
  SERIES_ID,
  TABLE,
} from '@spectrum-charts/constants';

import { hasSignalByName } from '../signal/signalSpecBuilder';

/** One hover condition. expr must evaluate to 1 | 0 | null. */
export interface HoverMatchRule {
  as: string;
  expr: string;
}

export interface HoverTargetDataOptions {
  name: string;
  groupby: string[];
  rules: HoverMatchRule[];
  source?: string; // defaults to TABLE
}

/**
 * Constructs the data source for checking the hover interaction rules, storing the hover state as target values for each hoverable item.
 * HoverMatchRules are defined per mark and injected into this data source.
 *
 * Example:
 *  Say we run this function with the following options:
 *  - name: 'line0'
 *  - groupby: ['${SERIES_ID}']
 *  - rules: [{ as: 'hoveredMatch', expr: `isValid(${HOVERED_ITEM}) ? (${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : 0) : null` }]
 *  - source: TABLE
 *
 *  This will generate the following data source:
 * ```typescript
 *  { name: 'line0_hoverTargetData', source: TABLE, transform: [
 *      { type: 'aggregate', groupby: ['${SERIES_ID}'] },
 *      { type: 'formula', as: 'hoveredMatch', expr: `isValid(${HOVERED_ITEM}) ? (${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : 0) : null` },
 *      { type: 'formula', as: 'target', expr: `isValid(datum.hoveredMatch) ? datum.hoveredMatch : ${HOVER_NEUTRAL_TARGET}` }
 *  ]}
 * ```
 *
 * @param HoverTargetDataOptions - options for the hover target data
 * @returns SourceData - the data source for the hover target data
 */
export const getHoverTargetData = ({
  name,
  groupby,
  rules,
  source = TABLE,
}: HoverTargetDataOptions): SourceData => {
  const transforms: (AggregateTransform | FormulaTransform)[] = [
    { type: 'aggregate', groupby: groupby },
    ...rules.map<FormulaTransform>((r) => ({ type: 'formula', as: r.as, expr: r.expr })),
  ];
  const targetExpr =
    rules.map((r) => `isValid(datum.${r.as}) ? datum.${r.as}`).join(' : ') + ` : ${HOVER_NEUTRAL_TARGET}`;
  transforms.push({ type: 'formula', as: 'target', expr: targetExpr });

  return { name: `${name}_${HOVER_TARGET_DATA}`, source, transform: transforms };
};

export interface HoverAnimStateOptions {
  name: string;
  keys: string[];
  keyField?: string;
}

/**
 * Tracks the startTime, startValue, and target for each hoverable item.
 * @param HoverAnimStateOptions - options for the hover animation state data
 * @returns ValuesData - the values data for the hover animation state data
 */
export const getHoverAnimStateData = ({ name, keys, keyField = SERIES_ID }: HoverAnimStateOptions): ValuesData => ({
  name: `${name}_${HOVER_ANIM_STATE_DATA}`,
  values: keys.map((id) => ({ [keyField]: id, startTime: 0, startValue: 1, target: 1 })),
  on: keys.map((_, i) => getOnTriggerEntry(name, i)),
});

/**
 * Helper function to get the on-trigger entry for each hoverable item. Records the startTime, startValue, and
 * target for each hoverable item, triggered by the hover target signal. This is used by HoverFractionData to
 * calculate the linear interpolation between the startValue and target.
 * @param name - the name of the mark
 * @param i - the index of the hoverable item
 * @returns OnTrigger - the on trigger entry for the hoverable item
 */
const getOnTriggerEntry = (name: string, i: number): OnTrigger => {
  const animRef = `data('${name}_${HOVER_ANIM_STATE_DATA}')[${i}]`;
  const targetSigRef = `${name}_${HOVER_TARGETS}[${i}]`;
  const fracRef = `(data('${name}_${HOVER_FRACTION_DATA}') || [])[${i}]`;
  const hasChanged = `${targetSigRef} !== ${animRef}.target`;
  const fracExpr = `(${fracRef} || {fraction: 1}).fraction`;
  return {
    trigger: `${name}_${HOVER_TARGETS}`,
    modify: animRef,
    values: `{startTime: ${hasChanged} ? now() : ${animRef}.startTime, startValue: ${hasChanged} ? ${fracExpr} : ${animRef}.startValue, target: ${targetSigRef}}`,
  };
};

/**
 * Calculates the fraction of the animation for each hoverable item. This is the actual linear interpolation between the startValue and target.
 * @param name - the name of the mark
 * @returns SourceData - the source data for the hover fraction data
 */
export const getHoverFractionData = (name: string): SourceData => ({
  name: `${name}_${HOVER_FRACTION_DATA}`,
  source: `${name}_${HOVER_ANIM_STATE_DATA}`,
  transform: [
    {
      type: 'formula',
      as: 'fraction',
      expr: `lerp([datum.startValue, datum.target], datum.target === datum.startValue ? 1 : clamp((${HOVER_ACTIVE_TIMER} - datum.startTime) / (${ANIMATION_HOVER_SPEED} * abs(datum.target - datum.startValue)), 0, 1))`,
    },
  ],
});

/**
 * Adds/extends the shared `hoverAnimLastChangeData` tracker in the data array: a single-row data
 * source recording the timestamp of the most recent hover target change across every animated
 * mark on the chart. Uses the same `trigger`/`modify`/`values` data on-trigger pattern already
 * used by `getHoverAnimStateData` so `hoverAnimating` can tell how recently anything changed
 * without adding new signal-to-signal wiring.
 * @param data - the data array to add the hover animation last change data to
 * @param name - the name of the mark
 */
export const addHoverAnimLastChangeData = (data: Data[], name: string): void => {
  let lastChangeData = data.find((d) => d.name === HOVER_ANIM_LAST_CHANGE_DATA) as ValuesData | undefined;
  if (!lastChangeData) {
    lastChangeData = { name: HOVER_ANIM_LAST_CHANGE_DATA, values: [{ lastChange: 0 }], on: [] };
    data.push(lastChangeData);
  }
  if (lastChangeData.on === undefined) {
    lastChangeData.on = [];
  }
  lastChangeData.on.push({
    trigger: `${name}_${HOVER_TARGETS}`,
    modify: `data('${HOVER_ANIM_LAST_CHANGE_DATA}')[0]`,
    values: '{lastChange: now()}',
  });
};

/**
 * Returns a Vega expression string that evaluates to the current animation fraction (0..0.5..1)
 * for `datum`, looked up by `keyField`. Marks compose this into whatever visual property they
 * want to animate (opacity, strokeWidth, radius, ...). The engine only exposes the raw fraction.
 * @param name - the name of the mark
 * @param keyField - the identity field used to match the animation row (defaults to SERIES_ID)
 * @returns string - the signal for the hover fraction
 */
export const getHoverFractionSignal = (name: string, keyField: string = SERIES_ID): string => {
  const fractionData = `data('${name}_${HOVER_FRACTION_DATA}')`;
  const lookup = `indexof(pluck(${fractionData}, '${keyField}'), datum.${keyField})`;
  // default to the neutral emphasis level when this datum has no animation row
  return `(${fractionData}[${lookup}] || {fraction: ${HOVER_NEUTRAL_TARGET}}).fraction`;
};

/**
 * Reads emphasis level expression (0 = deemphasized, neutral in the middle, 1 = emphasized)
 * and reacts only while a series is being de-emphasized; ignores emphasis. Concretely:
 *   deemphasized (0) -> 0   ·   neutral -> 1   ·   emphasized (1) -> 1
 * (Returns 0 as the series is pushed below neutral, and a flat 1 from neutral upward.)
 */
export const getDeemphasisRamp = (fractionExpr: string): string =>
  // Scales the fraction by 1/HOVER_NEUTRAL_TARGET. The whole expression is then clamped to 0..1.
  `clamp(${fractionExpr} / ${HOVER_NEUTRAL_TARGET}, 0, 1)`;

/**
 * Reads emphasis level expression (0 = deemphasized, neutral in the middle, 1 = emphasized)
 * and reacts only while a series is being emphasized; ignores de-emphasis. Concretely:
 *   deemphasized (0) -> 0   ·   neutral -> 0   ·   emphasized (1) -> 1
 * (Returns a flat 0 from neutral downward, and ramps to 1 as the series is pushed above neutral.)
 */
export const getEmphasisRamp = (fractionExpr: string): string =>
  // Scales the fraction by 1/HOVER_NEUTRAL_TARGET and shifts left by 1. The whole expression is then clamped to 0..1.
  `clamp((${fractionExpr} - ${HOVER_NEUTRAL_TARGET}) / (1 - ${HOVER_NEUTRAL_TARGET}), 0, 1)`;

/**
 * Adds the hover animation signals to the signals array.
 * @param signals - the signals array to add the hover animation signals to
 * @param name - the name of the mark
 */
export const addHoverAnimationSignals = (signals: Signal[], name: string): void => {
  if (!hasSignalByName(signals, HOVER_TIMER)) {
    signals.push({
      name: HOVER_TIMER,
      value: 0,
      on: [{ events: { type: 'timer', throttle: ANIMATION_THROTTLE }, update: 'now()' }],
    });
  }
  if (!hasSignalByName(signals, HOVER_ANIMATING)) {
    signals.push({
      name: HOVER_ANIMATING,
      // + ANIMATION_THROTTLE gives the timer one extra tick of headroom past the nominal
      // duration so a transition is guaranteed to reach its exact resting value before pausing.
      value: false,
      update: `(${HOVER_TIMER} - data('${HOVER_ANIM_LAST_CHANGE_DATA}')[0].lastChange) < ${
        ANIMATION_HOVER_SPEED + ANIMATION_THROTTLE
      }`,
    });
  }
  if (!hasSignalByName(signals, HOVER_IDLE_TICKS)) {
    signals.push({
      name: HOVER_IDLE_TICKS,
      // gates hoverActiveTimer's one-tick grace period below: 0 while animating, 1 on the first
      // idle tick (still grace), 2+ once fully idle. Capped at 2 since nothing checks higher values.
      // Grace period prevents bug with slow machines skipping the final tick of the animation.
      value: 0,
      update: `${HOVER_ANIMATING} ? 0 : min(${HOVER_TIMER} - ${HOVER_TIMER} + ${HOVER_IDLE_TICKS} + 1, 2)`,
    });
  }
  if (!hasSignalByName(signals, HOVER_ACTIVE_TIMER)) {
    signals.push({
      name: HOVER_ACTIVE_TIMER,
      value: 0,
      // tracks hoverTimer while animating, and for one tick past that (hoverIdleTicks <= 1) so the
      // tick that captures the fraction's clamped resting value can't be skipped by a delayed frame
      // on a slow machine; holds its previous value (self-reference) from the second idle tick on
      update: `${HOVER_ANIMATING} || ${HOVER_IDLE_TICKS} <= 1 ? ${HOVER_TIMER} : ${HOVER_ACTIVE_TIMER}`,
    });
  }

  signals.push({
    name: `${name}_${HOVER_TARGETS}`,
    update: `pluck(data('${name}_${HOVER_TARGET_DATA}'), 'target')`,
  });
};
