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
import { Combo } from '../../pre-alpha/components/Combo';
import { findAllMarksByGroupName, findChart, hoverNthElement, render, screen, within } from '../../test-utils';
import { Basic } from './Features/ComboBasic.story';
import { DualAxis } from './Features/DualAxis/ComboDualAxis.story';
import { Inspect } from './Features/Inspect/ComboInspect.story';

describe('Combo', () => {
  // Combo is not a real React component. This test just provides test coverage for sonarqube
  test('Combo pseudo element', () => {
    render(<Combo />);
  });

  test('Basic renders a bar and a line mark', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const bars = await findAllMarksByGroupName(chart, 'combo0Bar0');
    expect(bars.length).toEqual(7);

    const lines = await findAllMarksByGroupName(chart, 'combo0Line0');
    expect(lines.length).toEqual(1);
  });

  test('DualAxis renders each mark against its own named axis', async () => {
    render(<DualAxis {...DualAxis.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    expect(await screen.findByText('People')).toBeInTheDocument();
    expect(await screen.findByText('Total')).toBeInTheDocument();

    const bars = await findAllMarksByGroupName(chart, 'combo0Bar0');
    expect(bars.length).toEqual(7);
  });

  test('Inspect shows each child mark\'s own inspect content on hover', async () => {
    render(<Inspect {...Inspect.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const bars = await findAllMarksByGroupName(chart, 'combo0Bar0');
    await hoverNthElement(bars, 0);
    const inspect = await screen.findByTestId('rsc-tooltip');
    expect(inspect).toBeInTheDocument();
    expect(within(inspect).getByText('People: 10')).toBeInTheDocument();
  });
});
