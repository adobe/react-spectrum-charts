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

import { findChart, getAllMarksByGroupName, render } from '../../../test-utils';
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
