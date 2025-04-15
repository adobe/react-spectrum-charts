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

import userEvent from '@testing-library/user-event';

import { HIGHLIGHT_CONTRAST_RATIO } from '@spectrum-charts/constants';

import { Area } from '../../../components';
import {
	clickNthElement,
	findAllMarksByGroupName,
	findChart,
	findMarksByGroupName,
	hoverNthElement,
	render,
	screen,
	unhoverNthElement,
	waitFor,
	within,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { Basic, BasicFloating, Supreme } from './Area.story';
import { Popover, Basic as StackedBasic, TimeAxis, Tooltip } from './StackedArea.story';

describe('Area', () => {
	// Area is not a real React component. This is test just provides test coverage for sonarqube
	test('Area pseudo element', () => {
		render(<Area />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Basic Floating renders properly', async () => {
		render(<BasicFloating {...BasicFloating.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Supreme renders properly', async () => {
		render(<Supreme {...Supreme.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Stacked Basic renders properly', async () => {
		render(<StackedBasic {...StackedBasic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Time Axis renders properly', async () => {
		render(<TimeAxis {...TimeAxis.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Area with Tooltip renders properly', async () => {
		render(<Tooltip {...Tooltip.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get areas
		const areas = await findAllMarksByGroupName(chart, 'area0');

		// hover and validate all hover interactions
		await hoverNthElement(areas, 0);
		const tooltip = await screen.findByTestId('rsc-tooltip');
		expect(tooltip).toBeInTheDocument();
		expect(within(tooltip).getByText('OS: Windows')).toBeInTheDocument();
		expect(areas[1].getAttribute('opacity')).toEqual((1 / HIGHLIGHT_CONTRAST_RATIO).toString());

		const highlightRule = await findMarksByGroupName(chart, 'area0_rule', 'line');
		expect(highlightRule).toBeInTheDocument();
		const highlightPoint = await findMarksByGroupName(chart, 'area0_point');
		expect(highlightPoint).toBeInTheDocument();

		// unhover and validate the highlights go away
		await unhoverNthElement(areas, 0);
		expect(areas[1].getAttribute('fill-opacity')).toEqual('0.8');
		expect(highlightRule).not.toBeInTheDocument();
		expect(highlightPoint).not.toBeInTheDocument();
	});

	test('Area with Popover renders properly', async () => {
		render(<Popover {...Popover.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get areas
		const areas = await findAllMarksByGroupName(chart, 'area0');

		// clicking the bar should open the popover
		await clickNthElement(areas, 0);
		const popover = await screen.findByTestId('rsc-popover');
		await waitFor(() => expect(popover).toBeInTheDocument()); // waitFor to give the popover time to make sure it doesn't close

		// shouldn't close the popover
		await userEvent.click(popover);
		expect(popover).toBeInTheDocument();
		expect(within(popover).getByText('OS: Windows')).toBeInTheDocument();

		// should close the popover
		await userEvent.click(chart);
		await waitFor(() => expect(popover).not.toBeInTheDocument());
	});
});
