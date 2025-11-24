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
import { Basic, LabelKey, Percent, Value, ValueFormat } from './SegmentLabel.story';

describe('Spectrum2 SegmentLabel', () => {
  test('Basic renders properly with S2 styling', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const label = await screen.findByText('Chrome');
    expect(label).toBeInTheDocument();
    // S2 should NOT have bold font-weight for segment labels
    expect(label).not.toHaveAttribute('font-weight', 'bold');
    // S2 should have fontSize 14 for segment labels
    expect(label).toHaveAttribute('font-size', '14px');
    expect(await screen.findByText('Safari')).toBeInTheDocument();
    expect(await screen.findByText('Other')).toBeInTheDocument();
  });

  test('LabelKey renders properly with S2 styling', async () => {
    render(<LabelKey {...LabelKey.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const label = await screen.findByText('Chrome');
    expect(label).toBeInTheDocument();
    expect(label).not.toHaveAttribute('font-weight', 'bold');
    expect(label).toHaveAttribute('font-size', '14px');
  });

  test('Percent renders properly with S2 styling', async () => {
    render(<Percent {...Percent.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const label = await screen.findByText('Chrome');
    expect(label).toBeInTheDocument();
    expect(label).not.toHaveAttribute('font-weight', 'bold');
    expect(label).toHaveAttribute('font-size', '14px');

    // Percent values should have fontSize 16 and bold font-weight
    const percentValue = await screen.findByText('26%');
    expect(percentValue).toBeInTheDocument();
    expect(percentValue).toHaveAttribute('font-size', '16px');
    expect(percentValue).toHaveAttribute('font-weight', 'bold');
  });

  test('Value renders properly with S2 styling', async () => {
    render(<Value {...Value.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const label = await screen.findByText('Chrome');
    expect(label).toBeInTheDocument();
    expect(label).not.toHaveAttribute('font-weight', 'bold');
    expect(label).toHaveAttribute('font-size', '14px');

    // Value should have fontSize 16 and bold font-weight
    const value = await screen.findByText('10,390');
    expect(value).toBeInTheDocument();
    expect(value).toHaveAttribute('font-size', '16px');
    expect(value).toHaveAttribute('font-weight', 'bold');
  });

  test('Should format segment metric values with S2 styling', async () => {
    render(<ValueFormat {...ValueFormat.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const label = await screen.findByText('Chrome');
    expect(label).toBeInTheDocument();
    expect(label).not.toHaveAttribute('font-weight', 'bold');
    expect(label).toHaveAttribute('font-size', '14px');

    // Formatted value should have fontSize 16 and bold font-weight
    const formattedValue = await screen.findByText('10K');
    expect(formattedValue).toBeInTheDocument();
    expect(formattedValue).toHaveAttribute('font-size', '16px');
    expect(formattedValue).toHaveAttribute('font-weight', 'bold');
  });
});

