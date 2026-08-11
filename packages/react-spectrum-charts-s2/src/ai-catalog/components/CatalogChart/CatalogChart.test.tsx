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
import React from 'react';

import { findChart, getAllMarksByGroupName, hoverNthElement, render, screen, within } from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { CatalogChart } from './CatalogChart';

const barData = {
  values: [
    { browser: 'Chrome', downloads: 27000 },
    { browser: 'Firefox', downloads: 8000 },
    { browser: 'Safari', downloads: 7750 },
  ],
};

const lineData = {
  values: [
    { month: 'Jan', browser: 'Chrome', downloads: 4200 },
    { month: 'Feb', browser: 'Chrome', downloads: 5100 },
    { month: 'Jan', browser: 'Firefox', downloads: 2100 },
    { month: 'Feb', browser: 'Firefox', downloads: 2300 },
  ],
};

describe('CatalogChart', () => {
  test('renders a Bar mark from a valid request', async () => {
    render(
      <CatalogChart
        request={{
          component: 'Chart',
          data: barData,
          axes: [
            { component: 'Axis', position: 'bottom' },
            { component: 'Axis', position: 'left' },
          ],
          children: [{ component: 'Bar', dimension: 'browser', metric: 'downloads' }],
        }}
      />
    );

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    expect(getAllMarksByGroupName(chart, 'bar0')).toHaveLength(barData.values.length);
  });

  test('renders Bar decorations without breaking the mark', async () => {
    render(
      <CatalogChart
        request={{
          component: 'Chart',
          data: barData,
          children: [
            {
              component: 'Bar',
              dimension: 'browser',
              metric: 'downloads',
              decorations: [
                { component: 'BarDirectLabel', position: 'end-outside' },
                { component: 'ChartInspect', highlightBy: 'item' },
              ],
            },
          ],
        }}
      />
    );

    const chart = await findChart();
    expect(getAllMarksByGroupName(chart, 'bar0')).toHaveLength(barData.values.length);
    // BarDirectLabel adds a text mark per bar; confirms the decoration wasn't silently dropped by
    // childrenAdapter.ts's displayName check (the exact failure mode renderBarDecoration guards against).
    expect(chart.querySelectorAll('text').length).toBeGreaterThan(0);
  });

  test('ChartInspect decoration shows the default "dimension: metric" tooltip body on hover', async () => {
    render(
      <CatalogChart
        request={{
          component: 'Chart',
          data: barData,
          children: [
            {
              component: 'Bar',
              dimension: 'browser',
              metric: 'downloads',
              decorations: [{ component: 'ChartInspect', highlightBy: 'item' }],
            },
          ],
        }}
      />
    );

    const chart = await findChart();
    const bars = getAllMarksByGroupName(chart, 'bar0');

    await hoverNthElement(bars, 0);
    const tooltip = await screen.findByTestId('rsc-tooltip');
    expect(within(tooltip).getByText('Chrome: 27000')).toBeInTheDocument();
  });

  test('renders a Line mark with multiple color-faceted series', async () => {
    render(
      <CatalogChart
        request={{
          component: 'Chart',
          data: lineData,
          children: [
            { component: 'Line', dimension: 'month', metric: 'downloads', color: 'browser', scaleType: 'point' },
          ],
        }}
      />
    );

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    expect(getAllMarksByGroupName(chart, 'line0')).toHaveLength(2);
  });

  test('renders a LineDirectLabel decoration without breaking the mark', async () => {
    render(
      <CatalogChart
        request={{
          component: 'Chart',
          data: lineData,
          children: [
            {
              component: 'Line',
              dimension: 'month',
              metric: 'downloads',
              color: 'browser',
              scaleType: 'point',
              decorations: [{ component: 'LineDirectLabel', value: 'series', position: 'end' }],
            },
          ],
        }}
      />
    );

    const chart = await findChart();
    expect(getAllMarksByGroupName(chart, 'line0')).toHaveLength(2);
    expect(chart.querySelectorAll('text').length).toBeGreaterThan(0);
  });

  test('forwards colorScheme to the underlying Chart', async () => {
    // "gray-100" is a named Spectrum token that resolves to a different hex value per color
    // scheme, unlike the default categorical accent color (which happens to be scheme-invariant) —
    // using it as backgroundColor makes colorScheme's effect on getColorValue observable.
    const requestFor = (colorScheme: 'light' | 'dark') => ({
      component: 'Chart' as const,
      colorScheme,
      backgroundColor: 'gray-100',
      data: barData,
      children: [{ component: 'Bar' as const, dimension: 'browser', metric: 'downloads' }],
    });

    const { container: lightContainer, unmount } = render(<CatalogChart request={requestFor('light')} />);
    await findChart();
    const lightBackground = lightContainer.querySelector('.rsc-container > div')?.getAttribute('style');
    unmount();

    const { container: darkContainer } = render(<CatalogChart request={requestFor('dark')} />);
    await findChart();
    const darkBackground = darkContainer.querySelector('.rsc-container > div')?.getAttribute('style');

    // Regression test for the bug where CatalogChart always spread `colorScheme: parsed.colorScheme`
    // onto <Chart> — an explicit `undefined` there silently overrode Chart's own default instead of
    // falling back to it. This confirms an actually-provided colorScheme reaches the rendered chart.
    expect(darkBackground).not.toEqual(lightBackground);
  });

  test('forwards backgroundColor to the underlying Chart', async () => {
    const { container } = render(
      <CatalogChart
        request={{
          component: 'Chart',
          backgroundColor: 'gray-100',
          data: barData,
          children: [{ component: 'Bar', dimension: 'browser', metric: 'downloads' }],
        }}
      />
    );

    await findChart();
    const styledDiv = container.querySelector('.rsc-container > div');
    // DEFAULT_BACKGROUND_COLOR is 'transparent' — an explicitly-provided backgroundColor should
    // resolve to a real color instead of falling through to (or being overridden to) the default.
    expect(styledDiv).not.toHaveStyle({ backgroundColor: 'transparent' });
  });

  test('renders without axes when the request omits them', async () => {
    render(
      <CatalogChart
        request={{
          component: 'Chart',
          data: barData,
          children: [{ component: 'Bar', dimension: 'browser', metric: 'downloads' }],
        }}
      />
    );

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    expect(getAllMarksByGroupName(chart, 'bar0')).toHaveLength(barData.values.length);
  });

  test('throws for a request with an invalid mark discriminator', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <CatalogChart
          request={{
            component: 'Chart',
            data: barData,
            children: [{ component: 'Donut', dimension: 'browser', metric: 'downloads' }],
          }}
        />
      )
    ).toThrow();
    consoleError.mockRestore();
  });
});
