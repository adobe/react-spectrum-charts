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
import { Clip, NewSignal, NumericValueRef, ProductionRule, Signal, SourceData, Transforms } from 'vega';

import {
  ANIMATION_TIMER,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  CubicBezierEasing,
  DRAW_IN_ANIM_T,
  DRAW_IN_ANIM_T_EASED,
  DRAW_IN_CLIP_OVERFLOW,
  DRAW_IN_CLIP_X,
  DRAW_IN_DONE,
  DRAW_IN_DURATION,
  DRAW_IN_EXTENT_DATA,
  DRAW_IN_LABEL_FADE_DURATION_MS,
  DRAW_IN_START,
  DRAW_IN_SWEEP_DURATION_MS,
  DRAW_IN_VORONOI_DATA,
  FILTERED_TABLE,
  S2_EASE_IN_OUT,
  SERIES_ID,
} from '@spectrum-charts/core-s2/constants';

import { getScaleName } from '../scale/scaleSpecBuilder.js';
import { hasSignalByName } from '../signal/signalSpecBuilder.js';
import { BarSpecOptions, LineSpecOptions, ScaleType } from '../types/index.js';
import { addAnimationTimerSignal } from './animationTimerUtils.js';

/**
 * Gets the condition that is true until the draw-in animation has finished.
 * @returns string
 */
export const getDrawInAnimationActiveCondition = (): string => `${DRAW_IN_ANIM_T} < 1`;

/**
 * Gets an expression that eases `t` along a cubic-bezier curve.
 * @param curve
 * @param t - expression for linear 0-1 progress
 * @returns expression string
 */
export const getCubicBezierExpr = (curve: CubicBezierEasing, t: string): string => `cubicBezier(${curve.join(', ')}, ${t})`;

/**
 * Gets an expression for the linear progress at which the curve reaches eased progress `p` (the curve mirrored on y = x).
 * @param curve
 * @param p - expression for eased 0-1 progress
 * @returns expression string
 */
export const getInverseCubicBezierExpr = ([x1, y1, x2, y2]: CubicBezierEasing, p: string): string =>
  getCubicBezierExpr([y1, x1, y2, x2], p);

/**
 * Adds the shared mount-timer chain (`drawInStart` -> `drawInAnimT` -> eased progress) every draw-in animated mark
 * reads from. The chart's draw-in lasts as long as its longest mark so mixed marks finish together.
 * @param signals
 * @param durationMs - this mark's draw-in duration
 */
export const addDrawInClockSignals = (signals: Signal[], durationMs: number): void => {
  addAnimationTimerSignal(signals, getDrawInAnimationActiveCondition, true);
  if (!hasSignalByName(signals, DRAW_IN_START)) {
    // starts on the first timer tick (the first painted frame) so a slow mount doesn't consume the animation
    signals.push({
      name: DRAW_IN_START,
      value: 0,
      on: [{ events: { signal: ANIMATION_TIMER }, update: `${DRAW_IN_START} || ${ANIMATION_TIMER}` }],
    });
  }
  const duration = signals.find((signal): signal is NewSignal => signal.name === DRAW_IN_DURATION && 'value' in signal);
  if (duration) {
    duration.value = Math.max(Number(duration.value), durationMs);
  } else {
    signals.push({ name: DRAW_IN_DURATION, value: durationMs });
  }
  if (!hasSignalByName(signals, DRAW_IN_ANIM_T)) {
    signals.push({
      name: DRAW_IN_ANIM_T,
      value: 0,
      update: `clamp((${ANIMATION_TIMER} - ${DRAW_IN_START}) / ${DRAW_IN_DURATION}, 0, 1)`,
    });
  }
  if (!hasSignalByName(signals, DRAW_IN_ANIM_T_EASED)) {
    signals.push({ name: DRAW_IN_ANIM_T_EASED, value: 0, update: getCubicBezierExpr(S2_EASE_IN_OUT, DRAW_IN_ANIM_T) });
  }
};

/**
 * Gets the condition that keeps the timer ticking until labels finish fading in after the draw-in.
 * @param clock - expression for the current time
 * @returns string
 */
export const getDrawInLabelFadeActiveCondition = (clock: string): string =>
  `${clock} - ${DRAW_IN_START} < ${DRAW_IN_DURATION} + ${DRAW_IN_LABEL_FADE_DURATION_MS}`;

/**
 * Keeps the animation timer running past the draw-in so the last label's fade can finish.
 * @param signals
 */
export const addDrawInLabelFadeTimer = (signals: Signal[]): void =>
  addAnimationTimerSignal(signals, getDrawInLabelFadeActiveCondition, true);

/**
 * Gets a label's linear 0-1 fade-in, which starts once its own mark has finished drawing.
 * @param settleProgress - expression for the eased progress at which the label's mark finishes
 * @returns expression string
 */
export const getDrawInLabelFadeExpr = (settleProgress: string): string => {
  const settleTime = `${DRAW_IN_DURATION} * ${getInverseCubicBezierExpr(S2_EASE_IN_OUT, settleProgress)}`;
  const elapsed = `${ANIMATION_TIMER} - ${DRAW_IN_START}`;
  return `clamp((${elapsed} - ${settleTime}) / ${DRAW_IN_LABEL_FADE_DURATION_MS}, 0, 1)`;
};

/**
 * Adds the signal that flips once when draw-in finishes, for marks that should only update at the end.
 * @param signals
 */
export const addDrawInDoneSignal = (signals: Signal[]): void => {
  if (!hasSignalByName(signals, DRAW_IN_DONE)) {
    signals.push({ name: DRAW_IN_DONE, value: false, update: `${DRAW_IN_ANIM_T} >= 1` });
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
  addDrawInClockSignals(signals, DRAW_IN_SWEEP_DURATION_MS);
  const clipXSignal = `${name}_${DRAW_IN_CLIP_X}`;
  if (hasSignalByName(signals, clipXSignal)) return;
  const [start, end] = getDrawInPixelExtent(scaleType);
  signals.push({ name: clipXSignal, update: `lerp([${start}, ${end}], ${DRAW_IN_ANIM_T_EASED})` });
};

/**
 * Gets the name of the data that feeds a line's voronoi once draw-in finishes.
 * @param name - line name
 * @returns string
 */
export const getLineDrawInVoronoiDataName = (name: string): string => `${name}_${DRAW_IN_VORONOI_DATA}`;

/**
 * Gets the data that feeds a line's voronoi, empty until draw-in finishes so the hover layer isn't repainted every frame.
 * @param name - line name
 * @returns SourceData
 */
export const getLineDrawInVoronoiData = (name: string): SourceData => ({
  name: getLineDrawInVoronoiDataName(name),
  source: `${FILTERED_TABLE}ForInspect`,
  transform: [{ type: 'filter', expr: DRAW_IN_DONE }],
});

/**
 * Gets the name of the data that reserves a line's voronoi point bounds during draw-in.
 * @param name - line name
 * @returns string
 */
export const getLineDrawInExtentDataName = (name: string): string => `${name}_${DRAW_IN_EXTENT_DATA}`;

/**
 * Gets each series' min/max points on both axes until draw-in finishes, which span the same bounds as every point.
 * @param options - line name, dimension, metric and scale type
 * @returns SourceData
 */
export const getLineDrawInExtentData = ({
  dimension,
  metric,
  name,
  scaleType,
}: Pick<LineSpecOptions, 'dimension' | 'metric' | 'name' | 'scaleType'>): SourceData => {
  const transform: Transforms[] = [];
  let xField = scaleType === 'time' ? DEFAULT_TRANSFORMED_TIME_DIMENSION : dimension;
  if (scaleType === 'point') {
    // point scales order by domain position, not value
    transform.push({
      type: 'formula',
      as: 'rscDrawInXIndex',
      expr: `indexof(domain('${getScaleName('x', scaleType)}'), datum.${dimension})`,
    });
    xField = 'rscDrawInXIndex';
  }
  transform.push(
    {
      type: 'joinaggregate',
      groupby: [SERIES_ID],
      fields: [metric, metric, xField, xField],
      ops: ['min', 'max', 'min', 'max'],
      as: ['rscDrawInYMin', 'rscDrawInYMax', 'rscDrawInXMin', 'rscDrawInXMax'],
    },
    {
      type: 'filter',
      expr: `!${DRAW_IN_DONE} && (datum.${metric} === datum.rscDrawInYMin || datum.${metric} === datum.rscDrawInYMax || datum.${xField} === datum.rscDrawInXMin || datum.${xField} === datum.rscDrawInXMax)`,
    }
  );
  return { name: getLineDrawInExtentDataName(name), source: `${FILTERED_TABLE}ForInspect`, transform };
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
  // the clip is a rectangle from (-o, -o) to (right, bottom), written as an SVG path
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
 * Hides one opacity rule entry until revealed, keeping its test so hover and highlight opacity still apply.
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

/**
 * Gets the field names a bar's draw-in reads for the totals of the positive and negative sides of each stack.
 * @param name - bar name
 * @returns [stackMaxField, stackMinField]
 */
export const getBarDrawInStackFields = (name: string): [string, string] => [
  `${name}_drawInStackMax`,
  `${name}_drawInStackMin`,
];

/**
 * Gets the animated metric value a bar's draw-in grows toward; stacked segments fill in order up the stack.
 * @param name - bar name
 * @param metric
 * @param stacked - whether the bar is stacked
 * @returns expression string
 */
export const getBarDrawInMetricExpr = (name: string, metric: string, stacked: boolean): string => {
  if (!stacked) return `datum.${metric} * ${DRAW_IN_ANIM_T_EASED}`;
  const [stackMax, stackMin] = getBarDrawInStackFields(name);
  const v0 = `datum.${metric}0`;
  const v1 = `datum.${metric}1`;
  // the stack's top grows toward its total; each segment shows only the part of that reach inside its own range
  const reach = `${DRAW_IN_ANIM_T_EASED} * (${v1} > 0 ? datum.${stackMax} : datum.${stackMin})`;
  return `clamp(${reach}, min(${v0}, ${v1}), max(${v0}, ${v1}))`;
};

/**
 * Gets the name of the data source bar marks read during draw-in.
 * @param name - bar name
 * @returns string
 */
export const getBarDrawInDataName = (name: string): string => `${name}_drawInData`;

/**
 * Gets the field holding a bar's animated draw-in metric value.
 * @param name - bar name
 * @returns string
 */
export const getBarDrawInValueField = (name: string): string => `${name}_drawInValue`;

/**
 * Gets the data source animated bar marks (and the facets that hold them) read from.
 * @param options
 * @returns string
 */
export const getBarMarkDataSource = ({ name, isDrawInAnimate }: BarSpecOptions): string =>
  isDrawInAnimate ? getBarDrawInDataName(name) : FILTERED_TABLE;

/**
 * Gets the data source that computes each bar's animated metric once per tick so mark encodings stay cheap.
 * @param name - bar name
 * @param metric
 * @param stacked - whether the bar is stacked
 * @returns SourceData
 */
export const getBarDrawInData = (name: string, metric: string, stacked: boolean): SourceData => ({
  name: getBarDrawInDataName(name),
  source: FILTERED_TABLE,
  transform: [{ type: 'formula', as: getBarDrawInValueField(name), expr: getBarDrawInMetricExpr(name, metric, stacked) }],
});

/**
 * Gets the eased progress at which a bar's row finishes drawing; stacked segments finish in order up the stack.
 * @param name - bar name
 * @param metric
 * @param stacked - whether the bar is stacked
 * @returns expression string
 */
export const getBarDrawInSettleProgressExpr = (name: string, metric: string, stacked: boolean): string => {
  if (!stacked) return '1';
  const [stackMax, stackMin] = getBarDrawInStackFields(name);
  const v1 = `datum.${metric}1`;
  const total = `(${v1} > 0 ? datum.${stackMax} : datum.${stackMin})`;
  return `(${total} ? ${v1} / ${total} : 1)`;
};
