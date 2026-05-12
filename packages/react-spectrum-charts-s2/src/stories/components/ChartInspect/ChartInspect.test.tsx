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
import { FADE_FACTOR } from '@spectrum-charts/constants';

import { ChartInspect } from '../../../components';
import {
  allElementsHaveAttributeValue,
  findAllMarksByGroupName,
  findChart,
  findMarksByGroupName,
  getAllMarksByGroupName,
  hoverNthElement,
  render,
  screen,
  unhoverNthElement,
  within,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { DodgedBarChart, LineChart, StackedBarChart } from './ChartInspect.story';

describe('ChartInspect', () => {
  // ChartInspect is not a real React component. This test provides coverage for sonarqube.
  test('ChartInspect pseudo element', () => {
    render(<ChartInspect />);
  });

  test('StackedBarChart renders properly', async () => {
    render(<StackedBarChart {...StackedBarChart.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const bars = await findAllMarksByGroupName(chart, 'bar0');

    await hoverNthElement(bars, 0);
    const inspect = await screen.findByTestId('rsc-tooltip');
    expect(inspect).toBeInTheDocument();
    expect(within(inspect).getByText('Operating system: Windows')).toBeInTheDocument();
    expect(bars[1].getAttribute('opacity')).toEqual(`${FADE_FACTOR}`);

    await unhoverNthElement(bars, 0);
    expect(bars[1].getAttribute('opacity')).toEqual('1');
  });

  test('Line renders properly and hover works as expected', async () => {
    render(<LineChart {...LineChart.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');

    await hoverNthElement(paths, 0);
    const inspect = await screen.findByTestId('rsc-tooltip');
    expect(inspect).toBeInTheDocument();
    expect(within(inspect).getByText('Nov 8')).toBeInTheDocument();

    const highlightRule = await findMarksByGroupName(chart, 'line0_hoverRule', 'line');
    expect(highlightRule).toBeInTheDocument();
    const highlightPoint = await findMarksByGroupName(chart, 'line0_point_highlight');
    expect(highlightPoint).toBeInTheDocument();

    await unhoverNthElement(paths, 0);
    expect(highlightRule).not.toBeInTheDocument();
    expect(highlightPoint).not.toBeInTheDocument();
  });

  test('Dodged bar inspect opens on hover and bar is highlighted correctly', async () => {
    render(<DodgedBarChart {...DodgedBarChart.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const bars = getAllMarksByGroupName(chart, 'bar0');

    await hoverNthElement(bars, 4);
    const inspect = await screen.findByTestId('rsc-tooltip');
    expect(inspect).toBeInTheDocument();

    expect(within(inspect).getByText('Operating system: Mac')).toBeInTheDocument();
    expect(within(inspect).getByText('Browser: Firefox')).toBeInTheDocument();
    expect(within(inspect).getByText('Users: 3')).toBeInTheDocument();

    expect(bars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
    expect(bars[4]).toHaveAttribute('opacity', '1');

    await unhoverNthElement(bars, 4);
    expect(allElementsHaveAttributeValue(bars, 'opacity', 1)).toBeTruthy();
  });
});
