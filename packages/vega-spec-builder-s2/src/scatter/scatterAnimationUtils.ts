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
import { Data, Mark, NumericValueRef, ProductionRule, Signal, ValuesData } from 'vega';

import {
  CONTROLLED_HIGHLIGHTED_ITEM,
  CONTROLLED_HIGHLIGHTED_SERIES,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  DRAW_IN_ANIM_T,
  DRAW_IN_ANIM_T_EASED,
  FADE_FACTOR,
  HOVERED_ITEM,
  HOVER_ACTIVE_TIMER,
  HOVER_ANIM_LAST_CHANGE_DATA,
  S2_EASE_OUT,
  SELECTED_ITEM,
  SERIES_ID,
} from '@spectrum-charts/core-s2/constants';

import { isHighlightedByGroup } from '../chartInspect/chartInspectUtils.js';
import { applyDrawInReveal, getCubicBezierExpr, getDrawInLabelFadeExpr } from '../marks/drawInAnimationUtils.js';
import {
  addHoverAnimLastChangeData,
  getHoverAnimStateData,
  getHoverDeemphasisOpacitySignal,
  getHoverFractionData,
  getHoverSeriesFractionData,
  getHoverTargetData,
} from '../marks/hoverAnimationUtils.js';
import { hasPopover } from '../marks/markUtils.js';
import { getScaleName } from '../scale/scaleSpecBuilder.js';
import { ScatterSpecOptions } from '../types/index.js';

/** Fraction of the draw-in each point spends growing; the rest staggers their starts from left to right. */
export const SCATTER_DRAW_IN_GROW_WINDOW = 0.3;

/**
 * Gets the name of the signal holding the IDs of the highlighted points, or null.
 * @param name - scatter name
 * @returns string
 */
export const getItemHighlightSignalName = (name: string): string => `${name}_itemHighlight`;

/**
 * Gets the name of the signal holding the current and previous highlighted points and when they changed.
 * @param name - scatter name
 * @returns string
 */
export const getItemHighlightStateSignalName = (name: string): string => `${name}_itemHighlightState`;

/**
 * Gets an expression for the IDs of the highlighted points (hover, controlled highlight, then selection), or null.
 * @param options
 * @returns expression string
 */
export const getItemHighlightExpr = (options: ScatterSpecOptions): string => {
  const { idKey, interactiveMarkName } = options;
  const sources: string[] = [];
  if (interactiveMarkName) {
    const hoveredItem = `${interactiveMarkName}_${HOVERED_ITEM}`;
    const hoveredIds = isHighlightedByGroup(options)
      ? `pluck(data('${interactiveMarkName}_highlightedData'), '${idKey}')`
      : `[${hoveredItem}.${idKey}]`;
    sources.push(`isValid(${hoveredItem}) ? ${hoveredIds}`);
  }
  sources.push(
    `isArray(${CONTROLLED_HIGHLIGHTED_ITEM}) && length(${CONTROLLED_HIGHLIGHTED_ITEM}) > 0 ? ${CONTROLLED_HIGHLIGHTED_ITEM}`
  );
  if (hasPopover(options)) {
    sources.push(`isValid(${SELECTED_ITEM}) ? [${SELECTED_ITEM}]`);
  }
  return `${sources.join(' : ')} : null`;
};

/**
 * Adds the signals for the point highlight crossfade: only the incoming and outgoing highlights animate.
 * @param signals
 * @param options
 */
export const addScatterItemHighlightSignals = (signals: Signal[], options: ScatterSpecOptions): void => {
  const { name } = options;
  const highlight = getItemHighlightSignalName(name);
  const state = getItemHighlightStateSignalName(name);
  const curIds = `${state}.cur`;
  const prevIds = `${state}.prev`;
  const isOn = (ids: string) => `(isArray(${ids}) && length(${ids}) > 0)`;
  const curOn = isOn(curIds);
  const prevOn = isOn(prevIds);
  const curFraction = `hoverAnimFraction(0, 1, ${state}.t, now())`;
  // the outgoing highlight starts from however far the incoming one had faded in
  const prevStart = `${prevOn} ? ${curFraction} : 1`;
  signals.push(
    { name: highlight, update: getItemHighlightExpr(options) },
    {
      name: state,
      value: { cur: null, prev: null, t: 0, prevStart: 1 },
      on: [
        {
          events: { signal: highlight },
          // a recomputed but identical highlight keeps its animation instead of restarting it
          update: `'' + ${highlight} === '' + ${state}.cur ? ${state} : {cur: ${highlight}, prev: ${state}.cur, t: now(), prevStart: ${prevStart}}`,
        },
      ],
    },
    { name: `${name}_itemCurFraction`, update: `hoverAnimFraction(0, 1, ${state}.t, ${HOVER_ACTIVE_TIMER})` },
    {
      name: `${name}_itemPrevFraction`,
      update: `hoverAnimFraction(${state}.prevStart, 0, ${state}.t, ${HOVER_ACTIVE_TIMER})`,
    },
    {
      // how much the points that aren't highlighted are dimmed (0 = not at all, 1 = fully)
      name: `${name}_itemDim`,
      update: `${curOn} ? (${prevOn} ? 1 : ${name}_itemCurFraction) : (${prevOn} ? ${name}_itemPrevFraction : 0)`,
    },
    {
      // the incoming highlight only fades in when it replaces another; otherwise only the other points dim
      name: `${name}_itemCurEmphasis`,
      update: `${prevOn} ? ${name}_itemCurFraction : 1`,
    },
    {
      name: `${name}_itemPrevEmphasis`,
      update: `${curOn} ? ${name}_itemPrevFraction : 1`,
    }
  );
};

/**
 * Gets the opacity expression for a point from the point highlight crossfade.
 * @param options
 * @returns expression string
 */
export const getScatterItemOpacityExpr = ({ idKey, name }: ScatterSpecOptions): string => {
  const state = getItemHighlightStateSignalName(name);
  const isIn = (ids: string) => `(isArray(${ids}) && indexof(${ids}, datum.${idKey}) > -1)`;
  const inCur = isIn(`${state}.cur`);
  const inPrev = isIn(`${state}.prev`);
  const emphasis = `max(${inCur} ? ${name}_itemCurEmphasis : 0, ${inPrev} ? ${name}_itemPrevEmphasis : 0)`;
  return `1 - ${name}_itemDim * ${1 - FADE_FACTOR} * (1 - ${emphasis})`;
};

/**
 * Gets the animated opacity rule for scatter points: the lower of the point and series highlight opacities.
 * @param options
 * @returns ProductionRule<NumericValueRef>
 */
export const getScatterAnimatedOpacity = (options: ScatterSpecOptions): ProductionRule<NumericValueRef> => [
  {
    signal: `min(${getScatterItemOpacityExpr(options)}, ${getHoverDeemphasisOpacitySignal(options.name)})`,
  },
];

/**
 * Adds the hover animation data: the shared engine keyed by series (legend and controlled series highlight).
 * @param data
 * @param options
 */
export const addScatterHoverAnimationData = (data: Data[], options: ScatterSpecOptions): void => {
  const { name, seriesIds } = options;
  data.push(
    getHoverTargetData({
      name,
      groupby: [SERIES_ID],
      rules: [
        {
          as: 'controlledSeriesMatch',
          expr: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) ? (${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : 0) : null`,
        },
      ],
    }),
    getHoverAnimStateData({ name, keys: seriesIds ?? [] }),
    getHoverFractionData(name),
    getHoverSeriesFractionData(name)
  );
  addHoverAnimLastChangeData(data, name);
  // the point highlight crossfade keeps the animation timer running the same way series changes do
  const lastChangeData = data.find((d) => d.name === HOVER_ANIM_LAST_CHANGE_DATA) as ValuesData;
  lastChangeData.on?.push({
    // t stays 0 until the first highlight change, so this can't fire before the tracker has its row
    trigger: `${getItemHighlightStateSignalName(name)}.t`,
    modify: `data('${HOVER_ANIM_LAST_CHANGE_DATA}')[0]`,
    values: '{lastChange: now(), settled: false}',
  });
};

/**
 * Gets an expression for a point's 0-1 draw-in progress; points start growing from left to right.
 * @param options
 * @returns expression string
 */
export const getScatterDrawInProgressExpr = ({ dimension, dimensionScaleType }: ScatterSpecOptions): string => {
  const scaleName = getScaleName('x', dimensionScaleType);
  const field = dimensionScaleType === 'time' ? DEFAULT_TRANSFORMED_TIME_DIMENSION : dimension;
  const [start, end] = [`range('${scaleName}')[0]`, `range('${scaleName}')[1]`];
  const position = `clamp((scale('${scaleName}', datum.${field}) - ${start}) / max(${end} - ${start}, 1), 0, 1)`;
  const delay = `${position} * ${1 - SCATTER_DRAW_IN_GROW_WINDOW}`;
  const linear = `clamp((${DRAW_IN_ANIM_T_EASED} - ${delay}) / ${SCATTER_DRAW_IN_GROW_WINDOW}, 0, 1)`;
  return getCubicBezierExpr(S2_EASE_OUT, linear);
};

/**
 * Grows a point's size during the draw-in; the radius grows with the progress.
 * @param size - the point's size rule once drawn
 * @param options
 * @returns NumericValueRef
 */
export const getScatterDrawInSize = (size: NumericValueRef, options: ScatterSpecOptions): NumericValueRef => {
  let base: string;
  if ('value' in size && typeof size.value === 'number') {
    base = `${size.value}`;
  } else if ('scale' in size && 'field' in size) {
    base = `scale('${size.scale as string}', datum.${size.field as string})`;
  } else {
    return size;
  }
  const progress = getScatterDrawInProgressExpr(options);
  return { signal: `${DRAW_IN_ANIM_T} >= 1 ? ${base} : ${base} * pow(${progress}, 2)` };
};

/**
 * Fades marks in after the points finish drawing in (annotations, paths, trendlines).
 * @param marks
 */
export const fadeInAfterScatterDrawIn = (marks: Mark[]): void => {
  const reveal = getDrawInLabelFadeExpr('1');
  for (const mark of marks) {
    if (mark.type === 'group') {
      fadeInAfterScatterDrawIn(mark.marks ?? []);
      continue;
    }
    mark.encode = mark.encode ?? {};
    mark.encode.update = mark.encode.update ?? {};
    const { opacity } = mark.encode.update;
    mark.encode.update.opacity = opacity === undefined ? { signal: reveal } : applyDrawInReveal(opacity, reveal);
  }
};
