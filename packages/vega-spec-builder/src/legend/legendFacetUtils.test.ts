/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Scale, ScaleField } from 'vega';

import { COLOR_SCALE, DEFAULT_COLOR, LINE_TYPE_SCALE, SYMBOL_SIZE_SCALE, TABLE } from '@spectrum-charts/constants';

import { getFacets, getFacetsFromKeys, getFieldName } from './legendFacetUtils';


describe('getFacets()', () => {
  test('should correctly identify continuous and categorical facets', () => {
    const scales: Scale[] = [
      {
        name: COLOR_SCALE,
        type: 'ordinal',
        domain: { data: TABLE, fields: [DEFAULT_COLOR] },
      },
      {
        name: LINE_TYPE_SCALE,
        type: 'ordinal',
      },
      {
        name: SYMBOL_SIZE_SCALE,
        type: 'linear',
        domain: { data: TABLE, fields: ['weight'] },
      },
    ];
    const { ordinalFacets, continuousFacets } = getFacets(scales);
    expect(ordinalFacets).toHaveLength(1);
    expect(continuousFacets).toHaveLength(1);
  });


});

describe('getFacetsFromKeys()', () => {
  test('should find the correct facets from the provided keys', () => {
    const scales: Scale[] = [
      {
        name: COLOR_SCALE,
        type: 'ordinal',
        domain: { data: TABLE, fields: [DEFAULT_COLOR] },
      },
      {
        name: LINE_TYPE_SCALE,
        type: 'ordinal',
      },
      {
        name: SYMBOL_SIZE_SCALE,
        type: 'linear',
        domain: { data: TABLE, fields: ['weight'] },
      },
    ];
    let facets = getFacetsFromKeys(['weight'], scales);
    expect(facets.ordinalFacets).toHaveLength(0);
    expect(facets.continuousFacets).toHaveLength(1);
    facets = getFacetsFromKeys([DEFAULT_COLOR], scales);
    expect(facets.ordinalFacets).toHaveLength(1);
    expect(facets.continuousFacets).toHaveLength(0);
  });


});

describe('getFieldName()', () => {
  test('should return string field as is', () => {
    expect(getFieldName('category')).toBe('category');
    expect(getFieldName('series')).toBe('series');
    expect(getFieldName('')).toBe('');
  });

  test('should extract field name from object with field property', () => {
    expect(getFieldName({ field: 'category' } as unknown as ScaleField)).toBe('category');
    expect(getFieldName({ field: 'series' } as unknown as ScaleField)).toBe('series');
    expect(getFieldName({ field: '' } as unknown as ScaleField)).toBe('');
  });

  test('should extract signal name from object with signal property', () => {
    expect(getFieldName({ signal: 'category' } as unknown as ScaleField)).toBe('category');
    expect(getFieldName({ signal: 'series' } as unknown as ScaleField)).toBe('series');
    expect(getFieldName({ signal: '' } as unknown as ScaleField)).toBe('');
  });

  test('should handle undefined input', () => {
    expect(getFieldName(undefined)).toBe('undefined');
  });

  test('should handle null input', () => {
    expect(getFieldName(null as unknown as ScaleField)).toBe('null');
  });

  test('should handle other object types with toString fallback', () => {
    const obj = { toString: () => 'custom object' };
    expect(getFieldName(obj as unknown as ScaleField)).toBe('custom object');
  });

  test('should handle object with both field and signal properties', () => {
    // Should prioritize field over signal
    expect(getFieldName({ field: 'category', signal: 'series' } as unknown as ScaleField)).toBe('category');
  });

  test('should handle object with non-string field property', () => {
    expect(getFieldName({ field: 123 } as unknown as ScaleField)).toBe('[object Object]');
  });

  test('should handle object with non-string signal property', () => {
    expect(getFieldName({ signal: 456 } as unknown as ScaleField)).toBe('[object Object]');
  });

  test('should handle empty object', () => {
    expect(getFieldName({} as unknown as ScaleField)).toBe('[object Object]');
  });

  test('should handle array input', () => {
    expect(getFieldName(['category'] as unknown as ScaleField)).toBe('category');
  });

  test('should handle number input', () => {
    expect(getFieldName(123 as unknown as ScaleField)).toBe('123');
  });

  test('should handle boolean input', () => {
    expect(getFieldName(true as unknown as ScaleField)).toBe('true');
    expect(getFieldName(false as unknown as ScaleField)).toBe('false');
  });
});
