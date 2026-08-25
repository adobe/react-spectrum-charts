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
import { FOCUSED_DIMENSION, FOCUSED_ITEM } from '@spectrum-charts/constants';

import { getAxisLabelFocusFontWeight, getMatchingAccessibleNavigationBarDimensionFields } from './axisLabelFocusUtils';

describe('getMatchingAccessibleNavigationBarDimensionFields()', () => {
  const marks = [
    { name: 'bar0', dimension: 'browser' },
    { name: 'bar1', dimension: 'segment' },
  ];

  test('returns marks whose dimension matches the scale field', () => {
    expect(getMatchingAccessibleNavigationBarDimensionFields('browser', marks)).toEqual([marks[0]]);
  });

  test('returns an empty array when no scale field is provided', () => {
    expect(getMatchingAccessibleNavigationBarDimensionFields(undefined, marks)).toEqual([]);
  });

  test('returns an empty array when no marks match', () => {
    expect(getMatchingAccessibleNavigationBarDimensionFields('downloads', marks)).toEqual([]);
  });

  test('defaults to an empty array when no marks are provided', () => {
    expect(getMatchingAccessibleNavigationBarDimensionFields('browser')).toEqual([]);
  });
});

describe('getAxisLabelFocusFontWeight()', () => {
  test('bolds the label when the focused item matches', () => {
    const rules = getAxisLabelFocusFontWeight('normal');
    expect(rules).toContainEqual({ test: `isValid(${FOCUSED_ITEM}) && ${FOCUSED_ITEM} === datum.value`, value: 'bold' });
  });

  test('bolds the label when the focused dimension matches', () => {
    const rules = getAxisLabelFocusFontWeight('normal');
    expect(rules).toContainEqual({
      test: `isValid(${FOCUSED_DIMENSION}) && ${FOCUSED_DIMENSION} === datum.value`,
      value: 'bold',
    });
  });

  test('falls back to the axis\'s own configured default weight, not a hardcoded one', () => {
    const rules = getAxisLabelFocusFontWeight('bold');
    expect(rules).toContainEqual({ value: 'bold' });
  });
});
