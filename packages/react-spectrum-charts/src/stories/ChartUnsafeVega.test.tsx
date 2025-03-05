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
import { findChart, fireEvent, getAllMarksByGroupName, render, screen, waitFor } from '@test-utils';
import { sequentialViridis16 } from '@themes';

import { BasicBar, PackedBubbleChart } from './ChartUnsafeVega.story';

const testFill = (el: HTMLElement, color: string) => {
	expect(el).toHaveAttribute('fill', color);
};

const getSlider = (container: HTMLElement, name: string) => {
	return container.querySelector(`input[name=${name}]`) as HTMLInputElement;
};

describe('UNSAFE_vegaSpec stories', () => {
	describe('BasicBar', () => {
		test('has correct number of bars', async () => {
			render(<BasicBar {...BasicBar.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const bars = getAllMarksByGroupName(chart, 'mark-rect');
			expect(bars).toHaveLength(5);
		});

		test('bars have spectrum color theme applied', async () => {
			render(<BasicBar {...BasicBar.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const bars = getAllMarksByGroupName(chart, 'mark-rect');

			// Ensure the default spectrum color theme is applied
			bars.forEach((bar) => {
				testFill(bar, 'rgb(15, 181, 174)');
			});
		});

		test('existing interaction signals in vega spec still work', async () => {
			render(<BasicBar {...BasicBar.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const bars = getAllMarksByGroupName(chart, 'mark-rect');

			// Make sure signals in the spec are not interfered with
			fireEvent.mouseOver(bars[0]);
			await waitFor(() => screen.getByText('53.1%'));
			expect(screen.getByText('53.1%')).toBeInTheDocument();
		});
	});

	describe('PackedBubbleChart', () => {
		test('has correct number of bubbles', async () => {
			render(<PackedBubbleChart {...PackedBubbleChart.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const bubbles = getAllMarksByGroupName(chart, 'mark-symbol');
			expect(bubbles).toHaveLength(16);
		});

		test('bubbles have spectrum color theme applied', async () => {
			render(<PackedBubbleChart {...PackedBubbleChart.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const bubbles = getAllMarksByGroupName(chart, 'mark-symbol');

			// Check the bubbles to ensure the sequential color scheme is applied
			// 16-value gradient with 16 bubbles will match 1:1
			bubbles.forEach((bubble, i) => {
				testFill(bubble, sequentialViridis16[i]);
			});
		});

		test('Slider interaction controls are present and can be changed', async () => {
			render(<PackedBubbleChart {...PackedBubbleChart.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const gravityXSlider = getSlider(chart, 'gravityX');
			const gravityYSlider = getSlider(chart, 'gravityY');

			// slider defaults are properly set
			expect(gravityXSlider.value).toBe('0.2');
			expect(gravityYSlider.value).toBe('0.1');

			// sliders can be adjusted
			fireEvent.change(gravityXSlider, { target: { value: 0.1 } });
			fireEvent.change(gravityYSlider, { target: { value: 0.9 } });

			// slider responds to event and updates accordingly
			expect(gravityXSlider.value).toBe('0.1');
			expect(gravityYSlider.value).toBe('0.9');
		});
	});
});
