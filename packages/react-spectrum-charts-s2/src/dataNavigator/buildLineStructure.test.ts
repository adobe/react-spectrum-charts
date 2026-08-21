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
import { NodeObject } from 'data-navigator';

import { segmentId } from './segmentId';
import { buildChartDescription, buildLineStructure, buildNodeLabel, getLineNodeId } from './buildLineStructure';

const data = [
  { datetime: 0, value: 28 },
  { datetime: 1, value: 43 },
  { datetime: 2, value: 81 },
];

const multiLineData = [
  { datetime: 0, value: 28, series: 'A' },
  { datetime: 1, value: 43, series: 'A' },
  { datetime: 0, value: 20, series: 'B' },
  { datetime: 1, value: 35, series: 'B' },
];

/** Follows a chain of edge-tagged moves manually, mirroring how data-navigator's input.move() resolves them. */
const move = (structure: ReturnType<typeof buildLineStructure>['structure'], from: string, navId: string): string | undefined => {
  const node = structure.nodes[from];
  for (const edgeId of node.edges) {
    const edge = structure.edges[edgeId];
    if (!edge.navigationRules.includes(navId)) continue;
    const rule = structure.navigationRules?.[navId];
    if (!rule) continue;
    const resolved = rule.direction === 'source' ? edge.source : edge.target;
    if (typeof resolved === 'string' && resolved !== from) return resolved;
  }
  return undefined;
};

describe('buildLineStructure()', () => {
  test('keys leaf nodes by their per-line index (single line)', () => {
    const { structure } = buildLineStructure({ data, dimension: 'datetime', isTimeDimension: false });
    expect(structure.nodes['1']).toBeDefined();
    expect(structure.nodes['1'].data).toHaveProperty('datetime', 0);
    expect(structure.nodes['2']).toBeDefined();
    expect(structure.nodes['3']).toBeDefined();
  });

  test('returns the chart root as the entry point', () => {
    const { structure, entryPoint } = buildLineStructure({ data, dimension: 'datetime', isTimeDimension: false });
    expect(entryPoint).toBeDefined();
    expect(structure.nodes[entryPoint as string]).toBeDefined();
    expect(structure.nodes[entryPoint as string].dimensionLevel).toBe(1);
  });

  test('sets a chart description on the entry point node', () => {
    const { structure, entryPoint } = buildLineStructure({
      data,
      dimension: 'datetime',
      isTimeDimension: false,
      title: 'Downloads over time',
    });
    expect(structure.nodes[entryPoint as string].semantics?.label).toContain('Downloads over time');
    expect(structure.nodes[entryPoint as string].semantics?.label).toContain('3 points');
  });

  test('gives a single-line chart exactly one line division, same shape as multi-line', () => {
    const { structure, entryPoint } = buildLineStructure({ data, dimension: 'datetime', isTimeDimension: false });
    const divisions = Object.values(structure.nodes).filter((node) => node.dimensionLevel === 2);
    expect(divisions).toHaveLength(1);
    expect(structure.nodes[entryPoint as string].edges.length).toBeGreaterThan(0);
  });

  test('ensures every node has a semantics label', () => {
    const { structure } = buildLineStructure({ data, dimension: 'datetime', isTimeDimension: false });
    Object.values(structure.nodes).forEach((node) => {
      expect(node.semantics?.label).toBeTruthy();
    });
  });

  test('formats a time dimension value as a readable date in the leaf label by default', () => {
    const { structure } = buildLineStructure({
      data: [{ datetime: new Date('2024-03-15T00:00:00Z').getTime(), value: 28 }],
      dimension: 'datetime',
    });
    const leaf = structure.nodes['1'];
    expect(leaf.semantics?.label).not.toContain('datetime: 1710');
    expect(leaf.semantics?.label).toMatch(/2024/);
  });

  describe('keyboard navigation (single line)', () => {
    test('drilling in from the chart root reaches the line, then its first point', () => {
      const { structure, entryPoint } = buildLineStructure({ data, dimension: 'datetime', isTimeDimension: false });
      const line = move(structure, entryPoint as string, 'child');
      expect(line).toBe('line');
      expect(move(structure, line as string, 'child')).toBe('1');
    });

    test('left/right move between points within the line, circularly', () => {
      const { structure } = buildLineStructure({ data, dimension: 'datetime', isTimeDimension: false });
      expect(move(structure, '1', 'right')).toBe('2');
      expect(move(structure, '2', 'right')).toBe('3');
      expect(move(structure, '3', 'right')).toBe('1'); // wraps
      expect(move(structure, '1', 'left')).toBe('3'); // wraps the other way
    });

    test('at the line level, right (or Enter) drills into the first point and left drills into the last', () => {
      const { structure } = buildLineStructure({ data, dimension: 'datetime', isTimeDimension: false });
      expect(move(structure, 'line', 'right')).toBe('1');
      expect(move(structure, 'line', 'child')).toBe('1');
      expect(move(structure, 'line', 'left')).toBe('3');
    });

    test('up/down do nothing when there is only one line', () => {
      const { structure } = buildLineStructure({ data, dimension: 'datetime', isTimeDimension: false });
      expect(move(structure, '1', 'up')).toBeUndefined();
      expect(move(structure, '1', 'down')).toBeUndefined();
    });

    test('escape from a point returns to the line, then to the chart root', () => {
      const { structure, entryPoint } = buildLineStructure({ data, dimension: 'datetime', isTimeDimension: false });
      const line = move(structure, entryPoint as string, 'child') && move(structure, '1', 'parent');
      expect(line).toBe('line');
      expect(move(structure, 'line', 'parent')).toBe(entryPoint);
    });
  });

  describe('multi-line (color present)', () => {
    test('keys leaf points by the series + per-line index composite', () => {
      const { structure } = buildLineStructure({
        data: multiLineData,
        dimension: 'datetime',
        color: 'series',
        isTimeDimension: false,
      });
      expect(structure.nodes[segmentId('A', 1)]).toBeDefined();
      expect(structure.nodes[segmentId('A', 2)]).toBeDefined();
      expect(structure.nodes[segmentId('B', 1)]).toBeDefined();
    });

    test('keeps one division per line, each with multiple points', () => {
      const { structure } = buildLineStructure({
        data: multiLineData,
        dimension: 'datetime',
        color: 'series',
        isTimeDimension: false,
      });
      const divisions = Object.values(structure.nodes).filter((node) => node.dimensionLevel === 2);
      expect(divisions).toHaveLength(2); // A, B
    });

    describe('keyboard navigation', () => {
      const build = () => buildLineStructure({ data: multiLineData, dimension: 'datetime', color: 'series' });

      test('drilling in from the chart root reaches the first line', () => {
        const { structure, entryPoint } = build();
        expect(move(structure, entryPoint as string, 'child')).toBe('line_A');
      });

      test('up/down move between lines while at the line level', () => {
        const { structure } = build();
        expect(move(structure, 'line_A', 'down')).toBe('line_B');
        expect(move(structure, 'line_B', 'down')).toBe('line_A'); // wraps
        expect(move(structure, 'line_A', 'up')).toBe('line_B'); // wraps the other way
      });

      test('entering a line via Enter or the right arrow key focuses its first point', () => {
        const { structure } = build();
        expect(move(structure, 'line_A', 'child')).toBe(segmentId('A', 1));
        expect(move(structure, 'line_A', 'right')).toBe(segmentId('A', 1));
      });

      test('entering a line via the left arrow key focuses its last point', () => {
        const { structure } = build();
        expect(move(structure, 'line_A', 'left')).toBe(segmentId('A', 2));
      });

      test('left/right move within the current line only', () => {
        const { structure } = build();
        expect(move(structure, segmentId('A', 1), 'right')).toBe(segmentId('A', 2));
        expect(move(structure, segmentId('A', 2), 'right')).toBe(segmentId('A', 1)); // wraps within line A
      });

      test('up/down move to the same-position point in the adjacent line', () => {
        const { structure } = build();
        expect(move(structure, segmentId('A', 1), 'down')).toBe(segmentId('B', 1));
        expect(move(structure, segmentId('B', 1), 'up')).toBe(segmentId('A', 1));
        expect(move(structure, segmentId('A', 2), 'down')).toBe(segmentId('B', 2));
      });

      test('escape from a point returns to its own line', () => {
        const { structure } = build();
        expect(move(structure, segmentId('B', 1), 'parent')).toBe('line_B');
      });
    });

    test('up/down at the leaf level does not fall back to the automatic within-line ordering', () => {
      // regression guard: up/down must never resolve to a same-line neighbor
      const { structure } = buildLineStructure({ data: multiLineData, dimension: 'datetime', color: 'series' });
      expect(move(structure, segmentId('A', 1), 'down')).not.toBe(segmentId('A', 2));
    });
  });
});

describe('getLineNodeId()', () => {
  test('returns undefined when the index field is missing', () => {
    expect(getLineNodeId({ datetime: 0 })).toBeUndefined();
  });

  test('keys a single-line datum by its index alone', () => {
    expect(getLineNodeId({ datetime: 0, _dnIndex: 2 })).toBe('2');
  });

  test('keys a multi-line datum by the series + index composite', () => {
    expect(getLineNodeId({ datetime: 0, series: 'A', _dnIndex: 2 }, 'series')).toBe(segmentId('A', 2));
  });
});

describe('buildChartDescription()', () => {
  test('describes a single-line chart and pluralizes the point count', () => {
    const label = buildChartDescription(data, 'datetime');
    expect(label).toContain('Line chart');
    expect(label).toContain('3 points');
  });

  test('uses the singular form for a single point', () => {
    expect(buildChartDescription([{ datetime: 0 }], 'datetime')).toContain('1 point.');
  });

  test('describes a multi-line chart when a series field is present', () => {
    const label = buildChartDescription(multiLineData, 'datetime', 'series', 'My title');
    expect(label).toContain('My title');
    expect(label).toContain('Multi-series line chart');
    expect(label).toContain('stacked by series');
    expect(label).toContain('2 lines');
  });
});

describe('buildNodeLabel()', () => {
  test('falls back to the node id when there is no data', () => {
    expect(buildNodeLabel({ id: 'lonely' } as NodeObject, 'datetime', true)).toBe('lonely');
  });

  test('describes a single-line division generically', () => {
    const node = { id: 'line', data: { values: { a: {}, b: {} } } } as unknown as NodeObject;
    expect(buildNodeLabel(node, 'datetime', true)).toBe('Line. Contains 2 points.');
  });

  test('describes a multi-line division by its child point count and derived value', () => {
    const node = {
      id: 'line_A',
      derivedNode: 'series',
      data: { series: 'A', values: { x: {}, y: {}, z: {} } },
    } as unknown as NodeObject;
    expect(buildNodeLabel(node, 'datetime', true)).toBe('Line A. Contains 3 points.');
  });

  test('describes a leaf node by its scalar fields, leaving non-time fields alone', () => {
    const node = { id: '1', data: { datetime: 0, value: 28, _dnIndex: 1 } } as unknown as NodeObject;
    const label = buildNodeLabel(node, 'datetime', false);
    expect(label).toContain('datetime: 0');
    expect(label).toContain('value: 28');
    expect(label).not.toContain('_dnIndex');
  });

  test('formats the dimension field as a date when isTimeDimension is true', () => {
    const node = {
      id: '1',
      data: { datetime: new Date('2024-03-15T00:00:00Z').getTime(), value: 28 },
    } as unknown as NodeObject;
    const label = buildNodeLabel(node, 'datetime', true);
    expect(label).toContain('value: 28');
    expect(label).toMatch(/2024/);
    expect(label).not.toContain('datetime: 1710');
  });

  test('falls back to the raw value when the dimension is not a valid date', () => {
    const node = { id: '1', data: { datetime: 'not-a-date', value: 28 } } as unknown as NodeObject;
    expect(buildNodeLabel(node, 'datetime', true)).toContain('datetime: not-a-date');
  });
});
