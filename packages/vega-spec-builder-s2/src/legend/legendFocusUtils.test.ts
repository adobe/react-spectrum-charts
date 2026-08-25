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
import { getMatchingAccessibleNavigationSeriesFields } from './legendFocusUtils';

describe('getMatchingAccessibleNavigationSeriesFields()', () => {
  const marks = [
    { name: 'bar0', dimension: 'browser', color: 'os' },
    { name: 'bar1', dimension: 'segment' },
  ];

  test('returns marks whose color field matches the scale field', () => {
    expect(getMatchingAccessibleNavigationSeriesFields('os', marks)).toEqual([marks[0]]);
  });

  test('returns an empty array when no scale field is provided', () => {
    expect(getMatchingAccessibleNavigationSeriesFields(undefined, marks)).toEqual([]);
  });

  test('excludes marks with no color field at all', () => {
    expect(getMatchingAccessibleNavigationSeriesFields('segment', marks)).toEqual([]);
  });
});
