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
import {
  DEFAULT_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_METRIC,
  DEFAULT_TIME_DIMENSION,
  MARK_ID,
} from '@spectrum-charts/constants';

import { LineSpecOptions } from '../types';
import { LineMarkOptions } from './lineUtils';

export const defaultLineMarkOptions: LineMarkOptions = {
  alternateSegmentLineType: 'dotted',
  color: DEFAULT_COLOR,
  colorScheme: DEFAULT_COLOR_SCHEME,
  dimension: DEFAULT_TIME_DIMENSION,
  idKey: MARK_ID,
  lineCap: 'round',
  lineType: { value: 'solid' },
  lineWidth: { value: 1 },
  name: 'line0',
  opacity: { value: 1 },
  metric: DEFAULT_METRIC,
  scaleType: 'time',
};

export const defaultLineOptions: LineSpecOptions = {
  chartPopovers: [],
  chartInspects: [],
  name: 'line0',
  dimension: DEFAULT_TIME_DIMENSION,
  forecasts: [],
  gradient: false,
  hasOnClick: false,
  hasOnContextMenu: false,
  idKey: MARK_ID,
  index: 0,
  lineCap: 'round',
  markType: 'line',
  metric: DEFAULT_METRIC,
  metricRanges: [],
  color: DEFAULT_COLOR,
  scaleType: 'time',
  lineType: { value: 'solid' },
  opacity: { value: 1 },
  colorScheme: DEFAULT_COLOR_SCHEME,
  interactiveMarkName: undefined,
  lineDirectLabels: [],
  linePointAnnotations: [],
  popoverMarkName: undefined,
  trendlines: [],
  interpolate: undefined,
  alternateSegmentLineType: 'dotted',
  dimensionHover: false,
  showHoverLabel: true,
};
