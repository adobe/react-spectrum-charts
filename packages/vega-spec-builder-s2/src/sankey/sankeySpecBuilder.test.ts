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
import { ValuesData } from 'vega';

import { COLOR_SCALE, HOVERED_ITEM, TABLE } from '@spectrum-charts/constants';

import { defaultSignals } from '../specTestUtils';
import { initializeSpec } from '../specUtils';
import { addData, addMarks, addSankey, addScales, addSignals } from './sankeySpecBuilder';
import { customSankeyOptions, data as sankeyData, defaultSankeyOptions } from './sankeyTestUtils';

describe('addData', () => {
  test('adds a nodes and a links data source, sized to the input edges', () => {
    const data = addData(initializeSpec({}, { data: sankeyData }).data ?? [], customSankeyOptions);

    const nodesData = data.find((d) => d.name === `${customSankeyOptions.name}_nodes`) as ValuesData | undefined;
    const linksData = data.find((d) => d.name === `${customSankeyOptions.name}_linksData`) as ValuesData | undefined;

    expect(nodesData?.values).toHaveLength(5);
    expect(linksData?.values).toHaveLength(sankeyData.length);

    // every link row carries the original edge under table_data (mirrors Venn's lookup-back convention)
    expect(linksData?.values?.[0]).toHaveProperty('table_data');
    expect(linksData?.values?.[0]).toHaveProperty('path');
    expect(linksData?.values?.[0]).toHaveProperty(customSankeyOptions.idKey);

    expect(nodesData?.values?.[0]).toHaveProperty('id');
    expect(nodesData?.values?.[0]).toHaveProperty('x');
    expect(nodesData?.values?.[0]).toHaveProperty('y');
    expect(nodesData?.values?.[0]).toHaveProperty('labelX');
    expect(nodesData?.values?.[0]).toHaveProperty('labelY');
    expect(nodesData?.values?.[0]).toHaveProperty('labelAlign');
    expect(nodesData?.values?.[0]).toHaveProperty('labelLimit');
    expect(nodesData?.values?.[0]).toHaveProperty('formattedValue');
    expect(nodesData?.values?.[0]).toHaveProperty(customSankeyOptions.idKey);
  });

  test('halves labelLimit only for the two columns sharing the last-column label flip gap, so neither can grow far enough to collide with the other', () => {
    const data = addData(initializeSpec({}, { data: sankeyData }).data ?? [], customSankeyOptions);
    const nodesData = data.find((d) => d.name === `${customSankeyOptions.name}_nodes`) as ValuesData | undefined;
    const nodeRows = (nodesData?.values ?? []) as { id: string; labelLimit: number }[];
    const limitById = Object.fromEntries(nodeRows.map((row) => [row.id, row.labelLimit]));

    // Home/Search/Product (columns 0-2) have no competing label growing into their gap
    expect(limitById.Home).toBe(limitById.Search);
    expect(limitById.Search).toBe(limitById.Product);
    expect(limitById.Home).toBeGreaterThan(0);

    // Cart and Checkout share one gap growing toward each other, so both get the smaller, halved limit
    expect(limitById.Cart).toBe(limitById.Checkout);
    expect(limitById.Cart).toBeGreaterThan(0);
    expect(limitById.Cart).toBeLessThan(limitById.Home);
  });

  test('right-aligns the label to the left of the node for the last column only, so it never gets clipped past the chart edge', () => {
    const data = addData(initializeSpec({}, { data: sankeyData }).data ?? [], customSankeyOptions);
    const nodesData = data.find((d) => d.name === `${customSankeyOptions.name}_nodes`) as ValuesData | undefined;
    const nodeRows = (nodesData?.values ?? []) as { id: string; x: number; labelX: number; labelAlign: string }[];

    // Checkout is the last (rightmost) node in the sankeyTestUtils fixture
    const checkout = nodeRows.find((row) => row.id === 'Checkout');
    expect(checkout?.labelAlign).toBe('right');
    expect(checkout?.labelX).toBeLessThan(checkout?.x ?? 0);

    // Home is the first (leftmost) node -- label stays to the right, as before
    const home = nodeRows.find((row) => row.id === 'Home');
    expect(home?.labelAlign).toBe('left');
    expect(home?.labelX).toBeGreaterThan(home?.x ?? 0);
  });

  test('returns empty nodes/links data sources when there is no data', () => {
    const data = addData(initializeSpec({}, { data: [] }).data ?? [], defaultSankeyOptions);

    const nodesData = data.find((d) => d.name === `${defaultSankeyOptions.name}_nodes`) as ValuesData | undefined;
    const linksData = data.find((d) => d.name === `${defaultSankeyOptions.name}_linksData`) as ValuesData | undefined;

    expect(nodesData?.values).toEqual([]);
    expect(linksData?.values).toEqual([]);
  });
});

describe('addSignal', () => {
  test('should add hover events for both the node and link layers when inspect is present', () => {
    const signals = addSignals(defaultSignals, {
      ...customSankeyOptions,
      chartInspects: [{}],
    });

    expect(signals).toHaveLength(defaultSignals.length + 1);

    const hoveredItemSignal = signals.find((signal) => signal.name.includes(HOVERED_ITEM));

    expect(hoveredItemSignal).toBeDefined();
    expect(hoveredItemSignal?.on).toHaveLength(4);
    expect(hoveredItemSignal?.on?.[0]).toHaveProperty('events', '@sankey:mouseover');
    expect(hoveredItemSignal?.on?.[1]).toHaveProperty('events', '@sankey:mouseout');
    expect(hoveredItemSignal?.on?.[2]).toHaveProperty('events', '@sankey_links:mouseover');
    expect(hoveredItemSignal?.on?.[3]).toHaveProperty('events', '@sankey_links:mouseout');
  });

  test('should not add signals when there is no inspect or popover', () => {
    const signals = addSignals(defaultSignals, customSankeyOptions);
    expect(signals).toHaveLength(defaultSignals.length);
  });
});

describe('addScales', () => {
  test('should add the color scale, domained off this component\'s own nodes data (not TABLE)', () => {
    const scales = addScales([], customSankeyOptions);
    expect(scales).toHaveLength(1);
    expect(scales[0]).toHaveProperty('name', COLOR_SCALE);
    expect(scales[0].domain).toEqual({ data: `${customSankeyOptions.name}_nodes`, field: customSankeyOptions.color });
  });
});

describe('addMarks', () => {
  test('adds the link mark, the node mark, then bg/fg pairs for the name and value labels', () => {
    const marks = addMarks([], customSankeyOptions);
    // path (links), rect (nodes), [name bg, name fg], [value bg, value fg]
    expect(marks).toHaveLength(6);
    expect(marks[0]).toHaveProperty('type', 'path');
    expect(marks[1]).toHaveProperty('type', 'rect');
    expect(marks.slice(2)).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'text' })]));
    expect(marks.slice(2)).toHaveLength(4);
    marks.slice(2).forEach((mark) => expect(mark).toHaveProperty('type', 'text'));

    // background halo marks come before their foreground counterpart within each pair
    expect(marks[2].name).toMatch(/_label_bg$/);
    expect(marks[3].name).toMatch(/_label$/);
    expect(marks[4].name).toMatch(/_valueLabel_bg$/);
    expect(marks[5].name).toMatch(/_valueLabel$/);
  });
});

describe('sankeySpecBuilder', () => {
  test('should add sankey correctly', () => {
    const props = customSankeyOptions;
    const spec = { data: [{ name: TABLE }], usermeta: {} };
    const result = addSankey(spec, props);

    const expectedSpec = {
      data: addData(spec.data ?? [], props),
      scales: addScales([], props),
      marks: addMarks([], props),
      signals: addSignals([], props),
      usermeta: {},
    };

    expect(result).toEqual(expectedSpec);
  });

  test('should add sankey correctly with default values', () => {
    const props = defaultSankeyOptions;
    const spec = { data: [{ name: TABLE }], usermeta: {} };

    const result = addSankey(spec, {
      markType: 'sankey',
      idKey: 'rscMarkId',
    });

    const expectedSpec = {
      data: addData(spec.data ?? [], props),
      scales: addScales([], props),
      marks: addMarks([], props),
      signals: addSignals([], props),
      usermeta: {},
    };

    expect(result).toEqual(expectedSpec);
  });
});
