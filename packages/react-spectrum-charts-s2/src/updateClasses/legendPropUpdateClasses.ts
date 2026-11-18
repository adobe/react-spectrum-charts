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
import { LEGEND_UPDATE_CLASSES, NOOP, REBUILD, UpdateClassTable } from '@spectrum-charts/vega-spec-builder-s2';

import { LegendProps } from '../types/index.js';
import { omitKeys } from './omitKeys.js';

/** Update classes for `Legend` props. */
export const LEGEND_PROP_UPDATE_CLASSES = {
  ...omitKeys(LEGEND_UPDATE_CLASSES, ['chartPopovers', 'hasMouseInteraction', 'hasOnClick']),
  // the adapter replaces it with the popovers from children
  chartPopovers: NOOP,
  children: REBUILD,
  onClick: REBUILD,
  onMouseOut: REBUILD,
  onMouseOver: REBUILD,
} satisfies UpdateClassTable<LegendProps>;
