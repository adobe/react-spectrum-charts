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

import { BarDirectLabelProps, BarProps, ChartProps } from '../../../types/index.js';
import { getDashboardCoverageErrors } from '../../dashboardCoverage.js';
import { stubS2BrowserApis } from '../../dashboardTestUtils.js';
import { DirectLabelRegressions } from './BarVariations.story.js';
import { barDirectLabelRegressions, dashboard } from './barDirectLabel.dashboard.js';

jest.mock('../../../Chart.js', () => ({
  Chart: ({ animationTypes, children, data, renderer, width }: ChartProps) => (
    <div
      data-testid="label-chart"
      data-animation-types={animationTypes?.join(',')}
      data-renderer={renderer}
      data-width={width}
      data-values={JSON.stringify(data)}
    >
      {children}
    </div>
  ),
}));

jest.mock('../../../components/index.js', () => ({
  Axis: () => null,
  Legend: () => null,
  ChartInspect: () => null,
  Bar: ({ children, orientation = 'vertical', type = 'stacked', trellis }: BarProps) => (
    <div data-testid="label-bar" data-orientation={orientation} data-type={type} data-trellis={trellis}>
      {children}
    </div>
  ),
  BarDirectLabel: ({ position = 'end-outside', overflow, dataKey }: BarDirectLabelProps) => (
    <span data-testid="direct-label" data-position={position} data-overflow={overflow} data-key={dataKey} />
  ),
}));

jest.mock('../../../hooks/useChartProps.js', () => ({
  __esModule: true,
  default: (props: ChartProps) => props,
}));

beforeAll(stubS2BrowserApis);
beforeEach(() => localStorage.clear());

test('covers positions, layouts, collisions, updates and animation baselines with unique cases', () => {
  expect(getDashboardCoverageErrors(dashboard)).toEqual([]);
  expect(barDirectLabelRegressions).toHaveLength(33);
  expect(new Set(barDirectLabelRegressions.map(({ id }) => id)).size).toBe(33);
  render(<DirectLabelRegressions />);
  expect(screen.getAllByTestId('label-chart')).toHaveLength(33);
  const positions = new Set(screen.getAllByTestId('direct-label').map((label) => label.getAttribute('data-position')));
  expect(positions).toEqual(new Set(['start', 'middle', 'end', 'end-outside']));
  expect(screen.getAllByTestId('label-bar').some((bar) => bar.getAttribute('data-trellis') === 'panel')).toBe(true);
});

test('wires animation switches and replay into every regression chart', async () => {
  render(<DirectLabelRegressions />);
  const expectTypes = (types: string) => {
    screen.getAllByTestId('label-chart').forEach((chart) => {
      expect(chart).toHaveAttribute('data-animation-types', types);
    });
  };
  expectTypes('hover,drawIn');
  await userEvent.click(screen.getByRole('switch', { name: 'Bar direct label regressions hover opacity animation' }));
  expectTypes('drawIn');
  await userEvent.click(screen.getByRole('switch', { name: 'Bar direct label regressions draw-in animation' }));
  expectTypes('');
  const firstChart = screen.getAllByTestId('label-chart')[0];
  await userEvent.click(screen.getByRole('button', { name: 'Replay draw-in' }));
  expect(firstChart.isConnected).toBe(false);
  expectTypes('');
});

test('isolates the five animation comparisons and applies size and renderer controls', async () => {
  render(<DirectLabelRegressions />);
  await userEvent.click(screen.getByRole('radio', { name: 'Animation comparisons' }));
  expect(screen.getAllByTestId('label-chart')).toHaveLength(5);
  await userEvent.click(screen.getByRole('radio', { name: 'XS (160px container)' }));
  await userEvent.click(screen.getByRole('radio', { name: 'Canvas' }));
  screen.getAllByTestId('label-chart').forEach((chart) => {
    expect(chart).toHaveAttribute('data-width', '160');
    expect(chart).toHaveAttribute('data-renderer', 'canvas');
  });
});

test('updates values and selected rows without replacing the chart', async () => {
  render(<DirectLabelRegressions />);
  const toggle = screen.getByRole('button', { name: 'Toggle values and selection' });
  const chart = toggle.parentElement?.querySelector('[data-testid="label-chart"]');
  expect(chart).toBeDefined();
  const before = chart?.getAttribute('data-values');
  await userEvent.click(toggle);
  expect(chart?.isConnected).toBe(true);
  expect(chart?.getAttribute('data-values')).not.toBe(before);
});
