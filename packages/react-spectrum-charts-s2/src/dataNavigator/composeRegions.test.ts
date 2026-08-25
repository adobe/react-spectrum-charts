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
import { buildAxisStructure } from './buildAxisStructure';
import { buildBarStructure } from './buildBarStructure';
import { composeRegions, getNodeRegion } from './composeRegions';

const data = [
  { browser: 'Chrome', downloads: 27000 },
  { browser: 'Firefox', downloads: 8000 },
];

describe('composeRegions()', () => {
  test('a single region is untouched: same node keys and entry point, no region edges added', () => {
    const content = buildBarStructure({ data, dimension: 'browser' });
    const composed = composeRegions([{ name: 'content', structure: content.structure, entryPoint: content.entryPoint, namespace: false }]);

    expect(composed.entryPoint).toBe(content.entryPoint);
    expect(Object.keys(composed.structure.nodes).sort()).toEqual(Object.keys(content.structure.nodes).sort());
    expect(Object.keys(composed.structure.edges).sort()).toEqual(Object.keys(content.structure.edges).sort());
  });

  test('content keeps its raw (unprefixed) node ids so Vega focus-ring signal matching keeps working', () => {
    const content = buildBarStructure({ data, dimension: 'browser' });
    const xAxis = buildAxisStructure({ data, field: 'browser', type: 'categorical' });
    const composed = composeRegions([
      { name: 'content', structure: content.structure, entryPoint: content.entryPoint, namespace: false },
      { name: 'xAxis', structure: xAxis.structure, entryPoint: xAxis.entryPoint },
    ]);

    expect(composed.structure.nodes.Chrome).toBeDefined();
    expect(getNodeRegion(composed.structure.nodes.Chrome)).toBe('content');
  });

  test('auxiliary regions get namespaced node ids to avoid colliding with content or each other', () => {
    const content = buildBarStructure({ data, dimension: 'browser' });
    const xAxis = buildAxisStructure({ data, field: 'browser', type: 'categorical' });
    const composed = composeRegions([
      { name: 'content', structure: content.structure, entryPoint: content.entryPoint, namespace: false },
      { name: 'xAxis', structure: xAxis.structure, entryPoint: xAxis.entryPoint },
    ]);

    expect(composed.structure.nodes['xAxis::Chrome']).toBeDefined();
    expect(composed.structure.nodes['xAxis::Chrome'].data).toHaveProperty('browser', 'Chrome');
    expect(getNodeRegion(composed.structure.nodes['xAxis::Chrome'])).toBe('xAxis');
    // the raw "Chrome" key still belongs to content, not overwritten by the axis region
    expect(getNodeRegion(composed.structure.nodes.Chrome)).toBe('content');
  });

  test('keeps a namespaced node\'s id and renderId in lockstep to avoid an unprefixed renderId collision', () => {
    const content = buildBarStructure({ data, dimension: 'browser' });
    const xAxis = buildAxisStructure({ data, field: 'browser', type: 'categorical' });
    const composed = composeRegions([
      { name: 'content', structure: content.structure, entryPoint: content.entryPoint, namespace: false },
      { name: 'xAxis', structure: xAxis.structure, entryPoint: xAxis.entryPoint },
    ]);

    const xAxisRoot = composed.structure.nodes[`xAxis::${xAxis.entryPoint}`];
    expect(xAxisRoot).toBeDefined();
    expect(xAxisRoot.renderId).toBe(xAxisRoot.id);
  });

  test('wires region entry points together circularly with left/right sibling edges', () => {
    const content = buildBarStructure({ data, dimension: 'browser' });
    const xAxis = buildAxisStructure({ data, field: 'browser', type: 'categorical' });
    const legend = buildAxisStructure({ data, field: 'browser', type: 'categorical' });
    const composed = composeRegions([
      { name: 'content', structure: content.structure, entryPoint: content.entryPoint, namespace: false },
      { name: 'xAxis', structure: xAxis.structure, entryPoint: xAxis.entryPoint },
      { name: 'legend', structure: legend.structure, entryPoint: legend.entryPoint },
    ]);

    const contentRoot = composed.structure.nodes[content.entryPoint as string];
    const xAxisRootId = `xAxis::${xAxis.entryPoint}`;
    const legendRootId = `legend::${legend.entryPoint}`;

    // content -> xAxis -> legend -> content (circular)
    const contentEdges = contentRoot.edges.map((id) => composed.structure.edges[id]);
    expect(contentEdges.some((edge) => edge.target === xAxisRootId && edge.navigationRules.includes('right'))).toBe(true);
    expect(contentEdges.some((edge) => edge.source === legendRootId && edge.navigationRules.includes('left'))).toBe(true);
  });

  test('entry point is the first region\'s own entry point', () => {
    const content = buildBarStructure({ data, dimension: 'browser' });
    const xAxis = buildAxisStructure({ data, field: 'browser', type: 'categorical' });
    const composed = composeRegions([
      { name: 'content', structure: content.structure, entryPoint: content.entryPoint, namespace: false },
      { name: 'xAxis', structure: xAxis.structure, entryPoint: xAxis.entryPoint },
    ]);

    expect(composed.entryPoint).toBe(content.entryPoint);
  });

  test('returns an empty structure for no regions', () => {
    const composed = composeRegions([]);
    expect(composed.entryPoint).toBeUndefined();
    expect(composed.structure.nodes).toEqual({});
  });
});
