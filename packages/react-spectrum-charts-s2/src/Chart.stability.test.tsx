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

import { Provider } from '@react-spectrum/s2';
import {
  ANIMATION_TIMER,
  DEFAULT_COLOR_SCHEME,
  DRAW_IN_ANIM_T,
  DRAW_IN_DURATION,
} from '@spectrum-charts/core-s2/constants';

import { Chart } from './Chart.js';
import { Axis, Bar, Donut, Legend, Line } from './components/index.js';
import usePrefersReducedMotion from './hooks/usePrefersReducedMotion.js';
import { Bullet, Scatter } from './lab/index.js';
import {
  act,
  clickNthElement,
  enableDrawIn,
  findChart,
  getAllLegendEntries,
  getScene,
  render,
  setupChartHarness,
} from './test-utils/index.js';
import { ChartChildElement, ChartProps } from './types/index.js';

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

// without axes, fit autosize takes a second pass when the topmost line's stroke overflow moves
const axedUntoggleableChart = (props: Partial<ChartProps> = {}) =>
  stableChart(props, [<Axis key="left" position="left" />, ...untoggleableChildren]);

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
    [
      'controlled highlightedSeries undefined → a → b',
      [chart(), chart({ highlightedSeries: 'a' }), chart({ highlightedSeries: 'b' })],
      { views: 0, renders: 2 },
    ],
  ])('%s', async (_, elements, expected) => {
    const { views, renders } = await harness.countUpdates(elements);

    expect({ views, renders }).toEqual(expected);
  });

  test('a legend toggle', async () => {
    const mounted = await harness.mount(chart());
    const views = harness.views.length;
    const renders = harness.renderCount();

    await clickNthElement(getAllLegendEntries(await findChart()), 0);
    await harness.settle();

    expect({ views: harness.views.length - views, renders: harness.renderCount() - renders }).toEqual({
      views: 0,
      renders: 1,
    });
    mounted.unmount();
  });

  test('a static chart rebuilds once when its first controlled highlight adds hover animation', async () => {
    const animated = (props: Partial<ChartProps> = {}) =>
      untoggleableChart({ animations: true, animationTypes: ['hover'], ...props });

    const { views } = await harness.countUpdates([
      animated(),
      animated({ highlightedSeries: 'a' }),
      animated({ highlightedSeries: 'b' }),
    ]);

    expect(views).toBe(1);
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
      'controlled hiddenSeries undefined → a → b',
      [
        axedUntoggleableChart(),
        axedUntoggleableChart({ hiddenSeries: ['a'] }),
        axedUntoggleableChart({ hiddenSeries: ['b'] }),
      ],
      { views: 0, renders: 2 },
    ],
    [
      'controlled highlightedSeries undefined → a → b → undefined',
      [
        untoggleableChart(),
        untoggleableChart({ highlightedSeries: 'a' }),
        untoggleableChart({ highlightedSeries: 'b' }),
        untoggleableChart(),
      ],
      { views: 0, renders: 3 },
    ],
    [
      'controlled highlightedItem undefined → id → undefined',
      [untoggleableChart(), untoggleableChart({ highlightedItem: 1 }), untoggleableChart()],
      { views: 0, renders: 2 },
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

  // restored series and categories take their first-appearance position, as on a fresh mount
  describe('restored ahead of the others', () => {
    const threeSeries = [...data, { datetime: 1, value: 1, series: 'c' }, { datetime: 2, value: 2, series: 'c' }];
    const withoutA = { data: threeSeries.filter((row) => row.series !== 'a') };

    test('a series', async () => {
      const { updated, fresh } = await harness.compareUpdateToMount(stableChart, withoutA, { data: threeSeries });

      expect(updated).toEqual(fresh);
    });

    // keyed bars append a returning item to the scene, so compare bar items in data order
    const sortBarItems = (node: unknown): unknown => {
      if (Array.isArray(node)) return node.map(sortBarItems);
      if (!node || typeof node !== 'object') return node;
      const sorted = Object.fromEntries(Object.entries(node).map(([key, value]) => [key, sortBarItems(value)]));
      if (typeof sorted.name === 'string' && sorted.name.startsWith('bar0') && Array.isArray(sorted.items)) {
        sorted.items = [...sorted.items].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
      }
      return sorted;
    };

    // no axis, since Vega appends a returning tick to the axis scene without moving it
    test('a bar category', async () => {
      const barChildren = [<Bar key="bar" dimension="series" metric="value" />];
      const barChart = (props: Partial<ChartProps>) => stableChart(props, barChildren);
      const { updated, fresh } = await harness.compareUpdateToMount(barChart, withoutA, { data: threeSeries });

      expect(sortBarItems(updated)).toEqual(sortBarItems(fresh));
    });
  });

  test.each<[string, Partial<ChartProps>, Partial<ChartProps>]>([
    ['controlled hiddenSeries', {}, { hiddenSeries: ['a'] }],
    ['changed controlled hiddenSeries', { hiddenSeries: ['a'] }, { hiddenSeries: ['b'] }],
    ['cleared controlled hiddenSeries', { hiddenSeries: ['a'] }, {}],
    ['a controlled highlightedSeries', {}, { highlightedSeries: 'a' }],
    ['a cleared highlightedSeries', { highlightedSeries: 'a' }, {}],
    ['a controlled highlightedItem', {}, { highlightedItem: 1 }],
    ['a cleared highlightedItem', { highlightedItem: 1 }, {}],
  ])('%s with an untoggleable legend', async (_, a, b) => {
    const { updated, fresh } = await harness.compareUpdateToMount(untoggleableChart, a, b);

    expect(updated).toEqual(fresh);
  });

  const shapedChart = (symbolShape: string) => (props: Partial<ChartProps>) =>
    stableChart(props, [
      <Line key="line" dimension="datetime" metric="value" color="series" scaleType="linear" />,
      <Legend key="legend" symbolShape={{ value: symbolShape }} />,
    ]);

  test.each([
    ['a built-in shape', 'circle'],
    ['a built-in polygon', 'cross'],
    ['a custom path larger than the icon', 'M -1.5 -1.5 L 1.5 -1.5 L 0 1.5 Z'],
  ])('controlled hiddenSeries on a legend with %s', async (_, symbolShape) => {
    const { updated, fresh } = await harness.compareUpdateToMount(
      shapedChart(symbolShape),
      {},
      { hiddenSeries: ['a'] }
    );

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

type SceneMark = { marktype?: string; name?: string; items?: SceneMark[] };

const findSceneItems = (node: SceneMark, name: string): SceneMark[] => {
  if (node.marktype && node.name === name) return node.items ?? [];
  return (node.items ?? []).flatMap((child) => findSceneItems(child, name));
};

const getMarkItems = (view: View, name: string): SceneMark[] =>
  findSceneItems((view.scenegraph() as unknown as { root: SceneMark }).root, name);

describe('keyed marks', () => {
  type KeyedRow = { category: string; series: string; value: number; target: number };

  const keyedData: KeyedRow[] = [
    { category: 'x', series: 'a', value: 3, target: 4 },
    { category: 'x', series: 'b', value: 5, target: 4 },
    { category: 'y', series: 'a', value: 2, target: 4 },
    { category: 'y', series: 'b', value: 4, target: 4 },
  ];

  const doubled = keyedData.map((row) => ({ ...row, value: row.value * 2 }));

  const renderKeyedChart = (mark: ChartChildElement, props: Partial<ChartProps>) => (
    <Chart
      data={keyedData}
      width={400}
      height={300}
      animations={false}
      onVegaViewReady={harness.onVegaViewReady}
      {...props}
    >
      {mark}
    </Chart>
  );

  const keyedChart = (mark: ChartChildElement) => (props: Partial<ChartProps>) => renderKeyedChart(mark, props);

  const marks: [string, string, ChartChildElement][] = [
    ['stacked bar', 'bar0', <Bar key="bar" dimension="category" metric="value" color="series" />],
    ['dodged bar', 'bar0', <Bar key="bar" dimension="category" metric="value" color="series" type="dodged" />],
    ['scatter', 'scatter0', <Scatter key="scatter" dimension="value" metric="target" color="series" />],
    ['donut', 'donut0', <Donut key="donut" metric="value" color="category" />],
    ['bullet', 'bullet0Rect', <Bullet key="bullet" dimension="category" metric="value" target="target" />],
  ];

  test.each(marks)('a %s data update keeps its items and matches a fresh mount', async (_, name, mark) => {
    const keyed = keyedChart(mark);
    const mounted = await harness.mount(keyed({}));
    const before = getMarkItems(harness.latestView(), name);
    await harness.update(mounted, keyed({ data: doubled }));
    const after = getMarkItems(harness.latestView(), name);
    const updated = getScene(harness.latestView());
    mounted.unmount();

    expect(before.length).toBeGreaterThan(0);
    // compared by count so a failure doesn't print the cyclic scene items
    expect(after.filter((item, i) => item === before[i]).length).toBe(before.length);
    expect(after.length).toBe(before.length);

    const fresh = await harness.mount(keyed({ data: doubled }));
    expect(updated).toEqual(getScene(harness.latestView()));
    fresh.unmount();
  });
});

describe('mid-flight data updates', () => {
  type KeyedRow = { category: string; series: string; value: number };

  const rows: KeyedRow[] = [
    { category: 'x', series: 'a', value: 3 },
    { category: 'x', series: 'b', value: 5 },
    { category: 'y', series: 'a', value: 2 },
    { category: 'y', series: 'b', value: 4 },
  ];

  const changed = [...rows.map((row) => ({ ...row, value: row.value * 2 })), { category: 'z', series: 'a', value: 1 }];

  const frames: FrameRequestCallback[] = [];
  let frameSpy: jest.SpyInstance | undefined;

  // the ticker never runs, so each test drives the draw-in clock itself
  beforeEach(() => {
    enableDrawIn();
    frames.length = 0;
    frameSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
  });

  afterEach(() => {
    frameSpy?.mockRestore();
    // releases the ticker's pending frame so later tests can schedule their own
    frames.forEach((callback) => callback(performance.now()));
    jest.mocked(usePrefersReducedMotion).mockReturnValue(true);
  });

  const waitForView = async (count: number): Promise<View> => {
    for (let i = 0; i < 100 && harness.views.length < count; i++) {
      await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    }
    const view = harness.latestView();
    await act(async () => {
      await view.runAsync();
    });
    return view;
  };

  const pinDrawIn = async (view: View, progress: number) => {
    const start = 1000;
    await act(async () => {
      await view.signal(ANIMATION_TIMER, start).runAsync();
      await view.signal(ANIMATION_TIMER, start + Number(view.signal(DRAW_IN_DURATION)) * progress).runAsync();
    });
  };

  const renderMidFlightChart = (mark: ChartChildElement, chartData: KeyedRow[]) => (
    <Chart data={chartData} width={400} height={300} onVegaViewReady={harness.onVegaViewReady}>
      {mark}
    </Chart>
  );

  const midFlightChart = (mark: ChartChildElement) => (chartData: KeyedRow[]) => renderMidFlightChart(mark, chartData);

  const marks: [string, ChartChildElement][] = [
    ['stacked bar', <Bar key="bar" dimension="category" metric="value" color="series" />],
    ['dodged bar', <Bar key="bar" dimension="category" metric="value" color="series" type="dodged" />],
    ['line', <Line key="line" dimension="category" metric="value" color="series" scaleType="point" />],
    ['donut', <Donut key="donut" metric="value" color="category" />],
  ];

  test.each(marks)('a %s updated mid-draw-in matches a fresh mount at the same progress', async (_, mark) => {
    const midFlight = midFlightChart(mark);
    const mounted = render(midFlight(rows));
    await pinDrawIn(await waitForView(1), 0.5);
    mounted.rerender(<Provider colorScheme={DEFAULT_COLOR_SCHEME}>{midFlight(changed)}</Provider>);
    const view = await waitForView(1);
    await pinDrawIn(view, 0.5);
    const updated = getScene(view);
    mounted.unmount();

    expect(harness.views).toHaveLength(1);
    expect(view.signal(DRAW_IN_ANIM_T)).toBe(0.5);

    const fresh = render(midFlight(changed));
    const freshView = await waitForView(2);
    await pinDrawIn(freshView, 0.5);
    expect(updated).toEqual(getScene(freshView));
    fresh.unmount();
  });
});
