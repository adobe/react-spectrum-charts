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

import { Legend } from '@components/Legend';
import '@matchMediaMock';
import { clickNthElement, findChart, getAllLegendEntries, hoverNthElement, render, screen } from '@test-utils';

import { Basic, Descriptions, LabelLimit, OnClick, Position, Supreme, Title } from './Legend.story';

describe('Legend', () => {
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

		const tooltip = screen.queryByTestId('rsc-tooltip');
		expect(tooltip).not.toBeInTheDocument();
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
