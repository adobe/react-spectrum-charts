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
import { Data, Legend, LinearScale, Scale, ScaleMultiDataRef, ScaleMultiFieldsRef, Signal } from 'vega';

import {
  AnimationType,
  COLOR_SCALE,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_METRIC,
  DRAW_IN_GROW_DURATION_MS,
  DRAW_IN_SWEEP_DURATION_MS,
  HISTOGRAM_BIN_END,
  HISTOGRAM_BIN_START,
  HISTOGRAM_CURVE_Y,
  HISTOGRAM_Y1,
  HISTOGRAM_Y_BIN_END,
  HISTOGRAM_Y_BIN_START,
} from '@spectrum-charts/core-s2/constants';
import { getColorSchemeColors } from '@spectrum-charts/core-s2/tokens';
import { toCamelCase } from '@spectrum-charts/core-s2/utils';

import { addDrawInClockSignals, addDrawInDoneSignal } from '../marks/drawInAnimationUtils.js';
import { getInteractiveMarkName, isDrawInAnimationEnabled, isInteractive } from '../marks/markUtils.js';
import { addDomainFields, addFieldToFacetScaleDomain, getScaleIndexByType } from '../scale/scaleSpecBuilder.js';
import { addHoveredItemSignal } from '../signal/signalSpecBuilder.js';
import { addUserMetaInteractiveMark } from '../specUtils.js';
import {
  ColorScheme,
  HighlightedItem,
  HistogramCellColors,
  HistogramOptions,
  HistogramSpecOptions,
  ScSpec,
} from '../types/index.js';
import {
  addHistogramData,
  getHistogramBaseField,
  getHistogramBinsDataName,
  getHistogramDensityCurveDataName,
  hasHistogramDensityCurve,
  isHistogram2D,
} from './histogramDataUtils.js';
import { addHistogramMarks, getHistogramCellColorScaleName, isHistogramHorizontal } from './histogramMarkUtils.js';

/** Sequential scheme for 2D histogram cells, light for few rows and dark for many. */
export const HISTOGRAM_CELL_COLOR_SCHEME: HistogramCellColors = 'sequentialCerulean9';

/**
 * Adds all the necessary parts of a histogram to the spec
 * @param spec Spec
 * @param histogramOptions HistogramOptions
 */
export const addHistogram = produce<
  ScSpec,
  [
    HistogramOptions & {
      animations?: boolean;
      animationTypes?: AnimationType[];
      colorScheme?: ColorScheme;
      highlightedItem?: HighlightedItem;
      index?: number;
      idKey: string;
    }
  ]
>(
  (
    spec,
    {
      animations,
      animationTypes,
      cellColors = HISTOGRAM_CELL_COLOR_SCHEME,
      cellLegend = true,
      chartInspects = [],
      chartPopovers = [],
      color = { value: 'categorical-100' },
      colorScheme = DEFAULT_COLOR_SCHEME,
      cumulative = false,
      densityCurve = false,
      drawInEffect = 'grow',
      index = 0,
      layout = 'stacked',
      metric = DEFAULT_METRIC,
      name,
      orientation = 'vertical',
      yValue = 'count',
      ...options
    }
  ) => {
    const histogramName = toCamelCase(name || `histogram${index}`);
    const histogramOptions: HistogramSpecOptions = {
      cellColors,
      cellLegend,
      chartInspects,
      chartPopovers,
      color,
      colorScheme,
      cumulative,
      densityCurve,
      drawInEffect,
      index,
      interactiveMarkName: getInteractiveMarkName(
        { chartInspects, chartPopovers, hasOnClick: options.hasOnClick, highlightedItem: options.highlightedItem },
        histogramName
      ),
      isDrawInAnimate: isDrawInAnimationEnabled(animations, animationTypes),
      layout,
      metric,
      name: histogramName,
      orientation,
      yValue,
      ...options,
    };

    spec.usermeta = addUserMetaInteractiveMark(spec.usermeta, histogramOptions.interactiveMarkName);
    if (isHistogramHorizontal(histogramOptions)) {
      spec.usermeta = { ...spec.usermeta, chartOrientation: 'horizontal' };
    }
    spec.data = addData(spec.data ?? [], histogramOptions);
    spec.signals = addSignals(spec.signals ?? [], histogramOptions);
    spec.scales = setScales(spec.scales ?? [], histogramOptions);
    spec.marks = addHistogramMarks(spec.marks ?? [], histogramOptions);
    spec.legends = [...(spec.legends ?? []), ...getHistogramCellLegends(histogramOptions)];
  }
);

export const addData = produce<Data[], [HistogramSpecOptions]>((data, options) => {
  addHistogramData(data, options);
});

/**
 * Adds the signals for histogram to the signals array
 * @param signals Signal[]
 * @param options HistogramSpecOptions
 */
export const addSignals = produce<Signal[], [HistogramSpecOptions]>((signals, options) => {
  if (options.isDrawInAnimate) {
    const duration = options.drawInEffect === 'sweep' ? DRAW_IN_SWEEP_DURATION_MS : DRAW_IN_GROW_DURATION_MS;
    addDrawInClockSignals(signals, duration);
    addDrawInDoneSignal(signals);
  }
  if (!isInteractive(options)) return;
  addHoveredItemSignal(signals, options.name);
});

/**
 * Sets up all the scales for histogram on the scales array
 * @param scales Scale[]
 * @param options HistogramSpecOptions
 */
export const setScales = produce<Scale[], [HistogramSpecOptions]>((scales, options) => {
  const { cellColors, color, colorScheme, name } = options;
  const binsData = getHistogramBinsDataName(name);
  const horizontal = isHistogramHorizontal(options);

  const binIndex = getScaleIndexByType(scales, 'linear', horizontal ? 'y' : 'x', undefined, binsData);
  const binScale = addDomainFields(scales[binIndex], [HISTOGRAM_BIN_START, HISTOGRAM_BIN_END]);
  scales[binIndex] = { ...binScale, nice: false, zero: false } as Scale;

  const valueIndex = getScaleIndexByType(scales, 'linear', horizontal ? 'x' : 'y', undefined, binsData);
  if (isHistogram2D(options)) {
    const yScale = addDomainFields(scales[valueIndex], [HISTOGRAM_Y_BIN_START, HISTOGRAM_Y_BIN_END]);
    scales[valueIndex] = { ...yScale, nice: false, zero: false } as Scale;
    scales.push(getHistogramCellColorScale(options, binsData, cellColors, colorScheme));
    return;
  }
  scales[valueIndex] = {
    ...scales[valueIndex],
    domain: getHistogramValueDomain(options),
    nice: true,
    zero: true,
  } as Scale;
  addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
});

/**
 * Gets the bar-height scale's domain, including the density curve when there is one.
 * @param options - histogram spec options
 * @returns scale domain
 */
export const getHistogramValueDomain = (options: HistogramSpecOptions): ScaleMultiDataRef | ScaleMultiFieldsRef => {
  const binsData = getHistogramBinsDataName(options.name);
  if (!hasHistogramDensityCurve(options)) return { data: binsData, fields: [HISTOGRAM_Y1] };
  return {
    fields: [
      { data: binsData, field: HISTOGRAM_Y1 },
      { data: getHistogramDensityCurveDataName(options.name), field: HISTOGRAM_CURVE_Y },
    ],
  };
};

/**
 * Gets the color legend for 2D histogram cells.
 * @param options - histogram spec options
 * @returns legends
 */
export const getHistogramCellLegends = (options: HistogramSpecOptions): Legend[] => {
  if (!isHistogram2D(options) || !options.cellLegend) return [];
  return [
    {
      fill: getHistogramCellColorScaleName(options.name),
      type: 'gradient',
      direction: 'vertical',
      orient: 'right',
      title: options.cellLegendTitle,
      gradientLength: { signal: 'clamp(height * 0.6, 60, 240)' },
      gradientThickness: 12,
      format: '~s',
    },
  ];
};

/**
 * Gets the sequential color scale that colors 2D histogram cells by count.
 * @param name - histogram name
 * @param binsData - name of the bins data source
 * @param colorScheme - light or dark
 * @returns LinearScale
 */
export const getHistogramCellColorScale = (
  options: HistogramSpecOptions,
  binsData: string,
  cellColors: HistogramCellColors,
  colorScheme: ColorScheme
): LinearScale => ({
  name: getHistogramCellColorScaleName(options.name),
  type: 'linear',
  range: getColorSchemeColors(cellColors, colorScheme),
  domain: { data: binsData, field: getHistogramBaseField(options) },
  zero: true,
});
