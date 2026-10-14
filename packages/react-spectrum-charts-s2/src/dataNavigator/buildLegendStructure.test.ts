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
import { Structure } from 'data-navigator';

import { segmentId } from './buildBarStructure.js';
import {
  LEGEND_ROOT_ID,
  buildLegendStructure,
  getLegendNodeContentId,
  getLegendNodeLevel,
  getLegendNodeSeries,
  getLegendNodeToggledLabel,
  legendBarId,
  legendSeriesId,
} from './buildLegendStructure.js';

const data = [
  { browser: 'Chrome', os: 'Windows', downloads: 18000 },
  { browser: 'Chrome', os: 'Mac', downloads: 9000 },
  { browser: 'Firefox', os: 'Windows', downloads: 5000 },
  { browser: 'Firefox', os: 'Mac', downloads: 3000 },
  { browser: 'Safari', os: 'Mac', downloads: 0 },
];

const series = ['Windows', 'Mac'];

const build = (overrides: Partial<Parameters<typeof buildLegendStructure>[0]> = {}) =>
  buildLegendStructure({ data, dimension: 'browser', color: 'os', metric: 'downloads', series, ...overrides });

/** The node reached from `from` by `rule`, resolving the edge end the way data-navigator's `input.move` does. */
const move = (structure: Structure, from: string, rule: string): string | undefined => {
  const direction = structure.navigationRules?.[rule]?.direction;
  for (const edgeId of structure.nodes[from].edges) {
    const edge = structure.edges[edgeId];
    if (!edge.navigationRules.includes(rule) || !direction) continue;
    const target = edge[direction as 'source' | 'target'] as string;
    if (target !== from) return target;
  }
  return undefined;
};

describe('buildLegendStructure()', () => {
  test('builds root → series → bars levels, entering at the root', () => {
    const { structure, entryPoint } = build();

    expect(entryPoint).toBe(LEGEND_ROOT_ID);
    expect(getLegendNodeLevel(structure.nodes[LEGEND_ROOT_ID])).toBe('root');
    expect(getLegendNodeLevel(structure.nodes[legendSeriesId('Windows')])).toBe('series');
    expect(getLegendNodeSeries(structure.nodes[legendSeriesId('Windows')])).toBe('Windows');
    const bar = structure.nodes[legendBarId('Chrome', 'Mac')];
    expect(getLegendNodeLevel(bar)).toBe('bar');
    expect(getLegendNodeContentId(bar)).toBe(segmentId('Chrome', 'Mac'));
  });

  test('Enter drills into the first series, then its first bar; Escape returns', () => {
    const { structure } = build();

    expect(move(structure, LEGEND_ROOT_ID, 'child')).toBe(legendSeriesId('Windows'));
    expect(move(structure, legendSeriesId('Windows'), 'child')).toBe(legendBarId('Chrome', 'Windows'));
    expect(move(structure, legendBarId('Firefox', 'Windows'), 'parent')).toBe(legendSeriesId('Windows'));
    expect(move(structure, legendSeriesId('Mac'), 'parent')).toBe(LEGEND_ROOT_ID);
  });

  test('builds no series↔series edges (the adapter resolves them from the rendered legend grid)', () => {
    const { structure } = build();

    for (const rule of ['left', 'right', 'up', 'down']) {
      expect(move(structure, legendSeriesId('Windows'), rule)).toBeUndefined();
    }
  });

  test('left/right move along categories within a series, without wrapping', () => {
    const { structure } = build();

    expect(move(structure, legendBarId('Chrome', 'Mac'), 'right')).toBe(legendBarId('Firefox', 'Mac'));
    expect(move(structure, legendBarId('Firefox', 'Mac'), 'left')).toBe(legendBarId('Chrome', 'Mac'));
    expect(move(structure, legendBarId('Firefox', 'Mac'), 'right')).toBeUndefined();
  });

  test.each(['stacked', 'dodged'] as const)('%s: up/down move to the same category in the adjacent series', (type) => {
    const { structure } = build({ type });
    const windows = legendBarId('Chrome', 'Windows');
    const mac = legendBarId('Chrome', 'Mac');

    const [first, second] = move(structure, windows, 'down') === mac ? [windows, mac] : [mac, windows];
    expect(move(structure, first, 'down')).toBe(second);
    expect(move(structure, second, 'up')).toBe(first);
    expect(move(structure, first, 'up')).toBeUndefined();
  });

  test('uses the chart orientation for the physical keys', () => {
    expect(build({ orientation: 'vertical' }).structure.navigationRules?.right?.key).toBe('ArrowRight');
    expect(build({ orientation: 'horizontal' }).structure.navigationRules?.right?.key).toBe('ArrowDown');
  });

  test('excludes zero-value bars', () => {
    const { structure } = build({ series: ['Windows', 'Mac'] });

    expect(structure.nodes[legendBarId('Safari', 'Mac')]).toBeUndefined();
  });

  test('keeps hidden series navigable but not drillable', () => {
    const { structure } = build({ hiddenSeries: ['Mac'] });

    expect(structure.nodes[legendSeriesId('Mac')]).toBeDefined();
    expect(move(structure, legendSeriesId('Mac'), 'child')).toBeUndefined();
    expect(structure.nodes[legendBarId('Chrome', 'Mac')]).toBeUndefined();
    expect(move(structure, legendBarId('Chrome', 'Windows'), 'down')).toBeUndefined();
    expect(move(structure, legendBarId('Chrome', 'Windows'), 'up')).toBeUndefined();
  });

  test('labels the root, series and bars', () => {
    const { structure } = build({ title: 'Operating system', hiddenSeries: ['Mac'] });

    expect(structure.nodes[LEGEND_ROOT_ID].semantics?.label).toBe('Operating system legend. 2 series, 1 hidden.');
    expect(structure.nodes[legendSeriesId('Windows')].semantics?.label).toBe(
      'Operating system: Windows. browser: Chrome, downloads: 18000. browser: Firefox, downloads: 5000.'
    );
    expect(structure.nodes[legendSeriesId('Mac')].semantics?.label).toBe('Operating system: Mac. Hidden.');
    expect(getLegendNodeToggledLabel(structure.nodes[legendSeriesId('Mac')])).toBe('Operating system: Mac. Hidden.');
    expect(getLegendNodeToggledLabel(structure.nodes[legendSeriesId('Windows')])).toBe(
      'Operating system: Windows. Shown. browser: Chrome, downloads: 18000. browser: Firefox, downloads: 5000.'
    );
    expect(structure.nodes[legendBarId('Chrome', 'Windows')].semantics?.label).toBe('browser: Chrome. os: Windows. downloads: 18000.');
  });

  test('reads the legend display labels and descriptions for series', () => {
    const { structure } = build({
      fieldLabels: { browser: 'Browser', os: 'OS', downloads: 'Downloads' },
      labels: { Windows: 'Microsoft Windows' },
      descriptions: { Windows: { description: 'Desktop installs' }, Mac: { description: 'Apple desktops.' } },
      hiddenSeries: ['Mac'],
    });

    expect(structure.nodes[legendSeriesId('Windows')].semantics?.label).toBe(
      'OS: Microsoft Windows. Desktop installs. Browser: Chrome, Downloads: 18000. Browser: Firefox, Downloads: 5000.'
    );
    expect(structure.nodes[legendSeriesId('Mac')].semantics?.label).toBe('OS: Mac. Hidden. Apple desktops.');
  });

  test('reads a description\'s tooltip title before its text', () => {
    const { structure } = build({ descriptions: { Windows: { title: 'Microsoft Windows', description: 'Desktop installs' } } });
    expect(structure.nodes[legendSeriesId('Windows')].semantics?.label).toMatch(/^os: Windows\. Microsoft Windows\. Desktop installs\. browser: Chrome/);
  });

  describe('with keys', () => {
    // Entries group rows by browser (not by the bar's os series), so each entry covers several bars.
    const buildKeyed = (overrides: Partial<Parameters<typeof buildLegendStructure>[0]> = {}) =>
      build({ entryFields: ['browser'], series: ['Chrome', 'Firefox'], fieldLabels: { browser: 'Browser', os: 'OS', downloads: 'Downloads' }, ...overrides });

    test('reads and drills into every bar in the group, in stack segment order', () => {
      const { structure } = buildKeyed();
      expect(structure.nodes[LEGEND_ROOT_ID].semantics?.label).toBe('Browser legend. 2 series.');
      expect(structure.nodes[legendSeriesId('Chrome')].semantics?.label).toBe(
        'Browser: Chrome. OS: Mac, Downloads: 9000. OS: Windows, Downloads: 18000.'
      );
      const first = move(structure, legendSeriesId('Chrome'), 'child') as string;
      expect(getLegendNodeContentId(structure.nodes[first])).toBe(segmentId('Chrome', 'Mac'));
      const second = move(structure, first, 'right') as string;
      expect(getLegendNodeContentId(structure.nodes[second])).toBe(segmentId('Chrome', 'Windows'));
      expect(getLegendNodeSeries(structure.nodes[second])).toBe('Chrome');
    });

    test('treats a group whose series are all hidden as hidden', () => {
      const { structure } = buildKeyed({ hiddenSeries: ['Windows', 'Mac'] });
      expect(structure.nodes[legendSeriesId('Chrome')].semantics?.label).toBe('Browser: Chrome. Hidden.');
      expect(structure.nodes[LEGEND_ROOT_ID].semantics?.label).toBe('Browser legend. 2 series, 2 hidden.');
    });

    test('drops only the hidden series\' bars from a partly hidden group', () => {
      const { structure } = buildKeyed({ hiddenSeries: ['Mac'] });
      expect(structure.nodes[legendSeriesId('Chrome')].semantics?.label).toBe('Browser: Chrome. OS: Windows, Downloads: 18000.');
    });
  });

  test('falls back to the series field title, then the field name, for the root and series labels', () => {
    const titled = build({ fieldLabels: { os: 'OS' } }).structure;
    expect(titled.nodes[LEGEND_ROOT_ID].semantics?.label).toBe('OS legend. 2 series.');
    expect(titled.nodes[legendSeriesId('Mac')].semantics?.label).toEqual(expect.stringMatching(/^OS: Mac\. /));
    expect(build().structure.nodes[LEGEND_ROOT_ID].semantics?.label).toBe('os legend. 2 series.');
  });

  test('has no entry point without series', () => {
    expect(build({ series: [] }).entryPoint).toBeUndefined();
  });
});
