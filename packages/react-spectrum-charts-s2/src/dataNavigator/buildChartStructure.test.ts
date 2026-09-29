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

  describe('with a legend region', () => {
    const seriesData = [
      { browser: 'Chrome', os: 'Windows', downloads: 18000 },
      { browser: 'Chrome', os: 'Mac', downloads: 9000 },
      { browser: 'Firefox', os: 'Windows', downloads: 5000 },
    ];
    const options = { chartType: 'bar' as const, data: seriesData, dimension: 'browser', color: 'os', metric: 'downloads' };

    test('adds a namespaced legend region; a bottom legend sits below the x-axis', () => {
      const composed = buildChartStructure({
        ...options,
        xAxis: { field: 'browser', type: 'categorical' },
        legend: { series: ['Windows', 'Mac'], title: 'Operating system' },
      });
      const nodes = composed?.structure.nodes ?? {};

      expect(nodes['legend::root']).toBeDefined();
      expect(nodes['legend::series__rsc__Mac']).toBeDefined();
      const chained = Object.values(composed?.structure.edges ?? {}).some(
        (edge) => String(edge.source).startsWith('xAxis::') && edge.target === 'legend::root'
      );
      expect(chained).toBe(true);
    });

    const regionEdge = (composed: ReturnType<typeof buildChartStructure>, region: string) =>
      Object.values(composed?.structure.edges ?? {}).find(
        (edge) =>
          [edge.source, edge.target].includes(composed?.entryPoint ?? '') &&
          [edge.source, edge.target].some((id) => String(id).startsWith(`${region}::`))
      );

    test('the x-axis is reached with Down from the chart root, not the other arrows', () => {
      const composed = buildChartStructure({ ...options, xAxis: { field: 'browser', type: 'categorical' } });
      const edge = regionEdge(composed, 'xAxis');

      expect(edge?.source).toBe(composed?.entryPoint);
      expect(edge?.navigationRules).toEqual(['down', 'up']);
    });

    test.each([
      ['left', 'legend::root', ['left', 'right']],
      ['right', undefined, ['right', 'left']],
      ['top', 'legend::root', ['up', 'down']],
    ] as const)('a %s legend is reached from the chart root with the arrow pointing at it', (position, source, rules) => {
      const composed = buildChartStructure({
        ...options,
        xAxis: { field: 'browser', type: 'categorical' },
        legend: { series: ['Windows', 'Mac'], position },
      });
      const edge = regionEdge(composed, 'legend');

      expect(edge?.source).toBe(source ?? composed?.entryPoint);
      expect(edge?.navigationRules).toEqual(rules);
    });

    test('binds region moves to the physical arrows in a horizontal chart', () => {
      const composed = buildChartStructure({ ...options, orientation: 'horizontal', legend: { series: ['Windows'], position: 'right' } });

      // Horizontal charts map ArrowRight/ArrowLeft onto the `down`/`up` rules.
      expect(regionEdge(composed, 'legend')?.navigationRules).toEqual(['down', 'up']);
    });

    test('skips the legend region without a color series', () => {
      const composed = buildChartStructure({ chartType: 'bar', data, dimension: 'browser', legend: { series: ['Windows'] } });

      expect(Object.keys(composed?.structure.nodes ?? {}).some((id) => id.startsWith('legend::'))).toBe(false);
    });

    test('hidden series are skipped by content and not drillable from the legend', () => {
      const composed = buildChartStructure({ ...options, legend: { series: ['Windows', 'Mac'] }, hiddenSeries: ['Mac'] });
      const nodes = composed?.structure.nodes ?? {};

      expect(nodes['Chrome__rsc__Mac']).toBeUndefined();
      expect(nodes['legend::series__rsc__Mac']).toBeDefined();
      expect(nodes['legend::bar__rsc__Chrome__rsc__Mac']).toBeUndefined();
    });
  });
});
