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
import { Legend } from 'vega';

import { SYMBOL_SIZE_SCALE } from '@spectrum-charts/core-s2/constants';
import { getS2ColorValue } from '@spectrum-charts/core-s2/tokens';

import { ScatterSizeLegendOptions, ScatterSpecOptions } from '../../types/index.js';

/** Opacity of the size legend circles' gray-1000 border (the Spectrum 2 color swatch border). */
const SIZE_LEGEND_STROKE_OPACITY = 0.42;

/**
 * Gets a size legend legend for each ScatterSizeLegend child, when the scatter sizes points by a data field.
 * @param options ScatterSpecOptions
 * @returns Legend[]
 */
export const getScatterSizeLegends = ({ colorScheme, scatterSizeLegends, size }: ScatterSpecOptions): Legend[] => {
  if (typeof size !== 'string') return [];
  return scatterSizeLegends.map((legend) => getScatterSizeLegend(legend, colorScheme));
};

/**
 * Gets an expression for the midpoint of min and max, rounded to half of the range's order of magnitude.
 * @param min - expression for the smallest value
 * @param max - expression for the largest value
 * @returns expression string
 */
export const getRoundedMidpointExpr = (min: string, max: string): string => {
  const step = `pow(10, floor(log(${max} - ${min}) / LN10)) / 2`;
  return `round((${min} + ${max}) / 2 / (${step})) * (${step})`;
};

/**
 * Gets the size legend: the min, a rounded middle, and the max of the size scale as circles at their true size.
 * @param options ScatterSizeLegendOptions
 * @param colorScheme ColorScheme
 * @returns Legend
 */
export const getScatterSizeLegend = (
  { direction, position = 'right', title }: ScatterSizeLegendOptions,
  colorScheme: ScatterSpecOptions['colorScheme']
): Legend => {
  const domain = `domain('${SYMBOL_SIZE_SCALE}')`;
  const [min, max] = [`${domain}[0]`, `peek(${domain})`];
  const defaultDirection = position === 'top' || position === 'bottom' ? 'horizontal' : 'vertical';
  return {
    size: SYMBOL_SIZE_SCALE,
    orient: position,
    direction: direction ?? defaultDirection,
    ...(title !== undefined && { title }),
    symbolType: 'circle',
    values: { signal: `${min} === ${max} ? [${min}] : [${min}, ${getRoundedMidpointExpr(min, max)}, ${max}]` },
    encode: {
      symbols: {
        update: {
          fill: { value: getS2ColorValue('gray-500', colorScheme) },
          stroke: { value: getS2ColorValue('gray-1000', colorScheme) },
          strokeOpacity: { value: SIZE_LEGEND_STROKE_OPACITY },
          strokeWidth: { value: 1 },
        },
      },
      labels: { update: { text: { signal: 'formatShortNumber(datum.value)' } } },
    },
  };
};
