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
import { BAR_UPDATE_CLASSES, NOOP, REBUILD, UpdateClassTable } from '@spectrum-charts/vega-spec-builder-s2';

import { BarProps } from '../types/index.js';
import { omitKeys } from './omitKeys.js';

/** Update classes for `Bar` props. */
export const BAR_PROP_UPDATE_CLASSES = {
  ...omitKeys(BAR_UPDATE_CLASSES, [
    'barAnnotations',
    'barDirectLabels',
    'chartInspects',
    'chartPopovers',
    'hasOnClick',
    'markType',
  ]),
  children: REBUILD,
  onClick: REBUILD,
  onContextMenu: NOOP,
  onMouseOut: NOOP,
  onMouseOver: NOOP,
} satisfies UpdateClassTable<BarProps>;
