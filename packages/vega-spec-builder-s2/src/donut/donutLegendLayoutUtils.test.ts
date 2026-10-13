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
import { getSpectrum2VegaConfig } from '@spectrum-charts/core-s2/tokens';

import { buildSpec } from '../chartSpecBuilder.js';
import { getExpressionFunctions } from '../expressionFunctions/expressionFunctions.js';
import { initializeSpec } from '../specUtils.js';
import { DonutOptions, LegendOptions, ScSpec } from '../types/index.js';
import { DONUT_LEGEND_EXTENT, DONUT_LEGEND_MARGIN, addDonutLegendLayout } from './donutLegendLayoutUtils.js';

const donut: DonutOptions = { markType: 'donut', color: 'series', metric: 'value' };

describe('addDonutLegendLayout()', () => {
  test.each(['left', 'right'] as const)(
    'keeps the symmetric spacers and leaves the %s legend unchanged',
    (position) => {
      const before: ScSpec = { ...initializeSpec(), legends: [{ orient: 'bottom' }, { orient: position }] };
      const spec = addDonutLegendLayout(before, donut, [{ position: 'bottom' }, { position }]);
      expect(spec.signals?.map(({ name }) => name)).toEqual([DONUT_LEGEND_EXTENT, DONUT_LEGEND_MARGIN]);
      expect(spec.legends).toEqual(before.legends);
      expect(spec.marks).toHaveLength(2);
      spec.marks?.forEach((mark) => expect(mark).toHaveProperty('interactive', false));
      expect(spec.marks?.[0]).toHaveProperty('encode.update.x.signal', `-${DONUT_LEGEND_MARGIN}`);
      expect(spec.marks?.[1]).toHaveProperty('encode.update.x.signal', `width + ${DONUT_LEGEND_MARGIN}`);
    }
  );

  test('sizes a semicircle to twice the chart height', () => {
    const spec = addDonutLegendLayout(initializeSpec(), { ...donut, variant: 'semicircle' }, [{ position: 'right' }]);
    expect(spec.signals?.[1]).toHaveProperty(
      'update',
      expect.stringContaining('2 * (rscContainerHeight(height) - padding.top - padding.bottom)')
    );
  });

  test('uses the legend title width when it is wider than the labels', () => {
    const spec = addDonutLegendLayout(initializeSpec(), donut, [
      { position: 'right', title: 'Browser "share"', titleLimit: 120 },
    ]);
    expect(spec.signals?.[0]).toHaveProperty(
      'update',
      expect.stringContaining(`min(getLabelWidth("Browser \\"share\\"", 'bold', 14), 120))`)
    );
  });

  test('uses only the label width when there is no title', () => {
    const spec = addDonutLegendLayout(initializeSpec(), donut, [{ position: 'right' }]);
    expect(spec.signals?.[0]).not.toHaveProperty('update', expect.stringContaining('getLabelWidth'));
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

  test('preserves legend options, data, scales and existing signals and marks', () => {
    const legends: LegendOptions[] = [
      { position: 'right', title: 'Browser', highlight: true, hiddenEntries: ['Safari'] },
    ];
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
    { series: 'Firefox', value: 12 },
    { series: 'Opera', value: 8 },
    { series: 'Other', value: 4 },
    { series: 'Brave', value: 3 },
    { series: 'Unknown', value: 1 },
  ];

  const getSignals = async (viewWidth: number, legend: LegendOptions = { position: 'right' }, padding = 0) => {
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', () => viewWidth + 2 * padding);
    expressionFunction('rscContainerHeight', () => 300 + 2 * padding);
    const spec = buildSpec({ data, marks: [donut], legends: [legend] });
    const table = spec.data?.find(({ name }) => name === TABLE);
    if (!table || !('values' in table)) throw new Error('Expected inline table data');
    table.values = data;
    const view = new View(parse(spec), { renderer: 'none' }).width(viewWidth).height(300).padding(padding);
    await view.runAsync();
    return { view, margin: view.signal(DONUT_LEGEND_MARGIN), extent: view.signal(DONUT_LEGEND_EXTENT) };
  };

  const getDonutCenterX = (view: View): number => {
    const arcs: { x: number; mark: { group: { x?: number } } }[] = [];
    const walk = (node: { items?: unknown[]; mark?: { marktype?: string } }) => {
      (node.items ?? []).forEach((item) => {
        const it = item as { mark?: { marktype?: string } };
        if (it.mark?.marktype === 'arc') arcs.push(it as never);
        walk(it as never);
      });
    };
    walk((view.scenegraph() as unknown as { root: unknown }).root as never);
    const arc = arcs[0];
    return (arc.mark.group.x ?? 0) + arc.x;
  };

  test('centers the donut in the chart, with the legend beside it', async () => {
    const { view } = await getSignals(1000);
    expect(getDonutCenterX(view)).toBeCloseTo(500, 0);
    view.finalize();
  });

  test('centers the donut for a left legend too', async () => {
    const { view } = await getSignals(1000, { position: 'left' });
    expect(getDonutCenterX(view)).toBeCloseTo(500, 0);
    view.finalize();
  });

  test('sets the margin to half the width left after the donut and legend', async () => {
    const { view, margin, extent } = await getSignals(1000);
    expect(margin).toBeCloseTo((1000 - extent - 300) / 2);
    view.finalize();
  });

  test('widens the extent for a title wider than the labels', async () => {
    const { view, extent } = await getSignals(1000);
    const titled = await getSignals(1000, { position: 'right', title: 'Browser share of all visitors' });
    expect(titled.extent).toBeGreaterThan(extent);
    view.finalize();
    titled.view.finalize();
  });

  test('excludes view padding from the available width', async () => {
    const { view, margin, extent } = await getSignals(1000, { position: 'right' }, 20);
    expect(margin).toBeCloseTo((1000 - extent - 300) / 2);
    view.finalize();
  });

  test('has no margin when the chart is not wider than the donut and legend', async () => {
    const { view, margin } = await getSignals(300);
    expect(margin).toBe(0);
    view.finalize();
  });

  test.each<{ position: 'left' | 'right'; variant: 'circle' | 'semicircle'; labels: boolean }>([
    { position: 'left', variant: 'circle', labels: true },
    { position: 'right', variant: 'circle', labels: true },
    { position: 'left', variant: 'circle', labels: false },
    { position: 'right', variant: 'circle', labels: false },
    { position: 'left', variant: 'semicircle', labels: false },
    { position: 'right', variant: 'semicircle', labels: false },
    { position: 'left', variant: 'semicircle', labels: true },
    { position: 'right', variant: 'semicircle', labels: true },
  ])(
    'resizes a $variant monotonically with a $position legend (labels: $labels)',
    async ({ position, variant, labels }) => {
      Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
      expressionFunction(
        'rscContainerWidth',
        function (this: { context: { dataflow: View & { _viewWidth: number } } }) {
          const view = this.context.dataflow;
          const padding = view.padding();
          const horizontalPadding =
            typeof padding === 'number' ? 2 * padding : (padding.left ?? 0) + (padding.right ?? 0);
          return view._viewWidth + horizontalPadding;
        }
      );
      expressionFunction(
        'rscContainerHeight',
        function (this: { context: { dataflow: View & { _viewHeight: number } } }) {
          const view = this.context.dataflow;
          const padding = view.padding();
          const verticalPadding =
            typeof padding === 'number' ? 2 * padding : (padding.top ?? 0) + (padding.bottom ?? 0);
          return view._viewHeight + verticalPadding;
        }
      );
      const spec = buildSpec({
        data,
        marks: [
          {
            ...donut,
            name: 'responsiveDonut',
            variant,
            segmentLabels: labels ? [{ value: true, percent: true, showValueRow: true, swatch: true }] : [],
          },
        ],
        legends: [{ position, title: 'Browser', labelLimit: 160 }],
        titles: [{ text: 'Browser share' }],
      });
      const table = spec.data?.find(({ name }) => name === TABLE);
      if (!table || !('values' in table)) throw new Error('Expected inline table data');
      table.values = data;
      const view = new View(parse(spec, getSpectrum2VegaConfig('light')), { renderer: 'none' }).padding(20);
      const resize = async (width: number): Promise<number> => {
        await view.width(width).height(420).resize().runAsync();
        await view.runAsync();
        return view.signal('responsiveDonut_outerRadius');
      };
      let previousRadius = Number.POSITIVE_INFINITY;
      let initialRadius = 0;
      try {
        for (let containerWidth = 1000; containerWidth >= 300; containerWidth -= 10) {
          const radius = await resize(containerWidth);
          if (containerWidth === 1000) initialRadius = radius;
          expect(radius).toBeLessThanOrEqual(previousRadius + 0.01);
          previousRadius = radius;
        }
        expect(previousRadius).toBeLessThan(initialRadius);
        for (let containerWidth = 300; containerWidth <= 1000; containerWidth += 10) {
          const radius = await resize(containerWidth);
          expect(radius).toBeGreaterThanOrEqual(previousRadius - 0.01);
          previousRadius = radius;
        }
        expect(previousRadius).toBeCloseTo(initialRadius);
      } finally {
        view.finalize();
      }
    }
  );
});
