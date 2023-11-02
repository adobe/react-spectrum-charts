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
import React from 'react';

import { HIGHLIGHT_CONTRAST_RATIO } from '@constants';
import '@matchMediaMock';
import { ChartPopover } from '@rsc';
import {
	clickNthElement,
	findAllMarksByGroupName,
	findChart,
	findMarksByGroupName,
	getAllMarksByGroupName,
	render,
	screen,
	waitFor,
	within,
} from '@test-utils';
import userEvent from '@testing-library/user-event';

import { Canvas, DodgedBarChart, LineChart, StackedBarChart, Svg } from './ChartPopover.story';

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
		expect(bars[1]).toHaveAttribute('fill-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(bars[1]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(bars[0]).toHaveAttribute('fill-opacity', '1');
		expect(bars[0]).toHaveAttribute('stroke', 'rgb(20, 115, 230)');
		expect(bars[0]).toHaveAttribute('stroke-opacity', '1');
		expect(bars[0]).toHaveAttribute('stroke-width', '2');
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
		const highlightPoint = await findMarksByGroupName(chart, 'line0_point');
		expect(highlightPoint).toBeInTheDocument();

		// click on chart which should hide the popover and the highlight visuals
		await userEvent.click(chart);
		await waitFor(() => expect(popover).not.toBeInTheDocument());
		expect(highlightRule).not.toBeInTheDocument();
		expect(highlightPoint).not.toBeInTheDocument();
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
		expect(bars[0]).toHaveAttribute('fill-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(bars[0]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(bars[4]).toHaveAttribute('fill-opacity', '1');
		expect(bars[4]).toHaveAttribute('stroke', 'rgb(20, 115, 230)');
		expect(bars[4]).toHaveAttribute('stroke-opacity', '1');
		expect(bars[4]).toHaveAttribute('stroke-width', '2');
	});
});
