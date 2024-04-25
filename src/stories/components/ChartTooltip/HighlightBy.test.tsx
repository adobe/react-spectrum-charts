import { HIGHLIGHT_CONTRAST_RATIO } from '@constants';
import {
	allElementsHaveAttributeValue,
	findAllMarksByGroupName,
	findChart,
	hoverNthElement,
	render,
} from '@test-utils';

import { Basic, Dimension, Keys, LineChart, Series } from './HighlightBy.story';

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

		const lineHoverPoints = await findAllMarksByGroupName(chart, 'line0_voronoi');
		expect(lineHoverPoints).toHaveLength(9);

		await hoverNthElement(lineHoverPoints, 0);

		const highlightedPoints = await findAllMarksByGroupName(chart, 'line0_point');
		expect(highlightedPoints).toHaveLength(3);

		expect(allElementsHaveAttributeValue(lines, 'opacity', '1')).toBe(true);
	});
});
