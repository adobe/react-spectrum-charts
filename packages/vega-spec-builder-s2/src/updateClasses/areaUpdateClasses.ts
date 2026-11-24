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
import { AreaOptions, UpdateClassTable } from '../types/index.js';
import { REBUILD, REPLAY } from './updateClassValues.js';

/** Update classes for area options. */
export const AREA_UPDATE_CLASSES = {
  chartInspects: REBUILD,
  chartPopovers: REBUILD,
  color: REPLAY,
  dimension: REPLAY,
  markType: REPLAY,
  metric: REPLAY,
  metricEnd: REBUILD,
  metricStart: REBUILD,
  name: REBUILD,
  opacity: REBUILD,
  order: REBUILD,
  padding: REBUILD,
  scaleType: REBUILD,
} satisfies UpdateClassTable<AreaOptions>;
