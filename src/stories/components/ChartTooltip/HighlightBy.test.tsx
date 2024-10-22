/*
 * Copyright 2024 Adobe. All rights reserved.
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
import {
	allElementsHaveAttributeValue,
	findAllMarksByGroupName,
	findChart,
	hoverNthElement,
	queryAllMarksByGroupName,
	render,
	screen,
} from '@test-utils';

import { AreaChart, Basic, Dimension, GroupData, Keys, LineChart, ScatterChart, Series } from './HighlightBy.story';

describe('Basic', () => {
	test('Only the hovered element should be highlighted', async () => {
		render(<Basic {...Basic.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const bars = await findAllMarksByGroupName(chart, 'bar0');
		expect(bars).toHaveLength(9);

		await hoverNthElement(bars, 2);
		// highlighed bar
		expect(bars[2]).toHaveAttribute('opacity', '1');
		// all other bars
		expect(
			allElementsHaveAttributeValue(
				[...bars.slice(0, 2), ...bars.slice(3)],
				'opacity',
				1 / HIGHLIGHT_CONTRAST_RATIO
			)
		).toBe(true);
	});
});

describe('Dimension', () => {
	test('All the bars with the same dimension should be highlighted', async () => {
		render(<Dimension {...Dimension.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const bars = await findAllMarksByGroupName(chart, 'bar0');
		expect(bars).toHaveLength(9);

		await hoverNthElement(bars, 2);
		// first three bars (same dimension)
		expect(allElementsHaveAttributeValue(bars.slice(0, 2), 'opacity', '1')).toBe(true);
		// all other bars
		expect(allElementsHaveAttributeValue(bars.slice(3), 'opacity', 1 / HIGHLIGHT_CONTRAST_RATIO)).toBe(true);
	});
});

describe('Series', () => {
	test('All the bars with the same series should be highlighted', async () => {
		render(<Series {...Series.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const bars = await findAllMarksByGroupName(chart, 'bar0');
		expect(bars).toHaveLength(9);

		await hoverNthElement(bars, 2);
		// bars 2, 5, and 8 (same series)
		expect(allElementsHaveAttributeValue([bars[2], bars[5], bars[8]], 'opacity', '1')).toBe(true);
		// all other bars
		expect(
			allElementsHaveAttributeValue(
				[...bars.slice(0, 1), ...bars.slice(3, 4), ...bars.slice(6, 7)],
				'opacity',
				1 / HIGHLIGHT_CONTRAST_RATIO
			)
		).toBe(true);
	});
});

describe('Keys', () => {
	test('All the bars with the same keys should be highlighted', async () => {
		render(<Keys {...Keys.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const bars = await findAllMarksByGroupName(chart, 'bar0');
		expect(bars).toHaveLength(9);

		await hoverNthElement(bars, 2);
		// bars 2, 5, and 8 (same series)
		expect(allElementsHaveAttributeValue([bars[2], bars[5], bars[8]], 'opacity', '1')).toBe(true);
		// all other bars
		expect(
			allElementsHaveAttributeValue(
				[...bars.slice(0, 1), ...bars.slice(3, 4), ...bars.slice(6, 7)],
				'opacity',
				1 / HIGHLIGHT_CONTRAST_RATIO
			)
		).toBe(true);
	});
});

describe('LineChart', () => {
	test('All lines should be highlighted and the points for each dimension should be highlighted', async () => {
		render(<LineChart {...LineChart.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const lines = await findAllMarksByGroupName(chart, 'line0');
		expect(lines).toHaveLength(3);

		const lineHoverAreas = await findAllMarksByGroupName(chart, 'line0_voronoi');
		expect(lineHoverAreas).toHaveLength(9);

		await hoverNthElement(lineHoverAreas, 0);

		const highlightedPoints = await findAllMarksByGroupName(chart, 'line0_point_highlight');
		expect(highlightedPoints).toHaveLength(3);

		expect(allElementsHaveAttributeValue(lines, 'opacity', '1')).toBe(true);
	});
});

describe('ScatterChart', () => {
	test('All points with the same weigth class should be highlighted', async () => {
		render(<ScatterChart {...ScatterChart.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points).toHaveLength(16);
		expect(allElementsHaveAttributeValue(points, 'opacity', 1)).toBe(true);

		const scatterHoverAreas = await findAllMarksByGroupName(chart, 'scatter0_voronoi');
		await hoverNthElement(scatterHoverAreas, 0);

		// highlighted points
		expect(allElementsHaveAttributeValue(points.slice(0, 6), 'opacity', '1')).toBe(true);
		// all other points
		expect(allElementsHaveAttributeValue(points.slice(6), 'opacity', 1 / HIGHLIGHT_CONTRAST_RATIO)).toBe(true);
	});
});

describe('AreaChart', () => {
	test('All points with the same dimension should be highlighted', async () => {
		render(<AreaChart {...AreaChart.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const areas = await findAllMarksByGroupName(chart, 'area0');
		expect(areas).toHaveLength(3);
		expect(allElementsHaveAttributeValue(areas, 'opacity', '1')).toBe(true);

		await hoverNthElement(areas, 0);

		// 3 highlight points should be visible
		const highlightedPoints = await findAllMarksByGroupName(chart, 'area0_point');
		expect(highlightedPoints).toHaveLength(3);

		// 3 vertical rules should be visible
		const highlightVerticalRules = await findAllMarksByGroupName(chart, 'area0_rule', 'line');
		expect(highlightVerticalRules).toHaveLength(3);

		expect(allElementsHaveAttributeValue(areas, 'opacity', '1')).toBe(true);
	});

	test('All points in the series should be highlighted', async () => {
		render(<AreaChart {...AreaChart.args} highlightBy="series" />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const areas = await findAllMarksByGroupName(chart, 'area0');
		expect(areas).toHaveLength(3);
		expect(allElementsHaveAttributeValue(areas, 'opacity', '1')).toBe(true);

		await hoverNthElement(areas, 0);

		// 3 highlight points should be visible
		const highlightedPoints = await findAllMarksByGroupName(chart, 'area0_point');
		expect(highlightedPoints).toHaveLength(3);
		// vertical rules should not be visible for the highlighted series
		const highlightVerticalRules = queryAllMarksByGroupName(chart, 'area0_rule', 'line');
		expect(highlightVerticalRules).toHaveLength(0);
		expect(areas[0]).toHaveAttribute('opacity', '1');
		expect(
			allElementsHaveAttributeValue(areas.slice(1), 'opacity', (1 / HIGHLIGHT_CONTRAST_RATIO).toString())
		).toBe(true);
	});
});

describe('GroupData', () => {
	test('Should have all group data available to the toolitp', async () => {
		render(<GroupData {...GroupData.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const scatterHoverAreas = await findAllMarksByGroupName(chart, 'scatter0_voronoi');
		await hoverNthElement(scatterHoverAreas, 0);

		expect(screen.getByText('Baby Peach')).toBeInTheDocument();
		expect(screen.getByText('Baby Daisy')).toBeInTheDocument();
		expect(screen.getByText('Baby Rosalina')).toBeInTheDocument();
		expect(screen.getByText('Lemmy')).toBeInTheDocument();
		expect(screen.getByText('Baby Mario')).toBeInTheDocument();
		expect(screen.getByText('Baby Luigi')).toBeInTheDocument();
		expect(screen.getByText('Dry Bones')).toBeInTheDocument();
		expect(screen.getByText('Light Mii')).toBeInTheDocument();
		expect(screen.getByText('Koopa Troopa')).toBeInTheDocument();
		expect(screen.getByText('Lakitu')).toBeInTheDocument();
		expect(screen.getByText('Bowser Jr.')).toBeInTheDocument();
		expect(screen.getByText('Toadette')).toBeInTheDocument();
		expect(screen.getByText('Wendy')).toBeInTheDocument();
		expect(screen.getByText('Isabelle')).toBeInTheDocument();
		expect(screen.getByText('Toad')).toBeInTheDocument();
		expect(screen.getByText('Shy Guy')).toBeInTheDocument();
		expect(screen.getByText('Larry')).toBeInTheDocument();
	});
});
