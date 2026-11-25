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
import { produce } from 'immer';
import { ColorValueRef, EncodeEntry, GroupMark, LineMark, Mark, NumericValueRef, ProductionRule, RectMark } from 'vega';

import {
  CHART_SIZE_STROKE_WIDTH,
  COLOR_SCALE,
  DEFAULT_OPACITY_RULE,
  DRAW_IN_ANIM_T,
  DRAW_IN_ANIM_T_EASED,
  FADE_FACTOR,
  HISTOGRAM_BIN_END,
  HISTOGRAM_BIN_START,
  HISTOGRAM_CURVE_X,
  HISTOGRAM_CURVE_Y,
  HISTOGRAM_Y0,
  HISTOGRAM_Y1,
  HISTOGRAM_Y_BIN_END,
  HISTOGRAM_Y_BIN_START,
  HOVERED_ITEM,
  S2_EASE_IN_OUT,
  SELECTED_ITEM,
} from '@spectrum-charts/core-s2/constants';
import { getS2ColorValue, spectrumColors } from '@spectrum-charts/core-s2/tokens';

import { getControlledHighlightedItemOpacityRule } from '../chartInspect/chartInspectUtils.js';
import { getCubicBezierExpr } from '../marks/drawInAnimationUtils.js';
import {
  getColorProductionRule,
  getCursor,
  getInspectEncoding,
  hasPopover,
  isInteractive,
} from '../marks/markUtils.js';
import { HistogramSpecOptions } from '../types/index.js';
import {
  getHistogramBaseField,
  getHistogramBinsDataName,
  getHistogramDensityCurveDataName,
  getHistogramDodgeFields,
  getHistogramSeriesFields,
  getHistogramStackTopField,
  hasHistogramDensityCurve,
  isHistogram2D,
  isHistogramDodged,
  isHistogramStacked,
} from './histogramDataUtils.js';

export const HISTOGRAM_X_SCALE = 'xLinear';
export const HISTOGRAM_Y_SCALE = 'yLinear';
/** Half of the gap between neighboring bars, in pixels. */
export const HISTOGRAM_HALF_GAP = 1;
export const HISTOGRAM_CORNER_RADIUS = 4;
export const HISTOGRAM_OVERLAID_FILL_OPACITY = 0.6;
export const HISTOGRAM_SELECTED_STROKE_WIDTH = 2;
/** Share of the sweep draw-in spent staggering bar start times from left to right. */
export const HISTOGRAM_SWEEP_STAGGER = 0.6;

/**
 * Gets the name of the color scale for 2D histogram cells.
 * @param name - histogram name
 * @returns scale name
 */
export const getHistogramCellColorScaleName = (name: string): string => `${name}_cellColor`;

/**
 * Whether bins run up the y axis with bars growing to the right.
 * @param options - histogram spec options
 * @returns boolean
 */
export const isHistogramHorizontal = (options: HistogramSpecOptions): boolean =>
  options.orientation === 'horizontal' && !isHistogram2D(options);

/**
 * Gets the scale bins are placed on: x for vertical bars, y for horizontal bars.
 * @param options - histogram spec options
 * @returns scale name
 */
export const getHistogramBinScale = (options: HistogramSpecOptions): string =>
  isHistogramHorizontal(options) ? HISTOGRAM_Y_SCALE : HISTOGRAM_X_SCALE;

/**
 * Gets the scale bar heights are read on: y for vertical bars, x for horizontal bars.
 * @param options - histogram spec options
 * @returns scale name
 */
export const getHistogramValueScale = (options: HistogramSpecOptions): string =>
  isHistogramHorizontal(options) ? HISTOGRAM_X_SCALE : HISTOGRAM_Y_SCALE;

/**
 * Gets an expression for the pixel size of a bin along a scale.
 * @param scale - scale name
 * @param start - bin start field
 * @param end - bin end field
 * @returns expression string
 */
const getBinPixelSize = (scale: string, start: string, end: string): string =>
  `abs(scale('${scale}', datum.${end}) - scale('${scale}', datum.${start}))`;

/**
 * Gets an expression for how far a bar is inset from its bin edges, shrinking for narrow bins.
 * @param scale - scale name
 * @param start - bin start field
 * @param end - bin end field
 * @returns expression string
 */
export const getBinInsetExpr = (scale: string, start: string, end: string): string =>
  `min(${HISTOGRAM_HALF_GAP}, ${getBinPixelSize(scale, start, end)} / 4)`;

/**
 * Gets an expression for a bin's 0-1 draw-in progress, staggered from left to right for `sweep`.
 * @param options - histogram spec options
 * @returns expression string
 */
export const getHistogramDrawInProgress = (options: HistogramSpecOptions): string => {
  if (options.drawInEffect !== 'sweep') return DRAW_IN_ANIM_T_EASED;
  // sweeps from the lowest bin: left to right, or bottom to top when horizontal
  const binPosition = isHistogramHorizontal(options)
    ? `(height - scale('${HISTOGRAM_Y_SCALE}', datum.${HISTOGRAM_BIN_START})) / max(height, 1)`
    : `scale('${HISTOGRAM_X_SCALE}', datum.${HISTOGRAM_BIN_START}) / max(width, 1)`;
  const position = `clamp(${binPosition}, 0, 1)`;
  const stagger = HISTOGRAM_SWEEP_STAGGER;
  const local = `clamp((${DRAW_IN_ANIM_T} - ${position} * ${stagger}) / ${1 - stagger}, 0, 1)`;
  return getCubicBezierExpr(S2_EASE_IN_OUT, local);
};

/**
 * Whether bars change size during draw-in, rather than only fading.
 * @param options - histogram spec options
 * @returns boolean
 */
export const isHistogramDrawInGrowing = ({ drawInEffect, isDrawInAnimate }: HistogramSpecOptions): boolean =>
  Boolean(isDrawInAnimate) && drawInEffect !== 'fade';

/**
 * Gets an expression for how far a 2D cell is inset from its bin edges, shrinking toward its center during draw-in.
 * @param options - histogram spec options
 * @param scale - scale name
 * @param start - bin start field
 * @param end - bin end field
 * @returns expression string
 */
export const getCellInsetExpr = (options: HistogramSpecOptions, scale: string, start: string, end: string): string => {
  const inset = getBinInsetExpr(scale, start, end);
  if (!isHistogramDrawInGrowing(options) || options.drawInEffect !== 'grow') return inset;
  const halfSize = `${getBinPixelSize(scale, start, end)} / 2`;
  return `${inset} + (1 - ${DRAW_IN_ANIM_T_EASED}) * max(0, ${halfSize} - ${inset})`;
};

/**
 * Gets the x encodings that span each bar from its bin's start to end, minus the gap.
 * @param inset - expression for the inset from each bin edge
 * @returns EncodeEntry
 */
export const getHistogramXEncodings = (
  inset = getBinInsetExpr(HISTOGRAM_X_SCALE, HISTOGRAM_BIN_START, HISTOGRAM_BIN_END)
): EncodeEntry => ({
  x: { signal: `scale('${HISTOGRAM_X_SCALE}', datum.${HISTOGRAM_BIN_START}) + (${inset})` },
  x2: { signal: `scale('${HISTOGRAM_X_SCALE}', datum.${HISTOGRAM_BIN_END}) - (${inset})` },
});

/**
 * Gets pixel expressions for the near and far edges of a bar along its bin axis, splitting the bin for dodged series.
 * @param options - histogram spec options
 * @returns [low edge, high edge]
 */
export const getHistogramBarSpan = (options: HistogramSpecOptions): [string, string] => {
  const scale = getHistogramBinScale(options);
  const start = `scale('${scale}', datum.${HISTOGRAM_BIN_START})`;
  const end = `scale('${scale}', datum.${HISTOGRAM_BIN_END})`;
  const low = `min(${start}, ${end})`;
  const size = `abs(${end} - ${start})`;
  if (!isHistogramDodged(options)) return [low, `${low} + ${size}`];
  const [index, count] = getHistogramDodgeFields(options.name);
  return [
    `${low} + ${size} * datum.${index} / datum.${count}`,
    `${low} + ${size} * (datum.${index} + 1) / datum.${count}`,
  ];
};

/**
 * Gets the encodings that place a bar along its bin axis, minus the gap between bars.
 * @param options - histogram spec options
 * @returns EncodeEntry
 */
export const getHistogramBinEncodings = (options: HistogramSpecOptions): EncodeEntry => {
  const [low, high] = getHistogramBarSpan(options);
  const inset = `min(${HISTOGRAM_HALF_GAP}, ((${high}) - (${low})) / 4)`;
  const [first, second] = isHistogramHorizontal(options) ? ['y', 'y2'] : ['x', 'x2'];
  return {
    [first]: { signal: `${low} + ${inset}` },
    [second]: { signal: `${high} - ${inset}` },
  };
};

/**
 * Gets the encodings for a bar's length along the value axis, growing from the baseline during draw-in.
 * @param options - histogram spec options
 * @returns EncodeEntry
 */
export const getHistogramValueEncodings = (options: HistogramSpecOptions): EncodeEntry => {
  const scale = getHistogramValueScale(options);
  const [top, base] = isHistogramHorizontal(options) ? ['x2', 'x'] : ['y', 'y2'];
  if (!isHistogramDrawInGrowing(options)) {
    return {
      [top]: { scale, field: HISTOGRAM_Y1 },
      [base]: { scale, field: HISTOGRAM_Y0 },
    };
  }
  const progress = getHistogramDrawInProgress(options);
  return {
    [top]: { signal: `scale('${scale}', datum.${HISTOGRAM_Y1} * ${progress})` },
    [base]: { signal: `scale('${scale}', datum.${HISTOGRAM_Y0} * ${progress})` },
  };
};

/**
 * Gets the rounded corners at the end of each bin's outermost bar, smaller for narrow bars.
 * @param options - histogram spec options
 * @returns EncodeEntry
 */
export const getHistogramCornerRadiusEncodings = (options: HistogramSpecOptions): EncodeEntry => {
  const stackTop = `datum.${getHistogramStackTopField(options.name)}`;
  const isEnd = isHistogramStacked(options)
    ? `datum.${HISTOGRAM_Y1} > datum.${HISTOGRAM_Y0} && datum.${HISTOGRAM_Y1} === ${stackTop}`
    : `datum.${HISTOGRAM_Y1} > 0`;
  const [low, high] = getHistogramBarSpan(options);
  const radius: ProductionRule<NumericValueRef> = [
    { test: isEnd, signal: `min(${HISTOGRAM_CORNER_RADIUS}, ((${high}) - (${low})) / 4)` },
    { value: 0 },
  ];
  if (isHistogramHorizontal(options)) return { cornerRadiusTopRight: radius, cornerRadiusBottomRight: radius };
  return { cornerRadiusTopLeft: radius, cornerRadiusTopRight: radius };
};

/**
 * Gets the opacity rules that fade every other bin while one is hovered or selected.
 * @param options - histogram spec options
 * @returns opacity rules
 */
export const getHistogramOpacity = (options: HistogramSpecOptions): ({ test?: string } & NumericValueRef)[] => {
  const { idKey, name } = options;
  if (!isInteractive(options)) {
    return [getControlledHighlightedItemOpacityRule(idKey), DEFAULT_OPACITY_RULE];
  }
  const hoveredItem = `${name}_${HOVERED_ITEM}`;
  const rules: ({ test?: string } & NumericValueRef)[] = [
    { test: `isValid(${hoveredItem})`, signal: `${hoveredItem}.${idKey} === datum.${idKey} ? 1 : ${FADE_FACTOR}` },
    getControlledHighlightedItemOpacityRule(idKey),
  ];
  if (hasPopover(options)) {
    rules.push({
      test: `isValid(${SELECTED_ITEM})`,
      signal: `${SELECTED_ITEM} === datum.${idKey} ? 1 : ${FADE_FACTOR}`,
    });
  }
  return [...rules, DEFAULT_OPACITY_RULE];
};

/**
 * Gets the outline that marks the bin whose popover is open.
 * @param options - histogram spec options
 * @returns EncodeEntry
 */
export const getHistogramSelectionEncodings = (options: HistogramSpecOptions): EncodeEntry => {
  if (!hasPopover(options)) return {};
  const test = `isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} === datum.${options.idKey}`;
  return {
    stroke: [{ test, value: spectrumColors.light['static-blue'] }, { value: 'transparent' }],
    strokeWidth: [{ test, value: HISTOGRAM_SELECTED_STROKE_WIDTH }, { value: 0 }],
  };
};

/**
 * Gets the fill opacity: semi-transparent for overlaid series, fading in during `fade` and 2D `sweep` draw-ins.
 * @param options - histogram spec options
 * @returns fill opacity value or signal
 */
export const getHistogramFillOpacity = (options: HistogramSpecOptions): NumericValueRef => {
  const { drawInEffect, isDrawInAnimate, layout } = options;
  const isOverlaid = layout === 'overlaid' && getHistogramSeriesFields(options).length > 0;
  const base = isOverlaid ? HISTOGRAM_OVERLAID_FILL_OPACITY : 1;
  const fades = drawInEffect === 'fade' || (drawInEffect === 'sweep' && isHistogram2D(options));
  if (isDrawInAnimate && fades) {
    return { signal: `${base} * ${getHistogramDrawInProgress(options)}` };
  }
  return { value: base };
};

/**
 * Gets the encodings shared by 1D bars and 2D cells.
 * @param options - histogram spec options
 * @returns EncodeEntry
 */
const getSharedUpdateEncodings = (options: HistogramSpecOptions): EncodeEntry => ({
  cursor: getCursor(options.chartPopovers, options.hasOnClick),
  fillOpacity: getHistogramFillOpacity(options),
  opacity: getHistogramOpacity(options),
  tooltip: getInspectEncoding(options.chartInspects, options.name),
  ...getHistogramSelectionEncodings(options),
});

/**
 * Gets the bar mark of a 1D histogram.
 * @param options - histogram spec options
 * @returns RectMark
 */
export const getHistogramBarMark = (options: HistogramSpecOptions): RectMark => {
  const { color, colorScheme, idKey, name } = options;
  return {
    name,
    description: name,
    type: 'rect',
    from: { data: getHistogramBinsDataName(name) },
    key: idKey,
    encode: {
      update: {
        ...getHistogramBinEncodings(options),
        ...getHistogramValueEncodings(options),
        ...getHistogramCornerRadiusEncodings(options),
        fill: getColorProductionRule(color, colorScheme) as ColorValueRef,
        ...getSharedUpdateEncodings(options),
      },
    },
  };
};

/**
 * Gets the cell mark of a 2D histogram, colored by count.
 * @param options - histogram spec options
 * @returns RectMark
 */
export const getHistogramCellMark = (options: HistogramSpecOptions): RectMark => {
  const { idKey, name } = options;
  const xInset = getCellInsetExpr(options, HISTOGRAM_X_SCALE, HISTOGRAM_BIN_START, HISTOGRAM_BIN_END);
  const yInset = getCellInsetExpr(options, HISTOGRAM_Y_SCALE, HISTOGRAM_Y_BIN_START, HISTOGRAM_Y_BIN_END);
  return {
    name,
    description: name,
    type: 'rect',
    from: { data: getHistogramBinsDataName(name) },
    key: idKey,
    encode: {
      update: {
        ...getHistogramXEncodings(xInset),
        y: { signal: `scale('${HISTOGRAM_Y_SCALE}', datum.${HISTOGRAM_Y_BIN_END}) + (${yInset})` },
        y2: { signal: `scale('${HISTOGRAM_Y_SCALE}', datum.${HISTOGRAM_Y_BIN_START}) - (${yInset})` },
        fill: { scale: getHistogramCellColorScaleName(name), field: getHistogramBaseField(options) },
        ...getSharedUpdateEncodings(options),
      },
    },
  };
};

/**
 * Gets the density curve line, one per series unless series are stacked.
 * @param options - histogram spec options
 * @returns marks
 */
export const getHistogramDensityCurveMarks = (options: HistogramSpecOptions): Mark[] => {
  if (!hasHistogramDensityCurve(options)) return [];
  const { colorScheme, isDrawInAnimate, name } = options;
  const [series] = isHistogramStacked(options) ? [] : getHistogramSeriesFields(options);
  const curveData = getHistogramDensityCurveDataName(name);
  const facetName = `${curveData}Facet`;
  const valueScale = getHistogramValueScale(options);
  const binScale = getHistogramBinScale(options);
  const [binChannel, valueChannel] = isHistogramHorizontal(options) ? ['y', 'x'] : ['x', 'y'];
  const line: LineMark = {
    name: `${name}_densityCurve`,
    type: 'line',
    interactive: false,
    from: { data: series ? facetName : curveData },
    encode: {
      enter: { interpolate: { value: 'monotone' }, strokeCap: { value: 'round' } },
      update: {
        [binChannel]: { scale: binScale, field: HISTOGRAM_CURVE_X },
        [valueChannel]: { scale: valueScale, field: HISTOGRAM_CURVE_Y },
        stroke: series ? { scale: COLOR_SCALE, field: series } : { value: getS2ColorValue('gray-800', colorScheme) },
        strokeWidth: { signal: CHART_SIZE_STROKE_WIDTH },
        opacity: isDrawInAnimate ? { signal: DRAW_IN_ANIM_T_EASED } : { value: 1 },
      },
    },
  };
  if (!series) return [line];
  const group: GroupMark = {
    name: `${name}_densityCurveGroup`,
    type: 'group',
    from: { facet: { name: facetName, data: curveData, groupby: [series] } },
    marks: [line],
  };
  return [group];
};

export const addHistogramMarks = produce<Mark[], [HistogramSpecOptions]>((marks, options) => {
  marks.push({
    name: `${options.name}_group`,
    type: 'group',
    // keeps bars inside the plot when an axis has a fixed range
    clip: true,
    marks: [
      isHistogram2D(options) ? getHistogramCellMark(options) : getHistogramBarMark(options),
      ...getHistogramDensityCurveMarks(options),
    ],
  });
});
