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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChartProps } from '../../../types/index.js';
import { stubS2BrowserApis } from '../../dashboardTestUtils.js';
import { PropVariations } from './AreaVariations.story.js';
import { areaVariationDatasets } from './areaVariationData.js';

jest.mock('../../../Chart.js', () => ({
  Chart: ({ animations, data, renderer }: ChartProps) => (
    <div
      data-testid="variation-chart"
      data-animations={String(animations)}
      data-renderer={renderer}
      data-rows={data?.length}
    />
  ),
}));

jest.mock('../../../hooks/useChartProps.js', () => ({
  __esModule: true,
  default: (props: ChartProps) => props,
}));

beforeAll(stubS2BrowserApis);
beforeEach(() => localStorage.clear());

const getCharts = () => screen.getAllByTestId('variation-chart');

test('has no animation toggle because Area has no S2 animations', () => {
  render(<PropVariations />);
  expect(screen.queryByRole('switch', { name: 'Area animations' })).toBeNull();
  getCharts().forEach((chart) => expect(chart.getAttribute('data-animations')).toBe('undefined'));
});

test('wires the renderer control into all area charts while switching datasets', async () => {
  render(<PropVariations />);
  const expectRenderer = (renderer: string) => {
    const charts = getCharts();
    expect(charts.length).toBeGreaterThan(1);
    charts.forEach((chart) => expect(chart.getAttribute('data-renderer')).toBe(renderer));
  };
  const countChartsWithRows = (rows: number) =>
    getCharts().filter((chart) => chart.getAttribute('data-rows') === String(rows)).length;
  expectRenderer('svg');
  const standardCount = countChartsWithRows(areaVariationDatasets.standard.length);
  expect(standardCount).toBeGreaterThan(1);

  await userEvent.click(screen.getByRole('radio', { name: 'Canvas' }));
  expectRenderer('canvas');

  await userEvent.click(screen.getByRole('button', { name: /Dataset/ }));
  await userEvent.click(screen.getByRole('option', { name: /Dense/ }));
  expectRenderer('canvas');
  expect(countChartsWithRows(areaVariationDatasets.dense.length)).toBeGreaterThanOrEqual(standardCount);

  await userEvent.click(screen.getByRole('radio', { name: 'SVG' }));
  expectRenderer('svg');
});
