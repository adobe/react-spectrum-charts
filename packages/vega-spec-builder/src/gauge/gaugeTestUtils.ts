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
import { GaugeSpecOptions } from '../types';
import { spectrumColors } from '@spectrum-charts/themes'; 
import { DEFAULT_COLOR_SCHEME } from '@spectrum-charts/constants'; 
import { MARK_ID } from '@spectrum-charts/constants';

export const defaultGaugeOptions: GaugeSpecOptions = {
  colorScheme: DEFAULT_COLOR_SCHEME,
  idKey: MARK_ID,
  index: 5,
  name: 'gaugeTestName',
  graphLabel: 'graphLabel',
  showLabel: false,
  showsAsPercent: false,
  metric: 'currentAmount',
  color: DEFAULT_COLOR_SCHEME,
  minArcValue: 0,
  maxArcValue: 100,
  backgroundFill: spectrumColors[DEFAULT_COLOR_SCHEME]['gray-200'],
  backgroundStroke: spectrumColors[DEFAULT_COLOR_SCHEME]['gray-300'],
  fillerColorSignal: 'light',
  needle: false,
  target: 'target',
  targetLine: false,
  showPerformanceRanges: false,
  performanceRanges: [
    { bandEndPct: 0.55, fill: spectrumColors[DEFAULT_COLOR_SCHEME]['red-900'] },
    { bandEndPct: 0.8, fill: spectrumColors[DEFAULT_COLOR_SCHEME]['yellow-400'] },
    { bandEndPct: 1, fill: spectrumColors[DEFAULT_COLOR_SCHEME]['green-700'] },
  ]
};
