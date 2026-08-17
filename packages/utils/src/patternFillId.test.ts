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
  getPatternFillId,
  isPatternFillValue,
  resolvePatternFillGroup,
  resolvePatternFillValue,
} from './patternFillId';

describe('isPatternFillValue() / getPatternFillId()', () => {
  test('recognizes a structured pattern-fill value', () => {
    expect(isPatternFillValue({ pattern: 'diagonal-stripe' })).toBe(true);
    expect(getPatternFillId({ pattern: 'diagonal-stripe' })).toBe('diagonal-stripe');
  });

  test('returns false/undefined for a plain color string', () => {
    expect(isPatternFillValue('#ff0000')).toBe(false);
    expect(getPatternFillId('#ff0000')).toBeUndefined();
  });

  test('returns false/undefined for undefined', () => {
    expect(isPatternFillValue(undefined)).toBe(false);
    expect(getPatternFillId(undefined)).toBeUndefined();
  });
});

describe('resolvePatternFillValue()', () => {
  test('resolves a built-in pattern name to a structured value with no foreground', () => {
    expect(resolvePatternFillValue('dots')).toStrictEqual({ pattern: 'dots' });
  });

  test('passes through a literal value unchanged', () => {
    expect(resolvePatternFillValue('#2680eb')).toBe('#2680eb');
  });
});

describe('resolvePatternFillGroup()', () => {
  test('colorizes a built-in pattern name using a sibling literal color in the same group', () => {
    expect(resolvePatternFillGroup(['dots', '#2680eb'])).toStrictEqual([
      { pattern: 'dots', foreground: '#2680eb' },
      '#2680eb',
    ]);
  });

  test('falls back to the fixed neutral tile (no foreground) when no sibling color is present', () => {
    expect(resolvePatternFillGroup(['dots', 'grid'])).toStrictEqual([{ pattern: 'dots' }, { pattern: 'grid' }]);
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
