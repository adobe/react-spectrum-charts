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

import { addSiblingKeySynonyms, getBaseNavigationRules } from './navigationRules';

const structureWith = (edges: Structure['edges']): Structure => ({ nodes: {}, edges });

describe('getBaseNavigationRules()', () => {
  test('vertical (default) maps each arrow key to its literal direction', () => {
    const rules = getBaseNavigationRules('vertical');
    expect(rules.left?.key).toBe('ArrowLeft');
    expect(rules.right?.key).toBe('ArrowRight');
    expect(rules.up?.key).toBe('ArrowUp');
    expect(rules.down?.key).toBe('ArrowDown');
    expect(getBaseNavigationRules().left?.key).toBe('ArrowLeft');
  });

  test('horizontal drives the stack axis (left/right) with Up/Down and the segment axis (up/down) with Left/Right in reading order', () => {
    const rules = getBaseNavigationRules('horizontal');
    expect(rules.left?.key).toBe('ArrowUp');
    expect(rules.right?.key).toBe('ArrowDown');
    expect(rules.up?.key).toBe('ArrowLeft');
    expect(rules.down?.key).toBe('ArrowRight');
  });

  test('keeps Enter/Escape as drill in/out in both orientations', () => {
    for (const orientation of ['vertical', 'horizontal'] as const) {
      const rules = getBaseNavigationRules(orientation);
      expect(rules.child?.key).toBe('Enter');
      expect(rules.parent?.key).toBe('Escape');
    }
  });
});

describe('addSiblingKeySynonyms()', () => {
  test('adds up alongside left and down alongside right', () => {
    const structure = structureWith({
      e1: { source: 'a', target: 'b', navigationRules: ['left', 'right'] },
    });
    addSiblingKeySynonyms(structure);
    expect(structure.edges.e1.navigationRules).toEqual(['left', 'right', 'up', 'down']);
  });

  test('leaves edges with no left/right rules untouched', () => {
    const structure = structureWith({
      e1: { source: 'a', target: 'b', navigationRules: ['parent', 'child'] },
    });
    addSiblingKeySynonyms(structure);
    expect(structure.edges.e1.navigationRules).toEqual(['parent', 'child']);
  });

  test('is idempotent — running twice does not duplicate synonyms', () => {
    const structure = structureWith({
      e1: { source: 'a', target: 'b', navigationRules: ['left', 'right'] },
    });
    addSiblingKeySynonyms(structure);
    addSiblingKeySynonyms(structure);
    expect(structure.edges.e1.navigationRules).toEqual(['left', 'right', 'up', 'down']);
  });
});
