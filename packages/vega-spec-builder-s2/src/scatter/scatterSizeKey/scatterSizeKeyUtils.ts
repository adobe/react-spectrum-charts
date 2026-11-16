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

import { ScatterSizeKeyOptions, ScatterSpecOptions } from '../../types/index.js';
import { SCATTER_OUTLINE_OPACITY } from '../scatterMarkUtils.js';

/**
 * Gets a size key legend for each ScatterSizeKey child, when the scatter sizes points by a data field.
 * @param options ScatterSpecOptions
 * @returns Legend[]
 */
export const getScatterSizeKeyLegends = ({ colorScheme, scatterSizeKeys, size }: ScatterSpecOptions): Legend[] => {
  if (typeof size !== 'string') return [];
  return scatterSizeKeys.map((key) => getScatterSizeKeyLegend(key, colorScheme));
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
 * Gets the size key: the min, a rounded middle, and the max of the size scale as circles at their true size.
 * @param options ScatterSizeKeyOptions
 * @param colorScheme ColorScheme
 * @returns Legend
 */
export const getScatterSizeKeyLegend = (
  { direction, position = 'right', title }: ScatterSizeKeyOptions,
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
          strokeOpacity: { value: SCATTER_OUTLINE_OPACITY },
          strokeWidth: { value: 1 },
        },
      },
      labels: { update: { text: { signal: 'formatShortNumber(datum.value)' } } },
    },
  };
};
