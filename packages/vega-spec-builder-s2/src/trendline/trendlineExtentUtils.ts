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
import { NumericValueRef } from 'vega';

/**
 * Gets the production rule for the start dimension extent of a trendline
 * @param startDimensionExtent
 * @param dimension
 * @param scale
 * @param axis
 * @returns
 */
export const getStartDimensionExtentProductionRule = (
  startDimensionExtent: number | 'domain' | null,
  dimension: string,
  scale: string,
  axis: 'x' | 'y'
): NumericValueRef => {
  switch (startDimensionExtent) {
    case null:
      return { scale, field: `${dimension}Min` };
    case 'domain':
      if (axis === 'x') return { value: 0 };
      return { signal: 'height' };
    default:
      return { scale, value: startDimensionExtent };
  }
};

/**
 * gets the production rule for the end dimension extent of a trendline
 * @param endDimensionExtent
 * @param dimension
 * @param scale
 * @param axis
 * @returns
 */
export const getEndDimensionExtentProductionRule = (
  endDimensionExtent: number | 'domain' | null,
  dimension: string,
  scale: string,
  axis: 'x' | 'y'
): NumericValueRef => {
  switch (endDimensionExtent) {
    case null:
      return { scale, field: `${dimension}Max` };
    case 'domain':
      if (axis === 'x') return { signal: 'width' };
      return { value: 0 };
    default:
      return { scale, value: endDimensionExtent };
  }
};
