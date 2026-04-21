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
import { Data, FormulaTransform, Mark, Signal } from 'vega';

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
const DEFAULT_SIZE = 'M';

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
    const gaugeOptions: GaugeSpecOptions = {
      arcSize,
      chartTooltips,
      color,
      colorScheme,
      holeRatio,
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
      ...options,
    };

    spec.data = addData(spec.data ?? [], gaugeOptions);
    spec.signals = addSignals(spec.signals ?? [], gaugeOptions);
    spec.marks = addMarks(spec.marks ?? [], gaugeOptions);
  }
);

export const addData = produce<Data[], [GaugeSpecOptions]>((data, options) => {
  const { name, metric, minScaleValue, maxScaleValue, target } = options;
  const transforms: Data['transform'] = [
    {
      type: 'window',
      ops: ['row_number'],
      as: [`${name}_rowIndex`],
    },
    {
      type: 'filter',
      expr: `datum.${name}_rowIndex === 1`,
    },
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
});

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
