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
import { buildLegendDescription, buildLegendStructure } from './buildLegendStructure';

const stackedData = [
  { browser: 'Chrome', os: 'Windows', downloads: 18000 },
  { browser: 'Chrome', os: 'Mac', downloads: 9000 },
  { browser: 'Firefox', os: 'Windows', downloads: 5000 },
  { browser: 'Firefox', os: 'Mac', downloads: 3000 },
];

describe('buildLegendStructure()', () => {
  test('keys leaf entry nodes by the unique series values', () => {
    const { structure } = buildLegendStructure({ data: stackedData, field: 'os' });
    expect(structure.nodes.Windows).toBeDefined();
    expect(structure.nodes.Windows.data).toHaveProperty('os', 'Windows');
    expect(structure.nodes.Mac).toBeDefined();
  });

  test('deduplicates repeated series values', () => {
    const { structure } = buildLegendStructure({ data: stackedData, field: 'os' });
    const leaves = Object.values(structure.nodes).filter((node) => node.dimensionLevel == null);
    expect(leaves).toHaveLength(2);
  });

  test('returns the dimension root as the entry point', () => {
    const { structure, entryPoint } = buildLegendStructure({ data: stackedData, field: 'os' });
    expect(entryPoint).toBeDefined();
    expect(structure.nodes[entryPoint as string].dimensionLevel).not.toBeUndefined();
  });

  test('ensures every node has a semantics label', () => {
    const { structure } = buildLegendStructure({ data: stackedData, field: 'os' });
    Object.values(structure.nodes).forEach((node) => {
      expect(node.semantics?.label).toBeTruthy();
    });
  });
});

describe('buildLegendDescription()', () => {
  test('pluralizes multiple entries and falls back to "Legend"', () => {
    expect(buildLegendDescription(2)).toBe('Legend. Contains 2 series entries. Use the left and right arrow keys to browse.');
  });

  test('uses the singular form for one entry and prefers the title', () => {
    expect(buildLegendDescription(1, 'Operating system')).toBe(
      'Operating system. Contains 1 series entry. Use the left and right arrow keys to browse.'
    );
  });
});
