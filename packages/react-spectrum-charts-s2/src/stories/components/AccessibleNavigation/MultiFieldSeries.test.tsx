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
import { ReactElement } from 'react';

import { fireEvent } from '@testing-library/react';

import { Chart } from '../../../Chart';
import { Axis, Bar, ChartPopover, Legend } from '../../../components';
import { findChart, render, screen, waitFor } from '../../../test-utils';
import { FunnelTimeComparison, KeyboardContextMenu, TimeComparisonBar, UserGrowthTimeComparison } from './MultiFieldSeries.story';

const focusedNode = (container: HTMLElement) =>
  container.querySelector('.dn-node:focus') ?? (document.activeElement as HTMLElement | null);

const focusedLabel = (container: HTMLElement) => focusedNode(container)?.querySelector('.dn-node-text')?.getAttribute('aria-label');

const press = (container: HTMLElement, key: string, init: Partial<KeyboardEventInit> = {}) =>
  fireEvent.keyDown(focusedNode(container) as HTMLElement, { key, code: key, ...init });

const enterChartRoot = async (chart: ReactElement) => {
  render(chart);
  const container = (await findChart()).closest('.rsc-container') as HTMLElement;
  await waitFor(() => expect(container.querySelector('.dn-entry-button')).toBeTruthy());
  (container.querySelector('.dn-entry-button') as HTMLButtonElement).click();
  await waitFor(() => expect(container.querySelector('.dn-node')).toBeTruthy());
  return container;
};

const moveToLegend = async (container: HTMLElement) => {
  for (let i = 0; i < 3 && !focusedLabel(container)?.includes('legend'); i++) press(container, 'ArrowDown');
  await waitFor(() => expect(focusedLabel(container)).toContain('legend'));
};

describe('Series split across several fields', () => {
  test('time comparison bars read and tell apart each period', async () => {
    const container = await enterChartRoot(<TimeComparisonBar {...TimeComparisonBar.args} />);
    press(container, 'Enter');
    press(container, 'Enter');
    expect(focusedLabel(container)).toBe('series: add-freeform-table-0. period: Previous 4 weeks. Events: 1554.');
    press(container, 'ArrowRight');
    expect(focusedLabel(container)).toBe('series: add-freeform-table-0. period: Last 4 weeks. Events: 1134.');
  });

  test('a legend entry combining series and period drills into its own bars', async () => {
    const container = await enterChartRoot(<TimeComparisonBar {...TimeComparisonBar.args} />);
    await moveToLegend(container);
    expect(focusedLabel(container)).toBe('series, period legend. 4 series.');
    press(container, 'Enter');
    expect(focusedLabel(container)).toMatch(/^series, period: Add Freeform table \| Previous 4 weeks\. datetime: \d+, Events: 1554\./);
    press(container, 'Enter');
    expect(focusedLabel(container)).toMatch(/^datetime: \d+\. series: add-freeform-table-0\. period: Previous 4 weeks\. Events: 1554\.$/);
  });

  test.each([
    ['dodged by series, stacked by subSeries', FunnelTimeComparison, 'series: All users. period: Previous 4 weeks. subSeries: retained.'],
    ['stacked by series, dodged by period', UserGrowthTimeComparison, 'series: New users. period: Previous 4 weeks.'],
  ])('dodged-and-stacked bars (%s) are navigable per series with a legend', async (_, Story, firstBar) => {
    const container = await enterChartRoot(<Story {...Story.args} />);
    expect(focusedLabel(container)).toContain('grouped by series');
    press(container, 'Enter');
    press(container, 'Enter');
    expect(focusedLabel(container)).toContain(firstBar);
    press(container, 'Escape');
    press(container, 'Escape');
    await moveToLegend(container);
    press(container, 'Enter');
    press(container, 'Enter');
    expect(focusedLabel(container)).toContain(firstBar);
  });
});

const data = [
  { browser: 'Chrome', os: 'Windows', downloads: 7 },
  { browser: 'Chrome', os: 'Mac', downloads: 3 },
  { browser: 'Firefox', os: 'Windows', downloads: 4 },
  { browser: 'Firefox', os: 'Mac', downloads: 5 },
];

describe('Shift+F10 / ContextMenu key', () => {
  test('opens a legend right-click popover from a focused series', async () => {
    const container = await enterChartRoot(
      <Chart data={data} width={600} height={400} accessibleNavigation>
        <Axis position="bottom" />
        <Bar dimension="browser" metric="downloads" color="os" />
        <Legend>
          <ChartPopover rightClick>{(datum) => <div>Series menu: {datum.value}</div>}</ChartPopover>
        </Legend>
      </Chart>
    );
    await moveToLegend(container);
    press(container, 'Enter');
    press(container, 'F10', { shiftKey: true });
    expect(await screen.findByText('Series menu: Windows')).toBeInTheDocument();
  });

  test('opens a bar right-click popover and fires onContextMenu from a focused bar', async () => {
    const onContextMenu = jest.fn();
    const container = await enterChartRoot(
      <Chart data={data} width={600} height={400} accessibleNavigation>
        <Axis position="bottom" />
        <Bar dimension="browser" metric="downloads" color="os" onContextMenu={onContextMenu}>
          <ChartPopover rightClick>{(datum) => <div>Bar menu: {datum.downloads}</div>}</ChartPopover>
        </Bar>
      </Chart>
    );
    press(container, 'Enter');
    press(container, 'Enter');
    expect(focusedLabel(container)).toBe('browser: Chrome. os: Mac. downloads: 3.');
    press(container, 'ContextMenu');
    expect(await screen.findByText('Bar menu: 3')).toBeInTheDocument();
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(onContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'contextmenu', clientX: expect.any(Number) }),
      expect.objectContaining({ browser: 'Chrome', os: 'Mac', downloads: 3 })
    );
  });

  test('does nothing on a category, which has no single mark to right-click', async () => {
    const onContextMenu = jest.fn();
    const container = await enterChartRoot(
      <Chart data={data} width={600} height={400} accessibleNavigation>
        <Axis position="bottom" />
        <Bar dimension="browser" metric="downloads" color="os" onContextMenu={onContextMenu} />
      </Chart>
    );
    press(container, 'Enter');
    press(container, 'F10', { shiftKey: true });
    expect(onContextMenu).not.toHaveBeenCalled();
  });

  test('the KeyboardContextMenu story opens a bar popover and logs onContextMenu', async () => {
    const container = await enterChartRoot(<KeyboardContextMenu {...KeyboardContextMenu.args} />);
    press(container, 'Enter');
    press(container, 'Enter');
    press(container, 'F10', { shiftKey: true });
    expect(await screen.findByText('Bar menu: Chrome / Linux')).toBeInTheDocument();
    expect(screen.getByTestId('last-context-menu')).toHaveTextContent(/Chrome \/ Linux at \(/);
  });
});
