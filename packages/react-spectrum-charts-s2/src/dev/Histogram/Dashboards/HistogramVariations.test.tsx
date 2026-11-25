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
import { PropVariations } from './HistogramVariations.story.js';
import { histogramVariations } from './histogram.dashboard.js';

jest.mock('../../../Chart.js', () => ({
  Chart: ({ animationTypes }: ChartProps) => (
    <div data-testid="variation-chart" data-animation-types={animationTypes?.join(',')} />
  ),
}));

jest.mock('../../../hooks/useChartProps.js', () => ({
  __esModule: true,
  default: (props: ChartProps) => props,
}));

beforeAll(stubS2BrowserApis);
beforeEach(() => localStorage.clear());

test('renders every variation', () => {
  render(<PropVariations />);
  expect(screen.getAllByTestId('variation-chart')).toHaveLength(histogramVariations.length);
});

test('wires the draw-in switch into all histogram charts while switching datasets', async () => {
  render(<PropVariations />);
  const drawIn = screen.getByRole('switch', { name: 'Histogram draw-in animation' });
  const expectAnimationTypes = (types: string) => {
    const charts = screen.getAllByTestId('variation-chart');
    expect(charts.length).toBeGreaterThan(1);
    charts.forEach((chart) => expect(chart.getAttribute('data-animation-types')).toBe(types));
  };
  expectAnimationTypes('drawIn');

  await userEvent.click(drawIn);
  expectAnimationTypes('');

  await userEvent.click(screen.getByRole('button', { name: /Dataset/ }));
  await userEvent.click(screen.getAllByRole('option')[1]);
  expectAnimationTypes('');

  await userEvent.click(drawIn);
  expectAnimationTypes('drawIn');
});
