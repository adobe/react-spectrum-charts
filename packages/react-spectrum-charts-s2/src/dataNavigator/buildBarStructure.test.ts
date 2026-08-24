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

import { buildBarStructure, buildChartDescription, buildNodeLabel, getBarNodeId, segmentId } from './buildBarStructure';
import { move } from './dataNavigatorTestUtils';

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

  test('sets a chart description on the entry point node', () => {
    const { structure, entryPoint } = buildBarStructure({ data, dimension: 'browser', title: 'Browser downloads' });
    expect(structure.nodes[entryPoint as string].semantics?.label).toContain('Browser downloads');
    expect(structure.nodes[entryPoint as string].semantics?.label).toContain('3 bars');
  });

  test('ensures every node has a semantics label', () => {
    const { structure } = buildBarStructure({ data, dimension: 'browser' });
    Object.values(structure.nodes).forEach((node) => {
      expect(node.semantics?.label).toBeTruthy();
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

    describe('keyboard navigation', () => {
      const build = () => buildBarStructure({ data: stackedData, dimension: 'browser', color: 'os' });

      test('drilling in from the chart root reaches the first stack', () => {
        const { structure, entryPoint } = build();
        expect(move(structure, entryPoint as string, 'child')).toBe('Chrome');
      });

      test('left/right move between stacks while at the stack level', () => {
        const { structure } = build();
        expect(move(structure, 'Chrome', 'right')).toBe('Firefox');
        expect(move(structure, 'Firefox', 'right')).toBe('Chrome'); // wraps
        expect(move(structure, 'Chrome', 'left')).toBe('Firefox'); // wraps the other way
      });

      test('entering a stack via Enter or the down arrow key focuses its first segment', () => {
        const { structure } = build();
        expect(move(structure, 'Chrome', 'child')).toBe(segmentId('Chrome', 'Windows'));
        expect(move(structure, 'Chrome', 'down')).toBe(segmentId('Chrome', 'Windows'));
      });

      test('entering a stack via the up arrow key focuses its last segment', () => {
        const { structure } = build();
        expect(move(structure, 'Chrome', 'up')).toBe(segmentId('Chrome', 'Mac'));
      });

      test('up/down move through every segment in the chart, crossing stack boundaries', () => {
        const { structure } = build();
        // flattened order across both stacks: Chrome/Windows, Chrome/Mac, Firefox/Windows, Firefox/Mac
        expect(move(structure, segmentId('Chrome', 'Windows'), 'down')).toBe(segmentId('Chrome', 'Mac'));
        expect(move(structure, segmentId('Chrome', 'Mac'), 'down')).toBe(segmentId('Firefox', 'Windows')); // crosses into the next stack
        expect(move(structure, segmentId('Firefox', 'Windows'), 'down')).toBe(segmentId('Firefox', 'Mac'));
        expect(move(structure, segmentId('Firefox', 'Mac'), 'down')).toBe(segmentId('Chrome', 'Windows')); // wraps to the very first segment
        expect(move(structure, segmentId('Chrome', 'Windows'), 'up')).toBe(segmentId('Firefox', 'Mac')); // wraps the other way
      });

      test('left/right move to the same-color segment in the adjacent stack', () => {
        const { structure } = build();
        expect(move(structure, segmentId('Chrome', 'Windows'), 'right')).toBe(segmentId('Firefox', 'Windows'));
        expect(move(structure, segmentId('Firefox', 'Windows'), 'left')).toBe(segmentId('Chrome', 'Windows'));
        expect(move(structure, segmentId('Chrome', 'Mac'), 'right')).toBe(segmentId('Firefox', 'Mac'));
      });

      test('left/right at the leaf level does not fall back to the automatic within-stack ordering', () => {
        // regression guard: left/right must never resolve to a same-stack neighbor
        const { structure } = build();
        expect(move(structure, segmentId('Chrome', 'Windows'), 'right')).not.toBe(segmentId('Chrome', 'Mac'));
      });

      test('escape from a segment returns to its own stack', () => {
        const { structure } = build();
        expect(move(structure, segmentId('Firefox', 'Mac'), 'parent')).toBe('Firefox');
      });
    });

    test('left/right does not jump to a stack that is missing the same color (sparse data)', () => {
      const sparseData = [
        { browser: 'Chrome', os: 'Windows', downloads: 18000 },
        { browser: 'Chrome', os: 'Mac', downloads: 9000 },
        { browser: 'Firefox', os: 'Windows', downloads: 5000 },
      ];
      const { structure } = buildBarStructure({ data: sparseData, dimension: 'browser', color: 'os' });
      expect(move(structure, segmentId('Chrome', 'Mac'), 'right')).toBeUndefined();
    });
  });
});

describe('buildChartDescription()', () => {
  test('describes a basic bar chart and pluralizes the bar count', () => {
    const label = buildChartDescription(data, 'browser');
    expect(label).toContain('Bar chart');
    expect(label).toContain('3 bars');
  });

  test('uses the singular form for a single bar', () => {
    expect(buildChartDescription([{ browser: 'Chrome' }], 'browser')).toContain('1 bar.');
  });

  test('describes a stacked bar chart when a series field is present', () => {
    const label = buildChartDescription(stackedData, 'browser', 'os', 'My title');
    expect(label).toContain('My title');
    expect(label).toContain('Stacked bar chart');
    expect(label).toContain('stacked by os');
    expect(label).toContain('2 stacks');
  });

  // Regression: the up arrow key also drills into a stack (focusing its last segment), matching
  // stackedBarNavigationRules' ['up'] edge — the aria description must mention it, not just Enter/down.
  test('mentions the up arrow key as a way to drill into a stack, alongside Enter and down', () => {
    const label = buildChartDescription(stackedData, 'browser', 'os');
    expect(label).toContain('Enter, up, or down to drill into');
  });
});

describe('buildNodeLabel()', () => {
  test('falls back to the node id when there is no data', () => {
    expect(buildNodeLabel({ id: 'lonely' } as NodeObject)).toBe('lonely');
  });

  test('describes a dimension node by its division count', () => {
    const node = { id: 'browser', data: { dimensionKey: 'browser', divisions: { a: {}, b: {} } } } as unknown as NodeObject;
    expect(buildNodeLabel(node)).toBe('browser dimension. Contains 2 divisions.');
  });

  test('describes a division (stack) node by its child bar count', () => {
    const node = { id: 'Chrome', data: { values: { x: {}, y: {}, z: {} } } } as unknown as NodeObject;
    expect(buildNodeLabel(node)).toBe('Chrome. Contains 3 bars.');
  });

  test('describes a leaf node by its scalar fields', () => {
    const node = { id: 'Chrome', data: { browser: 'Chrome', downloads: 27000, _dnId: 'skip-me' } } as unknown as NodeObject;
    const label = buildNodeLabel(node);
    expect(label).toContain('browser: Chrome');
    expect(label).toContain('downloads: 27000');
    expect(label).not.toContain('_dnId');
  });
});

describe('getBarNodeId()', () => {
  test('keys a basic bar datum by its dimension value', () => {
    expect(getBarNodeId({ browser: 'Chrome', downloads: 27000 }, 'browser')).toBe('Chrome');
  });

  test('keys a stacked bar datum by the dimension + series composite', () => {
    expect(getBarNodeId({ browser: 'Chrome', os: 'Windows', downloads: 18000 }, 'browser', 'os')).toBe(
      segmentId('Chrome', 'Windows')
    );
  });

  test('returns undefined when the dimension value is missing', () => {
    expect(getBarNodeId({ downloads: 27000 }, 'browser')).toBeUndefined();
  });
});
