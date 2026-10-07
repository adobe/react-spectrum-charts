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
import {
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  screen,
  waitFor,
  within,
} from '../../../../test-utils/index.js';
import '../../../../test-utils/__mocks__/matchMedia.mock.js';
import { InspectAndPopover } from './DonutHover.story.js';

describe('InspectAndPopover', () => {
  test('hovering a segment shows the default swatch, series, and percent with value', async () => {
    render(<InspectAndPopover {...InspectAndPopover.args} />);
    const chart = await findChart();
    const segments = await findAllMarksByGroupName(chart, 'donut0');

    await hoverNthElement(segments, 0);
    const inspect = await screen.findByTestId('rsc-tooltip');
    expect(within(inspect).getByText('Chrome')).toBeInTheDocument();
    expect(within(inspect).getByText('25.7% (10K)')).toBeInTheDocument();
    expect(within(inspect).getByTestId('donut-dialog-swatch')).toHaveStyle({
      backgroundColor: segments[0].getAttribute('fill'),
    });
  });

  test('clicking a segment opens a popover with the default content', async () => {
    render(<InspectAndPopover {...InspectAndPopover.args} />);
    const chart = await findChart();
    const segments = await findAllMarksByGroupName(chart, 'donut0');

    await clickNthElement(segments, 4);
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument());
    expect(within(popover).getByText('Other')).toBeInTheDocument();
    expect(within(popover).getByText('10.4% (4.2K)')).toBeInTheDocument();
    expect(within(popover).getByTestId('donut-dialog-swatch')).toHaveStyle({
      backgroundColor: segments[4].getAttribute('fill'),
    });
  });
});
