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
import React from 'react';

import { Combo } from '../../../alpha';
import { findAllMarksByGroupName, findChart, hoverNthElement, render, screen, within } from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { Basic, DualAxis, Tooltip } from './Combo.story';

describe('Combo', () => {
  // Combo is not a real React component. This test just provides test coverage for sonarqube
  test('Combo pseudo element', () => {
    render(<Combo />);
  });

  test('Basic renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'combo0Bar0');
    expect(bars.length).toEqual(7);

    // get lines
    const lines = await findAllMarksByGroupName(chart, 'combo0Line0');
    expect(lines.length).toEqual(1);

    // get axes
    const axes = await screen.findAllByRole('graphics-symbol');
    const axisText = axisTextUtil(axes);
    expect(axisText(0, 'People')).toBeInTheDocument();
    expect(axisText(0, '30')).toBeInTheDocument();
    expect(axisText(1, 'Adoption Rate')).toBeInTheDocument();
    expect(axisText(1, '0.8')).toBeInTheDocument();
  });

  test('Tooltip renders properly', async () => {
    render(<Tooltip {...Tooltip.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'combo0Bar0');
    expect(bars.length).toEqual(7);

    // get lines
    const lines = await findAllMarksByGroupName(chart, 'combo0Line0');
    expect(lines.length).toEqual(1);

    const paths = await findAllMarksByGroupName(chart, 'combo0Line0_hover0');

    // hover and validate all hover components are visible
    await hoverNthElement(paths, 0);
    const tooltip = await screen.findByTestId('rsc-tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(within(tooltip).getByText('Nov 8')).toBeInTheDocument();
  });

  test('Dual Axis renders properly', async () => {
    render(<DualAxis {...DualAxis.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // get bars
    const bars = await findAllMarksByGroupName(chart, 'combo0Bar0');
    expect(bars.length).toEqual(7);

    // get lines
    const lines = await findAllMarksByGroupName(chart, 'combo0Line0');
    expect(lines.length).toEqual(1);

    // get axes
    const axes = await screen.findAllByRole('graphics-symbol');
    const axisText = axisTextUtil(axes);
    expect(axisText(0, 'People')).toBeInTheDocument();
    expect(axisText(0, '30')).toBeInTheDocument();
    expect(axisText(1, 'Total')).toBeInTheDocument();
    expect(axisText(1, '130')).toBeInTheDocument();
  });

  const axisTextUtil = (axes: HTMLElement[]) => (index: number, text: string) => within(axes[index]).getByText(text);
});
