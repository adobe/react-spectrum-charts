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
import { Mark, Signal, Scale } from 'vega';
import { addGaugeMarks } from './gaugeMarkUtils';


import { DEFAULT_COLOR_SCHEME } from '@spectrum-charts/constants'; 

// import { getColorValue, spectrumColors } from '@spectrum-charts/themes';
import { getColorValue, spectrumColors } from '@spectrum-charts/themes'; 
import { toCamelCase } from '@spectrum-charts/utils';

import { ColorScheme, GaugeOptions, GaugeSpecOptions, ScSpec } from '../types';

const DEFAULT_COLOR = spectrumColors.light['blue-900']; // can't figure out why this doesnt change if i leave it blank
// might be because this sets the default color for the gauge component for the user when they use a <Gauge /> component. 
// the color I see in Storybook is what is hardcoded in Gauge.story.tsx


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
      colorScheme: colorScheme,
      index,
      name: toCamelCase(name ?? `gauge${index}`),
      metric: 'currentAmount',
      target: 'target',
      color: getColorValue(color, colorScheme), // Convert spectrum color to RGB
      numberFormat: '',
      maxArcValue: 100,
      backgroundFill: '#eee',
      backgroundStroke: '#999',
      fillerColorSignal: 'fillerColorToCurrVal',
      straightEdgeOffsetExpr: 'PI/15',
      labelColor: '#333',
      labelSize: 40,
      ...options,
    };


    spec.signals = addSignals(spec.signals ?? [], gaugeOptions);
    spec.scales = addScales(spec.scales ?? [], gaugeOptions);
    spec.marks = addGaugeMarks(spec.marks ?? [], gaugeOptions);
    
  }
);

export const addSignals = produce<Signal[], [GaugeSpecOptions]>((signals, options) => {
  
  signals.push({ name: 'arcMinVal', value: 0 });
  signals.push({ name: 'arcMaxVal', value: 100 }); 
  signals.push({ name: 'startAngle', update: "-PI / 2" }); // -90 degrees
  signals.push({ name: 'endAngle', update: "PI / 2" });    // 90 degrees
  signals.push({ name: 'currVal', value: "30" });
  signals.push({ name: 'target', value: "80" });
  signals.push({ name: 'backgroundfillColor', value: "#77A7FB"})
  signals.push({ name: 'fillerColorToCurrVal', value: "#89CFF0"})
  signals.push({ name: 'TargetTextTheta', update: "scale('angleScale', target)"})
  signals.push({ name: 'targetTextX', update: "centerX + (outerRadius + 40) * sin(TargetTextTheta)"})
  signals.push({ name: 'targetTextY', update: "centerY - (outerRadius + 40) * cos(TargetTextTheta)"})
  signals.push({ name: 'StartTextTheta', update: "scale('angleScale', arcMinVal)"})
  signals.push({ name: 'EndTextTheta', update: "scale('angleScale', arcMaxVal)"})
  signals.push({ name: 'MinTextX', update: "centerX + (innerRadius + (outerRadius - innerRadius) / 2) * sin(StartTextTheta)"})
  signals.push({ name: 'MinTextY', update: "centerY + 40"})
  signals.push({ name: 'MaxTextX', update: "centerX + (innerRadius + (outerRadius - innerRadius) / 2) * sin(EndTextTheta)"})
  signals.push({ name: 'MaxTextY', update: "centerY + 40"})
  signals.push({ name: 'cornerR', update: "(outerRadius - innerRadius) * 0.45"})
  signals.push({ name: 'capSpan', update: "(cornerR / outerRadius) * 2"})
  signals.push({ name: 'valueEnd', update: "scale('angleScale', clampedVal)"})
  signals.push({ name: 'isFull', update: "clampedVal >= arcMaxVal"})
  signals.push({ name: 'capEnd', update: "min(valueEnd, startAngle + capSpan)"})
  signals.push({ name: 'mainStart', update: "isFull ? startAngle : capEnd"})
  signals.push({ name: 'radiusRef', update: "min(width/2, height/2)"})
  signals.push({ name: 'outerRadius', update: "radiusRef * 0.95"})
  signals.push({ name: 'innerRadius', update: "outerRadius - (radiusRef * 0.25)"})
  signals.push({ name: 'theta', update: "scale('angleScale', clampedVal)"})
  signals.push({ name: 'centerX', update: "width/2"})
  signals.push({ name: 'centerY', update: "height/2 + outerRadius/2"})
  signals.push({ name: 'clampedVal', update: "min(max(arcMinVal, currVal), arcMaxVal)"})
  signals.push({ name: 'needleAngleRaw', update: "scale('angleScale', clampedVal)"})
  signals.push({ name: 'needleAngle', update: "needleAngleRaw - PI/2"})
  signals.push({ name: 'needleLength', update: "innerRadius"})
  signals.push({ name: 'needleTipX', update: "centerX + needleLength * cos(needleAngle)"})
  signals.push({ name: 'needleTipY', update: "centerY + needleLength * sin(needleAngle)"})

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
