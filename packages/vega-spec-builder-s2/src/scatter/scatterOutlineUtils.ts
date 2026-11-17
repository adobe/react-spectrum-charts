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
import { ColorValueRef, NumericValueRef } from 'vega';

import { BACKGROUND_COLOR } from '@spectrum-charts/core-s2/constants';
import { getS2ColorValue } from '@spectrum-charts/core-s2/tokens';

import { getColorProductionRuleSignalString } from '../marks/markUtils.js';
import { ScatterSpecOptions } from '../types/index.js';
import { isScatterPointsDeemphasized } from './scatterEmphasisUtils.js';

/** Opacity of the outline color; matches the Spectrum 2 color swatch border (gray-1000 at 42%). */
export const SCATTER_OUTLINE_OPACITY = 0.42;
/** Minimum contrast between a point's fill and the background before `auto` outlines it (WCAG non-text contrast). */
export const SCATTER_OUTLINE_MIN_CONTRAST = 3;

/**
 * Gets the outline encodings for scatter points, or none when `outline` is `never` or `stroke`/`lineWidth` are set.
 * @param options ScatterSpecOptions
 * @returns stroke, strokeOpacity, and strokeWidth encodings
 */
export const getScatterOutlineEncoding = (
  options: ScatterSpecOptions
): { stroke?: ColorValueRef; strokeOpacity?: NumericValueRef; strokeWidth?: NumericValueRef } => {
  const { color, colorScaleType, colorScheme, lineWidth, outline, stroke } = options;
  const hasCustomLineWidth = typeof lineWidth !== 'object' || lineWidth.value !== 0;
  if (outline === 'never' || stroke !== undefined || hasCustomLineWidth) return {};
  const fill = getColorProductionRuleSignalString(color, colorScheme, colorScaleType);
  // faded points keep a full-strength outline so their edge stays visible
  const strokeWidth: NumericValueRef =
    outline === 'always' || isScatterPointsDeemphasized(options)
      ? { value: 1 }
      : { signal: `contrast(${fill}, ${BACKGROUND_COLOR}) < ${SCATTER_OUTLINE_MIN_CONTRAST} ? 1 : 0` };
  return {
    stroke: { value: getS2ColorValue('gray-1000', colorScheme) },
    strokeOpacity: { value: SCATTER_OUTLINE_OPACITY },
    strokeWidth,
  };
};
