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
import { DONUT_SUMMARY_MIN_RADIUS } from '@spectrum-charts/constants';

import { DonutSummary } from '../../../rc';
import { render, screen } from '../../../test-utils';
import { Basic, NoLabel, NumberFormat } from './DonutSummary.story';

describe('DonutSummary renders properly', () => {
	// Donut is not a real React component. This is test just provides test coverage for sonarqube
	test('Donut pseudo element', () => {
		render(<DonutSummary />);
	});

	test('metric value should be centered if there is not a label', async () => {
		render(<NoLabel {...NoLabel.args} />);
		const metricValue = await screen.findByText('40.4K');
		expect(metricValue).toHaveAttribute('transform', 'translate(175,190)');
	});

	test('metric value should be above center if there is a label', async () => {
		render(<Basic {...Basic.args} />);
		const metricValue = await screen.findByText('40.4K');
		expect(metricValue).toHaveAttribute('transform', 'translate(175,175)');
	});

	test('metric label text should be 1/2 the size of the metric value text', async () => {
		render(<Basic {...Basic.args} width={200} height={200} />);
		const metricValue = await screen.findByText('40.4K');
		expect(metricValue).toHaveAttribute('font-size', '28px');
		const metricLabel = await screen.findByText('Visitors');
		expect(metricLabel).toHaveAttribute('font-size', '14px');
	});
});

describe('NumberFormat ', () => {
	test('shortCurrency', async () => {
		render(<NumberFormat {...NumberFormat.args} numberFormat="shortCurrency" />);
		expect(await screen.findByText('$40.4K')).toBeInTheDocument();
	});
	test('standardNumber', async () => {
		render(<NumberFormat {...NumberFormat.args} numberFormat="standardNumber" />);
		expect(await screen.findByText('40,365')).toBeInTheDocument();
	});
});

describe('Responsive font sizes should snap to correct font size based on inner radius', () => {
	test('should snap to min if target < 28', async () => {
		// 160 / 2 * 0.85 * 0.35 = 23.8
		// this should be clamped to the min of 28
		render(<Basic {...Basic.args} width={160} height={160} />);
		expect(await screen.findByText('40.4K')).toHaveAttribute('font-size', '28px');
	});

	test('should snap to 28 if 28 < target < 32', async () => {
		// 200 / 2 * 0.85 * 0.35 = 29.75
		// this is less than 32 and greater than 28 so it should snap to 28
		render(<Basic {...Basic.args} width={200} height={200} />);
		expect(await screen.findByText('40.4K')).toHaveAttribute('font-size', '28px');
	});

	test('should snap to 32 if 32 < target < 36', async () => {
		// 240 / 2 * 0.85 * 0.35 = 35.7
		// this is less than 36 and greater than 32 so it should snap to 32
		render(<Basic {...Basic.args} width={240} height={240} />);
		expect(await screen.findByText('40.4K')).toHaveAttribute('font-size', '32px');
	});

	test('should snap to 36 if 36 < target < 40', async () => {
		// 260 / 2 * 0.85 * 0.35 = 38.675
		// this is less than 40 and greater than 36 so it should snap to 36
		render(<Basic {...Basic.args} width={260} height={260} />);
		expect(await screen.findByText('40.4K')).toHaveAttribute('font-size', '36px');
	});

	test('should snap to 40 if 40 < target < 45', async () => {
		// 300 / 2 * 0.85 * 0.35 = 44.625
		// this is less than 44 and greater than 40 so it should snap to 40
		render(<Basic {...Basic.args} width={300} height={300} />);
		expect(await screen.findByText('40.4K')).toHaveAttribute('font-size', '40px');
	});

	test('should snap to 45 if 45 < target < 50', async () => {
		// 320 / 2 * 0.85 * 0.35 = 47.6
		// this is less than 50 and greater than 45 so it should snap to 45
		render(<Basic {...Basic.args} width={320} height={320} />);
		expect(await screen.findByText('40.4K')).toHaveAttribute('font-size', '45px');
	});

	test('should snap to 50 if 50 < target < 60', async () => {
		// 400 / 2 * 0.85 * 0.35 = 59
		// this is less than 60 and greater than 50 so it should snap to 50
		render(<Basic {...Basic.args} width={400} height={400} />);
		expect(await screen.findByText('40.4K')).toHaveAttribute('font-size', '50px');
	});

	test('should snap to max if target > 60', async () => {
		// 600 / 2 * 0.85 * 0.35 = 89.25
		// this is greater than 60 so it should snap to 60
		render(<Basic {...Basic.args} width={600} height={600} />);
		expect(await screen.findByText('40.4K')).toHaveAttribute('font-size', '60px');
	});
});

describe('Small radius', () => {
	test('should hide the summary if the donut inner radius is < DONUT_SUMMARY_MIN_RADIUS', async () => {
		render(<Basic {...Basic.args} width={DONUT_SUMMARY_MIN_RADIUS * 2} height={DONUT_SUMMARY_MIN_RADIUS * 2} />);
		expect(await screen.findByText('40.4K')).toHaveAttribute('font-size', '0px');
	});
});
