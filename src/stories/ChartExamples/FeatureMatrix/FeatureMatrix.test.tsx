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
import {
	allElementsHaveAttributeValue,
	findAllMarksByGroupName,
	findChart,
	findMarksByGroupName,
	hoverNthElement,
	render,
	screen,
} from '@test-utils';
import { spectrumColors } from '@themes';

import { FeatureMatrix, MultipleSegmentFeatureMatrix } from './FeatureMatrix.story';

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

		// trendline styling
		const trendlines = await findAllMarksByGroupName(chart, 'scatter0Trendline0', 'line');
		expect(trendlines).toHaveLength(3);

		const trendline = trendlines[0];
		expect(trendline).toHaveAttribute('stroke', colors['categorical-100']);
		expect(trendline).toHaveAttribute('stroke-width', '1');
		expect(trendline).toHaveAttribute('stroke-dasharray', '');

		expect(trendlines[1]).toHaveAttribute('stroke', colors['categorical-200']);
		expect(trendlines[2]).toHaveAttribute('stroke', colors['categorical-300']);
		expect(allElementsHaveAttributeValue(trendlines, 'opacity', 0)).toBeTruthy();

		// first trendline should be visible on hover
		await hoverNthElement(hoverAreas, 0);
		expect(trendlines[0]).toHaveAttribute('opacity', '1');
		expect(trendlines[1]).toHaveAttribute('opacity', '0');
		expect(trendlines[2]).toHaveAttribute('opacity', '0');

		// second trendline should be visible on hover
		await hoverNthElement(hoverAreas, 6);
		expect(trendlines[0]).toHaveAttribute('opacity', '0');
		expect(trendlines[1]).toHaveAttribute('opacity', '1');
		expect(trendlines[2]).toHaveAttribute('opacity', '0');

		// third trendline should be visible on hover
		await hoverNthElement(hoverAreas, 12);
		expect(trendlines[0]).toHaveAttribute('opacity', '0');
		expect(trendlines[1]).toHaveAttribute('opacity', '0');
		expect(trendlines[2]).toHaveAttribute('opacity', '1');
	});
});
