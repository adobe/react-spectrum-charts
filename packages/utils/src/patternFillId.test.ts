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
import {
  DEFAULT_PATTERN_FILL_IDS,
  getColorMatchedPatternFillUrl,
  getPatternFillId,
  getPatternFillUrl,
  resolvePatternFillGroup,
  resolvePatternFillValue,
} from './patternFillId';

describe('getPatternFillUrl() / getPatternFillId()', () => {
  test('round-trips a pattern id through the url reference format', () => {
    const url = getPatternFillUrl('diagonal-stripe');
    expect(url).toBe('url(#rsc-pattern-diagonal-stripe)');
    expect(getPatternFillId(url)).toBe('diagonal-stripe');
  });

  test('returns undefined for a non-pattern-reference value', () => {
    expect(getPatternFillId('#ff0000')).toBeUndefined();
    expect(getPatternFillId(undefined)).toBeUndefined();
  });
});

describe('resolvePatternFillValue()', () => {
  test('resolves a built-in pattern name to its url reference', () => {
    expect(resolvePatternFillValue('dots')).toBe(getPatternFillUrl('dots'));
  });

  test('passes through a literal value unchanged', () => {
    expect(resolvePatternFillValue('#2680eb')).toBe('#2680eb');
  });
});

describe('getColorMatchedPatternFillUrl()', () => {
  test('embeds the color in the pattern id, round-trippable via getPatternFillId', () => {
    const url = getColorMatchedPatternFillUrl('dots', '#2680eb');
    expect(url).toBe('url(#rsc-pattern-dots::#2680eb)');
    expect(getPatternFillId(url)).toBe('dots::#2680eb');
  });
});

describe('resolvePatternFillGroup()', () => {
  test('colorizes a built-in pattern name using a sibling literal color in the same group', () => {
    expect(resolvePatternFillGroup(['dots', '#2680eb'])).toStrictEqual([
      getColorMatchedPatternFillUrl('dots', '#2680eb'),
      '#2680eb',
    ]);
  });

  test('falls back to the fixed neutral tile when no sibling color is present', () => {
    expect(resolvePatternFillGroup(['dots', 'grid'])).toStrictEqual([getPatternFillUrl('dots'), getPatternFillUrl('grid')]);
  });

  test('passes through literal colors unchanged regardless of group contents', () => {
    expect(resolvePatternFillGroup(['#2680eb', '#ff0000'])).toStrictEqual(['#2680eb', '#ff0000']);
  });
});

describe('DEFAULT_PATTERN_FILL_IDS', () => {
  test('is a non-empty list of built-in pattern names', () => {
    expect(DEFAULT_PATTERN_FILL_IDS.length).toBeGreaterThan(0);
    expect(new Set(DEFAULT_PATTERN_FILL_IDS).size).toBe(DEFAULT_PATTERN_FILL_IDS.length);
  });
});
