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

import {AggregateTransform, FormulaTransform, OnTrigger, Signal, SourceData, ValuesData} from 'vega';
import {ANIMATION_HOVER_SPEED, ANIMATION_THROTTLE, FILTERED_TABLE, HOVER_NEUTRAL_TARGET, HOVER_TARGETS, HOVER_TIMER, SERIES_ID} from '@spectrum-charts/constants';
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
    source?: string; // defaults to FILTERED_TABLE
}

/**
 * Constructs the data source for checking the hover interaction rules, storing the hover state as target values for each hoverable item.
 * HoverMatchRules are defined per mark and injected into this data source.
 * @param param0 
 * @returns 
 */
export const getHoverTargetData = ({
    name, groupby, rules, source = FILTERED_TABLE,
}: HoverTargetDataOptions): SourceData => {
    const transforms: (AggregateTransform | FormulaTransform)[] = [
        { type: 'aggregate', groupby: groupby },
        ...rules.map<FormulaTransform>((r) => ({ type: 'formula', as: r.as, expr: r.expr })),
    ];
    const targetExpr = rules.map((r) => `isValid(datum.${r.as}) ? datum.${r.as}`).join(' : ') + ` : ${HOVER_NEUTRAL_TARGET}`;
    transforms.push({ type: 'formula', as: 'target', expr: targetExpr });

    return { name: `${name}_hoverTargetData`, source, transform: transforms };
};


export interface HoverAnimStateOptions {
    name: string;
    keys: string[];
    keyField?: string;
}

/**
 * Tracks the startTime, startValue, and target for each hoverable item.
 * @param param0 
 * @returns 
 */
export const getHoverAnimStateData = ({
    name, keys, keyField = SERIES_ID,
}: HoverAnimStateOptions): ValuesData => ({
    name: `${name}_hoverAnimStateData`,
    values: keys.map((id) => ({ [keyField]: id, startTime: 0, startValue: 1, target: 1 })),
    on: keys.map((_, i) => getOnTriggerEntry(name, i)),
});

/**
 * Helper function to get the on trigger entry for each hoverable item.
 * @param name 
 * @param i 
 * @returns 
 */
const getOnTriggerEntry = (name: string, i: number): OnTrigger => {
    const animRef = `data('${name}_hoverAnimStateData')[${i}]`;
    const targetSigRef = `${name}_${HOVER_TARGETS}[${i}]`;
    const fracRef = `data('${name}_hoverFractionData')[${i}]`;
    const hasChanged = `${targetSigRef} !== ${animRef}.target`;
    const fracExpr = `(${fracRef} || {fraction: 1}).fraction`;
    return {
        trigger: `${name}_${HOVER_TARGETS}`,
        modify: animRef,
        values: `{startTime: ${hasChanged} ? now() : ${animRef}.startTime, startValue: ${hasChanged} ? ${fracExpr} : ${animRef}.startValue, target: ${targetSigRef}}`,
    };  
};

/**
 * Calculates the fraction of the animation for each hoverable item.
 * @param name 
 * @returns 
 */
export const getHoverFractionData = (name: string): SourceData => ({
    name: `${name}_hoverFractionData`,
    source: `${name}_hoverAnimStateData`,
    transform: [
        {
        type: 'formula',
        as: 'fraction',
        expr: `lerp([datum.startValue, datum.target], clamp((${HOVER_TIMER} - datum.startTime) / ${ANIMATION_HOVER_SPEED}, 0, 1))`,
        },
    ],
});

/**
 * Returns a Vega expression string that evaluates to the current animation fraction (0..0.5..1)
 * for `datum`, looked up by `keyField`. Marks compose this into whatever visual property they
 * want to animate (opacity, strokeWidth, radius, ...). The engine only exposes the raw fraction.
 * @param name mark name
 * @param keyField identity field used to match the animation row (defaults to SERIES_ID)
 */
export const getHoverFractionSignal = (name: string, keyField: string = SERIES_ID): string => {
    const fractionData = `data('${name}_hoverFractionData')`;
    const lookup = `indexof(pluck(${fractionData}, '${keyField}'), datum.${keyField})`;
    // default to the neutral emphasis level when this datum has no animation row
    return `(${fractionData}[${lookup}] || {fraction: ${HOVER_NEUTRAL_TARGET}}).fraction`;
};

// The two ramps below take an emphasis-level expression (from getHoverFractionSignal — 0 = deemphasized,
// neutral in the middle, 1 = emphasized) and isolate one direction of change, so a property can react to
// deemphasis OR emphasis without reacting to the other. They are complementary: at neutral one reads 0 and
// the other reads 1. A consumer scales its own values by the ramp, e.g.
//   opacity     = LOW    + (1 - LOW)      * getDeemphasisRamp(...)   // only non-hovered series fade
//   strokeWidth = NORMAL + (HOVER - NORMAL) * getEmphasisRamp(...)   // only the hovered series grows

/**
 * Reacts only while a series is being de-emphasized; ignores emphasis. Concretely:
 *   deemphasized (0) -> 0   ·   neutral -> 1   ·   emphasized (1) -> 1
 * (Returns 0 as the series is pushed below neutral, and a flat 1 from neutral upward.)
 */
export const getDeemphasisRamp = (fractionExpr: string): string =>
    `clamp(${fractionExpr} / ${HOVER_NEUTRAL_TARGET}, 0, 1)`;

/**
 * Reacts only while a series is being emphasized; ignores de-emphasis. Concretely:
 *   deemphasized (0) -> 0   ·   neutral -> 0   ·   emphasized (1) -> 1
 * (Returns a flat 0 from neutral downward, and ramps to 1 as the series is pushed above neutral.)
 */
export const getEmphasisRamp = (fractionExpr: string): string =>
    `clamp((${fractionExpr} - ${HOVER_NEUTRAL_TARGET}) / (1 - ${HOVER_NEUTRAL_TARGET}), 0, 1)`;

/**
 * Adds the hover animation signals to the signals array.
 * @param signals
 * @param name
 * @returns
 */
export const addHoverAnimationSignals = (signals: Signal[], name: string): void => {
    if (!hasSignalByName(signals, HOVER_TIMER)) {
        signals.push({
        name: HOVER_TIMER,
        value: 0,
        on: [{ events: { type: 'timer', throttle: ANIMATION_THROTTLE }, update: 'now()' }],
        });
    }
    signals.push({
        name: `${name}_${HOVER_TARGETS}`,
        update: `pluck(data('${name}_hoverTargetData'), 'target')`,
    });
};