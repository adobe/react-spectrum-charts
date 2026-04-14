/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { FilterTransform } from 'vega';

import {
  DEFAULT_TIME_DIMENSION,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  DIMENSION_HOVER_AREA,
  FILTERED_TABLE,
  GROUP_ID,
  HOVERED_ITEM,
  SELECTED_ITEM,
} from '@spectrum-charts/constants';

import { getDimensionField, getLineHighlightedData, getUniqueDimensionData } from './lineDataUtils';
import { defaultLineOptions } from './lineTestUtils';

describe('getLineHighlightedData()', () => {
  test('should include select signal if hasPopover', () => {
    const expr = (
      getLineHighlightedData({ ...defaultLineOptions, chartPopovers: [{}] }).transform?.[0] as FilterTransform
    ).expr;
    expect(expr.includes(SELECTED_ITEM)).toBeTruthy();
  });
  test('should not include select signal if does not hasPopover', () => {
    const expr = (getLineHighlightedData(defaultLineOptions).transform?.[0] as FilterTransform).expr;
    expect(expr.includes(SELECTED_ITEM)).toBeFalsy();
  });
  test('should use groupId if hadGroupId', () => {
    const expr = (
      getLineHighlightedData({
        ...defaultLineOptions,
        chartPopovers: [{}],
        chartTooltips: [{ highlightBy: 'dimension' }],
      }).transform?.[0] as FilterTransform
    ).expr;
    expect(expr.includes(GROUP_ID)).toBeTruthy();
  });
  test('should include both point and dimension hover signals when interactionMode is dimension', () => {
    const expr = (
      getLineHighlightedData({
        ...defaultLineOptions,
        interactionMode: 'dimension',
        interactiveMarkName: 'line0',
        chartTooltips: [{}],
      }).transform?.[0] as FilterTransform
    ).expr;
    // Should include point-level hover
    expect(expr).toContain(`line0_${HOVERED_ITEM}`);
    // Should include dimension-level hover
    expect(expr).toContain(`line0_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`);
    // Should reference the transformed time dimension for matching
    expect(expr).toContain(DEFAULT_TRANSFORMED_TIME_DIMENSION);
  });
});

describe('getDimensionField()', () => {
  test('should return transformed time dimension for time scale', () => {
    expect(getDimensionField('time', DEFAULT_TIME_DIMENSION)).toBe(DEFAULT_TRANSFORMED_TIME_DIMENSION);
  });

  test('should return dimension directly for non-time based scale', () => {
    expect(getDimensionField('linear', 'x')).toBe('x');
  });
});

describe('getUniqueDimensionData()', () => {
  test('should create aggregate dataset grouped by transformed time dimension', () => {
    const data = getUniqueDimensionData('line0', 'time', DEFAULT_TIME_DIMENSION);
    expect(data).toEqual({
      name: 'line0_uniqueXValues',
      source: FILTERED_TABLE,
      transform: [{ type: 'aggregate', groupby: [DEFAULT_TRANSFORMED_TIME_DIMENSION] }],
    });
  });
});
