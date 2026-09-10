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

/** Which half of the focused item's composite id (`segmentId(a, b)` = `a+SEP+b`) `matchExpr` should be checked against: Line's leaf scheme keys by the leading value (color), Bar's keys by the trailing value (color). */
export type FocusMatchConvention = 'prefix' | 'suffix';

/** True when a dimension group is focused directly, or a leaf within it is, per the given id convention. Checking only the caller's own convention (rather than both) avoids a false match when an unrelated value happens to look like the other convention's id fragment. */
export const getFocusedGroupOrItemMatchExpr = (matchExpr: string, convention: FocusMatchConvention): string => {
  const itemMatch =
    convention === 'prefix'
      ? `indexof(${FOCUSED_ITEM}, (${matchExpr}) + "${NAVIGATION_ID_SEPARATOR}") === 0`
      : getSuffixMatchExpr(matchExpr);
  return `${FOCUSED_DIMENSION} === ${matchExpr} || (isValid(${FOCUSED_ITEM}) && (${itemMatch}))`;
};

const getSuffixMatchExpr = (matchExpr: string): string => {
  const separatorWith = `"${NAVIGATION_ID_SEPARATOR}" + (${matchExpr})`;
  const suffixOffset = `length(${FOCUSED_ITEM}) - length(${separatorWith})`;
  // The explicit `>= 0` rules out indexof's not-found sentinel (-1) coinciding with suffixOffset
  // when the search string is exactly one character longer than focusedItem (a false "match").
  return `indexof(${FOCUSED_ITEM}, ${separatorWith}) >= 0 && indexof(${FOCUSED_ITEM}, ${separatorWith}) === ${suffixOffset}`;
};
