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
import { Spec } from 'vega';

import {
  clearPatternFillRegistry,
  getPatternFillId,
  getPatternFillSource,
  PatternTileSource,
  registerPatternFill,
  specHasPatternFill,
} from './patternFillUtils';

afterEach(() => {
  clearPatternFillRegistry();
});

describe('getPatternFillId()', () => {
  test('extracts the pattern id from a structured pattern-fill value', () => {
    expect(getPatternFillId({ pattern: 'stripe-blue' })).toBe('stripe-blue');
  });

  test('returns undefined for a plain color string', () => {
    expect(getPatternFillId('#ff0000')).toBeUndefined();
  });

  test('returns undefined for a non-pattern-fill value', () => {
    expect(getPatternFillId(undefined)).toBeUndefined();
    expect(getPatternFillId({})).toBeUndefined();
  });
});

describe('registerPatternFill() / getPatternFillSource()', () => {
  test('returns the registered source by id', () => {
    const source: PatternTileSource = { id: 'stripe-blue', tileSize: { width: 8, height: 8 }, draw: jest.fn() };
    registerPatternFill(source);
    expect(getPatternFillSource('stripe-blue')).toBe(source);
  });

  test('returns undefined for an id with no registered source', () => {
    expect(getPatternFillSource('unregistered')).toBeUndefined();
  });
});

describe('specHasPatternFill()', () => {
  test('returns false for a spec with no pattern-fill reference', () => {
    const spec = { marks: [{ encode: { enter: { fill: { value: '#ff0000' } } } }] } as unknown as Spec;
    expect(specHasPatternFill(spec)).toBe(false);
  });

  test('returns true when a pattern-fill reference appears anywhere in the spec', () => {
    const spec = {
      marks: [{ encode: { enter: { fill: { value: { pattern: 'stripe-blue' } } } } }],
    } as unknown as Spec;
    expect(specHasPatternFill(spec)).toBe(true);
  });
});
