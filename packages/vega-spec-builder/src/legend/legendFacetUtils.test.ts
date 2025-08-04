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
import { Scale } from 'vega';

import { COLOR_SCALE, DEFAULT_COLOR, LINE_TYPE_SCALE, SYMBOL_SIZE_SCALE, TABLE } from '@spectrum-charts/constants';

import { getFacets, getFacetsFromKeys, getFieldName } from './legendFacetUtils';

describe('getFieldName()', () => {
  test('should return string fields as-is', () => {
    expect(getFieldName('category')).toBe('category');
    expect(getFieldName('value')).toBe('value');
    expect(getFieldName('')).toBe('');
  });

  test('should extract field name from field reference objects', () => {
    expect(getFieldName({ field: 'category' })).toBe('category');
    expect(getFieldName({ field: 'value' })).toBe('value');
  });

  test('should extract signal name from signal reference objects', () => {
    expect(getFieldName({ signal: 'mySignal' })).toBe('mySignal');
    expect(getFieldName({ signal: 'dynamicValue' })).toBe('dynamicValue');
  });

  test('should handle objects with both field and signal properties', () => {
    expect(getFieldName({ field: 'category', signal: 'mySignal' })).toBe('category');
  });

  test('should handle objects without field or signal properties', () => {
    const obj = { someProperty: 'value' };
    expect(getFieldName(obj)).toBe('[object Object]');
  });

  test('should handle null and undefined values', () => {
    expect(getFieldName(null)).toBe('null');
    expect(getFieldName(undefined)).toBe('undefined');
  });

  test('should handle non-string field values', () => {
    expect(getFieldName({ field: 123 })).toBe('[object Object]');
    expect(getFieldName({ field: true })).toBe('[object Object]');
  });

  test('should handle non-string signal values', () => {
    expect(getFieldName({ signal: 456 })).toBe('[object Object]');
    expect(getFieldName({ signal: false })).toBe('[object Object]');
  });

  test('should handle primitive values', () => {
    expect(getFieldName(123)).toBe('123');
    expect(getFieldName(true)).toBe('true');
    expect(getFieldName(false)).toBe('false');
  });
});

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
