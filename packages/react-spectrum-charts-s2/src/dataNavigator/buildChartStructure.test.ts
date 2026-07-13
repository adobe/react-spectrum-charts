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
import { buildChartStructure } from './buildChartStructure';
import { getNavigableChartType } from './navigableMarks';

const data = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
  { browser: 'Safari', downloads: 4000 },
];

describe('getNavigableChartType()', () => {
  test('resolves the Bar mark to the bar chart type', () => {
    expect(getNavigableChartType('Bar')).toBe('bar');
  });
  test('returns undefined for non-navigable marks', () => {
    expect(getNavigableChartType('Axis')).toBeUndefined();
    expect(getNavigableChartType('Line')).toBeUndefined();
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
});
