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
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DONUT_BASE_PADDING } from '@spectrum-charts/core-s2/constants';

import { ChartProps } from '../../../types/index.js';
import { stubS2BrowserApis } from '../../dashboardTestUtils.js';
import { PropVariations } from './DonutVariations.story.js';

jest.mock('../../../Chart.js', () => ({
  Chart: ({ animationTypes, height, minHeight, minWidth, width }: ChartProps) => (
    <div
      data-testid="variation-chart"
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

const getSizeButton = (variant: 'Full' | 'Semicircle', label: string): HTMLElement =>
  within(screen.getByRole('radiogroup', { name: `${variant} size presets` })).getByRole('radio', {
    name: new RegExp(`^${label} \\(`),
  });

test.each([
  { label: 'XS', diameter: 60, width: 80 },
  { label: 'S', diameter: 120, width: 140 },
  { label: 'M', diameter: 200, width: 220 },
  { label: 'L', diameter: 280, width: 300 },
  { label: 'XL', diameter: 400, width: 420 },
])('uses the $label width preset for both variants', async ({ label, diameter, width }) => {
  const { container } = render(<PropVariations />);
  await userEvent.click(getSizeButton('Full', label));

  expect(screen.getByRole('slider', { name: 'Container width (px)' })).toHaveValue(String(width));
  expect(getSizeButton('Full', label)).toHaveAttribute('aria-checked', 'true');
  expect(getSizeButton('Semicircle', label)).toHaveAttribute('aria-checked', 'true');
  expect(
    screen.getByText(
      `Full-circle diameter: ${diameter}px; both variants fill the container width, with 10px minimum padding on each side.`
    )
  ).toBeInTheDocument();
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

test.each(['Direct labels', 'Advanced labels'])('keeps the container width unchanged in %s mode', async (viewMode) => {
  const { container } = render(<PropVariations />);
  await userEvent.click(getSizeButton('Semicircle', 'S'));
  await userEvent.click(screen.getByRole('radio', { name: viewMode }));

  expect(screen.getByRole('slider', { name: 'Container width (px)' })).toHaveValue('140');
  expect(getSizeButton('Full', 'XS')).toHaveAttribute('aria-checked', 'true');
  expect(getSizeButton('Semicircle', 'S')).toHaveAttribute('aria-checked', 'true');
  const circle = container.querySelector('[data-variation-id="defaults"] [data-testid="variation-chart"]');
  const semicircle = container.querySelector('[data-variation-id="semicircle"] [data-testid="variation-chart"]');
  expect(circle?.parentElement).toHaveStyle({ width: '100%', minWidth: '0' });
  expect(semicircle?.parentElement).toHaveStyle({ width: '100%', minWidth: '0' });
  expect(circle?.closest('[data-variation-id]')?.parentElement).toHaveStyle({
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 142px), 142px))',
  });
  expect(circle).toHaveAttribute('data-height', '140');
  expect(semicircle).toHaveAttribute('data-height', String(70 + DONUT_BASE_PADDING));
});

test('keeps slider widths and preset selection in sync', async () => {
  const { container } = render(<PropVariations />);
  const slider = screen.getByRole('slider', { name: 'Container width (px)' });
  const small = getSizeButton('Semicircle', 'S');
  const medium = getSizeButton('Semicircle', 'M');
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

test.each(['No added labels', 'Direct labels', 'Advanced labels'])('selects the active size range across every breakpoint in %s mode', async (viewMode) => {
  render(<PropVariations />);
  await userEvent.click(screen.getByRole('radio', { name: viewMode }));
  const slider = screen.getByRole('slider', { name: 'Container width (px)' });
  const cases = [
    { width: 80, label: 'XS' },
    { width: 139, label: 'XS' },
    { width: 140, label: 'S' },
    { width: 217, label: 'S' },
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
    expect(getSizeButton('Semicircle', label)).toHaveAttribute('aria-checked', 'true');
    if (viewMode === 'No added labels') {
      expect(getSizeButton('Full', label)).toHaveAttribute('aria-checked', 'true');
    }
  }
});

test.each(['Direct labels', 'Advanced labels'])('preserves custom width and size selection when toggling %s', async (viewMode) => {
  const { container } = render(<PropVariations />);
  const slider = screen.getByRole('slider', { name: 'Container width (px)' });
  const chart = container.querySelector('[data-variation-id="semicircle"] [data-testid="variation-chart"]');
  fireEvent.change(slider, { target: { value: '217' } });
  await userEvent.click(screen.getByRole('radio', { name: viewMode }));
  expect(slider).toHaveValue('217');
  expect(getSizeButton('Full', 'S')).toHaveAttribute('aria-checked', 'true');
  expect(getSizeButton('Semicircle', 'S')).toHaveAttribute('aria-checked', 'true');

  for (const { width, label } of [
    { width: 220, label: 'M' },
    { width: 217, label: 'S' },
  ]) {
    fireEvent.change(slider, { target: { value: String(width) } });
    expect(slider).toHaveValue(String(width));
    expect(getSizeButton('Full', 'S')).toHaveAttribute('aria-checked', 'true');
    expect(getSizeButton('Semicircle', label)).toHaveAttribute('aria-checked', 'true');
  }
  await userEvent.click(screen.getByRole('radio', { name: 'No added labels' }));
  expect(slider).toHaveValue('217');
  expect(getSizeButton('Full', 'S')).toHaveAttribute('aria-checked', 'true');
  expect(getSizeButton('Semicircle', 'S')).toHaveAttribute('aria-checked', 'true');
  expect(chart?.isConnected).toBe(true);
});

test.each(['Direct labels', 'Advanced labels'])('tracks full-circle label-space breakpoints in %s mode', async (viewMode) => {
  render(<PropVariations />);
  await userEvent.click(screen.getByRole('radio', { name: viewMode }));
  const slider = screen.getByRole('slider', { name: 'Container width (px)' });
  expect(slider).toHaveAttribute('min', '80');
  expect(slider).toHaveAttribute('max', '674');
  const cases = [
    { width: 80, label: 'XS' },
    { width: 205, label: 'XS' },
    { width: 206, label: 'S' },
    { width: 343, label: 'S' },
    { width: 344, label: 'M' },
    { width: 471, label: 'M' },
    { width: 472, label: 'L' },
    { width: 673, label: 'L' },
    { width: 674, label: 'XL' },
  ];
  for (const { width, label } of [...cases, ...[...cases].reverse()]) {
    fireEvent.change(slider, { target: { value: String(width) } });
    expect(slider).toHaveValue(String(width));
    expect(getSizeButton('Full', label)).toHaveAttribute('aria-checked', 'true');
  }
});

test.each(['Direct labels', 'Advanced labels'])('sizes the shared container from either row in %s mode', async (viewMode) => {
  const { container } = render(<PropVariations />);
  const chart = container.querySelector('[data-variation-id="semicircle"] [data-testid="variation-chart"]');
  const slider = screen.getByRole('slider', { name: 'Container width (px)' });
  await userEvent.click(screen.getByRole('radio', { name: viewMode }));

  await userEvent.click(getSizeButton('Full', 'M'));
  expect(slider).toHaveValue('344');
  expect(getSizeButton('Full', 'M')).toHaveAttribute('aria-checked', 'true');
  expect(getSizeButton('Semicircle', 'L')).toHaveAttribute('aria-checked', 'true');

  await userEvent.click(getSizeButton('Semicircle', 'M'));
  expect(slider).toHaveValue('220');
  expect(getSizeButton('Full', 'S')).toHaveAttribute('aria-checked', 'true');
  expect(getSizeButton('Semicircle', 'M')).toHaveAttribute('aria-checked', 'true');

  await userEvent.click(getSizeButton('Full', 'S'));
  expect(slider).toHaveValue('206');
  expect(getSizeButton('Full', 'S')).toHaveAttribute('aria-checked', 'true');
  expect(getSizeButton('Semicircle', 'S')).toHaveAttribute('aria-checked', 'true');

  await userEvent.click(getSizeButton('Semicircle', 'S'));
  expect(slider).toHaveValue('140');
  expect(getSizeButton('Full', 'XS')).toHaveAttribute('aria-checked', 'true');
  expect(getSizeButton('Semicircle', 'S')).toHaveAttribute('aria-checked', 'true');
  expect(chart?.isConnected).toBe(true);
});

test('keeps the container width and slider range when switching label modes at XL', async () => {
  render(<PropVariations />);
  const slider = screen.getByRole('slider', { name: 'Container width (px)' });
  await userEvent.click(screen.getByRole('radio', { name: 'Direct labels' }));
  await userEvent.click(getSizeButton('Full', 'XL'));
  expect(slider).toHaveValue('674');

  await userEvent.click(screen.getByRole('radio', { name: 'No added labels' }));
  expect(slider).toHaveValue('674');
  expect(slider).toHaveAttribute('max', '674');
  expect(getSizeButton('Full', 'XL')).toHaveAttribute('aria-checked', 'true');
  expect(getSizeButton('Semicircle', 'XL')).toHaveAttribute('aria-checked', 'true');

  await userEvent.click(getSizeButton('Full', 'XL'));
  expect(slider).toHaveValue('420');
  expect(slider).toHaveAttribute('max', '674');
});

test('wires the dashboard animation toggle into all donut charts while switching datasets', async () => {
  render(<PropVariations />);
  const hover = screen.getByRole('switch', { name: 'Donut hover opacity animation' });
  const drawIn = screen.getByRole('switch', { name: 'Donut draw-in animation' });
  const expectAnimationTypes = (types: string) => {
    const charts = screen.getAllByTestId('variation-chart');
    expect(charts.length).toBeGreaterThan(1);
    charts.forEach((chart) => expect(chart.getAttribute('data-animation-types')).toBe(types));
  };
  expectAnimationTypes('hover,drawIn');

  await userEvent.click(drawIn);
  expectAnimationTypes('hover');

  await userEvent.click(hover);
  expectAnimationTypes('');

  await userEvent.click(screen.getByRole('button', { name: /Dataset/ }));
  await userEvent.click(screen.getAllByRole('option')[1]);
  expectAnimationTypes('');

  await userEvent.click(drawIn);
  expectAnimationTypes('drawIn');

  await userEvent.click(hover);
  expectAnimationTypes('hover,drawIn');
});
