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
import { Signal, Scale, Data } from 'vega';
import { addGaugeMarks } from './gaugeMarkUtils';


import { DEFAULT_COLOR_SCHEME } from '@spectrum-charts/constants'; 

// import { getColorValue, spectrumColors } from '@spectrum-charts/themes';
import { getColorValue, spectrumColors } from '@spectrum-charts/themes'; 
import { toCamelCase } from '@spectrum-charts/utils';

import { ColorScheme, GaugeOptions, GaugeSpecOptions, PerformanceRanges, ScSpec } from '../types';
import { getGaugeTableData } from './gaugeDataUtils';

const DEFAULT_COLOR = spectrumColors.light['blue-900']; 

const DEFAULT_PERFORMANCE_RANGES: PerformanceRanges[] = [
  { bandEndPct: 0.55, fill: spectrumColors.light['red-900'] },
  { bandEndPct: 0.8,  fill: spectrumColors.light['yellow-900'] },
  { bandEndPct: 1,    fill: spectrumColors.light['green-700'] },
];



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
      color = DEFAULT_COLOR,
      performanceRanges,
      showPerformanceRanges,
      name,
      ...options
    }
  ) => {
    const resolvedPerformanceRanges =
      (performanceRanges ?? DEFAULT_PERFORMANCE_RANGES).map(range => ({
        ...range,
        fill: getColorValue(range.fill, DEFAULT_COLOR_SCHEME),
      }));
    const gaugeOptions: GaugeSpecOptions = {
      backgroundFill: spectrumColors[colorScheme]['gray-200'],
      backgroundStroke: spectrumColors[colorScheme]['gray-300'],
      color: getColorValue(color, colorScheme),
      fillerColorSignal: 'fillerColorToCurrVal',
      colorScheme: colorScheme,
      index,
      maxArcValue: 100,
      minArcValue: 0,
      metric: 'currentAmount',
      target: 'target',
      name: toCamelCase(name ?? `gauge${index}`),
      needle: false,
      targetLine: false,
      performanceRanges: resolvedPerformanceRanges,
      showPerformanceRanges: showPerformanceRanges ?? false,
      ...options,
    };

    spec.signals = addSignals(spec.signals ?? [], gaugeOptions);
    spec.scales = addScales(spec.scales ?? [], gaugeOptions);
    spec.marks = addGaugeMarks(spec.marks ?? [], gaugeOptions);
    spec.data = addData(spec.data ?? [], gaugeOptions);  
    
  }
);

export const addSignals = produce<Signal[], [GaugeSpecOptions]>((signals, options) => {
  const ranges = options.performanceRanges;
  
  signals.push({ name: 'arcMaxVal', value: options.maxArcValue }) 
  signals.push({ name: 'arcMinVal', value: options.minArcValue })
  signals.push({ name: 'backgroundfillColor', value: `${options.backgroundFill}`})
  signals.push({ name: 'centerX', update: "width/2"})
  signals.push({ name: 'centerY', update: "height/2 + outerRadius/2"})
  signals.push({ name: 'clampedVal', update: "min(max(arcMinVal, currVal), arcMaxVal)"})
  signals.push({ name: 'currVal', update: `data('table')[0].${options.metric}` })
  signals.push({ name: 'endAngle', update: "PI * 2 / 3" })
  signals.push({
    name: 'fillerColorToCurrVal',
    update: options.showPerformanceRanges ? 'null' : `"${options.color}"`,
  });
  signals.push({
    name: 'needleColor',
    update: options.showPerformanceRanges
      ? `"${getColorValue('gray-900', options.colorScheme)}"`
      : `"${options.color}"`,
  });
  signals.push({ name: 'innerRadius', update: "outerRadius - (radiusRef * 0.25)"})
  signals.push({ name: 'needleAngleTarget', update: "needleAngleTargetVal - PI/2"})
  signals.push({ name: 'needleAngleDeg', update: "needleAngleClampedVal * 180 / PI"})
  signals.push({ name: 'needleAngleClampedVal', update: "scale('angleScale', clampedVal)"})
  signals.push({ name: 'needleAngleTargetVal', update: "scale('angleScale', target)"})
  signals.push({ name: 'needleLength', update: "30"})
  signals.push({ name: 'outerRadius', update: "radiusRef * 0.95"})
  signals.push({ name: 'radiusRef', update: "min(width/2, height/2)"})
  signals.push({ name: 'startAngle', update: "-PI * 2 / 3" })
  signals.push({ name: 'theta', update: "scale('angleScale', clampedVal)"})
  signals.push({ name: 'target', update: `data('table')[0].${options.target}`})
  signals.push({ name: 'targetLineStroke', value: getColorValue('gray-900', options.colorScheme)})
  signals.push({ name: 'targetLineX', update: "centerX + ( innerRadius - 5) * cos(needleAngleTarget)"})
  signals.push({ name: 'targetLineY', update: "centerY + ( innerRadius - 5) * sin(needleAngleTarget)"})
  signals.push({ name: 'targetLineX2', update: "centerX + ( outerRadius + 5) * cos(needleAngleTarget)"})
  signals.push({ name: 'targetLineY2', update: "centerY + ( outerRadius + 5) * sin(needleAngleTarget)"})

  signals.push({ name: 'band1EndPct', value: ranges[0].bandEndPct });
  signals.push({ name: 'band2EndPct', value: ranges[1].bandEndPct });
  signals.push({ name: 'band3EndPct', value: ranges[2].bandEndPct });
  signals.push({ name: 'bandRange', update: 'arcMaxVal - arcMinVal' });
  signals.push({ name: 'band1StartVal', update: 'arcMinVal' });
  signals.push({ name: 'band1EndVal', update: 'arcMinVal + bandRange * band1EndPct' });
  signals.push({ name: 'band2StartVal', update: 'band1EndVal' });
  signals.push({ name: 'band2EndVal', update: 'arcMinVal + bandRange * band2EndPct' });
  signals.push({ name: 'band3StartVal', update: 'band2EndVal' });
  signals.push({ name: 'band3EndVal', update: 'arcMaxVal' });
  signals.push({ name: 'band1StartAngle', update: "scale('angleScale', band1StartVal)" });
  signals.push({ name: 'band1EndAngle',   update: "scale('angleScale', band1EndVal)" });
  signals.push({ name: 'band2StartAngle', update: "scale('angleScale', band2StartVal)" });
  signals.push({ name: 'band2EndAngle',   update: "scale('angleScale', band2EndVal)" });
  signals.push({ name: 'band3StartAngle', update: "scale('angleScale', band3StartVal)" });
  signals.push({ name: 'band3EndAngle',   update: "scale('angleScale', band3EndVal)" });
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
