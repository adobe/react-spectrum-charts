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
import '@matchMediaMock';
import { TrendlineAnnotation, spectrumColors } from '@rsc';
import { allElementsHaveAttributeValue, findAllMarksByGroupName, findChart, render } from '@test-utils';

import { Badge, Basic, DimensionValue, NumberFormat, Prefix } from './TrendlineAnnotation.story';

const colors = spectrumColors.light;

describe('TrendlineAnnotation', () => {
	// TrendlineAnnotation is not a real React component. This is test just provides test coverage for sonarqube
	test('TrendlineAnnotation pseudo element', () => {
		render(<TrendlineAnnotation />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const labels = await findAllMarksByGroupName(chart, 'scatter0Trendline0Annotation0', 'text');
		expect(labels).toHaveLength(3);
		expect(allElementsHaveAttributeValue(labels, 'opacity', 1)).toBeTruthy();
		expect(labels[0]).toHaveTextContent('4.5');
		expect(labels[1]).toHaveTextContent('3.75');
		expect(labels[2]).toHaveTextContent('3');
	});

	test('should render Badge correctly', async () => {
		render(<Badge {...Badge.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const badges = await findAllMarksByGroupName(chart, 'scatter0Trendline0Annotation0_badge');
		expect(badges).toHaveLength(3);
		expect(badges[0]).toHaveAttribute('fill', colors['categorical-100']);
		expect(badges[1]).toHaveAttribute('fill', colors['categorical-200']);
		expect(badges[2]).toHaveAttribute('fill', colors['categorical-300']);
	});

	test('should render DimensionValue correctly', async () => {
		render(<DimensionValue {...DimensionValue.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const labels = await findAllMarksByGroupName(chart, 'scatter0Trendline0Annotation0', 'text');
		expect(labels).toHaveLength(3);
		expect(allElementsHaveAttributeValue(labels, 'opacity', 1)).toBeTruthy();
	});

	test('should render NumberFormat', async () => {
		render(<NumberFormat {...NumberFormat.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const labels = await findAllMarksByGroupName(chart, 'scatter0Trendline0Annotation0', 'text');
		expect(labels).toHaveLength(3);
		expect(allElementsHaveAttributeValue(labels, 'opacity', 1)).toBeTruthy();
		expect(labels[0]).toHaveTextContent('4.50');
		expect(labels[1]).toHaveTextContent('3.75');
		expect(labels[2]).toHaveTextContent('3.00');
	});

	test('should render Prefix', async () => {
		render(<Prefix {...Prefix.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const labels = await findAllMarksByGroupName(chart, 'scatter0Trendline0Annotation0', 'text');
		expect(labels).toHaveLength(3);
		expect(labels[0]).toHaveTextContent('Speed: 4.5');
		expect(labels[1]).toHaveTextContent('Speed: 3.75');
		expect(labels[2]).toHaveTextContent('Speed: 3');
	});
});
