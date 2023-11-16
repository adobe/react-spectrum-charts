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

import '@matchMediaMock';
import {
	clickNthElement,
	findAllByText,
	findAllMarksByGroupName,
	findChart,
	getByText,
	render,
	screen,
} from '@test-utils';

import {
	Dodged,
	HorizontalBarHorizontalTrellis,
	HorizontalBarVerticalTrellis,
	VerticalBarHorizontalTrellis,
	VerticalBarVerticalTrellis,
	WithCustomTrellisPadding,
} from './TrellisBar.story';

describe('TrellisBar', () => {
	test('Dodged renders properly', async () => {
		render(<Dodged {...Dodged.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(chart, 'bar0');
		expect(bars.length).toEqual(90);

		// click on bar and check where it rendered
		await clickNthElement(bars, 45);
		const popoverAnchor = await screen.findByTestId('rsc-popover-anchor');
		expect(popoverAnchor).toHaveStyle('position: absolute');
		expect(popoverAnchor).toHaveStyle('width: 85.60000000000002px');
		expect(popoverAnchor).toHaveStyle('height: 8.421428571428521px');
		expect(popoverAnchor).toHaveStyle('left: 316.5px');
		expect(popoverAnchor).toHaveStyle('top: 352.30714285714294px');
	});

	test('HorizontalBarHorizontalTrellis renders correctly', async () => {
		render(<HorizontalBarHorizontalTrellis {...HorizontalBarHorizontalTrellis.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(chart, 'bar0');
		expect(bars.length).toEqual(90);
	});

	test('HorizontalBarVerticalTrellis renders correctly', async () => {
		render(<HorizontalBarVerticalTrellis {...HorizontalBarVerticalTrellis.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(chart, 'bar0');
		expect(bars.length).toEqual(90);
	});

	test('VerticalBarHorizontalTrellis renders correctly', async () => {
		render(<VerticalBarHorizontalTrellis {...VerticalBarHorizontalTrellis.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(chart, 'bar0');
		expect(bars.length).toEqual(90);
	});

	test('VerticalBarVerticalTrellis renders correctly', async () => {
		render(<VerticalBarVerticalTrellis {...VerticalBarVerticalTrellis.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get bars
		const bars = await findAllMarksByGroupName(chart, 'bar0');
		expect(bars.length).toEqual(90);
	});

	describe('With custom trellis padding', () => {
		test('WithCustomTrellisPadding renders correctly', async () => {
			render(<WithCustomTrellisPadding {...WithCustomTrellisPadding.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();
	
			// get bars
			const bars = await findAllMarksByGroupName(chart, 'bar0');
			expect(bars.length).toEqual(90);
		});
	
		test('WithCustomTrellisPadding has correct padding for vertical trellis', async () => {
			render(<WithCustomTrellisPadding {...WithCustomTrellisPadding.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();
			// Get subcharts
			const trellisCharts = await findAllMarksByGroupName(chart, 'yTrellisGroup', 'g');
	
			// Y Trellis Group should have Y Translate. X Translate should be 0.
			// First chart should not have been tra.
			expect(trellisCharts[0]).toHaveAttribute('transform', 'translate(0,0)');
			expect(trellisCharts[1]).toHaveAttribute('transform', 'translate(0,244.9438202247191)');
			expect(trellisCharts[2]).toHaveAttribute('transform', 'translate(0,489.8876404494382)');
		});

		test('WithCustomTrellisPadding has correct padding for horizontal trellis', async () => {
			render(<WithCustomTrellisPadding {...WithCustomTrellisPadding.args} trellisOrientation='horizontal' />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();
			// Get subcharts
			const trellisCharts = await findAllMarksByGroupName(chart, 'xTrellisGroup', 'g');
	
			// X Trellis Group should have X Translate. Y Translate should be 0.
			// First chart should not have been transformed.
			expect(trellisCharts[0]).toHaveAttribute('transform', 'translate(0,0)');
			expect(trellisCharts[1]).toHaveAttribute('transform', 'translate(283.52059925093636,0)');
			expect(trellisCharts[2]).toHaveAttribute('transform', 'translate(567.0411985018727,0)');
		});
	});

	describe('axis titles', () => {
		test('should only display the axis title once, the others should have opacity = 0', async () => {
			render(<Dodged {...Dodged.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(getByText(chart, 'Platform')).toBeInTheDocument();

			// get y-axis titles, there should be 3 but only one should be visible
			const yTitles = await findAllByText(chart, 'Users, Count');
			expect(yTitles).toHaveLength(3);
			expect(yTitles[0]).toHaveAttribute('opacity', '1');
			expect(yTitles[1]).toHaveAttribute('opacity', '0');
			expect(yTitles[2]).toHaveAttribute('opacity', '0');
		});
	});
});
