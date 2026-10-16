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
import { Provider } from '@react-spectrum/s2';
import { render as renderWithWrapper } from '@testing-library/react';

import { FADE_FACTOR } from '@spectrum-charts/core-s2/constants';
import { sequentialCerulean5 } from '@spectrum-charts/core-s2/tokens';

import { Chart } from '../../../Chart.js';
import { Donut, DonutSummary } from '../../../components/index.js';
import {
  allElementsHaveAttributeValue,
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  screen,
  waitFor,
} from '../../../test-utils/index.js';
import { SemicircleBoolean, SemicircleOrdinal } from './DonutSemicircleVariants.story.js';

describe('DonutSemicircle', () => {
  test.each([false, true])('hides small deltas and restores them on resize without recreating the mark: isBoolean=%s', async (isBoolean) => {
    const data = [{ id: 'Complete', value: 0.68 }, { id: 'Remaining', value: 0.32 }];
    const mark = (
      <Donut color="id" metric="value" variant="semicircle" isBoolean={isBoolean}>
        <DonutSummary delta={0.025} />
      </Donut>
    );
    const { rerender } = renderWithWrapper(
      <Chart data={data} width={140} height={140} animations={false}>
        {mark}
      </Chart>,
      { wrapper: Provider }
    );
    await findChart();
    const delta = screen.getByText('+2.5%');
    expect(delta).toHaveAttribute('font-size', '0px');

    rerender(
      <Chart data={data} width={220} height={220} animations={false}>
        {mark}
      </Chart>
    );
    await waitFor(() => expect(delta).toHaveAttribute('font-size', '16px'));
    expect(delta.isConnected).toBe(true);

    rerender(
      <Chart data={data} width={140} height={140} animations={false}>
        {mark}
      </Chart>
    );
    await waitFor(() => expect(delta).toHaveAttribute('font-size', '0px'));
    expect(delta.isConnected).toBe(true);
  });

  test('passes hideValue to the boolean DonutSummary', async () => {
    render(<SemicircleBoolean {...SemicircleBoolean.args} hideValue />);
    await findChart();

    expect(screen.queryByText('68%')).not.toBeInTheDocument();
    expect(screen.getByText('Success rate')).toBeInTheDocument();
  });

  test.each([
    { Story: SemicircleBoolean, label: 'Success rate', value: '68%' },
    { Story: SemicircleOrdinal, label: 'Responses', value: '100' },
  ])('renders the value, label, and delta for $label', async ({ Story, label, value }) => {
    render(<Story {...Story.args} delta={0.025} />);
    await findChart();

    expect(screen.getByText(value)).not.toHaveAttribute('font-size', '0px');
    expect(screen.getByText(label)).not.toHaveAttribute('font-size', '0px');
    expect(screen.getByText('+2.5%')).not.toHaveAttribute('font-size', '0px');
  });

  test('retains the label and delta when the value is hidden', async () => {
    render(<SemicircleBoolean {...SemicircleBoolean.args} delta={-0.074} hideValue />);
    await findChart();

    expect(screen.queryByText('68%')).not.toBeInTheDocument();
    expect(screen.getByText('Success rate')).not.toHaveAttribute('font-size', '0px');
    expect(screen.getByText('\u22127.4%')).not.toHaveAttribute('font-size', '0px');
  });

  test('keeps ordinal responses in source order with a light-to-dark sequential palette', async () => {
    render(<SemicircleOrdinal {...SemicircleOrdinal.args} />);
    const chart = await findChart();
    const segments = await findAllMarksByGroupName(chart, 'donut0');

    expect(segments.map((segment) => segment.getAttribute('fill'))).toEqual([
      sequentialCerulean5[1],
      sequentialCerulean5[0],
      ...sequentialCerulean5.slice(2),
    ]);
  });

  test('hovering a semicircle segment fades the other segments', async () => {
    render(<SemicircleOrdinal {...SemicircleOrdinal.args} />);
    const chart = await findChart();
    const segments = await findAllMarksByGroupName(chart, 'donut0');

    await hoverNthElement(segments, 0);
    await waitFor(() => {
      expect(segments[0]).toHaveAttribute('opacity', '1');
      expect(allElementsHaveAttributeValue(segments.slice(1), 'opacity', FADE_FACTOR)).toBe(true);
    });
  });
});
