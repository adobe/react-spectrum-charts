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
import { BarOptions, UpdateClassTable } from '../types/index.js';
import { REBUILD, REPLAY } from './updateClassValues.js';

/** Update classes for bar options. */
export const BAR_UPDATE_CLASSES = {
  barAnnotations: REBUILD,
  barDirectLabels: REBUILD,
  chartInspects: REBUILD,
  chartPopovers: REBUILD,
  color: REPLAY,
  colorOverride: REBUILD,
  dimension: REPLAY,
  dimensionDataType: REBUILD,
  diverging: REBUILD,
  dualMetricAxis: REBUILD,
  groupedPadding: REBUILD,
  hasOnClick: REBUILD,
  hasSquareCorners: REBUILD,
  lineType: REBUILD,
  lineWidth: REBUILD,
  markType: REPLAY,
  metric: REPLAY,
  metricAxis: REBUILD,
  name: REBUILD,
  opacity: REBUILD,
  order: REBUILD,
  orientation: REBUILD,
  paddingOuter: REBUILD,
  paddingRatio: REBUILD,
  trellis: REBUILD,
  trellisOrientation: REBUILD,
  trellisPadding: REBUILD,
  trendlines: REBUILD,
  type: REBUILD,
} satisfies UpdateClassTable<BarOptions>;
