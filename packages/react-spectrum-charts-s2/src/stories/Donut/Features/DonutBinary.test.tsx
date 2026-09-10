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
import { spectrum2Colors } from '@spectrum-charts/themes';

import { findAllMarksByGroupName, findChart, render, screen } from '../../../test-utils';
import { Binary, Boolean } from './DonutBinary.story';

describe('DonutBinary', () => {
  // Boolean renders two charts: positive (green primary) and negative (red primary, reversed data)
  test('Boolean renders each chart\'s primary segment with its own explicit color', async () => {
    render(<Boolean {...Boolean.args} />);
    const [positiveChart, negativeChart] = await screen.findAllByRole('graphics-document');
    const positiveSegments = await findAllMarksByGroupName(positiveChart, 'donut0');
    const negativeSegments = await findAllMarksByGroupName(negativeChart, 'donut0');
    expect(positiveSegments[0]).toHaveAttribute('fill', spectrum2Colors.light['green-800']);
    expect(negativeSegments[0]).toHaveAttribute('fill', spectrum2Colors.light['red-800']);
  });

  test('Boolean forces the secondary segment to secondary-gray in both charts', async () => {
    render(<Boolean {...Boolean.args} />);
    const [positiveChart, negativeChart] = await screen.findAllByRole('graphics-document');
    const positiveSegments = await findAllMarksByGroupName(positiveChart, 'donut0');
    const negativeSegments = await findAllMarksByGroupName(negativeChart, 'donut0');
    expect(positiveSegments[1]).toHaveAttribute('fill', spectrum2Colors.light['gray-400']);
    expect(negativeSegments[1]).toHaveAttribute('fill', spectrum2Colors.light['gray-400']);
  });

  test('Binary renders the primary segment using the normal categorical color scheme', async () => {
    render(<Binary {...Binary.args} />);
    const chart = await findChart();
    const segments = await findAllMarksByGroupName(chart, 'donut0');
    expect(segments[0]).toHaveAttribute('fill', spectrum2Colors.light['categorical-600']);
  });

  test('Binary forces the secondary segment to secondary-gray even with the normal color scheme', async () => {
    render(<Binary {...Binary.args} />);
    const chart = await findChart();
    const segments = await findAllMarksByGroupName(chart, 'donut0');
    expect(segments[1]).toHaveAttribute('fill', spectrum2Colors.light['gray-400']);
  });

  test('Binary renders the primary segment value as a whole-number percent in the center hole', async () => {
    render(<Binary {...Binary.args} />);
    await findChart();
    // isBoolean's summary value format is hardcoded to '.0%' (0 decimals), so 0.883 renders as '88%'
    expect(await screen.findByText('88%')).toBeInTheDocument();
  });

  test('Binary renders the configured summary label', async () => {
    render(<Binary {...Binary.args} />);
    await findChart();
    expect(await screen.findByText('Satisfied')).toBeInTheDocument();
  });
});
