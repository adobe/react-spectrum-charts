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
import { buildAxisDescription, buildAxisStructure } from './buildAxisStructure';

const data = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
  { browser: 'Safari', downloads: 4000 },
];

describe('buildAxisStructure()', () => {
  describe('categorical', () => {
    test('keys leaf tick nodes by the unique field values, in first-seen order', () => {
      const { structure } = buildAxisStructure({ data, field: 'browser', type: 'categorical' });
      expect(structure.nodes.Chrome).toBeDefined();
      expect(structure.nodes.Chrome.data).toHaveProperty('browser', 'Chrome');
      expect(structure.nodes.Firefox).toBeDefined();
      expect(structure.nodes.Safari).toBeDefined();
    });

    test('deduplicates repeated field values', () => {
      const stackedData = [
        { browser: 'Chrome', os: 'Windows' },
        { browser: 'Chrome', os: 'Mac' },
        { browser: 'Firefox', os: 'Windows' },
      ];
      const { structure } = buildAxisStructure({ data: stackedData, field: 'browser', type: 'categorical' });
      const leaves = Object.values(structure.nodes).filter((node) => node.dimensionLevel == null);
      expect(leaves).toHaveLength(2);
    });

    test('returns the dimension root as the entry point', () => {
      const { structure, entryPoint } = buildAxisStructure({ data, field: 'browser', type: 'categorical' });
      expect(entryPoint).toBeDefined();
      expect(structure.nodes[entryPoint as string].dimensionLevel).not.toBeUndefined();
    });

    test('ensures every node has a semantics label', () => {
      const { structure } = buildAxisStructure({ data, field: 'browser', type: 'categorical' });
      Object.values(structure.nodes).forEach((node) => {
        expect(node.semantics?.label).toBeTruthy();
      });
    });
  });

  describe('numerical', () => {
    test('generates approximate "nice" tick nodes within the data extent', () => {
      const { structure } = buildAxisStructure({ data, field: 'downloads', type: 'numerical' });
      const leaves = Object.values(structure.nodes).filter((node) => node.dimensionLevel == null);
      expect(leaves.length).toBeGreaterThan(0);
      const values = leaves.map((node) => (node.data as Record<string, number>).downloads);
      expect(Math.min(...values)).toBeGreaterThanOrEqual(4000);
      expect(Math.max(...values)).toBeLessThanOrEqual(27000);
    });

    test('collapses to a single tick when every value is identical', () => {
      const flatData = [{ downloads: 100 }, { downloads: 100 }];
      const { structure } = buildAxisStructure({ data: flatData, field: 'downloads', type: 'numerical' });
      const leaves = Object.values(structure.nodes).filter((node) => node.dimensionLevel == null);
      expect(leaves).toHaveLength(1);
    });

    test('keeps every node id a string even though tick values are numbers', () => {
      // data-navigator's own edge-building code assumes ids are always strings (or functions) and
      // throws when it tries to call a numeric id as a function, so this must never regress.
      const { structure } = buildAxisStructure({ data, field: 'downloads', type: 'numerical' });
      Object.entries(structure.nodes).forEach(([key, node]) => {
        expect(typeof node.id).toBe('string');
        expect(key).toBe(node.id);
      });
      Object.values(structure.edges).forEach((edge) => {
        expect(typeof edge.source).toBe('string');
        expect(typeof edge.target).toBe('string');
      });
    });
  });
});

describe('buildAxisDescription()', () => {
  test('pluralizes multiple tick values and falls back to the field name', () => {
    expect(buildAxisDescription(3, 'browser')).toBe(
      'browser axis. Contains 3 tick values. Use the left and right arrow keys to browse.'
    );
  });

  test('uses the singular form for one tick value and prefers the title', () => {
    expect(buildAxisDescription(1, 'browser', 'Browser')).toBe(
      'Browser axis. Contains 1 tick value. Use the left and right arrow keys to browse.'
    );
  });
});
