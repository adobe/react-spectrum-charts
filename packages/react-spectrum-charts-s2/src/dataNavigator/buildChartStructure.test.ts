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

  describe('with axis and legend regions', () => {
    const stackedData = [
      { browser: 'Chrome', os: 'Windows', downloads: 18000 },
      { browser: 'Chrome', os: 'Mac', downloads: 9000 },
      { browser: 'Firefox', os: 'Windows', downloads: 5000 },
      { browser: 'Firefox', os: 'Mac', downloads: 3000 },
    ];

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

    test('adds a namespaced legend region only when requested', () => {
      const withoutLegend = buildChartStructure({ chartType: 'bar', data: stackedData, dimension: 'browser', color: 'os' });
      const withLegend = buildChartStructure({
        chartType: 'bar',
        data: stackedData,
        dimension: 'browser',
        color: 'os',
        legend: { field: 'os' },
      });

      expect(Object.keys(withoutLegend?.structure.nodes ?? {}).some((id) => id.startsWith('legend::'))).toBe(false);
      expect(withLegend?.structure.nodes['legend::Windows']).toBeDefined();
      expect(withLegend?.structure.nodes['legend::Mac']).toBeDefined();
    });

    test('content: false builds a legend-only structure whose entry point is the legend root', () => {
      const composed = buildChartStructure({
        chartType: 'bar',
        data: stackedData,
        dimension: 'browser',
        color: 'os',
        legend: { field: 'os' },
        content: false,
      });

      const ids = Object.keys(composed?.structure.nodes ?? {});
      expect(ids.every((id) => id.startsWith('legend::'))).toBe(true);
      expect(composed?.entryPoint).toBe('legend::_os');
    });

    test('composes content, both axes, and the legend together', () => {
      const composed = buildChartStructure({
        chartType: 'bar',
        data: stackedData,
        dimension: 'browser',
        color: 'os',
        title: 'Downloads by browser',
        xAxis: { field: 'browser', type: 'categorical' },
        yAxis: { field: 'downloads', type: 'numerical' },
        legend: { field: 'os' },
      });

      const regions = new Set(
        Object.keys(composed?.structure.nodes ?? {}).map((id) => (id.includes('::') ? id.split('::')[0] : 'content'))
      );
      expect(regions).toEqual(new Set(['content', 'xAxis', 'yAxis', 'legend']));
    });
  });
});
