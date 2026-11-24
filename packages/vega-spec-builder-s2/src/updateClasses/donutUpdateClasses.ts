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
import { DonutOptions, UpdateClassTable } from '../types/index.js';
import { REBUILD, REPLAY } from './updateClassValues.js';

/** Update classes for donut options. */
export const DONUT_UPDATE_CLASSES = {
  chartInspects: REBUILD,
  chartPopovers: REBUILD,
  color: REPLAY,
  donutSummaries: REBUILD,
  emphasizedItems: REBUILD,
  hideDeemphasizedLabels: REBUILD,
  holeRatio: REBUILD,
  isBoolean: REBUILD,
  markType: REPLAY,
  metric: REPLAY,
  name: REBUILD,
  segmentLabels: REBUILD,
  sortOrder: REBUILD,
  variant: REBUILD,
} satisfies UpdateClassTable<DonutOptions>;
