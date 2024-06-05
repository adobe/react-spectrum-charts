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
import { DONUT_SUMMARY_MAX_FONT_SIZE, DONUT_SUMMARY_MIN_FONT_SIZE } from '@constants';
import { findAllMarksByGroupName, findChart, render, screen } from '@test-utils';
import { Donut } from 'alpha/components/Donut';

import { Basic } from './Donut.story';

describe('Donut', () => {
	// Donut is not a real React component. This is test just provides test coverage for sonarqube
	test('Donut pseudo element', () => {
		render(<Donut />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// donut data has 7 segments
		const bars = await findAllMarksByGroupName(chart, 'donut0');
		expect(bars.length).toEqual(7);
	});

	describe('Summary text is correct size based on donut raidus', () => {
		test('text should be target size', async () => {
			render(<Basic {...Basic.args} width={300} height={300} />);
			const metricValue = await screen.findByText('39K');
			expect(metricValue).toHaveAttribute('font-size', '44px');
		});

		test('small donut, text should be min size', async () => {
			render(<Basic {...Basic.args} width={100} height={100} />);
			const metricValue = await screen.findByText('39K');
			expect(metricValue).toHaveAttribute('font-size', `${DONUT_SUMMARY_MIN_FONT_SIZE}px`);
		});

		test('large donut, text should be max size', async () => {
			render(<Basic {...Basic.args} width={600} height={600} />);
			const metricValue = await screen.findByText('39K');
			expect(metricValue).toHaveAttribute('font-size', `${DONUT_SUMMARY_MAX_FONT_SIZE}px`);
		});
	});

	test('metric label text should be 1/2 the size of the metric value text', async () => {
		render(<Basic {...Basic.args} width={204} height={204} />);
		const metricValue = await screen.findByText('39K');
		expect(metricValue).toHaveAttribute('font-size', '30px');
		const metricLabel = await screen.findByText('Visitors');
		expect(metricLabel).toHaveAttribute('font-size', '15px');
	});
});
