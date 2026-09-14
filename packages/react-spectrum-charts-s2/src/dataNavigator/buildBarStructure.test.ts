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
import { NodeObject, Structure } from 'data-navigator';

import { buildBarStructure, buildNodeLabel, segmentId } from './buildBarStructure';

const hasEdgeBetween = (structure: Structure, a: string, b: string): boolean =>
  Object.values(structure.edges).some((edge) => (edge.source === a && edge.target === b) || (edge.source === b && edge.target === a));

const data = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
  { browser: 'Safari', downloads: 4000 },
];

const stackedData = [
  { browser: 'Chrome', os: 'Windows', downloads: 18000 },
  { browser: 'Chrome', os: 'Mac', downloads: 9000 },
  { browser: 'Firefox', os: 'Windows', downloads: 5000 },
  { browser: 'Firefox', os: 'Mac', downloads: 3000 },
];

describe('buildBarStructure()', () => {
  test('keys leaf nodes by the dimension value', () => {
    const { structure } = buildBarStructure({ data, dimension: 'browser' });
    expect(structure.nodes.Chrome).toBeDefined();
    expect(structure.nodes.Chrome.data).toHaveProperty('browser', 'Chrome');
    expect(structure.nodes.Firefox).toBeDefined();
    expect(structure.nodes.Safari).toBeDefined();
  });

  test('returns the dimension root as the entry point', () => {
    const { structure, entryPoint } = buildBarStructure({ data, dimension: 'browser' });
    expect(entryPoint).toBeDefined();
    expect(structure.nodes[entryPoint as string]).toBeDefined();
    // dimension root nodes carry a dimensionLevel; leaf nodes do not
    expect(structure.nodes[entryPoint as string].dimensionLevel).not.toBeUndefined();
  });

  test('uses the consumer-supplied title verbatim as the entry point label (no synthesized narration)', () => {
    const { structure, entryPoint } = buildBarStructure({ data, dimension: 'browser', title: 'Browser downloads' });
    expect(structure.nodes[entryPoint as string].semantics?.label).toBe('Browser downloads');
  });

  test('falls back to the node id (no synthesized narration) when no title is supplied', () => {
    const { structure, entryPoint } = buildBarStructure({ data, dimension: 'browser' });
    expect(structure.nodes[entryPoint as string].semantics?.label).toBe(entryPoint);
  });

  test('ensures every node has a semantics label', () => {
    const { structure } = buildBarStructure({ data, dimension: 'browser' });
    Object.values(structure.nodes).forEach((node) => {
      expect(node.semantics?.label).toBeTruthy();
    });
  });

  describe('zero-value rows (invisible to mouse, so excluded from navigation too)', () => {
    test('excludes a basic bar leaf whose metric is exactly 0', () => {
      const zeroData = [...data, { browser: 'Edge', downloads: 0 }];
      const { structure } = buildBarStructure({ data: zeroData, dimension: 'browser', metric: 'downloads' });
      expect(structure.nodes.Edge).toBeUndefined();
      expect(structure.nodes.Chrome).toBeDefined();
    });

    test('keeps a negative-value leaf (only exactly-0 renders as invisible)', () => {
      const negativeData = [...data, { browser: 'Edge', downloads: -100 }];
      const { structure } = buildBarStructure({ data: negativeData, dimension: 'browser', metric: 'downloads' });
      expect(structure.nodes.Edge).toBeDefined();
    });

    test('excludes a zero-value segment from a stack, keeping its non-zero siblings', () => {
      const zeroSegmentData = [...stackedData, { browser: 'Chrome', os: 'Edge', downloads: 0 }];
      const { structure } = buildBarStructure({ data: zeroSegmentData, dimension: 'browser', color: 'os', metric: 'downloads' });
      expect(structure.nodes[segmentId('Chrome', 'Edge')]).toBeUndefined();
      expect(structure.nodes[segmentId('Chrome', 'Windows')]).toBeDefined();
    });

    test('excludes a whole stack when every one of its segments is zero-value', () => {
      const allZeroData = [
        ...stackedData,
        { browser: 'Safari', os: 'Mac', downloads: 0 },
        { browser: 'Safari', os: 'Windows', downloads: 0 },
      ];
      const { structure } = buildBarStructure({ data: allZeroData, dimension: 'browser', color: 'os', metric: 'downloads' });
      const divisions = Object.values(structure.nodes).filter((node) => node.dimensionLevel === 2);
      expect(divisions.map((node) => node.id)).not.toContain('Safari');
      expect(structure.nodes[segmentId('Safari', 'Mac')]).toBeUndefined();
    });
  });

  describe('stacked (color series present)', () => {
    test('keys leaf segments by the dimension + series composite', () => {
      const { structure } = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' });
      expect(structure.nodes[segmentId('Chrome', 'Windows')]).toBeDefined();
      expect(structure.nodes[segmentId('Chrome', 'Mac')]).toBeDefined();
      expect(structure.nodes[segmentId('Firefox', 'Mac')]).toBeDefined();
    });

    test('keeps one division per column (not compressed), each with multiple segments', () => {
      const { structure } = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' });
      // dimensionLevel === 2 are division (per-stack) nodes; basic bars compress these away
      const divisions = Object.values(structure.nodes).filter((node) => node.dimensionLevel === 2);
      expect(divisions).toHaveLength(2); // Chrome, Firefox
    });
  });

  describe('no wraparound (matches real mouse hover: navigation stays within its own level)', () => {
    test('does not wrap the last basic bar back to the first', () => {
      const { structure } = buildBarStructure({ data, dimension: 'browser' });
      expect(hasEdgeBetween(structure, 'Safari', 'Chrome')).toBe(false);
    });

    test('does not wrap the last stack back to the first stack', () => {
      const { structure } = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' });
      expect(hasEdgeBetween(structure, 'Firefox', 'Chrome')).toBe(false);
    });

    test('does not bridge the last segment of a stack into the next stack\'s first segment', () => {
      const { structure } = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' });
      expect(hasEdgeBetween(structure, segmentId('Chrome', 'Mac'), segmentId('Firefox', 'Windows'))).toBe(false);
    });
  });
});

describe('buildNodeLabel()', () => {
  test('falls back to the node id when there is no data', () => {
    expect(buildNodeLabel({ id: 'lonely' } as NodeObject)).toBe('lonely');
  });

  test('falls back to the node id for a dimension (root) node — no synthesized narration', () => {
    const node = {
      id: '_browser',
      dimensionLevel: 1,
      data: { dimensionKey: 'browser', divisions: { a: {}, b: {} } },
    } as unknown as NodeObject;
    expect(buildNodeLabel(node)).toBe('_browser');
  });

  test('falls back to the node id for a division (stack) node — no synthesized narration', () => {
    const node = { id: 'Chrome', dimensionLevel: 2, data: { values: { x: {}, y: {}, z: {} } } } as unknown as NodeObject;
    expect(buildNodeLabel(node)).toBe('Chrome');
  });

  test('describes a leaf node by its own scalar fields (consumer-owned field names, not translatable prose)', () => {
    const node = { id: 'Chrome', data: { browser: 'Chrome', downloads: 27000, _dnId: 'skip-me' } } as unknown as NodeObject;
    const label = buildNodeLabel(node);
    expect(label).toContain('browser: Chrome');
    expect(label).toContain('downloads: 27000');
    expect(label).not.toContain('_dnId');
  });
});
