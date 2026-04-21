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
import { AggregateTransform, Data, FilterTransform, FormulaTransform, Mark, Signal, WindowTransform } from 'vega';

import {
  DEFAULT_COLOR_SCHEME,
  DEFAULT_METRIC,
  FILTERED_TABLE,
} from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';

import { ColorScheme, GaugeOptions, GaugeSpecOptions, HighlightedItem, ScSpec } from '../types';
import { getGaugeMarks } from './gaugeMarkUtils';

const DEFAULT_ARC_SIZE = 2 / 3;
const DEFAULT_HOLE_RATIO = 0.8;
const DEFAULT_MAX_SCALE_VALUE = 100;
const DEFAULT_METHOD = 'last';
const DEFAULT_MIN_SCALE_VALUE = 0;
const DEFAULT_NUMBER_FORMAT = 'shortNumber';
const DEFAULT_SIZE = 'L';

interface GaugeSizeConfig {
  needleValueFontSize: number;
  fillValueFontSize: number;
  needleMetricFontSize: number;
  fillMetricFontSize: number;
  needleMetricWrapChars: number;
  fillMetricWrapChars: number;
  needleMetricLineHeight: number;
  fillMetricLineHeight: number;
  pivotDiameter: number;
  pivotStrokeWidth: number;
  needleBaseHalfWidth: number;
  needleTipHalfWidth: number;
  needleTipDiameter: number;
  needleTipGap: number;
  tickMajorLength: number;
  tickMinorLength: number;
  tickStrokeWidth: number;
  tickMinimalTarget: number;
  tickDenseMajorTarget: number;
  tickDenseMinorCount: number;
}

const GAUGE_SIZE_CONFIG: Record<string, GaugeSizeConfig> = {
  S:  { needleValueFontSize: 16, fillValueFontSize: 24, needleMetricFontSize: 12, fillMetricFontSize: 12, needleMetricWrapChars: 10, fillMetricWrapChars:  6, needleMetricLineHeight: 14, fillMetricLineHeight: 14, pivotDiameter:  7, pivotStrokeWidth: 1.5, needleBaseHalfWidth:  4,   needleTipHalfWidth: 2, needleTipDiameter: 4, needleTipGap:  4, tickMajorLength:  5, tickMinorLength: 2, tickStrokeWidth: 1.5, tickMinimalTarget:  4, tickDenseMajorTarget:  5, tickDenseMinorCount: 1 },
  M:  { needleValueFontSize: 28, fillValueFontSize: 40, needleMetricFontSize: 20, fillMetricFontSize: 22, needleMetricWrapChars: 18, fillMetricWrapChars: 10, needleMetricLineHeight: 22, fillMetricLineHeight: 24, pivotDiameter: 13, pivotStrokeWidth: 2,   needleBaseHalfWidth:  7.5, needleTipHalfWidth: 3, needleTipDiameter: 6, needleTipGap:  7, tickMajorLength:  8, tickMinorLength: 3, tickStrokeWidth: 2,   tickMinimalTarget:  6, tickDenseMajorTarget: 11, tickDenseMinorCount: 2 },
  L:  { needleValueFontSize: 40, fillValueFontSize: 56, needleMetricFontSize: 26, fillMetricFontSize: 32, needleMetricWrapChars: 26, fillMetricWrapChars: 14, needleMetricLineHeight: 24, fillMetricLineHeight: 32, pivotDiameter: 18, pivotStrokeWidth: 3,   needleBaseHalfWidth: 10.5, needleTipHalfWidth: 4, needleTipDiameter: 8, needleTipGap: 10, tickMajorLength: 12, tickMinorLength: 5, tickStrokeWidth: 3,   tickMinimalTarget:  7, tickDenseMajorTarget: 11, tickDenseMinorCount: 3 },
  XL: { needleValueFontSize: 48, fillValueFontSize: 54, needleMetricFontSize: 26, fillMetricFontSize: 28, needleMetricWrapChars: 28, fillMetricWrapChars: 16, needleMetricLineHeight: 28, fillMetricLineHeight: 30, pivotDiameter: 21, pivotStrokeWidth: 4.5, needleBaseHalfWidth: 12,   needleTipHalfWidth: 5, needleTipDiameter: 9, needleTipGap: 12, tickMajorLength: 14, tickMinorLength: 6, tickStrokeWidth: 3,   tickMinimalTarget: 10, tickDenseMajorTarget: 11, tickDenseMinorCount: 4 },
};

const resolveSizeConfig = (size: 'XL' | 'L' | 'M' | 'S' | number): GaugeSizeConfig =>
  typeof size === 'string' ? (GAUGE_SIZE_CONFIG[size] ?? GAUGE_SIZE_CONFIG.L) : GAUGE_SIZE_CONFIG.L;

export const addGauge = produce<
  ScSpec,
  [
    GaugeOptions & {
      colorScheme?: ColorScheme;
      highlightedItem?: HighlightedItem;
      index?: number;
    }
  ]
>(
  (
    spec,
    {
      arcSize = DEFAULT_ARC_SIZE,
      chartTooltips = [],
      color = 'categorical-01',
      colorScheme = DEFAULT_COLOR_SCHEME,
      holeRatio = DEFAULT_HOLE_RATIO,
      index = 0,
      label,
      maxScaleValue = DEFAULT_MAX_SCALE_VALUE,
      method = DEFAULT_METHOD,
      metric = DEFAULT_METRIC,
      minScaleValue = DEFAULT_MIN_SCALE_VALUE,
      name,
      numberFormat = DEFAULT_NUMBER_FORMAT,
      showNeedle = true,
      showRangeLabels = false,
      size = DEFAULT_SIZE,
      target,
      targetLabel,
      thresholds,
      ticks,
      ...options
    }
  ) => {
    const sc = resolveSizeConfig(size);
    const gaugeOptions: GaugeSpecOptions = {
      arcSize,
      chartTooltips,
      color,
      colorScheme,
      holeRatio: Math.min(0.9, Math.max(0.65, holeRatio)),
      index,
      label,
      maxScaleValue,
      method,
      metric,
      minScaleValue,
      name: toCamelCase(name ?? `gauge${index}`),
      numberFormat,
      showNeedle,
      showRangeLabels,
      size,
      target,
      targetLabel,
      thresholds,
      ticks,
      valueFontSize: showNeedle ? sc.needleValueFontSize : sc.fillValueFontSize,
      metricFontSize: showNeedle ? sc.needleMetricFontSize : sc.fillMetricFontSize,
      metricWrapChars: showNeedle ? sc.needleMetricWrapChars : sc.fillMetricWrapChars,
      metricLineHeight: showNeedle ? sc.needleMetricLineHeight : sc.fillMetricLineHeight,
      pivotDiameter: sc.pivotDiameter,
      pivotStrokeWidth: sc.pivotStrokeWidth,
      needleBaseHalfWidth: sc.needleBaseHalfWidth,
      needleTipHalfWidth: sc.needleTipHalfWidth,
      needleTipDiameter: sc.needleTipDiameter,
      needleTipGap: sc.needleTipGap,
      tickMajorLength: sc.tickMajorLength,
      tickMinorLength: sc.tickMinorLength,
      tickStrokeWidth: sc.tickStrokeWidth,
      tickMinimalTarget: sc.tickMinimalTarget,
      tickDenseMajorTarget: sc.tickDenseMajorTarget,
      tickDenseMinorCount: sc.tickDenseMinorCount,
      ...options,
    };

    spec.data = addData(spec.data ?? [], gaugeOptions);
    spec.signals = addSignals(spec.signals ?? [], gaugeOptions);
    spec.marks = addMarks(spec.marks ?? [], gaugeOptions);
  }
);

export const addData = produce<Data[], [GaugeSpecOptions]>((data, options) => {
  const { name, metric, minScaleValue, maxScaleValue, method, target, ticks } = options;
  const transforms: Data['transform'] = [
    ...getAggregationTransforms(name, metric, method, target),
    getValueAngleFormula(name, metric, minScaleValue, maxScaleValue),
  ];

  if (target) {
    transforms.push(getTargetAngleFormula(name, target, minScaleValue, maxScaleValue));
  }

  data.push({
    name,
    source: FILTERED_TABLE,
    transform: transforms,
  });

  if (ticks) {
    const range = maxScaleValue - minScaleValue;
    const { tickMajorLength, tickMinorLength, tickMinimalTarget, tickDenseMajorTarget, tickDenseMinorCount } = options;
    data.push({
      name: `${name}_ticks`,
      values: computeTickData(ticks, minScaleValue, maxScaleValue, tickMajorLength, tickMinorLength, tickMinimalTarget, tickDenseMajorTarget, tickDenseMinorCount),
      transform: [
        {
          type: 'formula',
          as: 'angle',
          expr: `${name}_startAngle + (datum.value - ${minScaleValue}) / ${range} * (${name}_endAngle - ${name}_startAngle)`,
        },
      ],
    });
  }
});

const niceInterval = (range: number, targetCount: number): number => {
  const roughStep = range / Math.max(1, targetCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  let multiplier: number;
  if (normalized < 1.5) multiplier = 1;
  else if (normalized < 3) multiplier = 2;
  else if (normalized < 7) multiplier = 5;
  else multiplier = 10;
  return multiplier * magnitude;
};

const linearTicks = (min: number, max: number, step: number): number[] => {
  const values: number[] = [];
  const first = Math.ceil((min - 1e-10) / step) * step;
  for (let v = first; v <= max + 1e-10; v += step) {
    values.push(parseFloat(v.toPrecision(10)));
  }
  return values;
};

const computeTickData = (
  mode: 'minimal' | 'normal' | 'dense',
  min: number,
  max: number,
  majorLength: number,
  minorLength: number,
  minimalTarget: number,
  denseMajorTarget: number,
  denseMinorCount: number
): Array<{ value: number; length: number }> => {
  const range = max - min;
  const majorStep = niceInterval(range, minimalTarget);

  if (mode === 'minimal') {
    return linearTicks(min, max, majorStep).map(v => ({ value: v, length: majorLength }));
  }

  if (mode === 'normal') {
    const majors = linearTicks(min, max, majorStep);
    const result: { value: number; length: number }[] = [];
    for (let i = 0; i < majors.length; i++) {
      result.push({ value: majors[i], length: majorLength });
      if (i < majors.length - 1) {
        result.push({ value: (majors[i] + majors[i + 1]) / 2, length: minorLength });
      }
    }
    return result;
  }

  // dense
  const denseMajorStep = niceInterval(range, denseMajorTarget);
  const result: { value: number; length: number }[] = [];
  const majors = linearTicks(min, max, denseMajorStep);
  for (let i = 0; i < majors.length; i++) {
    result.push({ value: majors[i], length: majorLength });
    if (i < majors.length - 1) {
      const subStep = (majors[i + 1] - majors[i]) / (denseMinorCount + 1);
      for (let j = 1; j <= denseMinorCount; j++) {
        result.push({
          value: parseFloat((majors[i] + j * subStep).toPrecision(10)),
          length: minorLength,
        });
      }
    }
  }
  return result;
};

const getAggregationTransforms = (
  name: string,
  metric: string,
  method: string,
  target?: string
): (WindowTransform | FilterTransform | AggregateTransform)[] => {
  if (method === 'avg' || method === 'sum') {
    const op = method === 'avg' ? 'mean' : 'sum';
    const fields = [metric, ...(target ? [target] : [])];
    return [
      {
        type: 'aggregate',
        fields,
        ops: fields.map(() => op),
        as: fields,
      } as AggregateTransform,
    ];
  }
  return [
    { type: 'window', ops: ['row_number'], as: [`${name}_rowIndex`] } as WindowTransform,
    { type: 'filter', expr: `datum.${name}_rowIndex === 1` } as FilterTransform,
  ];
};

const getValueAngleFormula = (
  name: string,
  metric: string,
  minScaleValue: number,
  maxScaleValue: number
): FormulaTransform => ({
  type: 'formula',
  as: `${name}_valueAngle`,
  expr: [
    `${name}_startAngle`,
    `+ (clamp(datum['${metric}'], ${minScaleValue}, ${maxScaleValue}) - ${minScaleValue})`,
    `/ (${maxScaleValue} - ${minScaleValue})`,
    `* (${name}_endAngle - ${name}_startAngle)`,
  ].join(' '),
});

const getTargetAngleFormula = (
  name: string,
  target: string,
  minScaleValue: number,
  maxScaleValue: number
): FormulaTransform => ({
  type: 'formula',
  as: `${name}_targetAngle`,
  expr: [
    `${name}_startAngle`,
    `+ (clamp(datum['${target}'], ${minScaleValue}, ${maxScaleValue}) - ${minScaleValue})`,
    `/ (${maxScaleValue} - ${minScaleValue})`,
    `* (${name}_endAngle - ${name}_startAngle)`,
  ].join(' '),
});

export const addSignals = produce<Signal[], [GaugeSpecOptions]>((signals, { name, arcSize, holeRatio }) => {
  signals.push(
    { name: `${name}_cx`, update: 'width / 2' },
    { name: `${name}_cy`, update: 'height * 0.62' },
    { name: `${name}_radius`, update: 'min(width / 2 - 4, height * 0.62 * 0.82)' },
    { name: `${name}_innerRadius`, update: `${name}_radius * ${holeRatio}` },
    { name: `${name}_capAngleOffset`, update: `asin((${name}_radius - ${name}_innerRadius) / 2 / ((${name}_radius + ${name}_innerRadius) / 2))` },
    { name: `${name}_totalAngle`, update: `${arcSize} * 2 * PI` },
    { name: `${name}_startAngle`, update: `-${name}_totalAngle / 2` },
    { name: `${name}_endAngle`, update: `${name}_totalAngle / 2` }
  );
});

export const addMarks = produce<Mark[], [GaugeSpecOptions]>((marks, options) => {
  marks.push(...getGaugeMarks(options));
});
