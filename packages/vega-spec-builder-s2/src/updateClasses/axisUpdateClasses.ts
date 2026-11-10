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
import { AxisOptions, UpdateClassTable } from '../types/index.js';
import { REBUILD, SIGNAL } from './updateClassValues.js';

/** Update classes for axis options. */
export const AXIS_UPDATE_CLASSES = {
  axisAnnotations: REBUILD,
  axisThumbnails: REBUILD,
  baseline: REBUILD,
  baselineOffset: REBUILD,
  currencyCode: REBUILD,
  currencyLocale: REBUILD,
  granularity: REBUILD,
  grid: REBUILD,
  hasOnClick: REBUILD,
  hasTooltip: REBUILD,
  hideDefaultLabels: REBUILD,
  labelAlign: REBUILD,
  labelFontWeight: REBUILD,
  labelFormat: REBUILD,
  labelLimit: REBUILD,
  labelOrientation: REBUILD,
  labels: REBUILD,
  name: REBUILD,
  numberFormat: REBUILD,
  position: REBUILD,
  range: REBUILD,
  referenceLines: REBUILD,
  subLabels: REBUILD,
  tickCountLimit: REBUILD,
  tickCountMinimum: REBUILD,
  tickMinStep: REBUILD,
  ticks: REBUILD,
  title: REBUILD,
  tooltipText: SIGNAL,
  truncateLabels: REBUILD,
} satisfies UpdateClassTable<AxisOptions>;
