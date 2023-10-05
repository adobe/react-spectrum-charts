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

import '@matchMediaMock';
import {
	findMarksByGroupName,
	findPrism,
	getAllLegendEntries,
	getAllMarksByGroupName,
	getMarksByGroupName,
	hoverNthElement,
	render,
	screen,
} from '@test-utils';
import React from 'react';

import {
	FunnelConversion,
	FunnelTimeComparison,
	ReleaseImpact,
	TrendsTimeComparisonBar,
	TrendsTimeComparisonStackedBar,
	UserGrowthTimeComparisonBarGrowth,
} from './PrismExamples.story';

function testBarOpacity(bar: HTMLElement, opacity: string) {
	expect(bar).toHaveAttribute('fill-opacity', opacity);
}

function testBarStroke(bar: HTMLElement, strokeDasharray: string, strokeWidth: string) {
	expect(bar).toHaveAttribute('stroke-dasharray', strokeDasharray);
	expect(bar).toHaveAttribute('stroke-width', strokeWidth);
}

describe('Funnel stories', () => {
	describe('FunnelConversion', () => {
		test('legend should only have 2 items in it', async () => {
			render(<FunnelConversion {...FunnelConversion.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const bars = getAllMarksByGroupName(prism, 'bar0');
			expect(bars).toHaveLength(12);

			const legendEntries = getAllLegendEntries(prism);
			expect(legendEntries).toHaveLength(2);

			expect(screen.getByText('All users')).toBeInTheDocument();
			expect(screen.getByText('US')).toBeInTheDocument();
		});
	});
});

describe('Time comparison stories', () => {
	describe('TrendsTimeComparisonBar', () => {
		test('historical series should have special style', async () => {
			render(<TrendsTimeComparisonBar {...TrendsTimeComparisonBar.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const bars = getAllMarksByGroupName(prism, 'bar0');
			expect(bars).toHaveLength(112);

			testBarOpacity(bars[0], '0.5');
			testBarStroke(bars[0], '3,4', '1.5');
		});

		test('current series should have typical style', async () => {
			render(<TrendsTimeComparisonBar {...TrendsTimeComparisonBar.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const bars = getAllMarksByGroupName(prism, 'bar0');
			expect(bars).toHaveLength(112);

			testBarOpacity(bars[1], '1');
			testBarStroke(bars[1], '', '1.5');
		});
	});

	describe('FunnelTimeComparison', () => {
		test('historical series should have special style', async () => {
			render(<FunnelTimeComparison {...FunnelTimeComparison.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const bars = getAllMarksByGroupName(prism, 'bar0');
			expect(bars).toHaveLength(24);

			testBarOpacity(bars[0], '0.5');
			testBarStroke(bars[0], '3,4', '1.5');

			// dropoff bars
			testBarOpacity(bars[2], '0.5');
			testBarStroke(bars[2], '3,4', '1.5');
		});

		test('current series should have typical style', async () => {
			render(<FunnelTimeComparison {...FunnelTimeComparison.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const bars = getAllMarksByGroupName(prism, 'bar0');
			expect(bars).toHaveLength(24);

			testBarOpacity(bars[1], '1');
			testBarStroke(bars[1], '', '1.5');

			// dropoff bars
			testBarOpacity(bars[3], '1');
			testBarStroke(bars[3], '', '1.5');
		});
	});

	describe('UserGrowthTimeComparison', () => {
		test('has correct number of bars', async () => {
			render(<UserGrowthTimeComparisonBarGrowth {...UserGrowthTimeComparisonBarGrowth.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const bars = getAllMarksByGroupName(prism, 'bar0');
			expect(bars).toHaveLength(48);
		});

		test('historical series should have special style', async () => {
			render(<UserGrowthTimeComparisonBarGrowth {...UserGrowthTimeComparisonBarGrowth.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const bars = getAllMarksByGroupName(prism, 'bar0');

			// previous period April
			for (let i = 0; i <= 3; i++) {
				testBarOpacity(bars[i], '0.5');
				testBarStroke(bars[i], '3,4', '1.5');
			}

			// previous period May
			for (let i = 8; i <= 11; i++) {
				testBarOpacity(bars[i], '0.5');
				testBarStroke(bars[i], '3,4', '1.5');
			}
		});

		test('current series should have typical style', async () => {
			render(<UserGrowthTimeComparisonBarGrowth {...UserGrowthTimeComparisonBarGrowth.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const bars = getAllMarksByGroupName(prism, 'bar0');

			// last period April
			for (let i = 4; i <= 7; i++) {
				testBarOpacity(bars[i], '1');
				testBarStroke(bars[i], '', '1.5');
			}

			// last period May
			for (let i = 12; i <= 15; i++) {
				console.log({ i });
				testBarOpacity(bars[i], '1');
				testBarStroke(bars[i], '', '1.5');
			}
		});
	});

	describe('TrendsTimeComparisonStackedBar', () => {
		test('historical series should have special style', async () => {
			render(<TrendsTimeComparisonStackedBar {...TrendsTimeComparisonStackedBar.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const bars = getAllMarksByGroupName(prism, 'bar0');
			expect(bars).toHaveLength(112);

			testBarOpacity(bars[0], '0.5');
			testBarStroke(bars[0], '3,4', '1.5');
		});

		test('current series should have typical style', async () => {
			render(<TrendsTimeComparisonStackedBar {...TrendsTimeComparisonStackedBar.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const bars = getAllMarksByGroupName(prism, 'bar0');
			expect(bars).toHaveLength(112);

			testBarOpacity(bars[1], '1');
			testBarStroke(bars[1], '', '1.5');
		});
	});

	describe('ReleaseImpact', () => {
		test('should have release line and icon on chart', async () => {
			render(<ReleaseImpact {...ReleaseImpact.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const releaseLine = getMarksByGroupName(prism, 'axis0_xReferenceLineRule0', 'line');
			expect(releaseLine).toBeInTheDocument();

			const releaseIcon = getMarksByGroupName(prism, 'axis0_xReferenceLineSymbol0');
			expect(releaseIcon).toBeInTheDocument();
		});

		test('should have subleabels with correct styling', async () => {
			render(<ReleaseImpact {...ReleaseImpact.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const daysBeforeLabel = screen.getByText('Days before');
			expect(daysBeforeLabel).toBeInTheDocument();
			expect(daysBeforeLabel).toHaveAttribute('font-weight', 'bold');
			expect(daysBeforeLabel).toHaveAttribute('text-anchor', 'start');

			const releaseLabel = screen.getByText('July 17, 2023');
			expect(releaseLabel).toBeInTheDocument();
			expect(releaseLabel).toHaveAttribute('font-weight', 'bold');
			expect(releaseLabel).toHaveAttribute('text-anchor', 'middle');

			const daysAfterLabel = screen.getByText('Days after');
			expect(daysAfterLabel).toBeInTheDocument();
			expect(daysAfterLabel).toHaveAttribute('font-weight', 'bold');
			expect(daysAfterLabel).toHaveAttribute('text-anchor', 'end');
		});

		test('hovering the average lines should show tooltips', async () => {
			render(<ReleaseImpact {...ReleaseImpact.args} />);

			const prism = await findPrism();
			expect(prism).toBeInTheDocument();

			const averageLines = getAllMarksByGroupName(prism, 'line0Trendline_voronoi');
			expect(averageLines).toHaveLength(28);
			await hoverNthElement(averageLines, 0);
			const tooltip = await screen.findByTestId('prism-tooltip');
			expect(tooltip).toBeInTheDocument();
			expect(screen.getByText(0.58)).toBeInTheDocument();

			expect(await findMarksByGroupName(prism, 'line0Trendline_point')).toBeInTheDocument();
			expect(await findMarksByGroupName(prism, 'line0Trendline_secondaryPoint')).toBeInTheDocument();
		});
	});
});
