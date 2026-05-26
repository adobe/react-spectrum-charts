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
import { FormulaTransform, Mark } from 'vega';

import { BACKGROUND_COLOR } from '@spectrum-charts/constants';

import { getScaleName } from '../scale/scaleSpecBuilder';
import { LineForecastOptions, LineForecastSpecOptions, LineSpecOptions } from '../types';

export const getForecastAlternateFlagTransform = (name: string, dimension: string, start: LineForecastOptions['start']): FormulaTransform => ({
  type: 'formula',
  as: `${name}_alternateFlag`,
  expr: `datum['${dimension}'] >= ${JSON.stringify(start)}`,
});

export const getForecastEffectiveValueTransform = (name: string, metric: string, forecastMetric: string): FormulaTransform => ({
  type: 'formula',
  as: `${name}_effectiveValue`,
  expr: `isValid(datum['${metric}']) ? datum['${metric}'] : datum['${forecastMetric}']`,
});

export const getLineForecastSpecOptions = (
  forecast: LineForecastOptions,
  index: number,
  lineOptions: LineSpecOptions
): LineForecastSpecOptions => ({
  color: lineOptions.color,
  colorScheme: lineOptions.colorScheme,
  dimension: lineOptions.dimension,
  index,
  label: forecast.label ?? 'Forecast',
  lineName: lineOptions.name,
  metric: forecast.metric,
  metricAxis: lineOptions.metricAxis,
  scaleType: lineOptions.scaleType,
  start: forecast.start,
});

export const getLineForecastBoundaryMark = (specOpts: LineForecastSpecOptions): Mark => {
  const { index, lineName, scaleType, start } = specOpts;
  const xScaleName = getScaleName('x', scaleType);
  const startSignal = `scale('${xScaleName}', ${JSON.stringify(start)})`;
  return {
    name: `${lineName}_forecast${index}_boundary`,
    description: `${lineName}_forecast${index}_boundary`,
    type: 'rule',
    interactive: false,
    encode: {
      enter: {
        y: { value: 0 },
        y2: { signal: 'height' },
        stroke: { value: '#909090' },
        strokeWidth: { value: 1 },
      },
      update: {
        x: { signal: startSignal },
      },
    },
  };
};

export const getLineForecastLabelMarks = (specOpts: LineForecastSpecOptions): Mark[] => {
  const { index, label, lineName, scaleType, start } = specOpts;
  const xScaleName = getScaleName('x', scaleType);
  const startSignal = `scale('${xScaleName}', ${JSON.stringify(start)})`;
  const xSignal = `${startSignal} + 8`;
  const opacityRules = [
    { test: `width - ${startSignal} < 80`, value: 0 },
    { value: 1 },
  ];
  const baseEnter = {
    text: { value: label },
    fontSize: { value: 14 },
    baseline: { value: 'top' as const },
  };
  return [
    {
      name: `${lineName}_forecast${index}_label_bg`,
      description: `${lineName}_forecast${index}_label_bg`,
      type: 'text',
      interactive: false,
      encode: {
        enter: {
          ...baseEnter,
          stroke: { signal: BACKGROUND_COLOR },
          strokeWidth: { value: 2 },
          fill: { value: 'transparent' },
        },
        update: {
          x: { signal: xSignal },
          y: { value: 4 },
          opacity: opacityRules,
        },
      },
    },
    {
      name: `${lineName}_forecast${index}_label`,
      description: `${lineName}_forecast${index}_label`,
      type: 'text',
      interactive: false,
      encode: {
        enter: {
          ...baseEnter,
          fill: { value: '#505050' },
        },
        update: {
          x: { signal: xSignal },
          y: { value: 4 },
          opacity: opacityRules,
        },
      },
    },
  ];
};
