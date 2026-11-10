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
import { FOCUSED_DIMENSION, FOCUSED_ITEM, FOCUSED_REGION } from '@spectrum-charts/core-s2/constants';

import { Chart } from './Chart.js';
import { Axis, Bar, ChartPopover, Legend } from './components/index.js';
import {
  act,
  findAllMarksByGroupName,
  findChart,
  fireEvent,
  screen,
  setupChartHarness,
  waitFor,
} from './test-utils/index.js';
import { BarProps, ChartProps } from './types/index.js';

type Props = Partial<ChartProps>;

const data = [
  { browser: 'Chrome', os: 'Windows', downloads: 30 },
  { browser: 'Chrome', os: 'Mac', downloads: 20 },
  { browser: 'Firefox', os: 'Windows', downloads: 15 },
  { browser: 'Firefox', os: 'Mac', downloads: 10 },
  { browser: 'Safari', os: 'Windows', downloads: 5 },
  { browser: 'Safari', os: 'Mac', downloads: 25 },
];

const onClick = jest.fn();

const harness = setupChartHarness();

const chart = (props: Props = {}, barProps: Partial<BarProps> = {}) => (
  <Chart
    data={data}
    width={600}
    height={400}
    animations={false}
    accessibleNavigation
    onVegaViewReady={harness.onVegaViewReady}
    {...props}
  >
    <Axis position="bottom" />
    <Axis position="left" />
    <Bar dimension="browser" metric="downloads" color="os" onClick={onClick} {...barProps}>
      <ChartPopover>{(datum) => <div>Popover {`${datum.browser} ${datum.os}`}</div>}</ChartPopover>
    </Bar>
    <Legend title="Operating system" />
  </Chart>
);

const container = (): HTMLElement => document.querySelector('.rsc-container') as HTMLElement;
const entryButton = (): HTMLButtonElement => container().querySelector('.dn-entry-button') as HTMLButtonElement;
// data-navigator renders one node at a time; jsdom doesn't track focus on it reliably, so target it directly.
const node = (): HTMLElement | null => container().querySelector('.dn-node');
const label = (): string | null | undefined => container().querySelector('.dn-node-text')?.getAttribute('aria-label');
const focusedId = (): string | undefined => node()?.id;
const axisRing = (): HTMLElement | null => container().querySelector('.dn-axis-focus-ring');
const signal = (name: string): unknown => harness.latestView().signal(name);

const press = async (key: string) => {
  const target = node();
  if (!target) throw new Error('No focused navigation node');
  fireEvent.keyDown(target, { key, code: key === ' ' ? 'Space' : key });
  await harness.settle();
};

const enter = async () => {
  await waitFor(() => expect(entryButton()).toBeTruthy());
  act(() => entryButton().click());
  await harness.settle();
  await waitFor(() => expect(node()).toBeTruthy());
};

const isRingVisible = async (groupName: string): Promise<boolean> => {
  const rings = await findAllMarksByGroupName(await findChart(), groupName);
  return rings.some((ring) => ring.getAttribute('opacity') === '1');
};

beforeEach(() => {
  onClick.mockClear();
});

describe('entering and leaving', () => {
  test('the entry button focuses the whole chart', async () => {
    await harness.mount(chart());
    await enter();

    expect(signal(FOCUSED_REGION)).toBe('chart');
    expect(entryButton().tabIndex).toBe(-1);
  });

  test('Escape at the chart root exits and clears focus', async () => {
    await harness.mount(chart());
    await enter();

    await press('Escape');

    expect(node()).toBeNull();
    expect(signal(FOCUSED_REGION)).toBeNull();
    expect(entryButton().tabIndex).toBe(0);
  });

  test('focus leaving the chart clears the ring but keeps the node to return to', async () => {
    await harness.mount(chart());
    await enter();
    await press('Enter');
    await press('Enter');
    expect(await isRingVisible('bar0_focusRing')).toBe(true);

    fireEvent.focusOut(node() as HTMLElement, { relatedTarget: document.body });
    await harness.settle();

    expect(signal(FOCUSED_ITEM)).toBeNull();
    expect(await isRingVisible('bar0_focusRing')).toBe(false);
    expect(node()).toBeTruthy();
    expect(entryButton().tabIndex).toBe(-1);

    fireEvent.focus(node() as HTMLElement);
    await harness.settle();
    expect(await isRingVisible('bar0_focusRing')).toBe(true);
  });
});

describe('bars', () => {
  test('Enter drills into a stack, then a segment', async () => {
    await harness.mount(chart());
    await enter();

    await press('Enter');
    expect(label()).toContain('Chrome');
    expect(signal(FOCUSED_DIMENSION)).toBe('Chrome');
    expect(await isRingVisible('bar0_stackFocusRing')).toBe(true);

    await press('Enter');
    expect(focusedId()).toBe('Chrome__rsc__Mac');
    expect(label()).toBe('Operating system: Mac.');
    expect(signal(FOCUSED_ITEM)).toBe('Chrome__rsc__Mac');
    expect(await isRingVisible('bar0_focusRing')).toBe(true);
  });

  test('a focused segment drives the same hover signal as the mouse', async () => {
    await harness.mount(chart());
    await enter();
    await press('Enter');
    await press('Enter');

    expect(signal('bar0_hoveredItem')).not.toBeNull();
  });

  test('arrows move across stacks on the same series and within a stack', async () => {
    await harness.mount(chart());
    await enter();
    await press('Enter');
    await press('Enter');

    await press('ArrowRight');
    expect(focusedId()).toBe('Firefox__rsc__Mac');

    await press('ArrowDown');
    expect(focusedId()).toBe('Firefox__rsc__Windows');
  });

  test('the first Escape dismisses the focus tooltip, later ones drill out', async () => {
    await harness.mount(chart());
    await enter();
    await press('Enter');
    await press('Enter');
    const tooltip = document.getElementById('vg-tooltip-element');
    expect(tooltip).toHaveClass('visible');

    await press('Escape');
    expect(tooltip).not.toHaveClass('visible');
    expect(focusedId()).toBe('Chrome__rsc__Mac');

    await press('Escape');
    expect(focusedId()).toBe('__browser_Chrome');
    expect(signal(FOCUSED_DIMENSION)).toBe('Chrome');
    expect(tooltip).toHaveClass('visible');

    await press('Escape');
    expect(focusedId()).toBe('__browser_Chrome');

    await press('Escape');
    expect(focusedId()).toBe('_browser');
    expect(signal(FOCUSED_REGION)).toBe('chart');
  });

  test.each(['Enter', ' '])('%j on a segment opens its popover and fires onClick', async (key) => {
    await harness.mount(chart());
    await enter();
    await press('Enter');
    await press('Enter');

    await press(key);

    expect(await screen.findByText('Popover Chrome Mac')).toBeInTheDocument();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0]).toMatchObject({ browser: 'Chrome', os: 'Mac' });
    expect(node()).toBeTruthy();
  });

  test('a named bar drives its own hover signal, popover and onClick', async () => {
    await harness.mount(chart({}, { name: 'Revenue Bars' }));
    await enter();
    await press('Enter');
    await press('Enter');
    expect(signal('revenueBars_hoveredItem')).not.toBeNull();

    await press('Enter');

    expect(await screen.findByText('Popover Chrome Mac')).toBeInTheDocument();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('clicking a bar focuses its node', async () => {
    await harness.mount(chart());
    const bars = await findAllMarksByGroupName(await findChart(), 'bar0');

    // bars render in data order
    fireEvent.mouseDown(bars[3]);
    await harness.settle();

    expect(focusedId()).toBe('Firefox__rsc__Mac');
    expect(entryButton().tabIndex).toBe(-1);
  });
});

describe('bottom axis', () => {
  test('ArrowDown from the chart moves to the axis and Enter to its labels', async () => {
    await harness.mount(chart());
    await enter();

    await press('ArrowDown');
    expect(signal(FOCUSED_REGION)).toBeNull();
    expect(axisRing()?.style.display).not.toBe('none');

    await press('Enter');
    expect(label()).toContain('Chrome');
    expect(signal('bar0_dimensionHoverArea_hoveredItem')).toMatchObject({ browser: 'Chrome' });
    expect(await isRingVisible('bar0_focusRing')).toBe(false);
    expect(await isRingVisible('bar0_stackFocusRing')).toBe(false);

    await press('ArrowRight');
    expect(label()).toContain('Firefox');
  });

  test('uses the default dimension when the bar does not set one', async () => {
    const categoryData = data.map(({ browser, ...row }) => ({ ...row, category: browser }));
    await harness.mount(chart({ data: categoryData }, { dimension: undefined }));
    await enter();

    await press('ArrowDown');
    expect(axisRing()).not.toBeNull();
    await press('Enter');

    expect(label()).toContain('Chrome');
  });

  test('a focused label does not open a popover', async () => {
    await harness.mount(chart());
    await enter();
    await press('ArrowDown');
    await press('Enter');

    await press(' ');

    expect(screen.queryByTestId('rsc-popover')).toBeNull();
    expect(onClick).not.toHaveBeenCalled();
  });
});

// Focus behaves like hover: it survives updates that keep the view's program and data, and resets otherwise.
describe('host updates', () => {
  const focusSegment = async () => {
    await enter();
    await press('Enter');
    await press('Enter');
  };

  test.each([
    ['a no-op', {}],
    ['a signal update', { highlightedSeries: 'Mac' }],
  ] as [string, Props][])('keeps focus after %s', async (_, props) => {
    const mounted = await harness.mount(chart());
    await focusSegment();
    const focusedItem = signal(FOCUSED_ITEM);

    await harness.update(mounted, chart(props));

    expect(focusedId()).toBe('Chrome__rsc__Mac');
    expect(signal(FOCUSED_ITEM)).toBe(focusedItem);
    expect(await isRingVisible('bar0_focusRing')).toBe(true);
  });

  const keepsFocusedNode = async (props: Props) => {
    const mounted = await harness.mount(chart());
    await focusSegment();

    await harness.update(mounted, chart(props));

    await waitFor(() => expect(focusedId()).toBe('Chrome__rsc__Mac'));
    expect(document.activeElement).toBe(node());
    expect(await isRingVisible('bar0_focusRing')).toBe(true);
  };

  test('keeps focus on the same node after a rebuild', () => keepsFocusedNode({ title: 'Retitled' }));

  test('keeps focus on the same node after a data update', () =>
    keepsFocusedNode({ data: data.map((row) => ({ ...row, downloads: row.downloads * 2 })) }));

  test('resets focus when the focused node no longer exists', async () => {
    const mounted = await harness.mount(chart());
    await focusSegment();

    await harness.update(mounted, chart({ data: data.filter((row) => row.browser !== 'Chrome') }));

    await waitFor(() => expect(document.activeElement).toBe(entryButton()));
    expect(node()).toBeNull();
    expect(entryButton().tabIndex).toBe(0);
    expect(signal(FOCUSED_ITEM)).toBeNull();
  });

  test('keeps the entry button focused when navigation resets', async () => {
    const mounted = await harness.mount(chart());
    await waitFor(() => expect(entryButton()).toBeTruthy());
    act(() => entryButton().focus());

    await harness.update(mounted, chart({ data: data.map((row) => ({ ...row, downloads: row.downloads * 2 })) }));

    expect(document.activeElement).toBe(entryButton());
  });
});
