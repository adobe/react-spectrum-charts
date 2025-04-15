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

import { LEGEND_TOOLTIP_DELAY } from '@spectrum-charts/constants';

import { Chart } from '../../../Chart';
import { Legend } from '../../../components';
import { clickNthElement, findChart, getAllLegendEntries, hoverNthElement, render, screen } from '../../../test-utils';
import '../../../test-utils/__mocks__/matchMedia.mock.js';
import { Basic, Descriptions, LabelLimit, OnClick, Position, Supreme, Title } from './Legend.story';

/**
 * Wait for the the duration of the legend tooltip hover delay.
 */
export const waitForLegendTooltip = async () => {
	await new Promise((resolve) => setTimeout(resolve, LEGEND_TOOLTIP_DELAY));
};

/**
 * Tooltips are rendered in a portal, so jest's default cleanup won't remove them.
 * This helper will remove all vega tooltips from the DOM.
 */
export const cleanupTooltips = () => {
	document.body.querySelectorAll('.vg-tooltip').forEach((node) => {
		node.remove();
	});
};

describe('Legend', () => {
	afterEach(() => {
		cleanupTooltips();
	});

	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const view = await screen.findByRole('graphics-document');
		expect(view).toBeInTheDocument();
		const windowsEntry = screen.getByText('Windows');
		expect(windowsEntry).toBeInTheDocument();
	});

	test('Descriptions renders properly', async () => {
		render(<Descriptions {...Descriptions.args} />);
		const view = await screen.findByRole('graphics-document');
		expect(view).toBeInTheDocument();
	});

	test('Displays legend descriptions on hover after a delay', async () => {
		render(<Descriptions {...Descriptions.args} />);
		const chart = await findChart();
		const legendEntries = getAllLegendEntries(chart);
		await hoverNthElement(legendEntries, 0);
		let tooltip = screen.queryByTestId('rsc-tooltip');

		expect(tooltip).toBeNull();

		await waitForLegendTooltip();
		tooltip = await screen.findByTestId('rsc-tooltip');
		expect(tooltip).toBeInTheDocument();
		expect(tooltip).toHaveTextContent('WindowsMost popular operating system, especially in business');
	});

	test('Does not display legend tooltip if there are no descriptions', async () => {
		render(<Descriptions {...Descriptions.args} descriptions={undefined} />);
		const chart = await findChart();
		const legendEntries = getAllLegendEntries(chart);
		await hoverNthElement(legendEntries, 0);

		await waitForLegendTooltip();

		const tooltip = screen.queryByTestId('rsc-tooltip');

		expect(tooltip).toBeNull();
	});

	test('Does not display legend tooltip if descriptions is empty', async () => {
		render(<Descriptions {...Descriptions.args} descriptions={[]} />);
		const chart = await findChart();
		const legendEntries = getAllLegendEntries(chart);
		await hoverNthElement(legendEntries, 0);
		waitForLegendTooltip();

		const tooltip = screen.queryByTestId('rsc-tooltip');
		expect(tooltip).toBeNull();
	});

	test('Description tooltips display for multiple entries with one series', async () => {
		const data = [
			{
				period: 'Previous period',
				series: 'series',
			},
			{
				period: 'Current period',
				series: 'series',
			},
		];

		const descriptions = [
			{
				seriesName: 'series | Previous period',
				description: 'description previous',
				title: 'Series | Previous period',
			},
			{
				seriesName: 'series | Current period',
				description: 'description current',
				title: 'Series | Current period',
			},
		];

		const legendLabels = [
			{
				seriesName: descriptions[0].seriesName,
				label: descriptions[0].title,
			},
			{
				seriesName: descriptions[1].seriesName,
				label: descriptions[1].title,
			},
		];

		render(
			<Chart data={data} width={700}>
				<Legend color="series" lineType="period" descriptions={descriptions} legendLabels={legendLabels} />
			</Chart>
		);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const entries = getAllLegendEntries(chart);
		await hoverNthElement(entries, 0);

		let tooltip = await screen.findByTestId('rsc-tooltip');
		expect(tooltip).toBeVisible();
		expect(tooltip).toHaveTextContent('Series | Previous perioddescription previous');

		cleanupTooltips();

		await hoverNthElement(entries, 1);

		tooltip = await screen.findByTestId('rsc-tooltip');
		expect(tooltip).toBeVisible();
		expect(tooltip).toHaveTextContent('Series | Current perioddescription current');
	});

	test('Disconnected renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const view = await screen.findByRole('graphics-document');
		expect(view).toBeInTheDocument();

		const chart = await findChart();

		const legendEntries = getAllLegendEntries(chart);
		expect(legendEntries.length).toBe(3);

		for (const entry of legendEntries) {
			expect(entry).toBeVisible();
		}

		expect(screen.getByText('Windows')).toBeInTheDocument();
		expect(screen.getByText('Mac')).toBeInTheDocument();
		expect(screen.getByText('Other')).toBeInTheDocument();
	});

	test('Position renders properly', async () => {
		render(<Position {...Position.args} />);
		const view = await screen.findByRole('graphics-document');
		expect(view).toBeInTheDocument();
	});

	test('Title renders properly', async () => {
		render(<Title {...Title.args} />);
		const view = await screen.findByRole('graphics-document');
		expect(view).toBeInTheDocument();
	});

	test('Supreme renders properly', async () => {
		render(<Supreme {...Supreme.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const entries = getAllLegendEntries(chart);
		await hoverNthElement(entries, 0);

		// make sure tooltip is visible
		const tooltip = await screen.findByTestId('rsc-tooltip');
		expect(tooltip).toBeInTheDocument();
	});

	test('Supreme with no descriptions', async () => {
		render(<Supreme {...Supreme.args} descriptions={[]} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const entries = getAllLegendEntries(chart);
		await hoverNthElement(entries, 0);
		await waitForLegendTooltip();

		const tooltip = screen.queryByTestId('rsc-tooltip');
		expect(tooltip).toBeNull();
	});

	test('should call onClick callback when selecting a legend entry', async () => {
		const onClick = jest.fn();
		render(<OnClick {...OnClick.args} onClick={onClick} />);
		const chart = await findChart();
		const entries = getAllLegendEntries(chart);

		await clickNthElement(entries, 0);
		expect(onClick).toHaveBeenCalledWith('Windows');

		await clickNthElement(entries, 1);
		expect(onClick).toHaveBeenCalledWith('Mac');

		await clickNthElement(entries, 2);
		expect(onClick).toHaveBeenCalledWith('Other');
	});

	test('respects labelLimit prop if provided (shorter than default limit)', async () => {
		render(<LabelLimit {...LabelLimit.args} labelLimit={30} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		expect(
			screen.queryByText('Very long Windows label that will be truncated without a custom labelLimit')
		).not.toBeInTheDocument();
	});

	test('respects labelLimit prop if provided (longer than default limit)', async () => {
		render(<LabelLimit {...LabelLimit.args} labelLimit={300} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		expect(
			screen.queryByText('Very long Windows label that will be truncated without a custom labelLimit')
		).toBeInTheDocument();
	});

	// Legend is not a real React component. This is test just provides test coverage for sonarqube
	test('Legend pseudo element', async () => {
		render(<Legend />);
	});
});
