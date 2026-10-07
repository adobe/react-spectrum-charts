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

import { TABLE } from '@spectrum-charts/constants';

import { buildSpec } from '../chartSpecBuilder';
import { getExpressionFunctions } from '../expressionFunctions';
import { initializeSpec } from '../specUtils';
import { DonutOptions, LegendOptions, ScSpec } from '../types';
import { DONUT_LEGEND_EXTENT, DONUT_LEGEND_MARGIN, addDonutLegendLayout } from './donutLegendLayoutUtils';

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
});

describe('buildSpec() donut side legend layout', () => {
  const data = [
    { series: 'Chrome', value: 48 },
    { series: 'Safari', value: 24 },
  ];

  const getSignals = async (viewWidth: number) => {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', (width: number) => width);
    expressionFunction('rscViewWidth', () => viewWidth);
    const spec = buildSpec({ data, marks: [donut], legends: [{ position: 'right' }] });
    const table = spec.data?.find(({ name }) => name === TABLE);
    if (!table || !('values' in table)) throw new Error('Expected inline table data');
    table.values = data;
    const view = new View(parse(spec), { renderer: 'none' }).width(viewWidth).height(300);
    await view.runAsync();
    return { margin: view.signal(DONUT_LEGEND_MARGIN), extent: view.signal(DONUT_LEGEND_EXTENT) };
  };

  test('splits the leftover width evenly around the donut and legend', async () => {
    const { margin, extent } = await getSignals(1000);
    expect(extent).toBeGreaterThan(24);
    expect(margin).toBeCloseTo((1000 - extent - 300) / 2);
  });

  test('has no margin when the chart is not wider than the donut and legend', async () => {
    expect((await getSignals(300)).margin).toBe(0);
  });
});
