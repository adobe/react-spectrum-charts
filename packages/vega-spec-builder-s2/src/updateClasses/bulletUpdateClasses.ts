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
import { BulletOptions, UpdateClassTable } from '../types/index.js';
import { REBUILD, REPLAY } from './updateClassValues.js';

/** Update classes for bullet options. */
export const BULLET_UPDATE_CLASSES = {
  chartInspects: REBUILD,
  color: REPLAY,
  dimension: REPLAY,
  direction: REBUILD,
  labelPosition: REBUILD,
  markType: REPLAY,
  maxScaleValue: REBUILD,
  metric: REPLAY,
  metricAxis: REBUILD,
  metricLabel: REBUILD,
  name: REBUILD,
  numberFormat: REBUILD,
  scaleType: REBUILD,
  showTarget: REBUILD,
  showTargetValue: REBUILD,
  target: REBUILD,
  targetLabel: REBUILD,
  thresholdBarColor: REBUILD,
  thresholds: REBUILD,
  track: REBUILD,
} satisfies UpdateClassTable<BulletOptions>;
