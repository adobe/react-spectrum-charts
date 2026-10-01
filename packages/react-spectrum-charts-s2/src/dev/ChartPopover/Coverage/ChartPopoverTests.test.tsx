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
import { spectrum2Colors } from '@spectrum-charts/themes';

import {
  clickNthElement,
  findChart,
  getAllMarksByGroupName,
  render,
  screen,
  waitFor,
  within,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { DodgedBar, DodgedBarHighlightByDimension, Renderer } from './ChartPopoverTests.story';

describe('ChartPopover tests', () => {
  test('Renders properly on canvas', async () => {
    render(<Renderer {...Renderer.args} renderer="canvas" />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('Renders properly in svg', async () => {
    render(<Renderer {...Renderer.args} renderer="svg" />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('Dodged bar popover opens on mark click and closes when clicking outside', async () => {
    render(<DodgedBar {...DodgedBar.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    let bars = getAllMarksByGroupName(chart, 'bar0');

    // clicking the bar should open the popover
    await clickNthElement(bars, 4);
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument()); // waitFor to give the popover time to make sure it doesn't close

    // check the content of the popover
    expect(within(popover).getByText('Operating system: Mac')).toBeInTheDocument();
    expect(within(popover).getByText('Browser: Firefox')).toBeInTheDocument();
    expect(within(popover).getByText('Users: 3')).toBeInTheDocument();

    bars = getAllMarksByGroupName(chart, 'bar0');

    // validate the highlight visuals are present -- opacity is now animated, so it settles asynchronously
    await waitFor(() => {
      expect(bars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
      expect(bars[4]).toHaveAttribute('opacity', '1');
    });
    expect(bars[4]).toHaveAttribute('stroke', spectrum2Colors.light['static-blue']);
    expect(bars[4]).toHaveAttribute('stroke-width', '2');
  });

  test('Dodged bar popover opens on dimension click and closes when clicking outside', async () => {
    render(<DodgedBarHighlightByDimension {...DodgedBarHighlightByDimension.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    let bars = getAllMarksByGroupName(chart, 'bar0');

    // clicking the bar should open the popover
    await clickNthElement(bars, 4);
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument()); // waitFor to give the popover time to make sure it doesn't close

    // check the content of the popover
    expect(within(popover).getByText('Operating system: Mac')).toBeInTheDocument();
    expect(within(popover).getByText('Browser: Firefox')).toBeInTheDocument();
    expect(within(popover).getByText('Users: 3')).toBeInTheDocument();

    bars = getAllMarksByGroupName(chart, 'bar0');

    // validate the highlight visuals are present -- opacity is now animated, so it settles asynchronously
    await waitFor(() => {
      expect(bars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
      expect(bars[4]).toHaveAttribute('opacity', '1');
    });

    const selectionRingMarks = getAllMarksByGroupName(chart, 'bar0_selectionRing');

    expect(selectionRingMarks).toHaveLength(3);
    expect(selectionRingMarks[0]).toHaveAttribute('stroke', spectrum2Colors.light['static-blue']);
    expect(selectionRingMarks[1]).toHaveAttribute('stroke', spectrum2Colors.light['static-blue']);
    expect(selectionRingMarks[2]).toHaveAttribute('stroke', spectrum2Colors.light['static-blue']);
    expect(selectionRingMarks[0]).toHaveAttribute('stroke-width', '2');
    expect(selectionRingMarks[1]).toHaveAttribute('stroke-width', '2');
    expect(selectionRingMarks[2]).toHaveAttribute('stroke-width', '2');
  });
});
