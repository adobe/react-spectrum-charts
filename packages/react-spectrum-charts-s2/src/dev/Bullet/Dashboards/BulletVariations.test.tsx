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

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BulletProps, ChartProps } from '../../../types/index.js';
import { stubS2BrowserApis } from '../../dashboardTestUtils.js';
import { PropVariations } from './BulletVariations.story.js';

jest.mock('../../../Chart.js', () => {
  const { Children, isValidElement } = jest.requireActual('react');
  const { Bullet } = jest.requireActual('../../../pre-alpha/index.js');
  return {
    Chart: ({ animations, children, data }: ChartProps) => {
      const bullet = Children.toArray(children).find(
        (child): child is ReactElement<BulletProps> => isValidElement(child) && child.type === Bullet
      );
      return (
        <div
          data-testid="variation-chart"
          data-animations={String(animations)}
          data-rows={data.length}
          data-track={String(Boolean(bullet?.props.track))}
          data-thresholds={bullet?.props.thresholds?.length ?? 0}
        />
      );
    },
  };
});

jest.mock('../../../hooks/useChartProps.js', () => ({
  __esModule: true,
  default: (props: ChartProps) => props,
}));

beforeAll(stubS2BrowserApis);
beforeEach(() => localStorage.clear());

const getCard = (id: string): HTMLElement =>
  document.querySelector(`section[data-variation-id="${id}"]`) as HTMLElement;
const getChart = (id: string): HTMLElement => within(getCard(id)).getByTestId('variation-chart');

test('does not wire animations into bullet charts', () => {
  render(<PropVariations />);
  expect(screen.queryByRole('switch', { name: 'Bullet animations' })).toBeNull();
  screen.getAllByTestId('variation-chart').forEach((chart) => {
    expect(chart.getAttribute('data-animations')).toBe('undefined');
  });
});

test('applies the background view mode only to variations without their own track or thresholds', async () => {
  render(<PropVariations />);
  expect(getChart('defaults').getAttribute('data-track')).toBe('false');
  expect(getChart('defaults').getAttribute('data-thresholds')).toBe('0');

  await userEvent.click(screen.getByRole('radio', { name: 'Track' }));
  expect(getChart('defaults').getAttribute('data-track')).toBe('true');
  expect(getChart('threshold-bar-color-no-thresholds').getAttribute('data-track')).toBe('false');

  await userEvent.click(screen.getByRole('radio', { name: 'Thresholds' }));
  expect(getChart('defaults').getAttribute('data-thresholds')).toBe('3');
  expect(getChart('track').getAttribute('data-thresholds')).toBe('0');
  expect(getChart('track').getAttribute('data-track')).toBe('true');
});

test('switches dashboard datasets without changing fixed-data variations', async () => {
  render(<PropVariations />);
  expect(getChart('defaults').getAttribute('data-rows')).toBe('3');

  await userEvent.click(screen.getByRole('button', { name: /Dataset/ }));
  await userEvent.click(screen.getByRole('option', { name: /Many/ }));
  expect(getChart('defaults').getAttribute('data-rows')).toBe('8');
  expect(getChart('missing-target').getAttribute('data-rows')).toBe('3');
  expect(getChart('empty-state').getAttribute('data-rows')).toBe('0');
});
