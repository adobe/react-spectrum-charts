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
import { FilterTransform } from 'vega';

import { GROUP_ID, SELECTED_ITEM, SERIES_ID } from '@spectrum-charts/constants';

import { getLineHighlightedData, getPrimarySeriesOtherExpr } from './lineDataUtils';
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
        chartInspects: [{ highlightBy: 'dimension' }],
      }).transform?.[0] as FilterTransform
    ).expr;
    expect(expr.includes(GROUP_ID)).toBeTruthy();
  });
});

describe('getPrimarySeriesOtherExpr()', () => {
  test('with string array uses JSON.stringify for series reference', () => {
    const expr = getPrimarySeriesOtherExpr(['series1', 'series2'], 'datum');
    expect(expr).toBe(`indexof(["series1","series2"], datum.${SERIES_ID}) < 0`);
  });

  test('with number uses slice of color domain', () => {
    const expr = getPrimarySeriesOtherExpr(3, 'datum');
    expect(expr).toBe(`indexof(slice(domain('color'), 0, 3), datum.${SERIES_ID}) < 0`);
  });

  test('uses provided datumPath', () => {
    const expr = getPrimarySeriesOtherExpr(['series1'], 'datum.datum');
    expect(expr).toContain('datum.datum');
  });
});
