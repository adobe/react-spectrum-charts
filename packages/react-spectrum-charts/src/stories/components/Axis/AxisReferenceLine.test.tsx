/*
 * Copyright 2023 Adobe. All rights reserved.
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

import { spectrumColors } from '@spectrum-charts/themes';

import { ReferenceLine } from '../../../components/ReferenceLine';
import { findChart, findMarksByGroupName, render, screen } from '../../../test-utils';
import { Basic, Color, Icon, IconColor, Label, LabelColor } from './AxisReferenceLine.story';

describe('AxisReferenceLine', () => {
  // Axis is not a real React component. This is test just provides test coverage for sonarqube
  test('Render pseudo element', () => {
    render(<ReferenceLine value={0} />);
  });

  test('Reference line renders', async () => {
    render(<Basic {...Basic.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const axisReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
    expect(axisReferenceLine).toBeInTheDocument();
  });

  test('Reference line gets the correct color', async () => {
    render(<Color {...Color.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const axisReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
    expect(axisReferenceLine).toBeInTheDocument();
    expect(axisReferenceLine).toHaveAttribute('stroke', spectrumColors.light['blue-500']);
  });

  test('Icon renders', async () => {
    render(<Icon {...Icon.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const icon = await findMarksByGroupName(chart, 'axis0ReferenceLine0_symbol');
    expect(icon).toBeInTheDocument();
  });

  test('IconColor should apply the correct color to the label', async () => {
    render(<IconColor {...IconColor.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const icon = await findMarksByGroupName(chart, 'axis0ReferenceLine0_symbol');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('fill', spectrumColors.light['blue-500']);
  });

  test('Label should display a custom label', async () => {
    render(<Label {...Label.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    expect(screen.getByText('Middle')).toBeInTheDocument();
  });

  test('LabelColor should set custom color on label', async () => {
    render(<LabelColor {...LabelColor.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const text = screen.getByText('Positive');

    expect(text).toBeInTheDocument();
    expect(text).toHaveAttribute('fill', spectrumColors.light['green-700']);
  });
});
