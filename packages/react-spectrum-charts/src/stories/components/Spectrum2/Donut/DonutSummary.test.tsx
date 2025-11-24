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
import React from 'react';

import { findChart, render, screen } from '../../../../test-utils';
import '../../../../test-utils/__mocks__/matchMedia.mock.js';
import { Basic } from './DonutSummary.story';

describe('Spectrum2 DonutSummary', () => {
  test('summary value should have font-weight 800 when S2 is true', async () => {
    render(<Basic {...Basic.args} />);
    const metricValue = await screen.findByText('40K');
    expect(metricValue).toHaveAttribute('font-weight', '800');
  });

  test('summary label should be present', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const summaryLabel = await screen.findByText('Visitors');
    expect(summaryLabel).toBeInTheDocument();
  });
});

