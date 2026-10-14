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
import { buildBarStructure, segmentId } from './buildBarStructure.js';
import { buildChartStructure, getNodeIdForDatum } from './buildChartStructure.js';
import { getNavigableChartType } from './navigableMarks.js';

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

  describe('with an x-axis region', () => {
    test('without xAxis, returns the raw content structure untouched', () => {
      const direct = buildBarStructure({ data, dimension: 'browser' });
      const composed = buildChartStructure({ chartType: 'bar', data, dimension: 'browser' });

      expect(composed?.entryPoint).toBe(direct.entryPoint);
      expect(Object.keys(composed?.structure.nodes ?? {}).sort()).toEqual(Object.keys(direct.structure.nodes).sort());
    });

    test('keeps content as the entry point and content ids untouched', () => {
      const direct = buildBarStructure({ data, dimension: 'browser' });
      const composed = buildChartStructure({
        chartType: 'bar',
        data,
        dimension: 'browser',
        xAxis: { field: 'browser', type: 'categorical' },
      });

      expect(composed?.entryPoint).toBe(direct.entryPoint);
      expect(composed?.structure.nodes.Chrome).toBeDefined();
    });

    test('adds a namespaced x-axis region alongside content', () => {
      const composed = buildChartStructure({
        chartType: 'bar',
        data,
        dimension: 'browser',
        xAxis: { field: 'browser', type: 'categorical' },
      });

      const axisNodes = Object.entries(composed?.structure.nodes ?? {}).filter(([id]) => id.startsWith('xAxis::'));
      expect(axisNodes.length).toBeGreaterThan(0);
    });

    test('skips the axis region (no throw) when none of its values are currently visible', () => {
      const direct = buildBarStructure({ data, dimension: 'browser' });
      // visibleValues share nothing with the axis's real values — e.g. a region wired to the wrong axis.
      const composed = buildChartStructure({
        chartType: 'bar',
        data,
        dimension: 'browser',
        xAxis: { field: 'browser', type: 'categorical', visibleValues: ['not-a-browser'] },
      });

      expect(composed?.entryPoint).toBe(direct.entryPoint);
      const axisNodes = Object.keys(composed?.structure.nodes ?? {}).filter((id) => id.startsWith('xAxis::'));
      expect(axisNodes).toHaveLength(0);
    });
  });

});

describe('getNodeIdForDatum()', () => {
  test('returns the dimension key for a single-series bar', () => {
    expect(getNodeIdForDatum('bar', { browser: 'Chrome' }, { dimension: 'browser' })).toBe('Chrome');
    expect(getNodeIdForDatum('bar', { browser: 3 }, { dimension: 'browser' })).toBe('3');
  });

  test('returns the segment id for a multi-series bar', () => {
    expect(getNodeIdForDatum('bar', { browser: 'Chrome', os: 'Mac' }, { dimension: 'browser', seriesField: 'os' })).toBe(
      segmentId('Chrome', 'Mac')
    );
  });

  test('keys Date dimension values the same way the structure does', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    expect(getNodeIdForDatum('bar', { day: date }, { dimension: 'day' })).toBe(String(date));
  });

  test('returns undefined when the dimension value cannot be a key', () => {
    expect(getNodeIdForDatum('bar', {}, { dimension: 'browser' })).toBeUndefined();
    expect(getNodeIdForDatum('bar', { browser: { a: 1 } }, { dimension: 'browser' })).toBeUndefined();
  });
});
