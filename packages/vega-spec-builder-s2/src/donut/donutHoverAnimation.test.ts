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

import {
  ANIMATION_TIMER,
  CONTROLLED_HIGHLIGHTED_ITEM,
  CONTROLLED_HIGHLIGHTED_SERIES,
  FADE_FACTOR,
  FILTERED_TABLE,
  MARK_ID,
  SELECTED_ITEM,
  TABLE,
} from '@spectrum-charts/constants';

import { buildSpec } from '../chartSpecBuilder';
import { getExpressionFunctions } from '../expressionFunctions';
import { ChartOptions } from '../types';
import { getArcMark, getDonutOpacity } from './donutUtils';
import { defaultDonutOptions } from './donutTestUtils';
import { getRichSegmentLabelMarks, getSegmentLabelMarks } from './segmentLabelUtils';

const data = [
  { id: 'a', series: 'Chrome', value: 30 },
  { id: 'b', series: 'Chrome', value: 50 },
  { id: 'c', series: 'Safari', value: 20 },
];
const chartOptions: ChartOptions = {
  data,
  idKey: 'id',
  marks: [
    {
      markType: 'donut',
      name: 'donut',
      color: 'series',
      segmentLabels: [{ value: true }],
      chartPopovers: [{}],
    },
  ],
};

describe('donut hover animations', () => {
  let view: View | undefined;
  let now: number;

  beforeEach(() => {
    now = 10000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    Object.entries(getExpressionFunctions('en-US')).forEach(([name, fn]) => expressionFunction(name, fn));
    expressionFunction('rscContainerWidth', (width: number) => width);
  });

  afterEach(() => {
    view?.finalize();
    view = undefined;
    jest.restoreAllMocks();
  });

  const createView = async (options: Partial<ChartOptions> = {}) => {
    const spec = buildSpec({ ...chartOptions, ...options });
    const table = spec.data?.find(({ name }) => name === TABLE);
    if (!table || !('values' in table)) throw new Error('Expected inline table data');
    table.values = data;
    view = new View(parse(spec), { renderer: 'none' }).width(500).height(500);
    await view.runAsync();
    return view;
  };

  const settle = async (chart: View) => {
    now += 1000;
    await chart.signal(ANIMATION_TIMER, now).runAsync();
  };

  const getArcOpacities = async (chart: View) => {
    const svg = new DOMParser().parseFromString(await chart.toSVG(), 'image/svg+xml');
    return Array.from(svg.querySelectorAll('g.donut path')).map((arc) =>
      Number(arc.getAttribute('opacity') ?? '1')
    );
  };

  test.each([
    { animations: false },
    { animationTypes: [] },
    { animationTypes: ['drawIn'] as ChartOptions['animationTypes'] },
  ])('keeps instant opacity when hover animation is disabled: %o', (options) => {
    const spec = buildSpec({ ...chartOptions, ...options });
    expect(spec.usermeta?.animatedMarks).toBeUndefined();
    expect(spec.data?.some(({ name }) => name === 'donut_hoverFractionData')).toBe(false);
    expect(spec.signals?.some(({ name }) => name === ANIMATION_TIMER)).toBe(false);
  });

  test('does not animate a noninteractive donut', () => {
    const spec = buildSpec({ data, marks: [{ markType: 'donut', color: 'series' }] });
    expect(spec.usermeta?.animatedMarks).toBeUndefined();
    expect(spec.signals?.some(({ name }) => name === ANIMATION_TIMER)).toBe(false);
  });

  test.each([
    { marks: [{ markType: 'donut' as const, color: 'series', segmentLabels: [{}] }] },
    { marks: [{ markType: 'donut' as const, color: 'series', chartInspects: [{}] }] },
    { marks: [{ markType: 'donut' as const, color: 'series' }], legends: [{ highlight: true }] },
    { marks: [{ markType: 'donut' as const, color: 'series' }], highlightedItem: 'a' },
    { marks: [{ markType: 'donut' as const, color: 'series' }], highlightedSeries: 'Chrome' },
  ])('registers animations for each highlight entry point: %o', (options) => {
    const spec = buildSpec({ data, idKey: 'id', ...options });
    expect(spec.usermeta?.animatedMarks).toHaveLength(1);
  });

  test('shares animated opacity across arcs, direct labels, and every rich label row', () => {
    const options = {
      ...defaultDonutOptions,
      isHoverAnimate: true,
      segmentLabels: [{ value: true }],
    };
    const opacity = getDonutOpacity(options);
    expect(getArcMark(options).encode?.update?.opacity).toEqual([
      expect.objectContaining({ value: 0 }),
      ...opacity,
    ]);
    const directLabels = getSegmentLabelMarks(options).flatMap((group) => group.marks ?? []);
    const richLabels = getRichSegmentLabelMarks({
      ...options,
      segmentLabels: [{ percent: true, swatch: true, showValueRow: true, showTotal: true }],
    }).flatMap((group) => group.marks ?? []);
    expect(directLabels.length).toBeGreaterThan(0);
    expect(richLabels.length).toBeGreaterThan(3);
    [...directLabels, ...richLabels].forEach((mark) =>
      expect(mark.encode?.update).toHaveProperty('opacity', opacity)
    );
    expect(getDonutOpacity(defaultDonutOptions)).toEqual([{ value: 1 }]);
  });

  test('animates each segment independently, including duplicate color categories, and restores neutral on leave', async () => {
    const chart = await createView();
    await settle(chart);
    const hovered = chart.data(FILTERED_TABLE)[0];
    await chart.signal('donut_hoveredItem', hovered).runAsync();
    expect(chart.data('donut_hoverTargetData').map((row) => row.target)).toEqual([1, 0, 0]);
    const startTime = chart.data('donut_hoverAnimStateData')[1].startTime;
    now = startTime + 50;
    await chart.signal(ANIMATION_TIMER, now).runAsync();
    const fraction = chart.data('donut_hoverFractionData')[1].fraction;
    expect(fraction).toBeGreaterThan(0);
    expect(fraction).toBeLessThan(0.5);
    const opacity = FADE_FACTOR + (1 - FADE_FACTOR) * Math.min(1, fraction / 0.5);
    expect(opacity).toBeGreaterThan(FADE_FACTOR);
    expect(opacity).toBeLessThan(1);
    await settle(chart);
    expect(chart.data('donut_hoverFractionData').map((row) => row.fraction)).toEqual([1, 0, 0]);
    expect(await getArcOpacities(chart)).toEqual([1, FADE_FACTOR, FADE_FACTOR]);
    expect(chart.data('donut_hoverSeriesFractionData').find((row) => row.rscSeriesId === 'Chrome').fraction).toBe(1);
    await chart.signal('donut_hoveredItem', null).runAsync();
    await settle(chart);
    expect(chart.data('donut_hoverFractionData').map((row) => row.fraction)).toEqual([0.5, 0.5, 0.5]);
    expect(await getArcOpacities(chart)).toEqual([1, 1, 1]);
  });

  test.each([
    { highlightedItem: 'b', expected: [0, 1, 0] },
    { highlightedItem: ['a', 'c'], expected: [1, 0, 1] },
    { highlightedSeries: 'Safari', expected: [0, 0, 1] },
  ])('animates controlled highlights without interactive children: %o', async ({ expected, ...options }) => {
    const chart = await createView({
      ...options,
      marks: [{ markType: 'donut', name: 'donut', color: 'series' }],
    });
    await settle(chart);
    expect(chart.data('donut_hoverFractionData').map((row) => row.fraction)).toEqual(expected);
  });

  test('resumes an interrupted transition from its current fraction', async () => {
    const chart = await createView();
    await settle(chart);
    await chart.signal('donut_hoveredItem', chart.data(FILTERED_TABLE)[0]).runAsync();
    now += 50;
    await chart.signal(ANIMATION_TIMER, now).runAsync();
    const fraction = chart.data('donut_hoverFractionData')[1].fraction;
    await chart.signal('donut_hoveredItem', chart.data(FILTERED_TABLE)[1]).runAsync();
    expect(chart.data('donut_hoverAnimStateData')[1].startValue).toBe(fraction);
    await settle(chart);
    expect(chart.data('donut_hoverFractionData').map((row) => row.fraction)).toEqual([0, 1, 0]);
  });

  test('combines legend, controlled item/series, and popover highlights with Line hover precedence', async () => {
    const chart = await createView({ legends: [{ highlight: true }] });
    await settle(chart);
    await chart.signal(SELECTED_ITEM, 'b').runAsync();
    expect(chart.data('donut_hoverTargetData').map((row) => row.target)).toEqual([0, 1, 0]);
    await chart.signal(CONTROLLED_HIGHLIGHTED_SERIES, 'Safari').runAsync();
    expect(chart.data('donut_hoverTargetData').map((row) => row.target)).toEqual([0, 0, 1]);
    await chart.signal(CONTROLLED_HIGHLIGHTED_ITEM, ['a', 'c']).runAsync();
    expect(chart.data('donut_hoverTargetData').map((row) => row.target)).toEqual([1, 0, 1]);
    await chart.signal('legend0_hoveredSeries', 'Chrome').runAsync();
    expect(chart.data('donut_hoverTargetData').map((row) => row.target)).toEqual([1, 1, 0]);
    await chart.signal('donut_hoveredItem', chart.data(FILTERED_TABLE)[2]).runAsync();
    expect(chart.data('donut_hoverTargetData').map((row) => row.target)).toEqual([0, 0, 1]);
    await settle(chart);
    expect(chart.data('donut_hoverFractionData').map((row) => row.fraction)).toEqual([0, 0, 1]);
  });

  test('keeps animation identities stable across semicircle sorting and legend filtering', async () => {
    const chart = await createView({
      marks: [{ markType: 'donut', name: 'donut', color: 'series', variant: 'semicircle', chartInspects: [{}] }],
      legends: [{ highlight: true, isToggleable: true }],
    });
    expect(chart.data(FILTERED_TABLE).map((row) => row.id)).toEqual(['b', 'a', 'c']);
    await chart.signal('donut_hoveredItem', chart.data(FILTERED_TABLE)[0]).runAsync();
    expect(chart.data('donut_hoverTargetData').map((row) => row.target)).toEqual([0, 1, 0]);
    await chart.signal('hiddenSeries', ['Safari']).runAsync();
    expect(chart.data(FILTERED_TABLE).map((row) => row.id)).toEqual(['b', 'a']);
    expect(chart.data('donut_hoverTargetData').map((row) => row.target)).toEqual([0, 1, 0]);
  });

  test('supports generated row ids and boolean donuts', async () => {
    const chart = await createView({
      idKey: MARK_ID,
      marks: [{ markType: 'donut', name: 'donut', color: 'series', isBoolean: true, chartInspects: [{}] }],
    });
    await settle(chart);
    await chart.signal('donut_hoveredItem', chart.data(FILTERED_TABLE)[1]).runAsync();
    expect(chart.data('donut_hoverTargetData').map((row) => row.target)).toEqual([0, 1, 0]);
    await settle(chart);
    expect(chart.data('donut_hoverFractionData').map((row) => row.fraction)).toEqual([0, 1, 0]);
  });

  test.each([{ values: [] }, { values: [{ series: 'Chrome', value: 0 }] }])(
    'parses animated empty states: %o',
    async ({ values }) => {
      const spec = buildSpec({ ...chartOptions, data: values });
      const table = spec.data?.find(({ name }) => name === TABLE);
      if (!table || !('values' in table)) throw new Error('Expected inline table data');
      table.values = values;
      view = new View(parse(spec), { renderer: 'none' }).width(400).height(400);
      await view.runAsync();
      expect(view.data('donut_hoverAnimStateData')).toHaveLength(values.length);
    }
  );
});
