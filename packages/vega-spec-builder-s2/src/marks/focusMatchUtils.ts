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
import { FOCUSED_DIMENSION, FOCUSED_ITEM, NAVIGATION_ID_SEPARATOR } from '@spectrum-charts/constants';

/**
 * Matches when a dimension group's own value (e.g. `datum.series`) equals the focused dimension
 * group (that level is focused directly), or prefixes the focused item's composite id (a leaf
 * within that group is focused, one level in). Keeps fade/z-index/halo rules for a group in sync
 * as keyboard focus moves between the group and leaf levels — see buildLineStructure's leaf id
 * scheme (`segmentId(groupValue, index)`), which this assumes.
 */
export const getFocusedGroupOrItemMatchExpr = (matchExpr: string): string =>
  `${FOCUSED_DIMENSION} === ${matchExpr} || (isValid(${FOCUSED_ITEM}) && indexof(${FOCUSED_ITEM}, ${matchExpr} + "${NAVIGATION_ID_SEPARATOR}") === 0)`;
