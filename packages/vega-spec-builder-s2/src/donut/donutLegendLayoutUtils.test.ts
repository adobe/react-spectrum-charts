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
import { View, expressionFunction, parse } from 'vega';

import { TABLE } from '@spectrum-charts/core-s2/constants';

import { buildSpec } from '../chartSpecBuilder.js';
import { getExpressionFunctions } from '../expressionFunctions/expressionFunctions.js';
import { initializeSpec } from '../specUtils.js';
import { DonutOptions, LegendOptions, ScSpec } from '../types/index.js';
import { DONUT_LEGEND_EXTENT, DONUT_LEGEND_MARGIN, addDonutLegendLayout } from './donutLegendLayoutUtils.js';

const donut: DonutOptions = { markType: 'donut', color: 'series', metric: 'value' };
const getSpacerXs = (spec: ScSpec) => spec.marks?.map((mark) => mark.encode?.update?.x);

describe('addDonutLegendLayout()', () => {
  test('pads before the donut and past a right legend', () => {
    const spec = addDonutLegendLayout(initializeSpec(), donut, [{ position: 'bottom' }, { position: 'right' }]);
    expect(spec.signals?.map(({ name }) => name)).toEqual([DONUT_LEGEND_EXTENT, DONUT_LEGEND_MARGIN]);
    expect(spec.signals?.[0]).toHaveProperty('update', expect.stringContaining(`data('legend1_maxLabelWidth')`));
    expect(spec.marks).toHaveLength(2);
    spec.marks?.forEach((mark) => expect(mark).toHaveProperty('interactive', false));
    expect(getSpacerXs(spec)).toEqual([
      { signal: `-${DONUT_LEGEND_MARGIN}` },
      { signal: `${DONUT_LEGEND_MARGIN} > 0 ? width + ${DONUT_LEGEND_EXTENT} + ${DONUT_LEGEND_MARGIN} : width` },
    ]);
  });

  test('mirrors the padding for a left legend', () => {
    const spec = addDonutLegendLayout(initializeSpec(), donut, [{ position: 'left' }]);
    expect(getSpacerXs(spec)).toEqual([
      { signal: `${DONUT_LEGEND_MARGIN} > 0 ? -(${DONUT_LEGEND_EXTENT} + ${DONUT_LEGEND_MARGIN}) : 0` },
      { signal: `width + ${DONUT_LEGEND_MARGIN}` },
    ]);
  });

  test('uses the title width when it is wider than the labels', () => {
    const spec = addDonutLegendLayout(initializeSpec(), donut, [
      { position: 'right', title: 'Browser "share"', titleLimit: 120 },
    ]);
    expect(spec.signals?.[0]).toHaveProperty(
      'update',
      expect.stringContaining(`min(getLabelWidth("Browser \\"share\\"", 'bold', 14), 120))`)
    );
  });

  test('ignores the title when there is none', () => {
    const spec = addDonutLegendLayout(initializeSpec(), donut, [{ position: 'right' }]);
    expect(spec.signals?.[0]).not.toHaveProperty('update', expect.stringContaining('getLabelWidth'));
  });

  test('sizes a semicircle to twice the chart height', () => {
    const spec = addDonutLegendLayout(initializeSpec(), { ...donut, variant: 'semicircle' }, [{ position: 'right' }]);
    expect(spec.signals?.[1]).toHaveProperty('update', expect.stringContaining('- 2 * height) / 2)'));
  });

  test('aligns the title to the chart bounds', () => {
    const spec = addDonutLegendLayout({ ...initializeSpec(), title: { text: 'Browsers', frame: 'group' } }, donut, [
      { position: 'right' },
    ]);
    expect(spec.title).toHaveProperty('frame', 'bounds');
  });

  test.each<[string, DonutOptions | undefined, LegendOptions[]]>([
    ['no donut', undefined, [{ position: 'right' }]],
    ['a bottom legend', donut, [{ position: 'bottom' }]],
    ['no legend', donut, []],
  ])('does nothing with %s', (_name, donutOptions, legends) => {
    const spec = initializeSpec();
    expect(addDonutLegendLayout(spec, donutOptions, legends)).toEqual(spec);
  });

  test('only appends to a built spec, leaving legends, data, scales and existing signals and marks untouched', () => {
    const legends: LegendOptions[] = [{ position: 'right', title: 'Browser', highlight: true, hiddenEntries: ['Safari'] }];
    const built = buildSpec({ data: [], marks: [donut], legends });
    const before = { ...built, signals: built.signals?.filter(({ name }) => !name.startsWith('rscDonutLegend')) };
    before.marks = built.marks?.filter(({ name }) => !name?.startsWith('rscDonutLegendSpacer'));
    const after = addDonutLegendLayout(before, donut, legends);
    expect(after.legends).toEqual(before.legends);
    expect(after.data).toEqual(before.data);
    expect(after.scales).toEqual(before.scales);
    expect(after.signals?.slice(0, before.signals?.length)).toEqual(before.signals);
    expect(after.marks?.slice(0, before.marks?.length)).toEqual(before.marks);
  });
});

describe('buildSpec() donut side legend layout', () => {
  const data = [
    { series: 'Chrome', value: 48 },
    { series: 'Safari', value: 24 },
  ];

  const getSignals = async (viewWidth: number, legend: LegendOptions = { position: 'right' }, padding = 0) => {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', () => viewWidth + 2 * padding);
    const spec = buildSpec({ data, marks: [donut], legends: [legend] });
    const table = spec.data?.find(({ name }) => name === TABLE);
    if (!table || !('values' in table)) throw new Error('Expected inline table data');
    table.values = data;
    const view = new View(parse(spec), { renderer: 'none' }).width(viewWidth).height(300).padding(padding);
    await view.runAsync();
    return { margin: view.signal(DONUT_LEGEND_MARGIN), extent: view.signal(DONUT_LEGEND_EXTENT) };
  };

  test('splits the leftover width evenly around the donut and legend', async () => {
    const { margin, extent } = await getSignals(1000);
    expect(extent).toBeGreaterThan(24);
    expect(margin).toBeCloseTo((1000 - extent - 300) / 2);
  });

  test('widens the extent for a title wider than the labels', async () => {
    const { extent } = await getSignals(1000);
    const titled = await getSignals(1000, { position: 'right', title: 'Browser share of all visitors' });
    expect(titled.extent).toBeGreaterThan(extent);
  });

  test('excludes view padding from the available width', async () => {
    const { margin, extent } = await getSignals(1000, { position: 'right' }, 20);
    expect(margin).toBeCloseTo((1000 - extent - 300) / 2);
  });

  test('has no margin when the chart is not wider than the donut and legend', async () => {
    expect((await getSignals(300)).margin).toBe(0);
  });
});
