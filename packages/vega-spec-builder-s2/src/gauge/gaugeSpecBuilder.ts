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
import {
  AggregateTransform,
  Data,
  FilterTransform,
  FormulaTransform,
  JoinAggregateTransform,
  Mark,
  Scale,
  Signal,
  ThresholdScale,
  WindowTransform,
} from 'vega';

import { DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, FILTERED_TABLE } from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';

import { ColorScheme, GaugeOptions, GaugeSpecOptions, ScSpec } from '../types';
import { getGaugeMarks } from './gaugeMarkUtils';

const DEFAULT_ARC_SIZE = 2 / 3;
const DEFAULT_HOLE_RATIO = 0.8;
const DEFAULT_MAX_SCALE_VALUE = 100;
const DEFAULT_METHOD = 'last';
const DEFAULT_MIN_SCALE_VALUE = 0;
const DEFAULT_NUMBER_FORMAT = 'shortNumber';
const DEFAULT_GAUGE_COLOR = 'categorical-100';

// value font size snaps to the Spectrum type ramp based on the actual rendered inner radius,
// mirroring DonutSummary's radius -> threshold-scale -> fontSize pattern (donutSummaryUtils.ts)
// instead of a discrete author-supplied size prop
const VALUE_FONT_SIZE_SCALE_DOMAIN = [30, 40, 50, 65, 80, 110];
const VALUE_FONT_SIZE_SCALE_RANGE = [14, 18, 22, 28, 34, 40, 48];

export const addGauge = produce<ScSpec, [GaugeOptions & { colorScheme?: ColorScheme; index?: number }]>(
  (
    spec,
    {
      arcSize = DEFAULT_ARC_SIZE,
      color = DEFAULT_GAUGE_COLOR,
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
      ...options
    }
  ) => {
    const gaugeOptions: GaugeSpecOptions = {
      arcSize: Math.min(0.85, Math.max(0.2, arcSize)),
      color,
      colorScheme,
      holeRatio: Math.min(0.9, Math.max(0.4, holeRatio)),
      index,
      label,
      maxScaleValue,
      method,
      metric,
      minScaleValue,
      name: toCamelCase(name ?? `gauge${index}`),
      numberFormat,
      showNeedle,
      ...options,
    };

    spec.data = addData(spec.data ?? [], gaugeOptions);
    spec.signals = addSignals(spec.signals ?? [], gaugeOptions);
    spec.scales = setScales(spec.scales ?? [], gaugeOptions);
    spec.marks = addMarks(spec.marks ?? [], gaugeOptions);
  }
);

const getAggregationTransforms = (
  name: string,
  metric: string,
  method: GaugeOptions['method']
): (WindowTransform | JoinAggregateTransform | FilterTransform | AggregateTransform)[] => {
  if (method === 'avg' || method === 'sum') {
    return [{ type: 'aggregate', fields: [metric], ops: [method === 'avg' ? 'mean' : 'sum'], as: [metric] }];
  }
  // 'last': isolate the final row in source order
  return [
    { type: 'window', ops: ['row_number'], as: [`${name}_rowIndex`] },
    { type: 'joinaggregate', ops: ['count'], as: [`${name}_rowCount`] },
    { type: 'filter', expr: `datum.${name}_rowIndex === datum.${name}_rowCount` },
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
    `/ (${maxScaleValue - minScaleValue})`,
    `* (${name}_endAngle - ${name}_startAngle)`,
  ].join(' '),
});

export const addData = produce<Data[], [GaugeSpecOptions]>((data, options) => {
  const { name, metric, minScaleValue, maxScaleValue, method } = options;
  data.push({
    name,
    source: FILTERED_TABLE,
    transform: [
      ...getAggregationTransforms(name, metric, method),
      getValueAngleFormula(name, metric, minScaleValue, maxScaleValue),
    ],
  });
});

export const addSignals = produce<Signal[], [GaugeSpecOptions]>((signals, { name, arcSize, holeRatio }) => {
  signals.push(
    { name: `${name}_cx`, update: 'width / 2' },
    { name: `${name}_cy`, update: 'height * 0.62' },
    { name: `${name}_radius`, update: 'min(width / 2 - 4, height * 0.62 * 0.82)' },
    { name: `${name}_innerRadius`, update: `${name}_radius * ${holeRatio}` },
    { name: `${name}_totalAngle`, update: `${arcSize} * 2 * PI` },
    { name: `${name}_startAngle`, update: `-${name}_totalAngle / 2` },
    { name: `${name}_endAngle`, update: `${name}_totalAngle / 2` },
    // typography and needle/pivot geometry all derive from the actual rendered radius below,
    // so they scale continuously with however big the chart renders - never from an input prop
    { name: `${name}_valueFontSize`, update: `scale('${name}_valueFontSizeScale', ${name}_innerRadius)` },
    { name: `${name}_metricFontSize`, update: `round(${name}_valueFontSize * 0.6)` },
    { name: `${name}_needleBaseHalfWidth`, update: `${name}_innerRadius * 0.1` },
    { name: `${name}_needleTipHalfWidth`, update: `${name}_innerRadius * 0.04` },
    { name: `${name}_needleTipDiameter`, update: `${name}_innerRadius * 0.08` },
    { name: `${name}_needleTipGap`, update: `${name}_innerRadius * 0.09` },
    { name: `${name}_pivotDiameter`, update: `${name}_innerRadius * 0.17` },
    { name: `${name}_pivotStrokeWidth`, update: `max(1, ${name}_innerRadius * 0.025)` }
  );
});

export const setScales = produce<Scale[], [GaugeSpecOptions]>((scales, { name }) => {
  const fontSizeScale: ThresholdScale = {
    name: `${name}_valueFontSizeScale`,
    type: 'threshold',
    domain: VALUE_FONT_SIZE_SCALE_DOMAIN,
    range: VALUE_FONT_SIZE_SCALE_RANGE,
  };
  scales.push(fontSizeScale);
});

export const addMarks = produce<Mark[], [GaugeSpecOptions]>((marks, options) => {
  marks.push(...getGaugeMarks(options));
});
