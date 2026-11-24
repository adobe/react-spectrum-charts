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
import { LineOptions, UpdateClassTable } from '../types/index.js';
import { NOOP, REBUILD, REPLAY } from './updateClassValues.js';

/** Update classes for line options. */
export const LINE_UPDATE_CLASSES = {
  alternateSegmentKey: REBUILD,
  alternateSegmentLabel: NOOP,
  alternateSegmentLineType: REBUILD,
  chartActionBars: REBUILD,
  chartInspects: REBUILD,
  chartPopovers: REBUILD,
  color: REPLAY,
  dimension: REPLAY,
  dimensionHover: REBUILD,
  dualMetricAxis: REBUILD,
  forecasts: REBUILD,
  gradient: REBUILD,
  hasOnClick: REBUILD,
  hasOnContextMenu: REBUILD,
  hoverLabelKey: REBUILD,
  interactionMode: REBUILD,
  interpolate: REBUILD,
  isMethodLast: REBUILD,
  isSparkline: REBUILD,
  lineCap: REBUILD,
  lineDirectLabels: REBUILD,
  linePointAnnotations: REBUILD,
  lineType: REBUILD,
  markType: REPLAY,
  metric: REPLAY,
  metricAxis: REBUILD,
  metricRanges: REBUILD,
  name: REBUILD,
  opacity: REBUILD,
  otherSeriesColor: REBUILD,
  padding: REBUILD,
  pointSize: REBUILD,
  primarySeries: REBUILD,
  scaleType: REBUILD,
  showHoverLabel: REBUILD,
  staticPoint: REBUILD,
  trendlines: REBUILD,
} satisfies UpdateClassTable<LineOptions>;
