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
import { ChartTooltip } from '@rsc';
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
} from '@test-utils';

import { DodgedBarChart, LineChart, StackedBarChart } from './ChartTooltip.story';

describe('ChartTooltip', () => {
	// ChartTooltip is not a real React component. This is test just provides test coverage for sonarqube
	test('ChartTooltip pseudo element', () => {
		render(<ChartTooltip />);
	});

	test('StackedBarChart renders properly', async () => {
		render(<StackedBarChart {...StackedBarChart.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(chart, 'bar0');

		// hover and validate all hover interactions
		await hoverNthElement(bars, 0);
		const tooltip = await screen.findByTestId('rsc-tooltip');
		expect(tooltip).toBeInTheDocument();
		expect(within(tooltip).getByText('Operating system: Windows')).toBeInTheDocument();
		expect(bars[1].getAttribute('opacity')).toEqual(`${1 / HIGHLIGHT_CONTRAST_RATIO}`);

		// unhover and validate the highlights go away
		await unhoverNthElement(bars, 0);
		expect(bars[1].getAttribute('opacity')).toEqual('1');
	});

	test('Line renders properly and hover works as expected', async () => {
		render(<LineChart {...LineChart.args} />);
		// validate chart drew
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get voronoi paths
		const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');

		// hover and validate all hover components are visible
		await hoverNthElement(paths, 0);
		const tooltip = await screen.findByTestId('rsc-tooltip');
		expect(tooltip).toBeInTheDocument();
		expect(within(tooltip).getByText('Nov 7')).toBeInTheDocument();

		const highlightRule = await findMarksByGroupName(chart, 'line0_hoverRule', 'line');
		expect(highlightRule).toBeInTheDocument();
		const highlightPoint = await findMarksByGroupName(chart, 'line0_point');
		expect(highlightPoint).toBeInTheDocument();

		// unhover and validate the highlights go away
		await unhoverNthElement(paths, 0);
		expect(highlightRule).not.toBeInTheDocument();
		expect(highlightPoint).not.toBeInTheDocument();
	});

	test('Dodged bar tooltip opens on hover and bar is highlighted correctly', async () => {
		render(<DodgedBarChart {...DodgedBarChart.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();
		const bars = getAllMarksByGroupName(chart, 'bar0');

		// clicking the bar should open the popover
		await hoverNthElement(bars, 4);
		const tooltip = await screen.findByTestId('rsc-tooltip');
		expect(tooltip).toBeInTheDocument();

		// check the content of the popover
		expect(within(tooltip).getByText('Operating system: Mac')).toBeInTheDocument();
		expect(within(tooltip).getByText('Browser: Firefox')).toBeInTheDocument();
		expect(within(tooltip).getByText('Users: 3')).toBeInTheDocument();

		// validate the highlight visuals are present
		expect(bars[0]).toHaveAttribute('opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(bars[4]).toHaveAttribute('opacity', '1');

		await unhoverNthElement(bars, 4);
		expect(allElementsHaveAttributeValue(bars, 'opacity', 1)).toBeTruthy();
	});
});
