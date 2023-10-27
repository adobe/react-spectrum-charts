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

import { findAllMarksByGroupName, findPrism, getAllLegendEntries, hoverNthElement, render, screen } from '@test-utils';

import { Basic, Controlled } from './LegendHighlight.story';

describe('Controlled', () => {
	test('non highlighted series bars should have opacity applied', async () => {
		render(<Controlled {...Controlled.args} />);
		const prism = await findPrism();

		const bars = await findAllMarksByGroupName(prism, 'bar0');
		expect(bars.length).toEqual(9);
		expect(bars[0]).toHaveAttribute('fill-opacity', '0.2');
		expect(bars[1]).toHaveAttribute('fill-opacity', '1');
		expect(bars[2]).toHaveAttribute('fill-opacity', '0.2');

		expect(bars[0]).toHaveAttribute('stroke-opacity', '0.2');
		expect(bars[1]).toHaveAttribute('stroke-opacity', '1');
		expect(bars[2]).toHaveAttribute('stroke-opacity', '0.2');
	});

	test('non highlighted series legend symbols should have opacity applied', async () => {
		render(<Controlled {...Controlled.args} />);
		const prism = await findPrism();

		const legendSymbols = await findAllMarksByGroupName(prism, 'role-legend-symbol');
		expect(legendSymbols.length).toEqual(3);
		expect(legendSymbols[0]).toHaveAttribute('fill-opacity', '0.2');
		expect(legendSymbols[1]).toHaveAttribute('fill-opacity', '1');
		expect(legendSymbols[2]).toHaveAttribute('fill-opacity', '0.2');

		expect(legendSymbols[0]).toHaveAttribute('stroke-opacity', '0.2');
		expect(legendSymbols[1]).toHaveAttribute('stroke-opacity', '1');
		expect(legendSymbols[2]).toHaveAttribute('stroke-opacity', '0.2');
	});

	test('non highlighted series legend labels should have opacity applied', async () => {
		render(<Controlled {...Controlled.args} />);
		const prism = await findPrism();

		const legendLabels = await findAllMarksByGroupName(prism, 'role-legend-symbol');
		expect(legendLabels.length).toEqual(3);
		expect(legendLabels[0]).toHaveAttribute('fill-opacity', '0.2');
		expect(legendLabels[1]).toHaveAttribute('fill-opacity', '1');
		expect(legendLabels[2]).toHaveAttribute('fill-opacity', '0.2');
	});
});

describe('Uncontrolled', () => {
	test('Basic renders', async () => {
		render(<Basic {...Basic.args} />);
		const view = await screen.findByRole('graphics-document');
		expect(view).toBeInTheDocument();
	});

	test('hovering over legend items highlights the bars with matching series', async () => {
		render(<Basic {...Basic.args} />);
		const prism = await findPrism();

		let bars = await findAllMarksByGroupName(prism, 'bar0');
		expect(bars.length).toEqual(9);
		expect(bars[0]).toHaveAttribute('fill-opacity', '1');
		expect(bars[1]).toHaveAttribute('fill-opacity', '1');
		expect(bars[2]).toHaveAttribute('fill-opacity', '1');

		expect(bars[0]).toHaveAttribute('stroke-opacity', '1');
		expect(bars[1]).toHaveAttribute('stroke-opacity', '1');
		expect(bars[2]).toHaveAttribute('stroke-opacity', '1');

		const legendEntries = getAllLegendEntries(prism);
		await hoverNthElement(legendEntries, 0);

		bars = await findAllMarksByGroupName(prism, 'bar0');
		expect(bars[0]).toHaveAttribute('fill-opacity', '1');
		expect(bars[1]).toHaveAttribute('fill-opacity', '0.2');
		expect(bars[2]).toHaveAttribute('fill-opacity', '0.2');

		expect(bars[0]).toHaveAttribute('stroke-opacity', '1');
		expect(bars[1]).toHaveAttribute('stroke-opacity', '0.2');
		expect(bars[2]).toHaveAttribute('stroke-opacity', '0.2');
	});

	test('hovering over legend items adds opacity to the non hovered legend symbols', async () => {
		render(<Basic {...Basic.args} />);
		const prism = await findPrism();

		let legendSymbols = await findAllMarksByGroupName(prism, 'role-legend-symbol');
		expect(legendSymbols.length).toEqual(3);
		expect(legendSymbols[0]).toHaveAttribute('fill-opacity', '1');
		expect(legendSymbols[1]).toHaveAttribute('fill-opacity', '1');
		expect(legendSymbols[2]).toHaveAttribute('fill-opacity', '1');

		expect(legendSymbols[0]).toHaveAttribute('stroke-opacity', '1');
		expect(legendSymbols[1]).toHaveAttribute('stroke-opacity', '1');
		expect(legendSymbols[2]).toHaveAttribute('stroke-opacity', '1');

		const legendEntries = getAllLegendEntries(prism);
		await hoverNthElement(legendEntries, 0);

		legendSymbols = await findAllMarksByGroupName(prism, 'role-legend-symbol');
		expect(legendSymbols[0]).toHaveAttribute('fill-opacity', '1');
		expect(legendSymbols[1]).toHaveAttribute('fill-opacity', '0.2');
		expect(legendSymbols[2]).toHaveAttribute('fill-opacity', '0.2');

		expect(legendSymbols[0]).toHaveAttribute('stroke-opacity', '1');
		expect(legendSymbols[1]).toHaveAttribute('stroke-opacity', '0.2');
		expect(legendSymbols[2]).toHaveAttribute('stroke-opacity', '0.2');
	});

	test('hovering over legend items adds opacity to the non hovered legend labels', async () => {
		render(<Basic {...Basic.args} />);
		const prism = await findPrism();

		let legendLabels = await findAllMarksByGroupName(prism, 'role-legend-symbol');
		expect(legendLabels.length).toEqual(3);
		expect(legendLabels[0]).toHaveAttribute('fill-opacity', '1');
		expect(legendLabels[1]).toHaveAttribute('fill-opacity', '1');
		expect(legendLabels[2]).toHaveAttribute('fill-opacity', '1');

		const legendEntries = getAllLegendEntries(prism);
		await hoverNthElement(legendEntries, 0);

		legendLabels = await findAllMarksByGroupName(prism, 'role-legend-symbol');
		expect(legendLabels.length).toEqual(3);
		expect(legendLabels[0]).toHaveAttribute('fill-opacity', '1');
		expect(legendLabels[1]).toHaveAttribute('fill-opacity', '0.2');
		expect(legendLabels[2]).toHaveAttribute('fill-opacity', '0.2');
	});
});
