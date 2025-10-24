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
import { Mark, Signal } from 'vega';

// import {
//   DEFAULT_GAUGE_DIRECTION,
//   DEFAULT_COLOR_SCHEME,
//   DEFAULT_LABEL_POSITION,
//   DEFAULT_SCALE_TYPE,
//   DEFAULT_SCALE_VALUE,
// } from '@spectrum-charts/constants';


import { DEFAULT_COLOR_SCHEME } from '@spectrum-charts/constants'; // this is the only constant i needed to get a simple blue rect to render

// import { getColorValue, spectrumColors } from '@spectrum-charts/themes';
import { getColorValue, spectrumColors } from '@spectrum-charts/themes'; 
import { toCamelCase } from '@spectrum-charts/utils';

import { ColorScheme, GaugeOptions, GaugeSpecOptions, ScSpec } from '../types';

const DEFAULT_COLOR = spectrumColors.light['blue-900']; // can't figure out why this doesnt change if i leave it blank
// might be because this sets the default color for the gauge component for the user when they use a <Gauge /> component. 
// the color I see in Storybook is what is hardcoded in Gauge.story.tsx


/**
 * Adds a simple Gauge chart to the spec
 * This is a simplified version that just renders a blue rectangle as proof of concept
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
      dimension: 'graphLabel',
      target: 'target',
      color: getColorValue(color, colorScheme), // Convert spectrum color to RGB
      direction: 'column',
      numberFormat: '',
      showTarget: true,
      showTargetValue: false,
      labelPosition: 'top',
      scaleType: 'normal',
      maxArcValue: 100,
      track: false,
      thresholds: [],
      thresholdBarColor: false,
      metricAxis: false,
      ...options,
    };

    // Initialize marks array if it doesn't exist
    if (!spec.marks) {
      spec.marks = [];
    }

    spec.signals = addSignals(spec.signals ?? [], gaugeOptions);

    // Add a simple blue rectangle mark as proof of concept
    // spec.marks.push({
    //   type: 'rect',
    //   name: `${gaugeOptions.name}_test_rectangle`,
    //   encode: {
    //     enter: {
    //       x: { value: 50 },
    //       y: { value: 50 },
    //       width: { value: 200 },
    //       height: { value: 100 },
    //       fill: { value: gaugeOptions.color },
    //     },
    //   },
    // });
    
  }
);

export const addSignals = produce<Signal[], [GaugeSpecOptions]>((signals, options) => {
  // Hardcoded range values
  signals.push({ name: 'arcMinVal', value: 0 });
  signals.push({ name: 'arcMaxVal', value: 100 });
  
  // Hardcoded angles 
  signals.push({ name: 'startAngle', value: "-PI / 2" }); // -90 degrees
  signals.push({ name: 'endAngle', value: "PI / 2" });    // 90 degrees
  
  // Get current value from first row of table data
  signals.push({ name: 'currVal', value: "30" });
  signals.push({ name: 'target', value: "80" });
  
});
