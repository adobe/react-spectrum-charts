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
import { DEFAULT_COLOR, SYMBOL_PATH_WIDTH_SCALE } from '@spectrum-charts/constants';

import { defaultScatterOptions } from '../scatter/scatterTestUtils';
import { getPathWidth, getScatterPathMarks, getScatterPathSpecOptions } from './scatterPathUtils';

describe('getScatterPathSpecOptions()', () => {
  test('should apply defaults', () => {
    const pathOptions = getScatterPathSpecOptions({}, 0, defaultScatterOptions);
    expect(pathOptions).toHaveProperty('color', 'gray-500');
    expect(pathOptions).toHaveProperty('name', 'scatter0Path0');
    expect(pathOptions).toHaveProperty('pathWidth', { value: 'M' });
    expect(pathOptions).toHaveProperty('opacity', 0.5);
  });
  test('should pick up groupBy properties from scatter facets', () => {
    const pathOptions = getScatterPathSpecOptions({}, 0, {
      ...defaultScatterOptions,
      color: DEFAULT_COLOR,
      size: 'size',
    });
    expect(pathOptions).toHaveProperty('groupBy', [DEFAULT_COLOR, 'size']);
  });
  test('should use groupBy instead of scatter facets is supplied', () => {
    const groupBy = ['test'];
    const pathOptions = getScatterPathSpecOptions({ groupBy }, 0, {
      ...defaultScatterOptions,
      color: DEFAULT_COLOR,
      size: 'size',
    });
    expect(pathOptions).toHaveProperty('groupBy', groupBy);
  });
});

describe('getScatterPathMarks()', () => {
  test('should return an epmty array if there are not any ScatterPath components', () => {
    const marks = getScatterPathMarks(defaultScatterOptions);
    expect(marks).toHaveLength(0);
  });
  test('should return scatter path marks', () => {
    const marks = getScatterPathMarks({ ...defaultScatterOptions, scatterPaths: [{}] });
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveProperty('type', 'group');
    expect(marks[0]).toHaveProperty('name', 'scatter0Path0_group');
    expect(marks[0].marks).toHaveLength(1);
    expect(marks[0]?.marks?.[0]).toHaveProperty('type', 'trail');
    expect(marks[0]?.marks?.[0]).toHaveProperty('name', 'scatter0Path0');
  });
});

describe('getPathWidth()', () => {
  test('should use scale if pathWidth is a string', () => {
    const pathWidth = getPathWidth('size');
    expect(pathWidth).toHaveProperty('scale', SYMBOL_PATH_WIDTH_SCALE);
    expect(pathWidth).toHaveProperty('field', 'size');
  });
  test('should convert named pathWidths', () => {
    const pathWidth = getPathWidth({ value: 'M' });
    expect(pathWidth).toHaveProperty('value', 2);
  });
  test('should pass through static number values', () => {
    const pathWidth = getPathWidth({ value: 3 });
    expect(pathWidth).toHaveProperty('value', 3);
  });
});
