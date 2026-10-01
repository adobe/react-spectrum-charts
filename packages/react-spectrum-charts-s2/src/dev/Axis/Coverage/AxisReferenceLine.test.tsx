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

import { spectrum2Colors } from '@spectrum-charts/themes';

import { ReferenceLine } from '../../../components/ReferenceLine';
import { findChart, findMarksByGroupName, render } from '../../../test-utils';
import { Basic, Label } from './AxisReferenceLine.story';

describe('AxisReferenceLine', () => {
  // Axis is not a real React component. This test just provides test coverage for sonarqube
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

  test('Reference line uses fixed S2 content neutral color', async () => {
    render(<Basic {...Basic.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const axisReferenceLine = await findMarksByGroupName(chart, 'axis0ReferenceLine0', 'line');
    expect(axisReferenceLine).toBeInTheDocument();
    expect(axisReferenceLine).toHaveAttribute('stroke', spectrum2Colors.light['gray-800']);
  });

  test('Label should display a custom label', async () => {
    render(<Label {...Label.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const labelMark = await findMarksByGroupName(chart, 'axis0ReferenceLine0_label', 'text');
    expect(labelMark).toBeInTheDocument();
  });
});
