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

import { applyDefaultLabels } from './nodeSemanticsUtils';

const makeStructure = (nodes: Record<string, Partial<NodeObject>>): Structure =>
  ({ nodes, edges: {} }) as unknown as Structure;

describe('applyDefaultLabels()', () => {
  test('sets a label on every node using the provided labelFor callback', () => {
    const structure = makeStructure({ a: { id: 'a' }, b: { id: 'b' } });
    applyDefaultLabels(structure, (node) => `label for ${node.id}`);
    expect(structure.nodes.a.semantics).toEqual({ label: 'label for a' });
    expect(structure.nodes.b.semantics).toEqual({ label: 'label for b' });
  });

  test('does not overwrite an existing label', () => {
    const structure = makeStructure({ a: { id: 'a', semantics: { label: 'existing' } } });
    applyDefaultLabels(structure, () => 'new label');
    expect(structure.nodes.a.semantics).toEqual({ label: 'existing' });
  });

  test('preserves other semantics fields already set on the node', () => {
    const structure = makeStructure({ a: { id: 'a', semantics: { role: 'group' } as NodeObject['semantics'] } });
    applyDefaultLabels(structure, () => 'new label');
    expect(structure.nodes.a.semantics).toEqual({ role: 'group', label: 'new label' });
  });
});
