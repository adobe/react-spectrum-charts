/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { spectrumColors } from '@spectrum-charts/themes';

import { Donut } from '../../../rc/components/Donut';
import { allElementsHaveAttributeValue, findAllMarksByGroupName, findChart, render, screen } from '../../../test-utils';
import { Basic, EmptyState } from './Donut.story';

describe('Donut', () => {
  // Donut is not a real React component. This is test just provides test coverage for sonarqube
  test('Donut pseudo element', () => {
    render(<Donut />);
  });

  test('Basic renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // donut data has 7 segments
    const bars = await findAllMarksByGroupName(chart, 'donut0');
    expect(bars.length).toEqual(7);

    // empty state ring should be hidden since there is data
    const emptyStateRings = await findAllMarksByGroupName(chart, 'donut0_emptyState');
    expect(allElementsHaveAttributeValue(emptyStateRings, 'opacity', '0')).toBe(true);
  });

  test('EmptyState renders a gray ring with the value in the center when all values are 0', async () => {
    render(<EmptyState {...EmptyState.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // the empty state ring should be visible and gray-200
    const emptyStateRings = await findAllMarksByGroupName(chart, 'donut0_emptyState');
    expect(emptyStateRings.length).toEqual(1);
    expect(emptyStateRings[0]).toHaveAttribute('fill', spectrumColors.light['gray-200']);
    expect(emptyStateRings[0]).toHaveAttribute('opacity', '1');

    // the donut segments should be hidden
    const segments = await findAllMarksByGroupName(chart, 'donut0');
    expect(allElementsHaveAttributeValue(segments, 'opacity', '0')).toBe(true);

    // the summary value should display 0
    expect(await screen.findByText('0')).toBeInTheDocument();
    expect(screen.getByText('Visitors')).toBeInTheDocument();

    // no NaN segment labels should be displayed
    expect(screen.queryAllByText(/NaN/)).toHaveLength(0);
  });
});
