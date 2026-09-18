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
import { formatTimestamp, generateLargeData } from './storyUtils';

describe('generateLargeData', () => {
  test('generates the requested number of series and points', () => {
    const data = generateLargeData(2, 3);
    expect(data).toHaveLength(6);
    expect(new Set(data.map((d) => d.series)).size).toBe(2);
  });

  test('is deterministic across calls (seeded random)', () => {
    const a = generateLargeData(2, 5);
    const b = generateLargeData(2, 5);
    expect(a).toEqual(b);
  });

  test('values are never negative', () => {
    const data = generateLargeData(5, 100);
    expect(data.every((d) => d.value >= 0)).toBe(true);
  });

  test('datetime increases by one hour per point', () => {
    const data = generateLargeData(1, 3);
    expect(data[1].datetime - data[0].datetime).toBe(60 * 60 * 1000);
  });
});

describe('formatTimestamp', () => {
  test('formats a timestamp as "MMM D"', () => {
    expect(formatTimestamp(new Date('2023-03-05T00:00:00Z').getTime())).toBe('Mar 5');
  });
});