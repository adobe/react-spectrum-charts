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

import { findChart, render, waitFor } from '../../../../test-utils/index.js';
import { FunnelTimeComparison, TimeComparisonBar, UserGrowthTimeComparison } from './MultiFieldSeries.story.js';

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

describe('Series split across several fields', () => {
  test('time comparison bars read and tell apart each period', async () => {
    const container = await enterChartRoot(<TimeComparisonBar {...TimeComparisonBar.args} />);
    press(container, 'Enter');
    press(container, 'Enter');
    expect(focusedLabel(container)).toBe('series: add-freeform-table-0. period: Previous 4 weeks. Events: 56952.');
    press(container, 'ArrowRight');
    expect(focusedLabel(container)).toBe('series: add-freeform-table-0. period: Last 4 weeks. Events: 51561.');
  });

  test.each([
    ['dodged by series, stacked by subSeries', FunnelTimeComparison, 'series: All users. period: Previous 4 weeks. subSeries: retained.'],
    ['stacked by series, dodged by period', UserGrowthTimeComparison, 'series: New users. period: Previous 4 weeks.'],
  ])('dodged-and-stacked bars (%s) are navigable per series', async (_, Story, firstBar) => {
    const container = await enterChartRoot(<Story {...Story.args} />);
    expect(focusedLabel(container)).toContain('grouped by series');
    press(container, 'Enter');
    press(container, 'Enter');
    expect(focusedLabel(container)).toContain(firstBar);
  });
});
