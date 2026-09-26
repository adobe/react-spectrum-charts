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
} from '../../../../test-utils';
import '../../../../test-utils/__mocks__/matchMedia.mock.js';
import { CustomContent, InspectAndPopover } from './DonutHover.story';

describe('InspectAndPopover', () => {
  test('hovering a segment shows the default swatch, series, and raw value', async () => {
    render(<InspectAndPopover {...InspectAndPopover.args} />);
    const chart = await findChart();
    const segments = await findAllMarksByGroupName(chart, 'donut0');

    await hoverNthElement(segments, 0);
    const inspect = await screen.findByTestId('rsc-tooltip');
    expect(within(inspect).getByText('Chrome')).toBeInTheDocument();
    expect(within(inspect).getByText('10390')).toBeInTheDocument();
    expect(within(inspect).getByTestId('donut-dialog-swatch')).toHaveStyle({
      backgroundColor: segments[0].getAttribute('fill'),
    });
    expect(inspect.querySelector('.rsc-donut-dialog-custom')).not.toBeInTheDocument();
  });

  test('clicking a segment opens a popover with the default content', async () => {
    render(<InspectAndPopover {...InspectAndPopover.args} />);
    const chart = await findChart();
    const segments = await findAllMarksByGroupName(chart, 'donut0');

    await clickNthElement(segments, 4);
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument());
    expect(within(popover).getByText('Other')).toBeInTheDocument();
    expect(within(popover).getByText('4201')).toBeInTheDocument();
    expect(within(popover).getByTestId('donut-dialog-swatch')).toHaveStyle({
      backgroundColor: segments[4].getAttribute('fill'),
    });
    expect(popover.querySelector('.rsc-donut-dialog-custom')).not.toBeInTheDocument();
  });
});

describe('CustomContent', () => {
  test('hovering a segment appends consumer content below the default content', async () => {
    render(<CustomContent {...CustomContent.args} />);
    const chart = await findChart();
    const segments = await findAllMarksByGroupName(chart, 'donut0');

    await hoverNthElement(segments, 0);
    const inspect = await screen.findByTestId('rsc-tooltip');
    expect(within(inspect).getByText('Chrome')).toBeInTheDocument();
    expect(within(inspect).getByText('10390')).toBeInTheDocument();
    expect(within(inspect).getByText('25.7% of all visitors')).toBeInTheDocument();
    expect(within(inspect).getByText('Browser share, May 2025')).toBeInTheDocument();
  });

  test('clicking a segment appends consumer content in the popover', async () => {
    render(<CustomContent {...CustomContent.args} />);
    const chart = await findChart();
    const segments = await findAllMarksByGroupName(chart, 'donut0');

    await clickNthElement(segments, 4);
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument());
    expect(within(popover).getByText('Other')).toBeInTheDocument();
    expect(within(popover).getByText('4201')).toBeInTheDocument();
    expect(within(popover).getByTestId('donut-dialog-swatch')).toHaveStyle({
      backgroundColor: segments[4].getAttribute('fill'),
    });
    expect(within(popover).getByText('10.4% of all visitors')).toBeInTheDocument();
  });
});
