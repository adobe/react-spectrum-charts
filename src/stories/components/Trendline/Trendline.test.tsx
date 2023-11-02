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
import { Trendline } from '@rsc';
import { findAllMarksByGroupName, findChart, getAllLegendEntries, hoverNthElement, render } from '@test-utils';

import { Basic, DisplayOnHover } from './Trendline.story';

describe('Trendline', () => {
	// Trendline is not a real React component. This is test just provides test coverage for sonarqube
	test('Trendline pseudo element', () => {
		render(<Trendline />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const trendlines = await findAllMarksByGroupName(chart, 'line0Trendline0');
		expect(trendlines).toHaveLength(4);
		expect(trendlines[0]).toHaveAttribute('stroke-dasharray', '7,4');
		expect(trendlines[0]).toHaveAttribute('stroke-width', '1.5');
	});

	describe('DisplayOnHover', () => {
		test('should display trendlines on line hover', async () => {
			render(<DisplayOnHover {...DisplayOnHover.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const lines = await findAllMarksByGroupName(chart, 'line0');
			expect(lines).toHaveLength(4);

			const trendlines = await findAllMarksByGroupName(chart, 'line0Trendline0');
			expect(trendlines).toHaveLength(4);

			// trendlines should be hidden by default
			expect(trendlines[0]).toHaveAttribute('stroke-opacity', '0');

			// hover over the first point on the first line
			const hoverAreas = await findAllMarksByGroupName(chart, 'line0_voronoi');
			await hoverNthElement(hoverAreas, 0);

			// first trendline should be visible
			expect(trendlines[0]).toHaveAttribute('stroke-opacity', '1');
			// second trendline should still be hidden
			expect(trendlines[1]).toHaveAttribute('stroke-opacity', '0');
		});
		test('should display trendlines on legend hover', async () => {
			render(<DisplayOnHover {...DisplayOnHover.args} />);
			const chart = await findChart();

			const trendlines = await findAllMarksByGroupName(chart, 'line0Trendline0');
			expect(trendlines).toHaveLength(4);

			// trendlines should be hidden by default
			expect(trendlines[0]).toHaveAttribute('stroke-opacity', '0');

			// hover over the first point on the first line
			const legendEntries = getAllLegendEntries(chart);
			await hoverNthElement(legendEntries, 0);

			// first trendline should be visible
			expect(trendlines[0]).toHaveAttribute('stroke-opacity', '1');
			// second trendline should still be hidden
			expect(trendlines[1]).toHaveAttribute('stroke-opacity', '0');
		});
	});
});
