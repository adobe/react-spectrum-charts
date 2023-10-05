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
import { clickNthElement, findPrism, getAllLegendEntries, hoverNthElement, render, screen } from '@test-utils';
import React from 'react';

import { Legend } from '@components/Legend';
import { Basic, Descriptions, Highlight, OnClick, Position, Supreme, Title } from './Legend.story';

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

	test('Highlight renders properly', async () => {
		render(<Highlight {...Highlight.args} />);
		const view = await screen.findByRole('graphics-document');
		expect(view).toBeInTheDocument();
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
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		screen.debug(prism, Infinity);
		const entries = getAllLegendEntries(prism);
		await hoverNthElement(entries, 0);

		// make sure tooltip is visible
		const tooltip = await screen.findByTestId('prism-tooltip');
		expect(tooltip).toBeInTheDocument();
	});

	test('Supreme with no descriptions', async () => {
		render(<Supreme {...Supreme.args} descriptions={[]} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		const entries = getAllLegendEntries(prism);
		await hoverNthElement(entries, 0);

		const tooltip = screen.queryByTestId('prism-tooltip');
		expect(tooltip).not.toBeInTheDocument();
	});

	test('should call onClick callback when selecting a legend entry', async () => {
		const onClick = jest.fn();
		render(<OnClick {...OnClick.args} onClick={onClick} />);
		const prism = await findPrism();
		const entries = getAllLegendEntries(prism);

		await clickNthElement(entries, 0);
		expect(onClick).toHaveBeenCalledWith('Windows');

		await clickNthElement(entries, 1);
		expect(onClick).toHaveBeenCalledWith('Mac');

		await clickNthElement(entries, 2);
		expect(onClick).toHaveBeenCalledWith('Other');
	});

	// Legend is not a real React component. This is test just provides test coverage for sonarqube
	test('Legend pseudo element', async () => {
		render(<Legend />);
	});
});
