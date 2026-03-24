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

import { FADE_FACTOR } from '@spectrum-charts/constants';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AxisThumbnail } from '../../../components';
import {
  allElementsHaveAttributeValue,
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  getPopoverTriggerButtons,
  render,
  hoverNthElement,
  within,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
// Mock Image so that Vega's image loading completes immediately in jsdom.
import '../../../test-utils/__mocks__/image.mock.js';
import {
  Basic,
  DodgedBarWithThumbnailPopover,
  DodgedBarWithTooltips,
  Popover,
  WithThumbnailPopover,
  YAxis,
  YAxisWithTooltip,
} from './AxisThumbnail.story';
import { Resizable } from './AxisThumbnailResize.story';

describe('AxisThumbnail', () => {
  // AxisThumbnail is not a real React component. This is test just provides test coverage for sonarqube
  test('AxisThumbnail pseudo element', () => {
    render(<AxisThumbnail />);
  });

  test('Basic renders properly', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // Check that thumbnail icons are drawn to the chart
    const thumbnailMarks = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    expect(thumbnailMarks).toHaveLength(5);
  });

  test('Thumbnail is hidden when width is too small', async () => {
    render(<Basic {...Basic.args} width={100} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // Check that thumbnail icons have 0 opacity
    const thumbnailMarks = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    expect(thumbnailMarks).toHaveLength(5);
    expect(allElementsHaveAttributeValue(thumbnailMarks, 'opacity', 0)).toBe(true);
  });

  test('YAxis renders properly', async () => {
    render(<YAxis {...YAxis.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // Check that thumbnail icons are drawn to the chart
    const thumbnailMarks = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    expect(thumbnailMarks).toHaveLength(5);
  });

  test('Resizable renders properly', async () => {
    render(<Resizable {...Resizable.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const thumbnailMarks = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    expect(thumbnailMarks).toHaveLength(5);
  });

  test('AxisThumbnail popover flicker regression', async () => {
    render(<Popover {...Popover.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const initialThumbnails = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    expect(initialThumbnails.length).toBeGreaterThan(0);

    const popoverButtons = getPopoverTriggerButtons(chart);
    expect(popoverButtons.length).toBeGreaterThan(0);
    await userEvent.click(popoverButtons[0]);

    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument());

    // shouldn't close the popover
    await userEvent.click(popover);
    expect(popover).toBeInTheDocument();

    // should close the popover
    await userEvent.click(chart);
    await waitFor(() => expect(popover).not.toBeInTheDocument());

    // Flicker regression: axis thumbnail <image> nodes should not be torn down/recreated by popover interactions.
    for (const node of initialThumbnails) {
      expect(node.isConnected).toBe(true);
    }
  });

  test('YAxisWithTooltip shows tooltip on thumbnail hover', async () => {
    render(<YAxisWithTooltip {...YAxisWithTooltip.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // Get thumbnail marks
    const thumbnailMarks = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    expect(thumbnailMarks.length).toBeGreaterThan(0);
    // Hover over first thumbnail
    await hoverNthElement(thumbnailMarks, 0);
    const tooltip = await screen.findByTestId('rsc-tooltip');
    expect(tooltip).toBeInTheDocument();

    // Verify tooltip content contains expected data
    const tooltipContent = within(tooltip);
    expect(tooltipContent.getByText(/Browser:/)).toBeInTheDocument();
    expect(tooltipContent.getByText(/Downloads:/)).toBeInTheDocument();

  });

  test('YAxisWithTooltip adjusts bar opacity on thumbnail hover', async () => {
    render(<YAxisWithTooltip {...YAxisWithTooltip.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // Get thumbnail marks
    const thumbnailMarks = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    expect(thumbnailMarks.length).toBeGreaterThan(0);

    let bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toEqual(5);
    expect(allElementsHaveAttributeValue(bars, 'opacity', 1)).toBeTruthy();

    // Hover over first thumbnail
    await hoverNthElement(thumbnailMarks, 0);
    const tooltip = await screen.findByTestId('rsc-tooltip');
    expect(tooltip).toBeInTheDocument();

    bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars[0]).toHaveAttribute('opacity', '1');
    expect(bars[2]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
  });

  test('DodgedBarWithTooltips shows tooltip on thumbnail hover with GROUP_DATA', async () => {
    render(<DodgedBarWithTooltips {...DodgedBarWithTooltips.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // Get thumbnail marks
    const thumbnailMarks = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    expect(thumbnailMarks.length).toBeGreaterThan(0);

    // Hover over first thumbnail
    await hoverNthElement(thumbnailMarks, 0);
    const tooltip = await screen.findByTestId('rsc-tooltip');
    expect(tooltip).toBeInTheDocument();

    // Verify tooltip content contains expected data
    const tooltipContent = within(tooltip);
    expect(tooltipContent.getByText(/Browser:/)).toBeInTheDocument();
    expect(tooltipContent.getByText(/Total Users:/)).toBeInTheDocument();

  });

  test('DodgedBarWithTooltips adjusts bar opacity on thumbnail hover', async () => {
    render(<DodgedBarWithTooltips {...DodgedBarWithTooltips.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // Get thumbnail marks
    const thumbnailMarks = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    expect(thumbnailMarks.length).toBeGreaterThan(0);

    let bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toBeGreaterThan(0);
    expect(allElementsHaveAttributeValue(bars, 'opacity', 1)).toBeTruthy();

    // Hover over first thumbnail
    await hoverNthElement(thumbnailMarks, 0);
    const tooltip = await screen.findByTestId('rsc-tooltip');
    expect(tooltip).toBeInTheDocument();

    bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars[0]).toHaveAttribute('opacity', '1');
    expect(bars[1]).toHaveAttribute('opacity', '1');
    expect(bars[3]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
  });

  test('DodgedBarWithTooltips shows tooltip on bar hover', async () => {
    render(<DodgedBarWithTooltips {...DodgedBarWithTooltips.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // Get bars
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars.length).toBeGreaterThan(0);

    // Hover over first bar
    await hoverNthElement(bars, 0);
    const tooltip = await screen.findByTestId('rsc-tooltip');
    expect(tooltip).toBeInTheDocument();

    // Verify tooltip content contains expected data
    const tooltipContent = within(tooltip);
    expect(tooltipContent.getByText(/Operating system:/)).toBeInTheDocument();
    expect(tooltipContent.getByText(/Browser:/)).toBeInTheDocument();
    expect(tooltipContent.getByText(/Users:/)).toBeInTheDocument();
  });

  test('With Thumbnail Popover: clicking thumbnail opens popover with correct content', async () => {
    render(<WithThumbnailPopover {...WithThumbnailPopover.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const thumbnailMarks = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    expect(thumbnailMarks.length).toBeGreaterThan(0);

    await clickNthElement(thumbnailMarks, 0);
    
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument());
    expect(within(popover).getByText(/Browser:/)).toBeInTheDocument();
    expect(within(popover).getByText(/Downloads:/)).toBeInTheDocument();
  });

  test('With Thumbnail Popover: clicking thumbnail highlights the corresponding bar', async () => {
    render(<WithThumbnailPopover {...WithThumbnailPopover.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const thumbnailMarks = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    await clickNthElement(thumbnailMarks, 0);
    
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars[0]).toHaveAttribute('opacity', '1');
    expect(bars[1]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
  });

  test('Dodged Bar with Thumbnail Popover: clicking thumbnail opens popover', async () => {
    render(<DodgedBarWithThumbnailPopover {...DodgedBarWithThumbnailPopover.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const thumbnailMarks = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    expect(thumbnailMarks.length).toBeGreaterThan(0);

    await clickNthElement(thumbnailMarks, 0);
    
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument());
    expect(within(popover).getByText(/Browser:/)).toBeInTheDocument();
  });

  test('Dodged Bar with Thumbnail Popover: clicking thumbnail highlights the corresponding bar', async () => {
    render(<DodgedBarWithThumbnailPopover {...DodgedBarWithThumbnailPopover.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const thumbnailMarks = await findAllMarksByGroupName(chart, 'axis0AxisThumbnail0', 'image');
    await clickNthElement(thumbnailMarks, 0);
    
    const bars = await findAllMarksByGroupName(chart, 'bar0');
    expect(bars[0]).toHaveAttribute('opacity', '1');
    expect(bars[1]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
  });

});
