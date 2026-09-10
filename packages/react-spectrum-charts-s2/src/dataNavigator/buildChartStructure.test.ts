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
import { buildBarStructure } from './buildBarStructure';
import { buildChartStructure, getNodeIdForDatum } from './buildChartStructure';
import { buildLineStructure } from './buildLineStructure';
import { getNavigableChartType } from './navigableMarks';

const data = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
  { browser: 'Safari', downloads: 4000 },
];

const lineData = [
  { datetime: 0, value: 28 },
  { datetime: 1, value: 43 },
];

describe('getNavigableChartType()', () => {
  test('resolves the Bar mark to the bar chart type', () => {
    expect(getNavigableChartType('Bar')).toBe('bar');
  });
  test('resolves the Line mark to the line chart type', () => {
    expect(getNavigableChartType('Line')).toBe('line');
  });
  test('returns undefined for non-navigable marks', () => {
    expect(getNavigableChartType('Axis')).toBeUndefined();
    expect(getNavigableChartType('Donut')).toBeUndefined();
  });
  test('returns undefined when there is no displayName', () => {
    expect(getNavigableChartType(undefined)).toBeUndefined();
  });
});

describe('buildChartStructure()', () => {
  test('delegates the bar chart type to buildBarStructure', () => {
    const viaDispatch = buildChartStructure({ chartType: 'bar', data, dimension: 'browser' });
    const direct = buildBarStructure({ data, dimension: 'browser' });

    expect(viaDispatch).toBeDefined();
    expect(viaDispatch?.entryPoint).toBe(direct.entryPoint);
    expect(Object.keys(viaDispatch?.structure.nodes ?? {}).sort()).toEqual(
      Object.keys(direct.structure.nodes).sort()
    );
  });

  test('delegates the line chart type to buildLineStructure', () => {
    const viaDispatch = buildChartStructure({ chartType: 'line', data: lineData, dimension: 'datetime' });
    const direct = buildLineStructure({ data: lineData, dimension: 'datetime' });

    expect(viaDispatch).toBeDefined();
    expect(viaDispatch?.entryPoint).toBe(direct.entryPoint);
    expect(Object.keys(viaDispatch?.structure.nodes ?? {}).sort()).toEqual(
      Object.keys(direct.structure.nodes).sort()
    );
  });
});

describe('getNodeIdForDatum()', () => {
  test('resolves a bar datum using the given dimension', () => {
    expect(getNodeIdForDatum('bar', { browser: 'Chrome', downloads: 27000 }, { dimension: 'browser' })).toBe('Chrome');
  });

  test('defaults the dimension to the standard categorical field when omitted', () => {
    expect(getNodeIdForDatum('bar', { category: 'Chrome', downloads: 27000 }, {})).toBe('Chrome');
  });

  test('resolves a line datum using its navigation index field', () => {
    expect(getNodeIdForDatum('line', { datetime: 0, _dnIndex: 2 }, {})).toBe('2');
  });

  test('returns undefined when the datum has no value for the resolved dimension', () => {
    expect(getNodeIdForDatum('bar', { downloads: 27000 }, { dimension: 'browser' })).toBeUndefined();
  });
});
