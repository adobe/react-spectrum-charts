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
import { Scatter, spectrumColors } from '@rsc';
import {
	allElementsHaveAttributeValue,
	clickNthElement,
	findAllMarksByGroupName,
	findChart,
	findMarksByGroupName,
	getAllLegendEntries,
	hoverNthElement,
	render,
	screen,
	within,
} from '@test-utils';
import userEvent from '@testing-library/user-event';

import { Basic, Color, ColorScaleType, LineType, Opacity, Popover, Size, Tooltip } from './Scatter.story';

const colors = spectrumColors.light;

describe('Scatter', () => {
	// Scatter is not a real React component. This is test just provides test coverage for sonarqube
	test('Scatter pseudo element', () => {
		render(<Scatter />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points).toHaveLength(16);
	});

	test('Color renders properly', async () => {
		render(<Color {...Color.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points).toHaveLength(16);
		expect(points[0]).toHaveAttribute('fill', colors['categorical-100']);
		expect(points[6]).toHaveAttribute('fill', colors['categorical-200']);
		expect(points[11]).toHaveAttribute('fill', colors['categorical-300']);

		const legendEntries = getAllLegendEntries(chart);
		expect(legendEntries).toHaveLength(3);
	});

	test('ColorScaleType renders properly', async () => {
		render(<ColorScaleType {...ColorScaleType.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points).toHaveLength(16);
		expect(points[0]).toHaveAttribute('fill', 'rgb(253, 231, 37)');
		expect(points[6]).toHaveAttribute('fill', 'rgb(104, 198, 93)');
		expect(points[11]).toHaveAttribute('fill', 'rgb(52, 99, 140)');

		// legend title
		expect(screen.getByText('Weight')).toBeInTheDocument();
		// gradient labels
		expect(screen.getByText('2.0')).toBeInTheDocument();
		expect(screen.getByText('4.5')).toBeInTheDocument();
	});

	test('LineType renders properly', async () => {
		render(<LineType {...LineType.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points[0]).toHaveAttribute('stroke-dasharray', '');
		expect(points[6]).toHaveAttribute('stroke-dasharray', '7,4');
		expect(points[11]).toHaveAttribute('stroke-dasharray', '2,3');
	});

	test('Opacity renders properly', async () => {
		render(<Opacity {...Opacity.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points[0]).toHaveAttribute('fill-opacity', '1');
		expect(points[6]).toHaveAttribute('fill-opacity', '0.75');
		expect(points[11]).toHaveAttribute('fill-opacity', '0.5');
	});

	describe('Popover', () => {
		test('should render a popover on hover', async () => {
			render(<Popover {...Popover.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const paths = await findAllMarksByGroupName(chart, 'scatter0_voronoi');

			await clickNthElement(paths, 0);
			let popover = await screen.findByTestId('rsc-popover');
			expect(popover).toBeInTheDocument();
			expect(within(popover).getByText('Baby Peach, Baby Daisy')).toBeInTheDocument();

			await userEvent.click(document.body);

			await clickNthElement(paths, 12);
			popover = await screen.findByTestId('rsc-popover');
			expect(within(popover).getByText('Metal Mario, Gold Mario, Pink Gold Peach')).toBeInTheDocument();
		});

		test('should highlight hovered points', async () => {
			render(<Popover {...Popover.args} animations={false}/>);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const paths = await findAllMarksByGroupName(chart, 'scatter0_voronoi');
			const points = await findAllMarksByGroupName(chart, 'scatter0');
			expect(points).toHaveLength(16);

			await clickNthElement(paths, 0);
			expect(points[0]).toHaveAttribute('opacity', '1');

			// make sure all points after the first have reduced opacity
			expect(
				allElementsHaveAttributeValue(points.slice(1), 'opacity', 1 / HIGHLIGHT_CONTRAST_RATIO)
			).toBeTruthy();

			// find the select ring
			const selectRing = await findMarksByGroupName(chart, 'scatter0_selectRing');
			expect(selectRing).toBeInTheDocument();
			expect(selectRing).toHaveAttribute('stroke', spectrumColors.light['static-blue']);
			expect(selectRing).toHaveAttribute('stroke-width', '2');
		});
	});

	test('Size renders properly', async () => {
		render(<Size {...Size.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');

		// small circle (radius 3)
		expect(points[0]).toHaveAttribute('d', 'M3,0A3,3,0,1,1,-3,0A3,3,0,1,1,3,0');
		// big circle (radius 8)
		expect(points[15]).toHaveAttribute('d', 'M8,0A8,8,0,1,1,-8,0A8,8,0,1,1,8,0');

		const legendEntries = getAllLegendEntries(chart);
		expect(legendEntries).toHaveLength(6);
	});

	describe('Tooltip', () => {
		test('should render a tooltip on hover', async () => {
			render(<Tooltip {...Tooltip.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const paths = await findAllMarksByGroupName(chart, 'scatter0_voronoi');

			await hoverNthElement(paths, 0);
			let tooltip = await screen.findByTestId('rsc-tooltip');
			expect(tooltip).toBeInTheDocument();
			expect(within(tooltip).getByText('Baby Peach, Baby Daisy')).toBeInTheDocument();

			await hoverNthElement(paths, 12);
			tooltip = await screen.findByTestId('rsc-tooltip');
			expect(within(tooltip).getByText('Metal Mario, Gold Mario, Pink Gold Peach')).toBeInTheDocument();
		});
		test('should highlight hovered points', async () => {
			render(<Tooltip { ...Tooltip.args } animations={false} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const paths = await findAllMarksByGroupName(chart, 'scatter0_voronoi');
			const points = await findAllMarksByGroupName(chart, 'scatter0');
			expect(points).toHaveLength(16);

			await hoverNthElement(paths, 0);
			expect(points[0]).toHaveAttribute('opacity', '1');

			// make sure all points after the first have reduced opacity
			expect(
				allElementsHaveAttributeValue(points.slice(1), 'opacity', 1 / HIGHLIGHT_CONTRAST_RATIO)
			).toBeTruthy();
		});
	});
});
