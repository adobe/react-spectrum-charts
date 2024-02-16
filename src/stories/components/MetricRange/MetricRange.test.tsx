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
import { MetricRange } from '@rsc';
import { clickNthElement, findAllMarksByGroupName, findChart, hoverNthElement, render } from '@test-utils';

import { Basic, WithHover, WithPopover } from './MetricRange.story';

describe('MetricRange', () => {
	// MetricRange is not a real React component. This is test just provides test coverage for sonarqube
	test('MetricRange pseudo element', () => {
		render(<MetricRange metricEnd="100" metricStart="0" />);
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const metricRange0Children = await findAllMarksByGroupName(chart, 'line0MetricRange0_group', 'g');
		expect(metricRange0Children).toHaveLength(2);

		const metricRange1Children = await findAllMarksByGroupName(chart, 'line0MetricRange0_group', 'g');
		expect(metricRange1Children).toHaveLength(2);

		const metricRangeAreas = await findAllMarksByGroupName(metricRange0Children[1], 'line0MetricRange0');
		expect(metricRangeAreas[0]).toHaveAttribute('opacity', '0.8');
		expect(metricRangeAreas[0]).toHaveAttribute('fill-opacity', '0.2');

		const metricRangeLines = await findAllMarksByGroupName(metricRange0Children[0], 'line0');
		expect(metricRangeLines[0]).toHaveAttribute('stroke-opacity', '1');
		expect(metricRangeLines[0]).toHaveAttribute('stroke-dasharray', '3,4');
		expect(metricRangeLines[0]).toHaveAttribute('stroke-width', '1.5');
	});

	test('WithHover renders properly', async () => {
		render(<WithHover {...WithHover.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		let metricRange0Children = await findAllMarksByGroupName(chart, 'line0MetricRange0_group', 'g');
		expect(metricRange0Children).toHaveLength(2);

		let metricRangeLines = await findAllMarksByGroupName(metricRange0Children[0], 'line0');
		expect(metricRangeLines[0]).toHaveAttribute('opacity', '0');
		expect(metricRangeLines[0]).toHaveAttribute('stroke-dasharray', '3,4');
		expect(metricRangeLines[0]).toHaveAttribute('stroke-width', '1.5');

		let metricRangeAreas = await findAllMarksByGroupName(chart, 'line0MetricRange0');
		expect(metricRangeAreas[0]).toHaveAttribute('opacity', '0.8');
		expect(metricRangeAreas[0]).toHaveAttribute('fill-opacity', '0');

		const points = await findAllMarksByGroupName(chart, 'line0_voronoi');
		await hoverNthElement(points, 0);

		metricRange0Children = await findAllMarksByGroupName(chart, 'line0MetricRange0_group', 'g');
		metricRangeLines = await findAllMarksByGroupName(metricRange0Children[0], 'line0');
		expect(metricRangeLines[0]).toHaveAttribute('stroke-opacity', '1');

		metricRangeAreas = await findAllMarksByGroupName(chart, 'line0MetricRange0');
		expect(metricRangeAreas[0]).toHaveAttribute('fill-opacity', '0.2');
	});

	test('Hovered range stays active with popover', async () => {
		render(<WithPopover {...WithPopover.args} />);

		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'line0_voronoi');
		await clickNthElement(points, 0);

		const metricRangeChildren = await findAllMarksByGroupName(chart, 'line0MetricRange0_group', 'g');
		const metricRangeAreas = await findAllMarksByGroupName(chart, 'line0MetricRange0');
		expect(metricRangeAreas[0]).toHaveAttribute('opacity', '0.8');
		expect(metricRangeAreas[0]).toHaveAttribute('fill-opacity', '0.2');

		const metricRangeLines = await findAllMarksByGroupName(metricRangeChildren[0], 'line0');
		expect(metricRangeLines[0]).toHaveAttribute('stroke-opacity', '1');
	});
});
