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

import { ChartProps } from '../../../types/index.js';
import { PropVariations } from './DonutVariations.story.js';

jest.mock('../../../Chart.js', () => ({
  Chart: ({ animations, animationTypes }: ChartProps) => (
    <div
      data-testid="variation-chart"
      data-animations={String(animations)}
      data-animation-types={animationTypes?.join(',')}
    />
  ),
}));

jest.mock('../../../hooks/useChartProps.js', () => ({
  __esModule: true,
  default: (props: ChartProps) => props,
}));

test('wires the dashboard animation toggle into all donut charts while switching datasets', () => {
  render(<PropVariations />);
  const toggle = screen.getByRole('checkbox', { name: 'Donut animations' });
  const expectAnimations = (enabled: boolean) => {
    const charts = screen.getAllByTestId('variation-chart');
    expect(charts.length).toBeGreaterThan(1);
    charts.forEach((chart) => {
      expect(chart.getAttribute('data-animations')).toBe(String(enabled));
      expect(chart.getAttribute('data-animation-types')).toBe('hover,drawIn');
    });
  };
  expectAnimations(true);

  fireEvent.click(toggle);
  expectAnimations(false);

  const dataset = screen.getByRole('combobox', { name: 'Donut dataset' });
  if (!(dataset instanceof HTMLSelectElement) || !dataset.options[1]) {
    throw new Error('Expected multiple dashboard datasets');
  }
  fireEvent.change(dataset, { target: { value: dataset.options[1].value } });
  expectAnimations(false);

  fireEvent.click(toggle);
  expectAnimations(true);
});
