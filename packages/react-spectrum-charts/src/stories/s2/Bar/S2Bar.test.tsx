/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { findAllMarksByGroupName, findChart, render } from '../../../test-utils';
import { S2Bar, S2DodgedBar, S2StackedBar } from './S2Bar.story';

describe('s2 Bar styling', () => {
  test('Basic bar renders with s2 corner radius', async () => {
    render(<S2Bar {...S2Bar.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // Find bars and check corner radius
    const bars = await findAllMarksByGroupName(chart, 'bar0', 'rect');
    expect(bars.length).toBeGreaterThan(0);
    
    // S2 bars should have 4px corner radius on top corners
    const firstBar = bars[0];
    expect(firstBar).toHaveAttribute('ry'); // SVG corner radius attribute
  });

  test('Stacked bar renders with s2 corner radius', async () => {
    render(<S2StackedBar {...S2StackedBar.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const bars = await findAllMarksByGroupName(chart, 'bar0', 'rect');
    expect(bars.length).toBeGreaterThan(0);

    // Check that bars have corner radius applied
    const firstBar = bars[0];
    expect(firstBar).toHaveAttribute('ry');
  });

  test('Dodged bar renders with s2 corner radius', async () => {
    render(<S2DodgedBar {...S2DodgedBar.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const bars = await findAllMarksByGroupName(chart, 'bar0', 'rect');
    expect(bars.length).toBeGreaterThan(0);

    // Check that bars have corner radius applied
    const firstBar = bars[0];
    expect(firstBar).toHaveAttribute('ry');
  });
});

