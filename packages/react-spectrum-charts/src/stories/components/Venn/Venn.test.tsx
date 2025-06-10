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
import userEvent from '@testing-library/user-event';

import { Venn } from '../../../alpha';
import {
  allElementsHaveAttributeValue,
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  hoverNthElement,
  render,
  screen,
  within,
} from '../../../test-utils';
import { Basic, WithLegend, WithPopover, WithToolTip } from './Venn.story';

describe('Venn', () => {
  test('Venn pseudo element', () => {
    render(<Venn />);
  });

  test('Basic renders properly without passing props', async () => {
    render(<Basic {...Basic.args} />);
    const chart = await findChart();

    expect(chart).toBeInTheDocument();

    const circles = await findAllMarksByGroupName(chart, 'venn0');
    expect(circles.length).toEqual(2);

    const intersections = await findAllMarksByGroupName(chart, 'venn0_intersections');
    expect(intersections.length).toEqual(1);
  });

  test('WithLegend renders properly', async () => {
    render(<WithLegend {...WithLegend.args} />);
    const chart = await findChart();

    expect(chart).toBeInTheDocument();

    const circles = await findAllMarksByGroupName(chart, 'venn0');
    expect(circles.length).toEqual(4);

    const intersections = await findAllMarksByGroupName(chart, 'venn0_intersections');
    expect(intersections.length).toEqual(5);
  });

  describe('Popover', () => {
    test('should render a popover on click', async () => {
      render(<WithPopover {...WithPopover.args} />);
      const chart = await findChart();

      expect(chart).toBeInTheDocument();

      const circles = await findAllMarksByGroupName(chart, 'venn0');

      await clickNthElement(circles, 0);

      let popover = await screen.findByTestId('rsc-popover');
      expect(within(popover).getByText('Instagram')).toBeInTheDocument();

      const circleStrokes = await findAllMarksByGroupName(chart, 'venn0_circle_strokes')

      expect(circleStrokes[0]).toHaveAttribute('stroke-opacity', '1')

      await userEvent.click(chart);

      const intersections = await findAllMarksByGroupName(chart, 'venn0_intersections');
      await clickNthElement(intersections, 0);

      popover = await screen.findByTestId('rsc-popover');
      expect(within(popover).getByText('Instagram∩TikTok')).toBeInTheDocument();

      const intersectionStrokes = await findAllMarksByGroupName(chart, 'venn0_intersections_strokes')
      expect(intersectionStrokes[0]).toHaveAttribute('stroke-opacity', '1')
    });

    test('should dim unselected circles', async () => {
      render(<WithPopover {...WithPopover.args} />);
      const chart = await findChart();

      expect(chart).toBeInTheDocument();

      const circles = await findAllMarksByGroupName(chart, 'venn0');

      await clickNthElement(circles, 0);

      // Check to make sure all other circles after have lower opacity
      expect(allElementsHaveAttributeValue(circles.slice(1), 'opacity', '0.2')).toBeTruthy();
    });

    test('should dim unselected intersections', async () => {
      render(<WithPopover {...WithPopover.args} />);
      const chart = await findChart();

      expect(chart).toBeInTheDocument();

      const intersections = await findAllMarksByGroupName(chart, 'venn0_intersections');

      await clickNthElement(intersections, 0);

      // Check to make sure all other intersections after have lower opacity
      expect(allElementsHaveAttributeValue(intersections.slice(1), 'opacity', '0.2')).toBeTruthy();
    });
  });

  describe('Tooltip', () => {
    test('should render a tooltip on hover', async () => {
      render(<WithToolTip {...WithToolTip.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const circles = await findAllMarksByGroupName(chart, 'venn0');

      const intersections = await findAllMarksByGroupName(chart, 'venn0_intersections');

      await hoverNthElement(circles, 0);
      let tooltip = await screen.findByTestId('rsc-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(within(tooltip).getByText('Instagram')).toBeInTheDocument();

      await hoverNthElement(circles, 1);
      tooltip = await screen.findByTestId('rsc-tooltip');
      expect(within(tooltip).getByText('TikTok')).toBeInTheDocument();

      await hoverNthElement(intersections, 0);
      tooltip = await screen.findByTestId('rsc-tooltip');
      expect(within(tooltip).getByText('Instagram∩TikTok'));
    });

    test('should highlight hovered circles and intersections', async () => {
      render(<WithToolTip {...WithToolTip.args} />);

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const circles = await findAllMarksByGroupName(chart, 'venn0');

      const intersections = await findAllMarksByGroupName(chart, 'venn0_intersections');

      await hoverNthElement(circles, 0);
      expect(circles[0]).toHaveAttribute('opacity', '1');

      expect(allElementsHaveAttributeValue(circles.slice(1), 'opacity', '0.2')).toBeTruthy();

      await hoverNthElement(intersections, 0);
      expect(intersections[0]).toHaveAttribute('opacity', '1');

      expect(allElementsHaveAttributeValue(intersections.slice(1), 'fill-opacity', '0.2')).toBeTruthy();
    });
  });
});
