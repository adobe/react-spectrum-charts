/*
 * Copyright 2025 Adobe. All rights reserved.
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
import { Mark, Signal, Scale, Data } from 'vega';
import { addGaugeMarks } from './gaugeMarkUtils';


import { DEFAULT_COLOR_SCHEME } from '@spectrum-charts/constants'; 

// import { getColorValue, spectrumColors } from '@spectrum-charts/themes';
import { getColorValue, spectrumColors } from '@spectrum-charts/themes'; 
import { toCamelCase } from '@spectrum-charts/utils';

import { ColorScheme, GaugeOptions, GaugeSpecOptions, ScSpec } from '../types';
import { getGaugeTableData } from './gaugeDataUtils';

const DEFAULT_COLOR = spectrumColors.light['blue-900']; 


/**
 * Adds a simple Gauge chart to the spec
 * 
 */
export const addGauge = produce<
  ScSpec,
  [GaugeOptions & { colorScheme?: ColorScheme; index?: number; idKey: string }]
>(
  (
    spec,
    {
      colorScheme = DEFAULT_COLOR_SCHEME,
      index = 0,
      name,
      color = DEFAULT_COLOR,
      ...options
    }
  ) => {
    const gaugeOptions: GaugeSpecOptions = {
      backgroundFill: spectrumColors[colorScheme]['gray-200'],
      backgroundStroke: spectrumColors[colorScheme]['gray-300'],
      color: getColorValue(color, colorScheme),
      colorScheme: colorScheme,
      fillerColorSignal: 'fillerColorToCurrVal',
      index,
      maxArcValue: 100,
      minArcValue: 0,
      metric: 'currentAmount',
      name: toCamelCase(name ?? `gauge${index}`),
      numberFormat: '',
      target: 'target',
      ...options,
    };


    spec.signals = addSignals(spec.signals ?? [], gaugeOptions);
    spec.scales = addScales(spec.scales ?? [], gaugeOptions);
    spec.marks = addGaugeMarks(spec.marks ?? [], gaugeOptions);
    spec.data = addData(spec.data ?? [], gaugeOptions);  

    
  }
);

export const addSignals = produce<Signal[], [GaugeSpecOptions]>((signals, options) => {
  signals.push({ name: 'arcMaxVal', value: options.maxArcValue }); 
  signals.push({ name: 'arcMinVal', value: options.minArcValue });
  signals.push({ name: 'backgroundfillColor', value: `${options.backgroundFill}`});
  signals.push({ name: 'centerX', update: "width/2"})
  signals.push({ name: 'centerY', update: "height/2 + outerRadius/2"})
  signals.push({ name: 'clampedVal', update: "min(max(arcMinVal, currVal), arcMaxVal)"})
  signals.push({ name: 'currVal', update: `data('table')[0].${options.metric}` });
  signals.push({ name: 'endAngle', update: "PI * 2 / 3" }); // 120 degrees 
  signals.push({ name: 'fillerColorToCurrVal', value: `${options.color}`})
  signals.push({ name: 'innerRadius', update: "outerRadius - (radiusRef * 0.25)"})
  signals.push({ name: 'needleAngle', update: "needleAngleOriginal - PI/2"})
  signals.push({ name: 'needleAngleOriginal', update: "scale('angleScale', clampedVal)"})
  signals.push({ name: 'needleLength', update: "innerRadius"})
  signals.push({ name: 'needleTipX', update: "centerX + needleLength * cos(needleAngle)"})
  signals.push({ name: 'needleTipY', update: "centerY + needleLength * sin(needleAngle)"})
  signals.push({ name: 'outerRadius', update: "radiusRef * 0.95"})
  signals.push({ name: 'radiusRef', update: "min(width/2, height/2)"})
  signals.push({ name: 'startAngle', update: "-PI * 2 / 3" }); // -120 degrees
  signals.push({ name: 'target', update: `data('table')[0].${options.target}` });
  signals.push({ name: 'theta', update: "scale('angleScale', clampedVal)"})
});

export const addScales = produce<Scale[], [GaugeSpecOptions]>((scales, options) => {
  scales.push({
    name: 'angleScale',
    type: 'linear',
    domain: [{ signal: 'arcMinVal' }, { signal: 'arcMaxVal' }],
    range: [{ signal: 'startAngle' }, { signal: 'endAngle' }],
    clamp: true
  });
});

export const addData = produce<Data[], [GaugeSpecOptions]>((data, options) => {
  const tableData = getGaugeTableData(data);
});