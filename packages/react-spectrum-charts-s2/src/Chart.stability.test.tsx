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
import { View } from 'vega';

import { DRAW_IN_ANIM_T } from '@spectrum-charts/core-s2/constants';

import { Chart } from './Chart.js';
import { Axis, Legend, Line } from './components/index.js';
import usePrefersReducedMotion from './hooks/usePrefersReducedMotion.js';
import {
  clickNthElement,
  enableDrawIn,
  findChart,
  getAllLegendEntries,
  getScene,
  setupChartHarness,
} from './test-utils/index.js';
import { ChartProps } from './types/index.js';

// Baselines record behavior on main; the S2 chart stability RFC (#1022) tightens them to its targets.

type Row = { datetime: number; value: number; series: string };

const data: Row[] = [
  { datetime: 1, value: 3, series: 'a' },
  { datetime: 2, value: 5, series: 'a' },
  { datetime: 1, value: 2, series: 'b' },
  { datetime: 2, value: 4, series: 'b' },
];

const harness = setupChartHarness();

const chart = (props: Partial<ChartProps> = {}, onVegaViewReady: (view: View) => void = harness.onVegaViewReady) => (
  <Chart data={data} width={400} height={300} animations={false} onVegaViewReady={onVegaViewReady} {...props}>
    <Axis position="left" />
    <Axis position="bottom" />
    <Line dimension="datetime" metric="value" color="series" scaleType="linear" />
    <Legend isToggleable />
  </Chart>
);

// hoisted so parent re-renders keep the same children, and therefore the same listeners and onNewView
const stableChildren = [
  <Axis key="left" position="left" />,
  <Axis key="bottom" position="bottom" />,
  <Line key="line" dimension="datetime" metric="value" color="series" scaleType="linear" />,
  <Legend key="legend" isToggleable />,
];

// a toggleable legend's own hidden series override the controlled prop
const untoggleableChildren = [
  <Line key="line" dimension="datetime" metric="value" color="series" scaleType="linear" />,
  <Legend key="legend" />,
];

const stableChart = (props: Partial<ChartProps> = {}, children = stableChildren) => (
  <Chart data={data} width={400} height={300} animations={false} onVegaViewReady={harness.onVegaViewReady} {...props}>
    {children}
  </Chart>
);

const untoggleableChart = (props: Partial<ChartProps> = {}) => stableChart(props, untoggleableChildren);

const append = (rows: Row[], i: number): Row[] => [
  ...rows,
  { datetime: 3 + i, value: i, series: 'a' },
  { datetime: 3 + i, value: i + 1, series: 'b' },
];

const streamed = (count: number) => Array.from({ length: count }, (_, i) => i).reduce(append, data);

describe('view counts', () => {
  test('initial mount creates 1 view and renders once', async () => {
    const { mountViews, mountRenders } = await harness.countUpdates([chart()]);

    expect({ mountViews, mountRenders }).toEqual({ mountViews: 1, mountRenders: 1 });
  });

  test.each<[string, ReturnType<typeof chart>[], { views: number; renders: number }]>([
    ['a parent re-render with identical inline JSX', [chart(), chart()], { views: 0, renders: 0 }],
    ['a new data array with identical contents', [chart(), chart({ data: [...data] })], { views: 0, renders: 0 }],
    [
      'an inline onVegaViewReady arrow on a parent re-render',
      [chart({}, (view) => harness.onVegaViewReady(view)), chart({}, (view) => harness.onVegaViewReady(view))],
      { views: 0, renders: 0 },
    ],
    // the first highlight changes the program (#1065); a → b updates the live view
    [
      'controlled highlightedSeries undefined → a → b',
      [chart(), chart({ highlightedSeries: 'a' }), chart({ highlightedSeries: 'b' })],
      { views: 1, renders: 2 },
    ],
  ])('%s', async (_, elements, expected) => {
    const { views, renders } = await harness.countUpdates(elements);

    expect({ views, renders }).toEqual(expected);
  });

  // Rebuilds while hiddenSeries is a program signal (#1065); the RFC targets 0 new views.
  test('a legend toggle', async () => {
    const mounted = await harness.mount(chart());
    const views = harness.views.length;
    const renders = harness.renderCount();

    await clickNthElement(getAllLegendEntries(await findChart()), 0);
    await harness.settle();

    expect({ views: harness.views.length - views, renders: harness.renderCount() - renders }).toEqual({
      views: 1,
      renders: 1,
    });
    mounted.unmount();
  });

  test('streaming 8 appends', async () => {
    const elements = [chart(), ...Array.from({ length: 8 }, (_, i) => chart({ data: streamed(i + 1) }))];

    const { mountViews, mountRenders, views, renders } = await harness.countUpdates(elements);

    expect({ views: mountViews + views, renders: mountRenders + renders }).toEqual({ views: 1, renders: 9 });
  });
});

describe('view counts with stable children', () => {
  test.each<[string, ReturnType<typeof stableChart>[], { views: number; renders: number }]>([
    ['a parent re-render', [stableChart(), stableChart()], { views: 0, renders: 0 }],
    [
      'a new data array with identical contents',
      [stableChart(), stableChart({ data: [...data] })],
      { views: 0, renders: 0 },
    ],
    ['changed data values', [stableChart(), stableChart({ data: streamed(1) })], { views: 0, renders: 1 }],
    ['a width change', [stableChart(), stableChart({ width: 500 })], { views: 0, renders: 1 }],
    ['a title change', [stableChart(), stableChart({ title: 'Retitled' })], { views: 1, renders: 1 }],
    [
      'controlled hiddenSeries undefined → a → b (rebuilds: legend layout depends on it)',
      [untoggleableChart(), untoggleableChart({ hiddenSeries: ['a'] }), untoggleableChart({ hiddenSeries: ['b'] })],
      { views: 2, renders: 2 },
    ],
    [
      'controlled highlightedSeries a → b → c',
      [
        untoggleableChart({ highlightedSeries: 'a' }),
        untoggleableChart({ highlightedSeries: 'b' }),
        untoggleableChart({ highlightedSeries: 'c' }),
      ],
      { views: 0, renders: 2 },
    ],
  ])('%s', async (_, elements, expected) => {
    const { views, renders } = await harness.countUpdates(elements);

    expect({ views, renders }).toEqual(expected);
  });

  test('streaming 8 appends', async () => {
    const elements = [stableChart(), ...Array.from({ length: 8 }, (_, i) => stableChart({ data: streamed(i + 1) }))];

    const { mountViews, views } = await harness.countUpdates(elements);

    expect(mountViews + views).toBe(1);
  });
});

describe('update equals fresh mount', () => {
  test.each<[string, Partial<ChartProps>, Partial<ChartProps>]>([
    ['changed values', {}, { data: data.map((row) => ({ ...row, value: row.value * 2 })) }],
    ['an appended row', {}, { data: streamed(1) }],
    ['a removed series', {}, { data: data.filter((row) => row.series === 'a') }],
    ['a controlled highlightedSeries', {}, { highlightedSeries: 'a' }],
    ['a cleared highlightedSeries', { highlightedSeries: 'a' }, {}],
    ['controlled hiddenSeries', {}, { hiddenSeries: ['a'] }],
    ['a title', {}, { title: 'Retitled' }],
    ['the dark color scheme', {}, { colorScheme: 'dark' }],
    ['padding', {}, { padding: 12 }],
  ])('%s', async (_, a, b) => {
    const { updated, fresh } = await harness.compareUpdateToMount(chart, a, b);

    expect(updated).toEqual(fresh);
  });

  // stable children route data and signal changes to the live view instead of rebuilding
  test.each<[string, Partial<ChartProps>, Partial<ChartProps>]>([
    ['changed values', {}, { data: data.map((row) => ({ ...row, value: row.value * 2 })) }],
    ['an appended row', {}, { data: streamed(1) }],
    ['a removed series', {}, { data: data.filter((row) => row.series === 'a') }],
    ['emptied data', {}, { data: [] }],
    ['restored data', { data: [] }, {}],
    ['a width change', {}, { width: 500 }],
  ])('%s with stable children', async (_, a, b) => {
    const { updated, fresh } = await harness.compareUpdateToMount(stableChart, a, b);

    expect(updated).toEqual(fresh);
  });

  test.each<[string, Partial<ChartProps>, Partial<ChartProps>]>([
    ['controlled hiddenSeries', {}, { hiddenSeries: ['a'] }],
    ['changed controlled hiddenSeries', { hiddenSeries: ['a'] }, { hiddenSeries: ['b'] }],
    ['cleared controlled hiddenSeries', { hiddenSeries: ['a'] }, {}],
    ['a controlled highlightedSeries', {}, { highlightedSeries: 'a' }],
  ])('%s with an untoggleable legend', async (_, a, b) => {
    const { updated, fresh } = await harness.compareUpdateToMount(untoggleableChart, a, b);

    expect(updated).toEqual(fresh);
  });

  test('distinguishes scenes with different data', async () => {
    const mounted = await harness.mount(chart());
    const scene = getScene(harness.latestView());
    mounted.unmount();

    const { fresh } = await harness.compareUpdateToMount(chart, {}, { data: streamed(1) });

    expect(scene).not.toEqual(fresh);
  });

  describe('with draw-in', () => {
    beforeEach(enableDrawIn);
    afterEach(() => jest.mocked(usePrefersReducedMotion).mockReturnValue(true));

    test('settles draw-in before comparing', async () => {
      const animated = (props: Partial<ChartProps>) => chart({ ...props, animations: true });

      const { updated, fresh } = await harness.compareUpdateToMount(animated, {}, { title: 'Retitled' });

      expect(harness.latestView().signal(DRAW_IN_ANIM_T)).toBe(1);
      expect(updated).toEqual(fresh);
    });
  });
});
