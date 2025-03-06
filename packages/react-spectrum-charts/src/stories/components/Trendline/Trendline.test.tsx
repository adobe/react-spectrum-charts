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
import { Trendline } from '../../../components';
import { HIGHLIGHT_CONTRAST_RATIO } from '../../../constants';
import {
	allElementsHaveAttributeValue,
	findAllMarksByGroupName,
	findChart,
	findMarksByGroupName,
	getAllLegendEntries,
	hoverNthElement,
	queryMarksByGroupName,
	render,
} from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { spectrumColors } from '../../../themes';
import {
	BarChart,
	Basic,
	DisplayOnHover,
	Orientation,
	TooltipAndPopover,
	TooltipAndPopoverOnParentLine,
} from './Trendline.story';

const colors = spectrumColors.light;

describe('Trendline', () => {
	// Trendline is not a real React component. This is test just provides test coverage for sonarqube
	test('Trendline pseudo element', () => {
		render(<Trendline />);
	});

	describe('Basic', () => {
		test('Basic renders properly', async () => {
			render(<Basic {...Basic.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const trendlines = await findAllMarksByGroupName(chart, 'line0Trendline0');
			expect(trendlines).toHaveLength(4);
			expect(trendlines[0]).toHaveAttribute('stroke-dasharray', '7,4');
			expect(trendlines[0]).toHaveAttribute('stroke-width', '1.5');
		});

		/**
		 * If there is an issue with the trendline, vega defaults to drawing all the x positions at 0.
		 * This function checks that all the x positions are unique.
		 * @param path
		 * @returns
		 */
		const allXPathPositionsAreUnique = (path: string): boolean => {
			const xPositions = path.match(/([+-]?(\d*\.)?\d+),/g)?.map((match) => match.replace(',', '')) ?? [];
			return new Set(xPositions).size === xPositions.length;
		};

		test('regression method renders correctly', async () => {
			render(<Basic {...Basic.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const trendlines = await findAllMarksByGroupName(chart, 'line0Trendline0');
			expect(trendlines).toHaveLength(4);
			const trendlinePath = trendlines[0].getAttribute('d');
			expect(trendlinePath).toBeTruthy();
			expect(allXPathPositionsAreUnique(trendlinePath ?? '')).toBeTruthy();
		});

		test('moving average method renders correctly', async () => {
			render(<Basic {...Basic.args} method="movingAverage-3" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const trendlines = await findAllMarksByGroupName(chart, 'line0Trendline0');
			expect(trendlines).toHaveLength(4);
			const trendlinePath = trendlines[0].getAttribute('d');
			expect(trendlinePath).toBeTruthy();
			expect(allXPathPositionsAreUnique(trendlinePath ?? '')).toBeTruthy();
		});
	});

	describe('DisplayOnHover', () => {
		test('should display trendlines on line hover', async () => {
			render(<DisplayOnHover {...DisplayOnHover.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const lines = await findAllMarksByGroupName(chart, 'line0');
			expect(lines).toHaveLength(4);

			// shouldn't be any trendlines visible
			let trendline = queryMarksByGroupName(chart, 'line0Trendline0');
			expect(trendline).not.toBeInTheDocument();

			// hover over the first point on the first line
			const hoverAreas = await findAllMarksByGroupName(chart, 'line0_voronoi');
			await hoverNthElement(hoverAreas, 0);

			// trendline should be visible
			trendline = await findMarksByGroupName(chart, 'line0Trendline0');
			expect(trendline).toBeInTheDocument();
			expect(trendline).toHaveAttribute('opacity', '1');
		});

		test('should display trendlines on legend hover', async () => {
			render(<DisplayOnHover {...DisplayOnHover.args} />);
			const chart = await findChart();

			// shouldn't be any trendlines visible
			let trendline = queryMarksByGroupName(chart, 'line0Trendline0');
			expect(trendline).not.toBeInTheDocument();

			// hover over the first point on the first line
			const legendEntries = getAllLegendEntries(chart);
			await hoverNthElement(legendEntries, 0);

			// trendline should be visible
			trendline = await findMarksByGroupName(chart, 'line0Trendline0');
			expect(trendline).toBeInTheDocument();
			expect(trendline).toHaveAttribute('opacity', '1');
		});

		test('should display on hover for window methods', async () => {
			render(<DisplayOnHover {...DisplayOnHover.args} method="movingAverage-2" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const lines = await findAllMarksByGroupName(chart, 'line0');
			expect(lines).toHaveLength(4);

			// shouldn't be any trendlines visible
			let trendline = queryMarksByGroupName(chart, 'line0Trendline0');
			expect(trendline).not.toBeInTheDocument();

			// hover over the first point on the first line
			const hoverAreas = await findAllMarksByGroupName(chart, 'line0_voronoi');
			await hoverNthElement(hoverAreas, 0);

			// trendline should be visible
			trendline = await findMarksByGroupName(chart, 'line0Trendline0');
			expect(trendline).toBeInTheDocument();
			expect(trendline).toHaveAttribute('opacity', '1');
		});
	});

	describe('Orientation', () => {
		test('Should have vertical trendline', async () => {
			render(<Orientation {...Orientation.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const trendlines = await findAllMarksByGroupName(chart, 'scatter0Trendline0', 'line');
			expect(trendlines).toHaveLength(3);
			// if x2 is 0, then the trendline is vertical
			expect(allElementsHaveAttributeValue(trendlines, 'x2', '0')).toBeTruthy();
			expect(allElementsHaveAttributeValue(trendlines, 'y2', '-387')).toBeTruthy();
		});
	});

	describe('TooltipAndPopover', () => {
		test('Should highlight trendline on hover', async () => {
			render(<TooltipAndPopover {...TooltipAndPopover.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const lines = await findAllMarksByGroupName(chart, 'line0');
			expect(lines).toHaveLength(4);
			const trendlines = await findAllMarksByGroupName(chart, 'line0Trendline0');
			expect(trendlines).toHaveLength(4);

			// all lines and trendlines are full opacity
			expect(allElementsHaveAttributeValue([...lines, ...trendlines], 'opacity', 1)).toBeTruthy();

			// hover over the first point on the first trendline
			const trendlineHoverAreas = await findAllMarksByGroupName(chart, 'line0Trendline_voronoi');
			await hoverNthElement(trendlineHoverAreas, 0);

			// highlighted line and trendline are still full opacity
			expect(allElementsHaveAttributeValue([lines[0], trendlines[0]], 'opacity', 1)).toBeTruthy();

			// other lines and trendlines are faded
			expect(
				allElementsHaveAttributeValue([lines[1], trendlines[1]], 'opacity', 1 / HIGHLIGHT_CONTRAST_RATIO)
			).toBeTruthy();
		});
	});

	describe('TooltipAndPopoverOnParentLine', () => {
		test('Should highlight trendline on hover', async () => {
			render(<TooltipAndPopoverOnParentLine {...TooltipAndPopoverOnParentLine.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const lines = await findAllMarksByGroupName(chart, 'line0');
			expect(lines).toHaveLength(4);
			const trendlines = await findAllMarksByGroupName(chart, 'line0Trendline0');
			expect(trendlines).toHaveLength(4);

			// all lines and trendlines are full opacity
			expect(allElementsHaveAttributeValue([...lines, ...trendlines], 'opacity', 1)).toBeTruthy();

			// hover over the first point on the first trendline
			const trendlineHoverAreas = await findAllMarksByGroupName(chart, 'line0_voronoi');
			await hoverNthElement(trendlineHoverAreas, 0);

			// highlighted line and trendline are still full opacity
			expect(lines[0]).toHaveAttribute('opacity', '1');

			// other lines and trendlines are faded
			expect(lines[1]).toHaveAttribute('opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		});
	});

	describe('BarChart', () => {
		test('should display trendlines on bar charts', async () => {
			render(<BarChart {...BarChart.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const trendlines = await findAllMarksByGroupName(chart, 'bar0Trendline0', 'line');

			expect(trendlines).toHaveLength(3);
			expect(trendlines[0]).toHaveAttribute('stroke', colors['categorical-100']);
			expect(trendlines[1]).toHaveAttribute('stroke', colors['categorical-200']);
			expect(trendlines[2]).toHaveAttribute('stroke', colors['categorical-300']);
		});
	});
});
