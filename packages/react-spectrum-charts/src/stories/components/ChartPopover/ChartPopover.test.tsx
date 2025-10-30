/*
 * Copyright 2023 Adobe. All rights reserved.
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

import { FADE_FACTOR } from '@spectrum-charts/constants';
import { spectrumColors } from '@spectrum-charts/themes';

import { ChartPopover } from '../../../components';
import {
  allElementsHaveAttributeValue,
  clickNthElement,
  findAllMarksByGroupName,
  findChart,
  findMarksByGroupName,
  getAllMarksByGroupName,
  render,
  rightClickNthElement,
  screen,
  waitFor,
  within,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import {
  Canvas,
  ContentMargin,
  DodgedBarChart,
  DonutChart,
  LineChart,
  MinWidth,
  OnOpenChange,
  RightClick,
  Size,
  StackedBarChart,
  Svg,
} from './ChartPopover.story';

describe('ChartPopover', () => {
  // ChartPopover is not a real React component. This is test just provides test coverage for sonarqube
  test('ChartPopover pseudo element', () => {
    render(<ChartPopover />);
  });

  test('Renders properly on canvas', async () => {
    render(<Canvas {...Canvas.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('Renders properly in svg', async () => {
    render(<Svg {...Svg.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
  });

  test('Popover opens on mark click and closes when clicking outside', async () => {
    render(<StackedBarChart {...StackedBarChart.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const bars = getAllMarksByGroupName(chart, 'bar0');

    // clicking the bar should open the popover
    await clickNthElement(bars, 0);
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument()); // waitFor to give the popover time to make sure it doesn't close

    // shouldn't close the popover
    await userEvent.click(popover);
    expect(popover).toBeInTheDocument();

    // should close the popover
    await userEvent.click(chart);
    await waitFor(() => expect(popover).not.toBeInTheDocument());
  });

  test('Esc closes the popover', async () => {
    render(<StackedBarChart {...StackedBarChart.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const bars = getAllMarksByGroupName(chart, 'bar0');

    await clickNthElement(bars, 0);
    const popover = await screen.findByTestId('rsc-popover');

    await userEvent.keyboard('Hello');

    // escape should close the
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(popover).not.toBeInTheDocument());
  });

  test('Content appears in popover', async () => {
    render(<StackedBarChart {...StackedBarChart.args} />);
    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    let bars = getAllMarksByGroupName(chart, 'bar0');

    await clickNthElement(bars, 0);
    const popover = await screen.findByTestId('rsc-popover');
    expect(within(popover).getByText('Users: 5')).toBeInTheDocument();

    bars = getAllMarksByGroupName(chart, 'bar0');
    // validate the highlight visuals are present
    expect(bars[0]).toHaveAttribute('opacity', '1');
    expect(bars[0]).toHaveAttribute('stroke', spectrumColors.light['static-blue']);
    expect(bars[0]).toHaveAttribute('stroke-width', '2');
    // all other bars should be faded
    expect(allElementsHaveAttributeValue(bars.slice(1), 'opacity', FADE_FACTOR)).toBeTruthy();
  });

  test('Popover should be corrrect size', async () => {
    render(<Size {...Size.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const bars = getAllMarksByGroupName(chart, 'bar0');

    // clicking the bar should open the popover
    await clickNthElement(bars, 0);
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument()); // waitFor to give the popover time to make sure it doesn't close

    expect(popover).toHaveStyle('width: 200px; height: 100px; min-width: 0px;');
  });

  test('should honor minWidth', async () => {
    render(<MinWidth {...MinWidth.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const bars = getAllMarksByGroupName(chart, 'bar0');

    // clicking the bar should open the popover
    await clickNthElement(bars, 0);
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument()); // waitFor to give the popover time to make sure it doesn't close

    expect(popover).toHaveStyle('width: auto; min-width: 250px;');
  });

  test('should honor contentMargin', async () => {
    render(<ContentMargin {...ContentMargin.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const bars = getAllMarksByGroupName(chart, 'bar0');

    // clicking the bar should open the popover
    await clickNthElement(bars, 0);
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument()); // waitFor to give the popover time to make sure it doesn't close

    // Check that the View inside the popover has the correct margin
    const view = screen.getByTestId('rsc-popover-content');
    // React Spectrum View applies margin using specific margin-* properties
    expect(view).toHaveStyle({
      marginTop: '24px',
      marginRight: '24px',
      marginBottom: '24px',
      marginLeft: '24px',
    });
  });

  test('should use default contentMargin when not provided', async () => {
    render(<StackedBarChart {...StackedBarChart.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const bars = getAllMarksByGroupName(chart, 'bar0');

    // clicking the bar should open the popover
    await clickNthElement(bars, 0);
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument());

    // Check that the View inside the popover has the default margin of 12px
    const view = screen.getByTestId('rsc-popover-content');
    // React Spectrum View applies margin using specific margin-* properties
    expect(view).toHaveStyle({
      marginTop: '12px',
      marginRight: '12px',
      marginBottom: '12px',
      marginLeft: '12px',
    });
  });

  test('Popover opens on right click, not left click', async () => {
    render(<RightClick {...RightClick.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const bars = getAllMarksByGroupName(chart, 'bar0');

    // left clicking the bar should not open the popover
    await clickNthElement(bars, 0);
    let popover = screen.queryByTestId('rsc-popover');
    await waitFor(() => expect(popover).not.toBeInTheDocument());

    // clicking the bar should open the popover
    await rightClickNthElement(bars, 0);
    popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument()); // waitFor to give the popover time to make sure it doesn't close

    // shouldn't close the popover
    await userEvent.click(popover);
    expect(popover).toBeInTheDocument();

    // should close the popover
    await userEvent.click(chart);
    await waitFor(() => expect(popover).not.toBeInTheDocument());
  });

  test('Line popover opens and closes corectly when clicking on the chart', async () => {
    render(<LineChart {...LineChart.args} />);
    // validate that the line drew
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');
    // click point and verify popover appears correctly
    await clickNthElement(points, 2);
    const popover = await screen.findByTestId('rsc-popover');
    expect(popover).toBeInTheDocument();
    // check the content of the popover
    expect(within(popover).getByText('Operating system: Other')).toBeInTheDocument();
    expect(within(popover).getByText('Browser: Chrome')).toBeInTheDocument();
    expect(within(popover).getByText('Users: 2')).toBeInTheDocument();

    // validate the highlight visuals are present
    const highlightRule = await findMarksByGroupName(chart, 'line0_hoverRule', 'line');
    expect(highlightRule).toBeInTheDocument();
    const highlightPoint = await findMarksByGroupName(chart, 'line0_point_select');
    expect(highlightPoint).toBeInTheDocument();

    // click on chart which should hide the popover and the highlight visuals
    await userEvent.click(chart);
    await waitFor(() => expect(popover).not.toBeInTheDocument());
    expect(highlightRule).not.toBeInTheDocument();
    expect(highlightPoint).not.toBeInTheDocument();
  });

  test('should highlight the selected line by fading other lines', async () => {
    render(<LineChart {...LineChart.args} />);
    // validate that the line drew
    const chart = await findChart();
    expect(chart).toBeInTheDocument();

    // lines should have full opacity
    const lines = await findAllMarksByGroupName(chart, 'line0');
    expect(lines).toHaveLength(3);
    expect(allElementsHaveAttributeValue(lines, 'opacity', 1)).toBeTruthy();

    // click on the first line
    const points = await findAllMarksByGroupName(chart, 'line0_voronoi');
    await clickNthElement(points, 0);

    // validate the first line is still full opacity, but the other lines are faded
    expect(lines[0]).toHaveAttribute('opacity', '1');
    expect(allElementsHaveAttributeValue(lines.slice(1), 'opacity', FADE_FACTOR)).toBeTruthy();
  });

  test('Dodged bar popover opens on mark click and closes when clicking outside', async () => {
    render(<DodgedBarChart {...DodgedBarChart.args} />);

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

    // validate the highlight visuals are present
    expect(bars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
    expect(bars[4]).toHaveAttribute('opacity', '1');
    expect(bars[4]).toHaveAttribute('stroke', spectrumColors.light['static-blue']);
    expect(bars[4]).toHaveAttribute('stroke-width', '2');
  });

  test('Dodged bar popover opens on dimension click and closes when clicking outside', async () => {
    render(<DodgedBarChart {...DodgedBarChart.args} UNSAFE_highlightBy="dimension" />);

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

    // validate the highlight visuals are present
    expect(bars[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
    expect(bars[4]).toHaveAttribute('opacity', '1');

    const selectionRingMarks = getAllMarksByGroupName(chart, 'bar0_selectionRing');

    expect(selectionRingMarks).toHaveLength(3);
    expect(selectionRingMarks[0]).toHaveAttribute('stroke', spectrumColors.light['static-blue']);
    expect(selectionRingMarks[1]).toHaveAttribute('stroke', spectrumColors.light['static-blue']);
    expect(selectionRingMarks[2]).toHaveAttribute('stroke', spectrumColors.light['static-blue']);
    expect(selectionRingMarks[0]).toHaveAttribute('stroke-width', '2');
    expect(selectionRingMarks[1]).toHaveAttribute('stroke-width', '2');
    expect(selectionRingMarks[2]).toHaveAttribute('stroke-width', '2');
  });

  test('should call onClick callback when selecting a legend entry', async () => {
    const onOpenChange = jest.fn();
    render(<OnOpenChange {...OnOpenChange.args} onOpenChange={onOpenChange} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    const bars = getAllMarksByGroupName(chart, 'bar0');

    // clicking the bar should open the popover
    await clickNthElement(bars, 0);
    expect(onOpenChange).toHaveBeenCalledWith(true);

    await userEvent.click(chart);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test('DonutChart', async () => {
    render(<DonutChart {...DonutChart.args} />);

    const chart = await findChart();
    expect(chart).toBeInTheDocument();
    let segments = getAllMarksByGroupName(chart, 'donut0');
    expect(segments).toHaveLength(7);

    // clicking the bar should open the popover
    await clickNthElement(segments, 4);
    const popover = await screen.findByTestId('rsc-popover');
    await waitFor(() => expect(popover).toBeInTheDocument()); // waitFor to give the popover time to make sure it doesn't close

    // check the content of the popover
    expect(within(popover).getByText('Browser: Other')).toBeInTheDocument();
    expect(within(popover).getByText('Visitors: 4201')).toBeInTheDocument();

    segments = getAllMarksByGroupName(chart, 'donut0');

    // validate the highlight visuals are present
    expect(segments[0]).toHaveAttribute('opacity', `${FADE_FACTOR}`);
    expect(segments[4]).toHaveAttribute('opacity', '1');
    expect(segments[4]).toHaveAttribute('stroke', spectrumColors.light['static-blue']);
    expect(segments[4]).toHaveAttribute('stroke-width', '2');
  });
});
