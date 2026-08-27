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
import { cyclicData, customSankeyOptions, data as sankeyData, sourceAndSinkOnlyData } from './sankeyTestUtils';
import { assignColumns, buildSankeyLayout, getRibbonPath, getSankeyEdges } from './sankeyUtils';

const toEdges = (rows: { source: string; target: string; value: number }[]) =>
  getSankeyEdges({ ...customSankeyOptions, data: rows });

describe('getSankeyEdges', () => {
  test('drops rows with a negative, NaN, or non-finite value, keeping well-formed rows', () => {
    const edges = getSankeyEdges({
      ...customSankeyOptions,
      data: [
        { source: 'A', target: 'B', value: 5 },
        { source: 'A', target: 'C', value: -1 },
        { source: 'A', target: 'D', value: NaN },
        { source: 'A', target: 'E', value: Infinity },
        { source: 'A', target: 'F', value: 0 },
      ],
    });

    expect(edges.map((edge) => edge.target).sort()).toEqual(['B', 'F']);
  });
});

describe('assignColumns', () => {
  test('layers a chain by the longest path from a source (a node is one column past its deepest dependency)', () => {
    const edges = toEdges(sankeyData);
    const columns = assignColumns(edges);

    expect(columns.get('Home')).toBe(0);
    expect(columns.get('Search')).toBe(1);
    // Product is reachable from Home (0) and Search (1) -- takes the deeper path plus one.
    expect(columns.get('Product')).toBe(2);
    expect(columns.get('Cart')).toBe(3);
    expect(columns.get('Checkout')).toBe(4);
  });

  test('places a source-only node at column 0 and a sink-only node at the deepest column', () => {
    const edges = toEdges(sourceAndSinkOnlyData);
    const columns = assignColumns(edges);

    expect(columns.get('SourceOnly')).toBe(0);
    expect(columns.get('Middle')).toBe(1);
    expect(columns.get('SinkOnly')).toBe(2);
  });

  test('detects a cycle, drops the back edge from layering, and still assigns every node a column', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const edges = toEdges(cyclicData);
    const columns = assignColumns(edges);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(columns.size).toBe(3);
    // every node has a defined column -- layering terminated instead of looping forever
    expect(columns.get('A')).toBeGreaterThanOrEqual(0);
    expect(columns.get('B')).toBeGreaterThanOrEqual(0);
    expect(columns.get('C')).toBeGreaterThanOrEqual(0);

    warnSpy.mockRestore();
  });

  test('respects explicitColumns overrides', () => {
    const edges = toEdges(sankeyData);
    const columns = assignColumns(edges, { Home: 5 });
    expect(columns.get('Home')).toBe(5);
  });
});

describe('buildSankeyLayout', () => {
  test('produces one node per unique id and one link per edge', () => {
    const edges = toEdges(sankeyData);
    const { nodes, links } = buildSankeyLayout(edges, 400, 300);

    expect(nodes).toHaveLength(5); // Home, Product, Search, Cart, Checkout -- no duplicates
    expect(links).toHaveLength(sankeyData.length);
  });

  test('a node value is the max of its outgoing and incoming totals', () => {
    const edges = toEdges(sankeyData);
    const { nodes } = buildSankeyLayout(edges, 400, 300);

    const product = nodes.find((node) => node.id === 'Product');
    // incoming: Home->Product (10) + Search->Product (4) = 14; outgoing: Product->Cart (7)
    expect(product?.value).toBe(14);
  });

  test('nodes in the same column fit within chartHeight and never overlap', () => {
    const edges = toEdges(sankeyData);
    const chartHeight = 300;
    const { nodes } = buildSankeyLayout(edges, 400, chartHeight);

    const byColumn = new Map<number, typeof nodes>();
    nodes.forEach((node) => byColumn.set(node.column, [...(byColumn.get(node.column) ?? []), node]));

    byColumn.forEach((columnNodes) => {
      const sorted = [...columnNodes].sort((a, b) => a.y - b.y);
      sorted.forEach((node) => {
        expect(node.y).toBeGreaterThanOrEqual(0);
        expect(node.y + node.dy).toBeLessThanOrEqual(chartHeight + 0.01);
      });
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].y).toBeGreaterThanOrEqual(sorted[i - 1].y + sorted[i - 1].dy - 0.01);
      }
    });
  });

  test('an isolated node with no edges is not produced (every node comes from an edge)', () => {
    const edges = toEdges([{ source: 'A', target: 'B', value: 1 }]);
    const { nodes } = buildSankeyLayout(edges, 200, 200);
    expect(nodes.map((node) => node.id).sort()).toEqual(['A', 'B']);
  });
});

describe('getRibbonPath', () => {
  test('returns an SVG path string starting at the source node edge', () => {
    const edges = toEdges(sankeyData);
    const { links } = buildSankeyLayout(edges, 400, 300);
    const path = getRibbonPath(links[0]);

    expect(path).toMatch(/^M-?\d+(\.\d+)?,-?\d+(\.\d+)?C/);
    expect(path.endsWith('Z')).toBe(true);
  });
});
