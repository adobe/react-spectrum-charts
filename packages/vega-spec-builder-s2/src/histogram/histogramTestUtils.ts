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
import { DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, MARK_ID } from '@spectrum-charts/core-s2/constants';

import { HistogramSpecOptions } from '../types/index.js';

export const defaultHistogramOptions: HistogramSpecOptions = {
  cellColors: 'sequentialCerulean9',
  cellLegend: true,
  chartInspects: [],
  chartPopovers: [],
  color: { value: 'categorical-100' },
  colorScheme: DEFAULT_COLOR_SCHEME,
  cumulative: false,
  densityCurve: false,
  drawInEffect: 'grow',
  idKey: MARK_ID,
  index: 0,
  interactiveMarkName: undefined,
  isDrawInAnimate: false,
  layout: 'stacked',
  markType: 'histogram',
  metric: DEFAULT_METRIC,
  name: 'histogram0',
  orientation: 'vertical',
  yValue: 'count',
};

export const interactiveHistogramOptions: HistogramSpecOptions = {
  ...defaultHistogramOptions,
  chartInspects: [{}],
  interactiveMarkName: 'histogram0',
};

export const colorSplitHistogramOptions: HistogramSpecOptions = {
  ...defaultHistogramOptions,
  color: 'series',
};

export const histogram2DOptions: HistogramSpecOptions = {
  ...defaultHistogramOptions,
  yMetric: 'y',
};
