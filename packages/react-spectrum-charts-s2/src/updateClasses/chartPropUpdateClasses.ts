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
import { CHART_UPDATE_CLASSES, NOOP, REBUILD, SIZE, UpdateClassTable } from '@spectrum-charts/vega-spec-builder-s2';

import { ChartProps } from '../types/index.js';
import { omitKeys } from './omitKeys.js';

/** Update classes for `Chart` props. */
export const CHART_PROP_UPDATE_CLASSES = {
  ...omitKeys(CHART_UPDATE_CLASSES, ['axes', 'legends', 'marks', 'titles']),
  children: REBUILD,
  config: REBUILD,
  dataTestId: NOOP,
  debug: NOOP,
  emptyStateText: NOOP,
  height: SIZE,
  loading: REBUILD,
  locale: REBUILD,
  maxHeight: SIZE,
  maxWidth: SIZE,
  minHeight: SIZE,
  minWidth: SIZE,
  onVegaViewReady: NOOP,
  padding: REBUILD,
  renderer: REBUILD,
  tooltipAnchor: NOOP,
  tooltipPlacement: NOOP,
  width: SIZE,
} satisfies UpdateClassTable<ChartProps>;
