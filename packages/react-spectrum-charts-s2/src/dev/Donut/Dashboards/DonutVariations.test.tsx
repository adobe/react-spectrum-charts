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
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DONUT_BASE_PADDING } from '@spectrum-charts/core-s2/constants';

import { ChartProps } from '../../../types/index.js';
import { stubS2BrowserApis } from '../../dashboardTestUtils.js';
import { PropVariations } from './DonutVariations.story.js';

jest.mock('../../../Chart.js', () => ({
  Chart: ({ animations, animationTypes, height, minHeight, minWidth, width }: ChartProps) => (
    <div
      data-testid="variation-chart"
      data-animations={String(animations)}
      data-animation-types={animationTypes?.join(',')}
      data-height={height}
      data-min-height={minHeight}
      data-min-width={minWidth}
      data-width={width}
    />
  ),
}));

jest.mock('../../../hooks/useChartProps.js', () => ({
  __esModule: true,
  default: (props: ChartProps) => props,
}));

beforeAll(stubS2BrowserApis);
beforeEach(() => localStorage.clear());

test.each([
  { label: 'XS', diameter: 60, width: 80 },
  { label: 'S', diameter: 120, width: 140 },
  { label: 'M', diameter: 200, width: 220 },
  { label: 'L', diameter: 280, width: 300 },
  { label: 'XL', diameter: 400, width: 420 },
])('uses the $label width preset for both variants', async ({ label, diameter, width }) => {
  const { container } = render(<PropVariations />);
  await userEvent.click(screen.getByRole('radio', { name: `${label} (${width}px width)` }));

  expect(screen.getByRole('slider', { name: 'Container width (px)' })).toHaveValue(String(width));
  expect(screen.getByText(`Full-circle diameter: ${diameter}px;`, { exact: false })).toBeInTheDocument();
  const circle = container.querySelector('[data-variation-id="defaults"] [data-testid="variation-chart"]');
  const semicircle = container.querySelector('[data-variation-id="semicircle"] [data-testid="variation-chart"]');
  expect(circle?.parentElement).toHaveStyle({ width: '100%', minWidth: '0' });
  expect(semicircle?.parentElement).toHaveStyle({ width: '100%', minWidth: '0' });
  expect(circle?.closest('[data-variation-id]')?.parentElement).toHaveStyle({
    gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${width + 2}px), ${width + 2}px))`,
  });
  expect(circle).toHaveAttribute('data-width', 'auto');
  expect(semicircle).toHaveAttribute('data-width', 'auto');
  expect(circle).toHaveAttribute('data-height', String(width));
  expect(semicircle).toHaveAttribute('data-height', String(width / 2 + DONUT_BASE_PADDING));
  expect(semicircle).toHaveAttribute('data-min-height', '0');
  expect(semicircle).toHaveAttribute('data-min-width', '0');
});

test.each(['Direct labels', 'Advanced labels'])('applies the label-adjusted width in %s mode', async (viewMode) => {
  const { container } = render(<PropVariations />);
  await userEvent.click(screen.getByRole('radio', { name: 'S (140px width)' }));
  await userEvent.click(screen.getByRole('radio', { name: viewMode }));

  expect(screen.getByRole('slider', { name: 'Container width (px)' })).toHaveValue('206');
  expect(screen.getByText('Full-circle diameter: 120px;', { exact: false })).toBeInTheDocument();
  const circle = container.querySelector('[data-variation-id="defaults"] [data-testid="variation-chart"]');
  const semicircle = container.querySelector('[data-variation-id="semicircle"] [data-testid="variation-chart"]');
  expect(circle?.parentElement).toHaveStyle({ width: '100%', minWidth: '0' });
  expect(semicircle?.parentElement).toHaveStyle({ width: '100%', minWidth: '0' });
  expect(circle?.closest('[data-variation-id]')?.parentElement).toHaveStyle({
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 208px), 208px))',
  });
  expect(circle).toHaveAttribute('data-height', '206');
  expect(semicircle).toHaveAttribute('data-height', String(103 + DONUT_BASE_PADDING));
});

test('keeps slider widths and preset selection in sync', async () => {
  const { container } = render(<PropVariations />);
  const slider = screen.getByRole('slider', { name: 'Container width (px)' });
  const small = screen.getByRole('radio', { name: 'S (140px width)' });
  const medium = screen.getByRole('radio', { name: 'M (220px width)' });
  const semicircle = container.querySelector('[data-variation-id="semicircle"] [data-testid="variation-chart"]');
  const grid = semicircle?.closest('[data-variation-id]')?.parentElement;

  await userEvent.click(small);
  expect(slider).toHaveValue('140');
  expect(small).toHaveAttribute('aria-checked', 'true');
  expect(grid).toHaveStyle({
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 142px), 142px))',
  });

  fireEvent.change(slider, { target: { value: '220' } });
  expect(medium).toHaveAttribute('aria-checked', 'true');
  expect(small).toHaveAttribute('aria-checked', 'false');
  expect(grid).toHaveStyle({
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 222px), 222px))',
  });
  expect(semicircle).toHaveAttribute('data-height', String(110 + DONUT_BASE_PADDING));

  fireEvent.change(slider, { target: { value: '180' } });
  expect(small).toHaveAttribute('aria-checked', 'true');
  expect(medium).toHaveAttribute('aria-checked', 'false');
  expect(grid).toHaveStyle({
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 182px), 182px))',
  });
  expect(semicircle).toHaveAttribute('data-height', String(90 + DONUT_BASE_PADDING));

  await userEvent.click(small);
  expect(slider).toHaveValue('140');
  expect(grid).toHaveStyle({
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 142px), 142px))',
  });
  expect(semicircle).toHaveAttribute('data-height', String(70 + DONUT_BASE_PADDING));
});

test('selects the active size range while dragging across every breakpoint in both directions', () => {
  render(<PropVariations />);
  const slider = screen.getByRole('slider', { name: 'Container width (px)' });
  const cases = [
    { width: 80, label: 'XS' },
    { width: 139, label: 'XS' },
    { width: 140, label: 'S' },
    { width: 219, label: 'S' },
    { width: 220, label: 'M' },
    { width: 299, label: 'M' },
    { width: 300, label: 'L' },
    { width: 419, label: 'L' },
    { width: 420, label: 'XL' },
  ];

  for (const { width, label } of [...cases, ...[...cases].reverse()]) {
    fireEvent.change(slider, { target: { value: String(width) } });
    expect(slider).toHaveValue(String(width));
    expect(screen.getByRole('radio', { name: new RegExp(`^${label} \\(`) })).toHaveAttribute('aria-checked', 'true');
  }
});

test.each(['Direct labels', 'Advanced labels'])('uses label-adjusted size ranges in %s mode', async (viewMode) => {
  render(<PropVariations />);
  await userEvent.click(screen.getByRole('radio', { name: 'S (140px width)' }));
  await userEvent.click(screen.getByRole('radio', { name: viewMode }));
  const slider = screen.getByRole('slider', { name: 'Container width (px)' });

  for (const { width, label } of [
    { width: 205, label: 'XS' },
    { width: 206, label: 'S' },
    { width: 207, label: 'S' },
  ]) {
    fireEvent.change(slider, { target: { value: String(width) } });
    expect(slider).toHaveValue(String(width));
    expect(screen.getByRole('radio', { name: new RegExp(`^${label} \\(`) })).toHaveAttribute('aria-checked', 'true');
  }
});

test('wires the dashboard animation toggle into all donut charts while switching datasets', async () => {
  render(<PropVariations />);
  const toggle = screen.getByRole('switch', { name: 'Donut animations' });
  const expectAnimations = (enabled: boolean) => {
    const charts = screen.getAllByTestId('variation-chart');
    expect(charts.length).toBeGreaterThan(1);
    charts.forEach((chart) => {
      expect(chart.getAttribute('data-animations')).toBe(String(enabled));
      expect(chart.getAttribute('data-animation-types')).toBe('hover,drawIn');
    });
  };
  expectAnimations(true);

  await userEvent.click(toggle);
  expectAnimations(false);

  await userEvent.click(screen.getByRole('button', { name: /Dataset/ }));
  await userEvent.click(screen.getAllByRole('option')[1]);
  expectAnimations(false);

  await userEvent.click(toggle);
  expectAnimations(true);
});
