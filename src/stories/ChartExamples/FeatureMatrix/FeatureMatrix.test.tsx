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
	findAllLegendEntries,
	findAllMarksByGroupName,
	findChart,
	findMarksByGroupName,
	getAllLegendEntries,
	getAllLegendSymbols,
	hoverNthElement,
	queryMarksByGroupName,
	render,
	screen,
} from '@test-utils';
import { spectrumColors } from '@themes';

import { FeatureMatrix, MultipleSegmentFeatureMatrix, TimeCompareFeatureMatrix } from './FeatureMatrix.story';

const colors = spectrumColors.light;

describe('FeatureMatrix', () => {
	test('Single series should render correctly', async () => {
		render(<FeatureMatrix {...FeatureMatrix.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points).toHaveLength(6);

		// point styling
		const point = points[0];
		expect(point).toHaveAttribute('fill', colors['categorical-100']);
		expect(point).toHaveAttribute('fill-opacity', '1');
		expect(point).toHaveAttribute('stroke-width', '0');

		// trendline styling
		// horizontal trendline
		const horizontalTrendline = await findMarksByGroupName(chart, 'scatter0Trendline0', 'line');
		expect(horizontalTrendline).toBeInTheDocument();
		expect(horizontalTrendline).toHaveAttribute('x2', '452');
		expect(horizontalTrendline).toHaveAttribute('y2', '0');
		expect(horizontalTrendline).toHaveAttribute('stroke', colors['gray-900']);
		expect(horizontalTrendline).toHaveAttribute('stroke-width', '1');
		expect(horizontalTrendline).toHaveAttribute('stroke-dasharray', '');
		// vertical trendline
		const verticalTrendline = await findMarksByGroupName(chart, 'scatter0Trendline1', 'line');
		expect(verticalTrendline).toBeInTheDocument();
		expect(verticalTrendline).toHaveAttribute('x2', '0');
		expect(verticalTrendline).toHaveAttribute('y2', '-396');

		// trendline annotations
		// horizontal trendline annotation
		const horizontalAnnotation = await screen.findByText('Median times 2.94');
		expect(horizontalAnnotation).toBeInTheDocument();
		expect(horizontalAnnotation).toHaveAttribute('text-anchor', 'end');

		// vertical trendline annotation
		const verticalAnnotation = await screen.findByText('Median %DAU 8.39%');
		expect(verticalAnnotation).toBeInTheDocument();
		expect(verticalAnnotation).toHaveAttribute('text-anchor', 'middle');
	});
});

describe('MultipleSegmentFeatureMatrix', () => {
	test('multiple series should render correctly', async () => {
		render(<MultipleSegmentFeatureMatrix {...MultipleSegmentFeatureMatrix.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points).toHaveLength(18);

		// point styling
		const point = points[0];
		expect(point).toHaveAttribute('fill', colors['categorical-100']);
		expect(point).toHaveAttribute('fill-opacity', '1');
		expect(point).toHaveAttribute('stroke-width', '0');

		expect(points[6]).toHaveAttribute('fill', colors['categorical-200']);
		expect(points[12]).toHaveAttribute('fill', colors['categorical-300']);
	});
	test('should display trendline on hover', async () => {
		render(<MultipleSegmentFeatureMatrix {...MultipleSegmentFeatureMatrix.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const hoverAreas = await findAllMarksByGroupName(chart, 'scatter0_voronoi');
		expect(hoverAreas).toHaveLength(18);

		let trendline = queryMarksByGroupName(chart, 'scatter0Trendline0', 'line');
		expect(trendline).not.toBeInTheDocument();

		// first trendline should be visible on hover
		await hoverNthElement(hoverAreas, 0);
		trendline = await findMarksByGroupName(chart, 'scatter0Trendline0', 'line');
		expect(trendline).toBeInTheDocument();
		expect(trendline).toHaveAttribute('stroke', colors['categorical-100']);
		expect(trendline).toHaveAttribute('stroke-width', '1');
		expect(trendline).toHaveAttribute('stroke-dasharray', '');

		// second trendline should be visible on hover
		await hoverNthElement(hoverAreas, 6);
		trendline = await findMarksByGroupName(chart, 'scatter0Trendline0', 'line');
		expect(trendline).toBeInTheDocument();
		expect(trendline).toHaveAttribute('stroke', colors['categorical-200']);

		// third trendline should be visible on hover
		await hoverNthElement(hoverAreas, 12);
		trendline = await findMarksByGroupName(chart, 'scatter0Trendline0', 'line');
		expect(trendline).toBeInTheDocument();
		expect(trendline).toHaveAttribute('stroke', colors['categorical-300']);
	});
	test('should display trendline annotations on hover', async () => {
		render(<MultipleSegmentFeatureMatrix {...MultipleSegmentFeatureMatrix.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const hoverAreas = await findAllMarksByGroupName(chart, 'scatter0_voronoi');
		expect(hoverAreas).toHaveLength(18);

		// no annotations should be visible initially
		expect(queryMarksByGroupName(chart, 'scatter0Trendline0Annotation0', 'text')).not.toBeInTheDocument();
		expect(queryMarksByGroupName(chart, 'scatter0Trendline1Annotation0', 'text')).not.toBeInTheDocument();

		// first annotations should be visible on hover
		await hoverNthElement(hoverAreas, 0);
		expect(queryMarksByGroupName(chart, 'scatter0Trendline0Annotation0', 'text')).toBeInTheDocument();
		expect(queryMarksByGroupName(chart, 'scatter0Trendline1Annotation0', 'text')).toBeInTheDocument();
		expect(screen.getByText('Median times 2.94')).toBeInTheDocument();
		expect(screen.getByText('Median %DAU 8.39%')).toBeInTheDocument();

		// second annotations should be visible on hover
		await hoverNthElement(hoverAreas, 6);
		expect(screen.getByText('Median times 2.54')).toBeInTheDocument();
		expect(screen.getByText('Median %DAU 10.58%')).toBeInTheDocument();

		// third annotations should be visible on hover
		await hoverNthElement(hoverAreas, 12);
		expect(screen.getByText('Median times 2.59')).toBeInTheDocument();
		expect(screen.getByText('Median %DAU 8.96%')).toBeInTheDocument();
	});
});

describe('TimeCompareFeatureMatrix', () => {
	test('should render time comparison correctly', async () => {
		render(<TimeCompareFeatureMatrix {...TimeCompareFeatureMatrix.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// point styling
		const points = await findAllMarksByGroupName(chart, 'scatter0');
		expect(points).toHaveLength(36);
		expect(points[0]).toHaveAttribute('fill-opacity', '0.5');
		expect(points[1]).toHaveAttribute('fill-opacity', '1');
		expect(points[0]).toHaveAttribute('stroke-dasharray', '2,3');
		expect(points[1]).toHaveAttribute('stroke-dasharray', '');
		expect(allElementsHaveAttributeValue(points, 'stroke-width', '1')).toBe(true);

		// path styling
		const paths = await findAllMarksByGroupName(chart, 'scatter0Path0');
		expect(paths).toHaveLength(18);
		expect(allElementsHaveAttributeValue(paths, 'fill-opacity', '0.2')).toBe(true);
		expect(allElementsHaveAttributeValue(paths, 'fill', spectrumColors.light['gray-500'])).toBe(true);
	});

	test('highlighting a point should highlight both current and present points, trendlines and legend series', async () => {
		render(<TimeCompareFeatureMatrix {...TimeCompareFeatureMatrix.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const hoverAreas = await findAllMarksByGroupName(chart, 'scatter0_voronoi');
		expect(hoverAreas).toHaveLength(36);

		await hoverNthElement(hoverAreas, 0);
		const points = await findAllMarksByGroupName(chart, 'scatter0');

		// first and second points should be highlighted
		expect(points[0]).toHaveAttribute('opacity', '1');
		expect(points[1]).toHaveAttribute('opacity', '1');
		expect(
			allElementsHaveAttributeValue(points.slice(2), 'opacity', (1 / HIGHLIGHT_CONTRAST_RATIO).toString())
		).toBe(true);

		// four trendlines should be visible (2 vertical, 2 horizontal)
		const horizontalTrendlines = await findAllMarksByGroupName(chart, 'scatter0Trendline0', 'line');
		expect(horizontalTrendlines).toHaveLength(2);
		const verticalTrendlines = await findAllMarksByGroupName(chart, 'scatter0Trendline1', 'line');
		expect(verticalTrendlines).toHaveLength(2);

		// first and second legend series should be highlighted
		const legendSymbols = getAllLegendSymbols(chart);
		expect(legendSymbols).toHaveLength(6);
		expect(legendSymbols[0]).toHaveAttribute('opacity', '1');
		expect(legendSymbols[1]).toHaveAttribute('opacity', '1');
		expect(
			allElementsHaveAttributeValue(legendSymbols.slice(2), 'opacity', (1 / HIGHLIGHT_CONTRAST_RATIO).toString())
		).toBe(true);
	});
});
