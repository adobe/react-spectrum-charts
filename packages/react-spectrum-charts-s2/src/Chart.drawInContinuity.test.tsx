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
import { ReactElement, StrictMode } from 'react';

import { View } from 'vega';

import { Provider } from '@react-spectrum/s2';
import {
  DEFAULT_COLOR_SCHEME,
  DRAW_IN_ANIM_T,
  DRAW_IN_DONUT_DURATION_MS,
  DRAW_IN_GROW_DURATION_MS,
  DRAW_IN_PAINT_FADE_MS,
  DRAW_IN_START,
  DRAW_IN_SWEEP_DURATION_MS,
} from '@spectrum-charts/core-s2/constants';
import { ChartData } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from './Chart.js';
import { Axis, Bar, Donut, Legend, Line } from './components/index.js';
import { Combo } from './lab/components/index.js';
import { act, enableDrawIn, render, waitFor } from './test-utils/index.js';
import { ChartProps } from './types/index.js';

type MarkType = 'bar' | 'line' | 'donut';

const fixtures: Record<MarkType, { duration: number; data: ChartData[]; children: ChartProps['children'] }> = {
  bar: {
    duration: DRAW_IN_GROW_DURATION_MS,
    data: [
      { browser: 'Chrome', downloads: 27, series: 'a' },
      { browser: 'Firefox', downloads: 8, series: 'b' },
    ],
    children: [
      <Bar key="bar" dimension="browser" metric="downloads" color="series" />,
      <Legend key="l" isToggleable />,
    ],
  },
  line: {
    duration: DRAW_IN_SWEEP_DURATION_MS,
    data: [
      { datetime: 1, value: 3, series: 'a' },
      { datetime: 2, value: 5, series: 'a' },
      { datetime: 1, value: 2, series: 'b' },
      { datetime: 2, value: 4, series: 'b' },
    ],
    children: [
      <Axis key="x" position="bottom" />,
      <Line key="line" dimension="datetime" metric="value" color="series" scaleType="linear" />,
      <Legend key="l" isToggleable />,
    ],
  },
  donut: {
    duration: DRAW_IN_DONUT_DURATION_MS,
    data: [
      { count: 10, series: 'a' },
      { count: 6, series: 'b' },
    ],
    children: [<Donut key="donut" metric="count" color="series" />, <Legend key="l" isToggleable />],
  },
};

const views: View[] = [];
const lastOf = (list: View[]): View => {
  const view = list.at(-1);
  if (!view) throw new Error('No view rendered');
  return view;
};
const latestView = () => lastOf(views);

const chart = (markType: MarkType, props: Partial<ChartProps> = {}) => (
  <Chart
    data={[...fixtures[markType].data]}
    width={400}
    height={300}
    onVegaViewReady={(view) => views.push(view)}
    {...props}
  >
    {fixtures[markType].children}
  </Chart>
);

const withProvider = (element: ReactElement) => <Provider colorScheme={DEFAULT_COLOR_SCHEME}>{element}</Provider>;

const startOf = (view: View) => Number(view.signal(DRAW_IN_START));
const hasDrawIn = (view: View) => DRAW_IN_START in (view.getState({ signals: () => true }).signals ?? {});

const waitForView = async (count = 1) => waitFor(() => expect(views.length).toBeGreaterThanOrEqual(count));

const waitForStart = async () => {
  await waitFor(() => expect(startOf(latestView())).toBeGreaterThan(0));
  return startOf(latestView());
};

const mount = async (element: ReactElement) => {
  const result = render(element);
  await waitForView();
  return { ...result, start: await waitForStart() };
};

const rebuild = async (rerender: (element: ReactElement) => void, element: ReactElement) => {
  const count = views.length;
  rerender(withProvider(element));
  await waitForView(count + 1);
  return latestView();
};

const sleep = (ms: number) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));

beforeEach(() => {
  enableDrawIn();
  views.length = 0;
});

describe.each(['bar', 'line', 'donut'] satisfies MarkType[])('%s draw-in continuity', (markType) => {
  const { duration, data } = fixtures[markType];

  test('draws in by default', async () => {
    const { start } = await mount(chart(markType));
    expect(start).toBeGreaterThan(0);
    expect(latestView().signal(DRAW_IN_ANIM_T)).toBeLessThan(1);
  });

  test.each<[string, Partial<ChartProps>]>([
    ['the same data in a new array', {}],
    ['changed values', { data: data.map((row) => ({ ...row, count: 1, downloads: 1, value: 1 })) }],
    ['an added row', { data: [...data, { ...data[0], series: 'c' }] }],
    ['a removed row', { data: data.slice(1) }],
    ['a title', { title: 'Retitled' }],
    ['the dark color scheme', { colorScheme: 'dark' }],
    ['a controlled highlight', { highlightedSeries: 'a' }],
    ['controlled hidden series', { hiddenSeries: ['a'] }],
    ['a locale', { locale: 'de-DE' }],
    ['padding', { padding: 12 }],
    ['an explicit animationTypes default', { animationTypes: ['hover', 'drawIn'] }],
  ])('a rebuild mid draw-in from %s continues from the original start', async (_, props) => {
    const { rerender, start } = await mount(chart(markType));

    const view = await rebuild(rerender, chart(markType, props));

    expect(startOf(view)).toBe(start);
    expect(view.signal(DRAW_IN_ANIM_T)).toBeLessThan(1);
  });

  test('a rebuild after draw-in finishes paints fully drawn', async () => {
    const { rerender, start } = await mount(chart(markType));
    await sleep(duration + 50);

    const view = await rebuild(rerender, chart(markType, { title: 'After' }));

    expect(startOf(view)).toBe(start);
    expect(view.signal(DRAW_IN_ANIM_T)).toBe(1);
  });

  test('many rebuilds through the draw-in never move the start', async () => {
    const { rerender, start } = await mount(chart(markType));
    for (let i = 0; i < 8; i++) {
      await rebuild(rerender, chart(markType, { title: `Rebuild ${i}` }));
      expect(startOf(latestView())).toBe(start);
    }
  });

  test('turning draw-in off and back on does not replay it', async () => {
    const { rerender, start } = await mount(chart(markType));

    expect(hasDrawIn(await rebuild(rerender, chart(markType, { animationTypes: ['hover'] })))).toBe(false);
    const view = await rebuild(rerender, chart(markType));

    expect(startOf(view)).toBe(start);
  });

  test('turning on draw-in after mounting without it plays it', async () => {
    const { rerender } = render(chart(markType, { animations: false }));
    await waitForView();
    expect(hasDrawIn(latestView())).toBe(false);
    const enabledAt = Date.now();

    await rebuild(rerender, chart(markType));

    expect(await waitForStart()).toBeGreaterThanOrEqual(enabledAt);
  });

  test('a remount replays draw-in', async () => {
    const { rerender, start } = await mount(<div key="a">{chart(markType)}</div>);
    await sleep(20);

    rerender(withProvider(<div key="b">{chart(markType)}</div>));

    await waitFor(() => expect(startOf(latestView())).toBeGreaterThan(start));
  });

  test('loading then data replays draw-in', async () => {
    const { rerender, start } = await mount(chart(markType));
    await sleep(20);

    rerender(withProvider(chart(markType, { loading: true })));
    const count = views.length;
    await rebuild(rerender, chart(markType));

    expect(views.length).toBe(count + 1);
    expect(await waitForStart()).toBeGreaterThan(start);
  });

  test('data emptied then restored replays draw-in', async () => {
    const { rerender, start } = await mount(chart(markType));
    await sleep(20);

    rerender(withProvider(chart(markType, { data: [] })));
    await rebuild(rerender, chart(markType));

    expect(await waitForStart()).toBeGreaterThan(start);
  });

  test('data emptied then restored replays draw-in when loading is explicitly false', async () => {
    const { rerender, start } = await mount(chart(markType, { loading: false }));
    await sleep(20);

    await rebuild(rerender, chart(markType, { loading: false, data: [] }));
    await rebuild(rerender, chart(markType, { loading: false }));

    expect(await waitForStart()).toBeGreaterThan(start);
  });
});

describe('draw-in continuity edge cases', () => {
  test('rebuilds before the first tick keep the first embed time', async () => {
    const mountedAt = Date.now();
    const { rerender } = render(chart('bar'));
    for (let i = 0; i < 5; i++) rerender(withProvider(chart('bar', { title: `Fast ${i}` })));
    await waitForView();

    const start = await waitForStart();

    expect(start).toBeGreaterThanOrEqual(mountedAt);
    expect(start).toBeLessThan(mountedAt + 50);
  });

  test('streaming updates faster than a frame still draw in from mount', async () => {
    const mountedAt = Date.now();
    const { rerender } = render(chart('bar'));
    for (let i = 0; i < 20; i++) {
      rerender(withProvider(chart('bar', { title: `Stream ${i}` })));
      await sleep(5);
    }
    await waitForView();

    expect(await waitForStart()).toBeLessThan(mountedAt + 50);
  });

  test('StrictMode double effects do not delay or replay draw-in', async () => {
    const mountedAt = Date.now();
    const { rerender } = render(<StrictMode>{chart('bar')}</StrictMode>);
    await waitForView();
    const start = await waitForStart();
    expect(start).toBeLessThan(mountedAt + fixtures.bar.duration / 2);

    await rebuild(rerender, <StrictMode>{chart('bar', { title: 'Strict' })}</StrictMode>);

    expect(startOf(latestView())).toBe(start);
  });

  test('two charts keep independent starts', async () => {
    const first: View[] = [];
    const second: View[] = [];
    const pair = (title: string) => (
      <>
        {chart('bar', { title, onVegaViewReady: (view) => first.push(view) })}
        {chart('bar', { title, onVegaViewReady: (view) => second.push(view) })}
      </>
    );
    const { rerender } = render(pair('one'));
    await waitFor(() => expect(startOf(first[0])).toBeGreaterThan(0));
    const firstStart = startOf(first[0]);

    await sleep(DRAW_IN_GROW_DURATION_MS + 50);
    rerender(
      withProvider(
        <>
          {chart('bar', { title: 'two', onVegaViewReady: (view) => first.push(view) })}
          <div key="remounted">{chart('bar', { title: 'two', onVegaViewReady: (view) => second.push(view) })}</div>
        </>
      )
    );
    await waitFor(() => expect(first.length).toBeGreaterThan(1));
    await waitFor(() =>
      expect(startOf(lastOf(second))).toBeGreaterThan(firstStart + DRAW_IN_GROW_DURATION_MS)
    );

    expect(startOf(lastOf(first))).toBe(firstStart);
  });

  test('charts without draw-in carry nothing over', async () => {
    const { rerender } = render(chart('bar', { animationTypes: ['hover'] }));
    await waitForView();

    const view = await rebuild(rerender, chart('bar', { animationTypes: ['hover'], title: 'Static' }));

    expect(hasDrawIn(view)).toBe(false);
  });

  test('combo charts draw in by default and continue across rebuilds', async () => {
    const combo = (title?: string) => (
      <Chart
        data={[
          { datetime: 1, people: 3, rate: 0.2 },
          { datetime: 2, people: 5, rate: 0.4 },
        ]}
        width={400}
        height={300}
        title={title}
        onVegaViewReady={(view) => views.push(view)}
      >
        <Combo dimension="datetime">
          <Bar metric="people" />
          <Line metric="rate" scaleType="linear" />
        </Combo>
      </Chart>
    );
    const { rerender, start } = await mount(combo());

    const view = await rebuild(rerender, combo('Rebuilt'));

    expect(startOf(view)).toBe(start);
  });
});

describe('first paint fade', () => {
  const animate = jest.fn();

  beforeEach(() => {
    animate.mockClear();
    Element.prototype.animate = animate;
  });

  afterEach(() => {
    delete (Element.prototype as Partial<Element>).animate;
  });

  test('fades in a fresh draw-in once and leaves no inline opacity', async () => {
    const { rerender, container } = await mount(chart('bar'));
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledWith([{ opacity: 0 }, { opacity: 1 }], {
      duration: DRAW_IN_PAINT_FADE_MS,
      easing: 'cubic-bezier(0, 0, 0.4, 1)',
    });
    const rsc = container.querySelector<HTMLElement>('.rsc');
    expect(animate.mock.contexts[0]).toBe(rsc);
    expect(rsc?.style.opacity).toBe('');

    await rebuild(rerender, chart('bar', { title: 'Rebuilt' }));
    await rebuild(rerender, chart('bar', { title: 'Rebuilt again' }));
    expect(animate).toHaveBeenCalledTimes(1);
  });

  test.each<[string, Partial<ChartProps>]>([
    ['animations are off', { animations: false }],
    ['draw-in is off', { animationTypes: ['hover'] }],
    ['there is no data', { data: [], loading: false }],
  ])('does not fade when %s', async (_, props) => {
    const { container } = render(chart('bar', props));
    await waitForView();
    expect(animate).not.toHaveBeenCalled();
    expect(container.querySelector<HTMLElement>('.rsc')?.style.opacity).toBe('');
  });

  test('fades again when data arrives after being emptied', async () => {
    const { rerender } = await mount(chart('bar', { loading: false }));
    await rebuild(rerender, chart('bar', { loading: false, data: [] }));
    await rebuild(rerender, chart('bar', { loading: false }));
    expect(animate).toHaveBeenCalledTimes(2);
  });
});
