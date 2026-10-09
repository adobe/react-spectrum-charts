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
import { Clip, NumericValueRef, ProductionRule, Signal } from 'vega';

import {
  ANIMATION_TIMER,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  DRAW_IN_ANIM_T,
  DRAW_IN_ANIM_T_EASED,
  DRAW_IN_ANIMATION_DURATION_MS,
  DRAW_IN_CLIP_OVERFLOW,
  DRAW_IN_CLIP_X,
  DRAW_IN_START,
} from '@spectrum-charts/core-s2/constants';

import { getScaleName } from '../scale/scaleSpecBuilder.js';
import { hasSignalByName } from '../signal/signalSpecBuilder.js';
import { LineSpecOptions, ScaleType } from '../types/index.js';
import { addAnimationTimerSignal } from './animationTimerUtils.js';

/**
 * Gets the condition that is true until the draw-in animation has finished.
 * @returns string
 */
export const getDrawInAnimationActiveCondition = (): string => `${DRAW_IN_ANIM_T} < 1`;

/**
 * Adds the shared mount-timer chain (`drawInStart` -> `drawInAnimT` -> `drawInAnimTEased`) every
 * draw-in animated mark reads from.
 * `drawInStart` - captures the animation timer's first tick
 * `drawInAnimT` - the animation progess (t) from 0-1
 * `drawInAnimTEased` - the animation progress with easing applied. Current easing formula is in-out quadratic
 */
export const addDrawInClockSignals = (signals: Signal[]): void => {
  addAnimationTimerSignal(signals, getDrawInAnimationActiveCondition, true);
  if (!hasSignalByName(signals, DRAW_IN_START)) {
    // starts on the first timer tick (the first painted frame) so a slow mount doesn't consume the animation
    signals.push({
      name: DRAW_IN_START,
      value: 0,
      on: [{ events: { signal: ANIMATION_TIMER }, update: `${DRAW_IN_START} || ${ANIMATION_TIMER}` }],
    });
  }
  if (!hasSignalByName(signals, DRAW_IN_ANIM_T)) {
    signals.push({
      name: DRAW_IN_ANIM_T,
      value: 0,
      update: `clamp((${ANIMATION_TIMER} - ${DRAW_IN_START}) / ${DRAW_IN_ANIMATION_DURATION_MS}, 0, 1)`,
    });
  }
  if (!hasSignalByName(signals, DRAW_IN_ANIM_T_EASED)) {
    signals.push({
      name: DRAW_IN_ANIM_T_EASED,
      update: `${DRAW_IN_ANIM_T} < 0.5 ? 2 * pow(${DRAW_IN_ANIM_T}, 2) : 1 - pow(-2 * ${DRAW_IN_ANIM_T} + 2, 2) / 2`,
    });
  }
};

/**
 * Gets the pixel positions of the first and last dimension values on the line's x scale.
 * @param scaleType
 * @returns [start, end] pixel expressions
 */
const getDrawInPixelExtent = (scaleType: ScaleType): [string, string] => {
  const scaleName = getScaleName('x', scaleType);
  if (scaleType === 'point') {
    return [`scale('${scaleName}', domain('${scaleName}')[0])`, `scale('${scaleName}', peek(domain('${scaleName}')))`];
  }
  return [
    `scale('${scaleName}', extent(domain('${scaleName}'))[0])`,
    `scale('${scaleName}', extent(domain('${scaleName}'))[1])`,
  ];
};

/**
 * Adds the line draw-in signals: the shared clock chain plus this line's sweeping clip edge in pixels.
 * @param signals
 * @param options
 */
export const addLineDrawInAnimationSignals = (signals: Signal[], { name, scaleType }: LineSpecOptions): void => {
  addDrawInClockSignals(signals);
  const clipXSignal = `${name}_${DRAW_IN_CLIP_X}`;
  if (hasSignalByName(signals, clipXSignal)) return;
  const [start, end] = getDrawInPixelExtent(scaleType);
  signals.push({ name: clipXSignal, update: `lerp([${start}, ${end}], ${DRAW_IN_ANIM_T_EASED})` });
};

/**
 * Gets the clip for marks revealed by the line draw-in; it covers the whole plot once the animation finishes.
 * @param name - line name
 * @returns Clip
 */
export const getLineDrawInClip = (name: string): Clip => {
  // overflow past the plot edges so strokes and points on an edge aren't cut in half
  const o = DRAW_IN_CLIP_OVERFLOW;
  // the sweeping edge while animating, then the full plot width so nothing stays clipped
  const right = `(${DRAW_IN_ANIM_T} >= 1 ? width + ${o} : ${name}_${DRAW_IN_CLIP_X})`;
  const bottom = `(height + ${o})`;
  // SVG path for the rectangle (-o, -o) to (right, bottom): move to top-left, right, down, left, close
  return { path: { signal: `'M-${o},-${o}' + 'H' + ${right} + 'V' + ${bottom} + 'H-${o}' + 'Z'` } };
};

/**
 * Gets the reveal (0 or 1) for a point; it shows once the line draw-in clip edge reaches it.
 * @param name - line name
 * @param scaleType
 * @param dimension
 * @returns expression string
 */
export const getLineDrawInRevealExpr = (name: string, scaleType: ScaleType, dimension: string): string => {
  const scaleName = getScaleName('x', scaleType);
  const field = scaleType === 'time' ? DEFAULT_TRANSFORMED_TIME_DIMENSION : dimension;
  // half-pixel tolerance so float error can't hide the first or last point
  return `(${name}_${DRAW_IN_CLIP_X} >= scale('${scaleName}', datum.${field}) - 0.5 ? 1 : 0)`;
};

/**
 * Multiplies one opacity rule entry by a reveal expression, keeping its test and other properties.
 * @param ref - opacity rule entry
 * @param reveal - 0-1 reveal expression
 * @returns NumericValueRef
 */
const multiplyRefByReveal = (ref: NumericValueRef, reveal: string): NumericValueRef => {
  if ('signal' in ref && typeof ref.signal === 'string') {
    return { ...ref, signal: `(${ref.signal}) * ${reveal}` };
  }
  if ('value' in ref && typeof ref.value === 'number') {
    // a value can't hold an expression, so swap it for an equivalent signal
    const { value, ...otherProps } = ref;
    return { ...otherProps, signal: `${value} * ${reveal}` };
  }
  return ref;
};

/**
 * Hides a mark until the draw-in reaches it by multiplying every entry of its opacity rule by the reveal.
 * @param rule - opacity production rule (a single entry or a list of tested entries)
 * @param reveal - 0-1 reveal expression
 * @returns ProductionRule<NumericValueRef>
 */
export const applyDrawInReveal = (
  rule: ProductionRule<NumericValueRef>,
  reveal: string
): ProductionRule<NumericValueRef> => {
  // multiply instead of replacing the rule so hover and highlight opacity still apply
  const entries = Array.isArray(rule) ? rule : [rule];
  const revealed = entries.map((ref) => multiplyRefByReveal(ref, reveal));
  return Array.isArray(rule) ? revealed : revealed[0];
};
