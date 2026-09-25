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
import { getCombinedTimeLabelFormat, getTimeLabelFormats, timeTickCandidates } from './timeAxisConfig';

describe('getTimeLabelFormats()', () => {
  test('returns the primary and secondary formats for each granularity', () => {
    expect(getTimeLabelFormats('hour')).toEqual({ secondaryLabelFormat: '%-I %p', primaryLabelFormat: '%b %-d' });
    expect(getTimeLabelFormats('day')).toEqual(getTimeLabelFormats('week'));
    expect(getTimeLabelFormats('quarter')).toEqual({ secondaryLabelFormat: 'Q%q', primaryLabelFormat: '%Y' });
    expect(getTimeLabelFormats('year')).toEqual({ secondaryLabelFormat: '%Y', primaryLabelFormat: '' });
  });
});

describe('getCombinedTimeLabelFormat()', () => {
  test('joins the primary and secondary formats', () => {
    expect(getCombinedTimeLabelFormat('day')).toBe('%b\u2000%-d');
  });

  test('omits the separator when there is no primary format', () => {
    expect(getCombinedTimeLabelFormat('year')).toBe('%Y');
  });
});

describe('timeTickCandidates', () => {
  test('never offers an interval finer than the granularity', () => {
    expect(timeTickCandidates.month[0]).toEqual({ interval: 'month', step: 1 });
    expect(timeTickCandidates.quarter[0]).toEqual({ interval: 'month', step: 3 });
    expect(timeTickCandidates.year).toEqual([{ interval: 'year', step: 1 }]);
  });
});
