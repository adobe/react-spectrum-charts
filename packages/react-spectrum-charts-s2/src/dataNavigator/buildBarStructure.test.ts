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

const edgeBetween = (structure: Structure, a: string, b: string) =>
  Object.values(structure.edges).find((edge) => (edge.source === a && edge.target === b) || (edge.source === b && edge.target === a));

/** The segment Enter reaches first from a division (stack) node — the edge where the division is the source, not the target. */
const firstSegmentOf = (structure: Structure, divisionId: string): string | undefined => {
  const division = structure.nodes[divisionId];
  const edgeId = division.edges.find((id) => structure.edges[id].source === divisionId && structure.edges[id].navigationRules.includes('child'));
  return edgeId ? (structure.edges[edgeId].target as string) : undefined;
};

/** The library keys a division (stack) node by an internal composite, not the raw dimension value — look it up by the value each of its segments actually carries. */
const divisionIdFor = (structure: Structure, dimensionKey: string, value: string): string => {
  const divisions = structure.dimensions?.[dimensionKey]?.divisions ?? {};
  const match = Object.values(divisions).find((division) =>
    Object.values((division as unknown as { values: Record<string, Record<string, unknown>> }).values).some(
      (leaf) => leaf[dimensionKey] === value
    )
  );
  return (match as unknown as { id: string }).id;
};

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

  test('falls back to a "metric by dimension" summary with a bar count when no title is supplied', () => {
    const { structure, entryPoint } = buildBarStructure({ data, dimension: 'browser', metric: 'downloads' });
    expect(structure.nodes[entryPoint as string].semantics?.label).toBe('downloads by browser chart. 3 bars.');
  });

  test('counts groups instead of bars, and names the series field, when a color series is present', () => {
    const { structure, entryPoint } = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os', metric: 'downloads' });
    expect(structure.nodes[entryPoint as string].semantics?.label).toBe('downloads by browser chart, grouped by os. 2 groups.');
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

    describe('segment order (matches Vega\'s real stack, not raw data-array order)', () => {
      // Vega's stack transform accumulates bottom-up, so without an explicit sort, the LAST row in the
      // array ends up visually on top (verified against the real transform) — Enter should reach that one.
      test('reaches the last-listed segment first when no order field is given', () => {
        const { structure } = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' });
        const chrome = divisionIdFor(structure, 'browser', 'Chrome');
        expect(firstSegmentOf(structure, chrome)).toBe(segmentId('Chrome', 'Mac'));
      });

      test('reaches the segment with the highest order value first, even when it is listed first in the array', () => {
        const orderedData = [
          { browser: 'Chrome', os: 'Windows', downloads: 18000, order: 2 },
          { browser: 'Chrome', os: 'Mac', downloads: 9000, order: 1 },
        ];
        const { structure } = buildBarStructure({ data: orderedData, dimension: 'browser', color: 'os', order: 'order' });
        const chrome = divisionIdFor(structure, 'browser', 'Chrome');
        expect(firstSegmentOf(structure, chrome)).toBe(segmentId('Chrome', 'Windows'));
      });

      test('reaches the segment with the highest order value first, even when it is listed last in the array', () => {
        const orderedData = [
          { browser: 'Chrome', os: 'Windows', downloads: 18000, order: 1 },
          { browser: 'Chrome', os: 'Mac', downloads: 9000, order: 2 },
        ];
        const { structure } = buildBarStructure({ data: orderedData, dimension: 'browser', color: 'os', order: 'order' });
        const chrome = divisionIdFor(structure, 'browser', 'Chrome');
        expect(firstSegmentOf(structure, chrome)).toBe(segmentId('Chrome', 'Mac'));
      });

      test('does not change the overall column (dimension) order — only the segments within each stack', () => {
        const { structure } = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' });
        const chrome = divisionIdFor(structure, 'browser', 'Chrome');
        const firefox = divisionIdFor(structure, 'browser', 'Firefox');
        expect(hasEdgeBetween(structure, chrome, firefox)).toBe(true);
      });
    });

    describe('segment Left/Right crosses to the same series in the adjacent stack', () => {
      const threeStackData = [
        { browser: 'Chrome', os: 'Windows', downloads: 18000 },
        { browser: 'Chrome', os: 'Mac', downloads: 9000 },
        { browser: 'Firefox', os: 'Windows', downloads: 5000 },
        { browser: 'Firefox', os: 'Mac', downloads: 3000 },
        { browser: 'Safari', os: 'Windows', downloads: 4000 },
        { browser: 'Safari', os: 'Mac', downloads: 2000 },
      ];

      test('links a segment to the same-series segment one stack over', () => {
        const { structure } = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' });
        expect(hasEdgeBetween(structure, segmentId('Chrome', 'Windows'), segmentId('Firefox', 'Windows'))).toBe(true);
        expect(hasEdgeBetween(structure, segmentId('Chrome', 'Mac'), segmentId('Firefox', 'Mac'))).toBe(true);
      });

      test('never links segments of different series across stacks', () => {
        const { structure } = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' });
        expect(hasEdgeBetween(structure, segmentId('Chrome', 'Windows'), segmentId('Firefox', 'Mac'))).toBe(false);
        expect(hasEdgeBetween(structure, segmentId('Chrome', 'Mac'), segmentId('Firefox', 'Windows'))).toBe(false);
      });

      test('the cross-stack edge navigates on Left/Right, not Up/Down', () => {
        const { structure } = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' });
        const edge = edgeBetween(structure, segmentId('Chrome', 'Windows'), segmentId('Firefox', 'Windows'));
        expect(edge?.navigationRules).toEqual(['left', 'right']);
      });

      test('within-stack segment edges keep Up/Down and no longer use Left/Right', () => {
        const { structure } = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' });
        const edge = edgeBetween(structure, segmentId('Chrome', 'Windows'), segmentId('Chrome', 'Mac'));
        expect(edge).toBeDefined();
        expect(edge?.navigationRules).toContain('up');
        expect(edge?.navigationRules).toContain('down');
        expect(edge?.navigationRules).not.toContain('left');
        expect(edge?.navigationRules).not.toContain('right');
      });

      test('does not wrap the last stack back to the first', () => {
        const { structure } = buildBarStructure({ data: threeStackData, dimension: 'browser', color: 'os' });
        expect(hasEdgeBetween(structure, segmentId('Safari', 'Windows'), segmentId('Chrome', 'Windows'))).toBe(false);
      });

      test('skips a series missing from the neighbouring stack (e.g. its segment is zero-value)', () => {
        const sparseData = [
          { browser: 'Chrome', os: 'Windows', downloads: 18000 },
          { browser: 'Chrome', os: 'Mac', downloads: 9000 },
          { browser: 'Firefox', os: 'Windows', downloads: 5000 },
          { browser: 'Firefox', os: 'Mac', downloads: 0 },
        ];
        const { structure } = buildBarStructure({ data: sparseData, dimension: 'browser', color: 'os', metric: 'downloads' });
        expect(hasEdgeBetween(structure, segmentId('Chrome', 'Windows'), segmentId('Firefox', 'Windows'))).toBe(true);
        expect(structure.nodes[segmentId('Firefox', 'Mac')]).toBeUndefined();
        expect(hasEdgeBetween(structure, segmentId('Chrome', 'Mac'), segmentId('Firefox', 'Mac'))).toBe(false);
      });
    });

    describe('orientation', () => {
      test('vertical (default) keys the stack axis on Left/Right and the segment axis on Up/Down', () => {
        const { structure } = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' });
        expect(structure.navigationRules?.left?.key).toBe('ArrowLeft');
        expect(structure.navigationRules?.up?.key).toBe('ArrowUp');
      });

      test('horizontal rotates the key mapping onto the same graph (stack axis on Up/Down, segment axis on Left/Right)', () => {
        const vertical = buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' }).structure;
        const horizontal = buildBarStructure({
          data: stackedData,
          dimension: 'browser',
          color: 'os',
          orientation: 'horizontal',
        }).structure;

        // The graph is identical — the cross-stack edge is still keyed on the logical left/right ids...
        const verticalEdge = edgeBetween(vertical, segmentId('Chrome', 'Windows'), segmentId('Firefox', 'Windows'));
        const horizontalEdge = edgeBetween(horizontal, segmentId('Chrome', 'Windows'), segmentId('Firefox', 'Windows'));
        expect(horizontalEdge?.navigationRules).toEqual(['left', 'right']);
        expect(horizontalEdge?.navigationRules).toEqual(verticalEdge?.navigationRules);

        // ...only the physical keys that drive each axis rotate.
        expect(horizontal.navigationRules?.left?.key).toBe('ArrowUp');
        expect(horizontal.navigationRules?.right?.key).toBe('ArrowDown');
        expect(horizontal.navigationRules?.up?.key).toBe('ArrowLeft');
        expect(horizontal.navigationRules?.down?.key).toBe('ArrowRight');
      });

      test('horizontal reaches the origin (lowest-order) segment first, matching left-to-right reading order', () => {
        const orderedData = [
          { browser: 'Chrome', os: 'Windows', downloads: 18000, order: 2 },
          { browser: 'Chrome', os: 'Mac', downloads: 9000, order: 1 },
        ];
        const { structure } = buildBarStructure({
          data: orderedData,
          dimension: 'browser',
          color: 'os',
          order: 'order',
          orientation: 'horizontal',
        });
        const chrome = divisionIdFor(structure, 'browser', 'Chrome');
        // Vertical reaches the highest-order segment first (see the segment-order tests); horizontal flips to the origin.
        expect(firstSegmentOf(structure, chrome)).toBe(segmentId('Chrome', 'Mac'));
      });
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

  test('falls back to the node id for a dimension (root) node when no dimension/metric is supplied', () => {
    const node = {
      id: '_browser',
      dimensionLevel: 1,
      data: { dimensionKey: 'browser', divisions: { a: {}, b: {} } },
    } as unknown as NodeObject;
    expect(buildNodeLabel(node)).toBe('_browser');
  });

  test('describes a dimension (root) node as "metric by dimension", labeled by their axis titles, with no count when no data is supplied', () => {
    const node = { id: '_browser', dimensionLevel: 1 } as unknown as NodeObject;
    const label = buildNodeLabel(node, {
      dimension: 'browser',
      metric: 'downloads',
      fieldLabels: { browser: 'Browser', downloads: 'Downloads' },
    });
    expect(label).toBe('Downloads by Browser chart.');
  });

  test('counts distinct dimension values as bars when data is supplied and there is no color series', () => {
    const node = { id: '_browser', dimensionLevel: 1 } as unknown as NodeObject;
    const label = buildNodeLabel(node, {
      dimension: 'browser',
      metric: 'downloads',
      data: [
        { browser: 'Chrome', downloads: 27000 },
        { browser: 'Firefox', downloads: 8000 },
      ],
      fieldLabels: { browser: 'Browser', downloads: 'Downloads' },
    });
    expect(label).toBe('Downloads by Browser chart. 2 bars.');
  });

  test('uses singular "bar" for a single-category chart', () => {
    const node = { id: '_browser', dimensionLevel: 1 } as unknown as NodeObject;
    const label = buildNodeLabel(node, {
      dimension: 'browser',
      metric: 'downloads',
      data: [{ browser: 'Chrome', downloads: 27000 }],
      fieldLabels: { browser: 'Browser', downloads: 'Downloads' },
    });
    expect(label).toBe('Downloads by Browser chart. 1 bar.');
  });

  test('counts groups and names the series field when a color series is present', () => {
    const node = { id: '_browser', dimensionLevel: 1 } as unknown as NodeObject;
    const label = buildNodeLabel(node, {
      dimension: 'browser',
      metric: 'downloads',
      color: 'operatingSystem',
      data: [
        { browser: 'Chrome', operatingSystem: 'Windows', downloads: 5 },
        { browser: 'Chrome', operatingSystem: 'Mac', downloads: 3 },
        { browser: 'Firefox', operatingSystem: 'Windows', downloads: 8 },
      ],
      fieldLabels: { browser: 'Browser', downloads: 'Downloads', operatingSystem: 'Operating system' },
    });
    expect(label).toBe('Downloads by Browser chart, grouped by Operating system. 2 groups.');
  });

  test('falls back to the node id for a division (stack) node when no dimension/data is supplied', () => {
    const node = { id: 'Chrome', dimensionLevel: 2, data: { values: { x: {}, y: {}, z: {} } } } as unknown as NodeObject;
    expect(buildNodeLabel(node)).toBe('Chrome');
  });

  test('describes a division (stack/group) node by its dimension value plus an itemized summary of its own segments', () => {
    const node = { id: 'dn-1', dimensionLevel: 2, derivedNode: 'browser', data: { browser: 'Chrome' } } as unknown as NodeObject;
    const label = buildNodeLabel(node, {
      dimension: 'browser',
      data: [
        { browser: 'Chrome', operatingSystem: 'Windows', downloads: 5 },
        { browser: 'Chrome', operatingSystem: 'Mac', downloads: 3 },
        { browser: 'Chrome', operatingSystem: 'Other', downloads: 2 },
        { browser: 'Firefox', operatingSystem: 'Windows', downloads: 8 },
      ],
      fieldLabels: { browser: 'Browser', operatingSystem: 'Operating system', downloads: 'Downloads' },
    });
    expect(label).toBe(
      'Browser: Chrome. Operating system: Windows, Downloads: 5. Operating system: Mac, Downloads: 3. Operating system: Other, Downloads: 2.'
    );
  });

  test('uses the metric title mapped to each segment\'s own series in a division (stack/group) summary', () => {
    const node = { id: 'dn-1', dimensionLevel: 2, derivedNode: 'browser', data: { browser: 'Chrome' } } as unknown as NodeObject;
    const label = buildNodeLabel(node, {
      dimension: 'browser',
      data: [
        { browser: 'Chrome', operatingSystem: 'Windows', value: 5 },
        { browser: 'Chrome', operatingSystem: 'Mac', value: 3 },
      ],
      fieldLabels: { browser: 'Browser', operatingSystem: 'Operating system' },
      metricSeriesLabel: {
        metric: 'value',
        color: 'operatingSystem',
        titleBySeries: { Windows: 'Windows Downloads', Mac: 'Mac Downloads' },
      },
    });
    expect(label).toBe('Browser: Chrome. Operating system: Windows, Windows Downloads: 5. Operating system: Mac, Mac Downloads: 3.');
  });

  test('falls back to the node id for a division node whose dimension value matches no rows', () => {
    const node = { id: 'Safari', dimensionLevel: 2, derivedNode: 'browser', data: { browser: 'Safari' } } as unknown as NodeObject;
    const label = buildNodeLabel(node, {
      dimension: 'browser',
      data: [{ browser: 'Chrome', downloads: 5 }],
      fieldLabels: { browser: 'Browser', downloads: 'Downloads' },
    });
    expect(label).toBe('Safari');
  });

  test('describes a leaf node by its own scalar fields (consumer-owned field names, not translatable prose)', () => {
    const node = { id: 'Chrome', data: { browser: 'Chrome', downloads: 27000, _dnId: 'skip-me' } } as unknown as NodeObject;
    const label = buildNodeLabel(node);
    expect(label).toContain('browser: Chrome');
    expect(label).toContain('downloads: 27000');
    expect(label).not.toContain('_dnId');
  });

  test('limits a leaf label to the fieldLabels fields, labeled by their axis/legend titles', () => {
    const node = {
      id: 'Chrome',
      data: { browser: 'Chrome', downloads: 27000, percentLabel: '53.1%', share: 0.531 },
    } as unknown as NodeObject;
    const label = buildNodeLabel(node, { fieldLabels: { browser: 'Browser', downloads: 'Downloads' } });
    expect(label).toBe('Browser: Chrome. Downloads: 27000.');
    expect(label).not.toContain('percentLabel');
    expect(label).not.toContain('share');
  });

  test('uses a human-readable color name for colorOverride and omits order', () => {
    const node = {
      id: 'Chrome',
      data: { browser: 'Chrome', downloads: 27, barColor: '#2d7d46', order: 1 },
    } as unknown as NodeObject;
    const label = buildNodeLabel(node, {
      fieldLabels: { browser: 'Browser', downloads: 'Downloads' },
      colorOverride: 'barColor',
      order: 'order',
    });
    expect(label).toContain('Color: dark green');
    expect(label).toContain('Downloads: 27');
    expect(label).not.toContain('#2d7d46');
    expect(label).not.toContain('order');
  });

  test('uses the metric title mapped to a leaf series', () => {
    const node = {
      id: 'Chrome::Mac',
      data: { browser: 'Chrome', operatingSystem: 'Mac', value: 5 },
    } as unknown as NodeObject;
    const label = buildNodeLabel(node, {
      fieldLabels: { browser: 'Browser', operatingSystem: 'Operating system' },
      metricSeriesLabel: {
        metric: 'value',
        color: 'operatingSystem',
        titleBySeries: { Windows: 'Windows Downloads', Mac: 'Mac Downloads' },
      },
    });
    expect(label).toContain('Mac Downloads: 5');
  });
});

describe('buildBarStructure() fieldLabels', () => {
  test('a leaf accessible name reads as the axis titles, dropping unrelated columns', () => {
    const richData = [{ browser: 'Chrome', downloads: 27000, percentLabel: '53.1%', share: 0.531 }];
    const { structure } = buildBarStructure({
      data: richData,
      dimension: 'browser',
      metric: 'downloads',
      fieldLabels: { browser: 'Browser', downloads: 'Downloads' },
    });
    expect(structure.nodes.Chrome.semantics?.label).toBe('Browser: Chrome. Downloads: 27000.');
  });

  test('a division (stack/group) accessible name itemizes its own segments, for stacked and dodged bars alike', () => {
    const groupData = [
      { browser: 'Chrome', operatingSystem: 'Windows', downloads: 5, order: 2 },
      { browser: 'Chrome', operatingSystem: 'Mac', downloads: 3, order: 1 },
    ];
    const expectedLabel = 'Browser: Chrome. Operating system: Windows, Downloads: 5. Operating system: Mac, Downloads: 3.';
    const fieldLabels = { browser: 'Browser', operatingSystem: 'Operating system', downloads: 'Downloads' };

    const { structure } = buildBarStructure({ data: groupData, dimension: 'browser', color: 'operatingSystem', order: 'order', fieldLabels });
    const chromeDivisionId = divisionIdFor(structure, 'browser', 'Chrome');
    expect(structure.nodes[chromeDivisionId].semantics?.label).toBe(expectedLabel);
  });
});
