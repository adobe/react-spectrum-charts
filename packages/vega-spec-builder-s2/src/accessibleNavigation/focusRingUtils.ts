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
import { RectEncodeEntry } from 'vega';

import { getS2ColorValue } from '@spectrum-charts/core-s2/tokens';

import { ColorScheme } from '../types/index.js';

export const FOCUS_RING_STROKE_WIDTH = 2;
export const FOCUS_RING_ROUNDED_RADIUS = 6;
export const FOCUS_RING_FLAT_RADIUS = 2;
/** Gap between a focused mark and its ring */
export const FOCUS_RING_OFFSET = 3;
const FOCUS_RING_COLOR = 'blue-800';

/**
 * Converts a value to the string navigation keys it by (JS `String(value)`), unlike Vega's `toString`, which maps '' and null to null.
 * @param expression
 * @returns string
 */
export const toNavigationKey = (expression: string): string => `("" + ${expression})`;

/**
 * Gets the unfilled stroke every keyboard focus ring draws.
 * @param colorScheme
 * @returns RectEncodeEntry
 */
export const getFocusRingStroke = (colorScheme: ColorScheme): RectEncodeEntry => ({
  fill: { value: 'transparent' },
  strokeWidth: { value: FOCUS_RING_STROKE_WIDTH },
  stroke: { value: getS2ColorValue(FOCUS_RING_COLOR, colorScheme) },
});
