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
import React from 'react';

import { SegmentLabel } from '../../../rc';
import { findChart, render, screen } from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { Basic, Percent, Value, ValueFormat } from './SegmentLabel.story';

describe('SegmentLabel', () => {
  // SegmentLabel is not a real React component. This is test just provides test coverage for sonarqube
  test('SegmentLabel pseudo element', () => {
    render(<SegmentLabel />);
  });

  test('Basic renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const label = await screen.findByText('Chrome');
    expect(label).toBeInTheDocument();
    expect(await screen.findByText('Safari')).toBeInTheDocument();
    expect(await screen.findByText('Other')).toBeInTheDocument();
  });

  test('Percent renders properly', async () => {
    render(<Percent {...Percent.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    expect(screen.getByText('26%')).toBeInTheDocument();
    expect(screen.getByText('17%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  test('Value renders properly', async () => {
    render(<Value {...Value.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    expect(screen.getByText('10,390')).toBeInTheDocument();
    expect(screen.getByText('7,045')).toBeInTheDocument();
    expect(screen.getByText('4,201')).toBeInTheDocument();
  });

  test('Should format segment metric values', async () => {
    render(<ValueFormat {...ValueFormat.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    expect(screen.getByText('10K')).toBeInTheDocument();
    expect(screen.getByText('7K')).toBeInTheDocument();
    expect(screen.getByText('4.2K')).toBeInTheDocument();
  });

  test('Should hide labels for thin segments', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    expect(screen.getByText('Safari')).toBeInTheDocument();
    // unknown has a font size of 0 since it's segment is too thin
    expect(screen.getByText('Unknown')).toHaveAttribute('font-size', '0px');
  });
});

