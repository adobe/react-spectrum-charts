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
import { buildBarStructure, segmentId } from './buildBarStructure';

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
  });
});
