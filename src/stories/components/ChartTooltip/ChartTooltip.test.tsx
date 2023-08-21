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

import { HIGHLIGHT_CONTRAST_RATIO } from '@constants';
import '@matchMediaMock';
import { ChartTooltip } from '@prism';
import {
	findAllMarksByGroupName,
	findMarksByGroupName,
	findPrism,
	getAllMarksByGroupName,
	hoverNthElement,
	unhoverNthElement,
} from '@test-utils';
import { render, screen, within } from '@testing-library/react';
import React from 'react';

import { DodgedBarChart, LineChart, StackedBarChart } from './ChartTooltip.story';

describe('ChartTooltip', () => {
	// ChartTooltip is not a real React component. This is test just provides test coverage for sonarqube
	test('ChartTooltip pseudo element', () => {
		render(<ChartTooltip />);
	});

	test('StackedBarChart renders properly', async () => {
		render(<StackedBarChart {...StackedBarChart.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(prism, 'rect0');

		// hover and validate all hover interactions
		await hoverNthElement(bars, 0);
		const tooltip = await screen.findByTestId('prism-tooltip');
		expect(tooltip).toBeInTheDocument();
		expect(within(tooltip).getByText('Operating system: Windows')).toBeInTheDocument();
		expect(bars[1].getAttribute('fill-opacity')).toEqual(`${1 / HIGHLIGHT_CONTRAST_RATIO}`);

		// unhover and validate the highlights go away
		await unhoverNthElement(bars, 0);
		expect(bars[1].getAttribute('fill-opacity')).toEqual('1');
	});

	test('Line renders properly and hover works as expected', async () => {
		render(<LineChart {...LineChart.args} />);
		// validate prism drew
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get voronoi paths
		const paths = await findAllMarksByGroupName(prism, 'line0Voronoi');

		// hover and validate all hover components are visible
		await hoverNthElement(paths, 0);
		const tooltip = await screen.findByTestId('prism-tooltip');
		expect(tooltip).toBeInTheDocument();
		expect(within(tooltip).getByText('Nov 8')).toBeInTheDocument();

		const highlightRule = await findMarksByGroupName(prism, 'line0HoverRule', 'line');
		expect(highlightRule).toBeInTheDocument();
		const highlightPoint = await findMarksByGroupName(prism, 'line0Point');
		expect(highlightPoint).toBeInTheDocument();

		// unhover and validate the highlights go away
		await unhoverNthElement(paths, 0);
		expect(highlightRule).not.toBeInTheDocument();
		expect(highlightPoint).not.toBeInTheDocument();
	});

	test('Dodged bar tooltip opens on hover and bar is highlighted correctly', async () => {
		render(<DodgedBarChart {...DodgedBarChart.args} />);

		const prism = await findPrism();
		expect(prism).toBeInTheDocument();
		const bars = getAllMarksByGroupName(prism, 'rect0');

		// clicking the bar should open the popover
		await hoverNthElement(bars, 4);
		const tooltip = await screen.findByTestId('prism-tooltip');
		expect(tooltip).toBeInTheDocument();

		// check the content of the popover
		expect(within(tooltip).getByText('Operating system: Mac')).toBeInTheDocument();
		expect(within(tooltip).getByText('Browser: Firefox')).toBeInTheDocument();
		expect(within(tooltip).getByText('Users: 3')).toBeInTheDocument();

		// validate the highlight visuals are present
		expect(bars[0]).toHaveAttribute('fill-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(bars[4]).toHaveAttribute('fill-opacity', '1');

		await unhoverNthElement(bars, 4);
		expect(bars[0]).toHaveAttribute('fill-opacity', '1');
		expect(bars[4]).toHaveAttribute('fill-opacity', '1');
	});
});
