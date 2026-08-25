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
import { FontWeight, ProductionRule } from 'vega';

import { FOCUSED_DIMENSION, FOCUSED_ITEM } from '@spectrum-charts/constants';

import { AccessibleNavigationMark } from '../types';

/** Filters `usermeta.accessibleNavigationMarks` to entries matching this axis's dimension field. */
export const getMatchingAccessibleNavigationBarDimensionFields = (
  scaleField: string | undefined,
  accessibleNavigationMarks: AccessibleNavigationMark[] = []
): AccessibleNavigationMark[] => {
  if (!scaleField) return [];
  return accessibleNavigationMarks.filter((mark) => mark.dimension === scaleField);
};

/**
 * Bolds an axis label when the data-navigator keyboard focus lands on the matching category —
 * either a single item (a plain bar) or a whole dimension group (a stacked/dodged column) — so
 * browsing the axis or the chart content gives the same visible feedback either way. Falls back
 * to the axis's own configured label weight rather than a hardcoded default, since that may
 * already be non-default.
 */
export const getAxisLabelFocusFontWeight = (defaultFontWeight: FontWeight): ProductionRule<{ value: FontWeight }> => [
  { test: `isValid(${FOCUSED_ITEM}) && ${FOCUSED_ITEM} === datum.value`, value: 'bold' },
  { test: `isValid(${FOCUSED_DIMENSION}) && ${FOCUSED_DIMENSION} === datum.value`, value: 'bold' },
  { value: defaultFontWeight },
];
