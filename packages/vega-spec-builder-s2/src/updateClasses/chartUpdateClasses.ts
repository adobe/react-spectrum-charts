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
import { ChartOptions, UpdateClassTable } from '../types/index.js';
import { DATA, REBUILD, REPLAY, SIGNAL, SIZE } from './updateClassValues.js';

/** Update classes for chart options. */
export const CHART_UPDATE_CLASSES = {
  accessibleNavigation: REBUILD,
  animations: REBUILD,
  animationTypes: REBUILD,
  axes: REBUILD,
  backgroundColor: REBUILD,
  chartHeight: SIZE,
  chartWidth: SIZE,
  colors: REBUILD,
  colorScheme: REBUILD,
  data: DATA,
  description: REBUILD,
  hiddenSeries: SIGNAL,
  highlightedItem: SIGNAL,
  highlightedSeries: SIGNAL,
  idKey: REBUILD,
  legends: REBUILD,
  lineTypes: REBUILD,
  lineWidths: REBUILD,
  marks: REPLAY,
  opacities: REBUILD,
  symbolShapes: REBUILD,
  symbolSizes: REBUILD,
  title: REBUILD,
  titles: REBUILD,
  UNSAFE_vegaSpec: REPLAY,
} satisfies UpdateClassTable<ChartOptions>;
