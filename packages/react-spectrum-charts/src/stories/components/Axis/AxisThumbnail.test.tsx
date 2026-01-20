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

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AxisThumbnail } from '../../../components';
import {
  allElementsHaveAttributeValue,
  findAllMarksByGroupName,
  findChart,
  getPopoverTriggerButtons,
  render,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { Basic, Popover, YAxis } from './AxisThumbnail.story';
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
});
