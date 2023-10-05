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
	clickNthElement,
	findAllMarksByGroupName,
	findPrism,
	getAllLegendEntries,
	getAllLegendSymbols,
	hoverNthElement,
	render,
	screen,
} from '@test-utils';
import React from 'react';

import { spectrumColors } from '@themes';
import { DefaultHiddenSeries, HiddenSeries, IsToggleable } from './LegendHideShow.story';

const colors = spectrumColors.light;

test('Clicking an entry in the legend should hide that series.', async () => {
	render(<IsToggleable {...IsToggleable.args} />);
	const prism = await findPrism();

	let bars = await findAllMarksByGroupName(prism, 'bar0');
	expect(bars.length).toEqual(9);
	// all series should be visible
	expect(bars[0]).toHaveAttribute('fill', colors['categorical-100']);
	expect(bars[1]).toHaveAttribute('fill', colors['categorical-200']);
	expect(bars[2]).toHaveAttribute('fill', colors['categorical-300']);
	expect(bars[3]).toHaveAttribute('fill', colors['categorical-100']);

	// clicking on the first series should hide it
	const entries = getAllLegendEntries(prism);
	await clickNthElement(entries, 0);

	bars = await findAllMarksByGroupName(prism, 'bar0');
	expect(bars.length).toEqual(6);
	// first series should be hidden
	expect(bars[0]).toHaveAttribute('fill', colors['categorical-200']);
	expect(bars[1]).toHaveAttribute('fill', colors['categorical-300']);
	expect(bars[2]).toHaveAttribute('fill', colors['categorical-200']);
});

test('Hidden series should have the correct legend styling', async () => {
	render(<IsToggleable {...IsToggleable.args} />);
	const prism = await findPrism();

	let symbols = getAllLegendSymbols(prism);
	expect(symbols[0]).toHaveAttribute('fill', colors['categorical-100']);
	expect(symbols[0]).toHaveAttribute('stroke', colors['categorical-100']);
	expect(screen.getByText('Windows')).toHaveAttribute('fill', colors['gray-700']);

	// clicking on the first series should hide it
	const entries = getAllLegendEntries(prism);
	await clickNthElement(entries, 0);

	symbols = getAllLegendSymbols(prism);
	expect(symbols[0]).toHaveAttribute('fill', colors['gray-300']);
	expect(symbols[0]).toHaveAttribute('stroke', colors['gray-300']);
	expect(screen.getByText('Windows')).toHaveAttribute('fill', colors['gray-500']);
});

test('HiddenSeries should not be drawn to bar chart', async () => {
	render(<HiddenSeries {...HiddenSeries.args} />);
	const prism = await findPrism();

	const bars = await findAllMarksByGroupName(prism, 'bar0');
	expect(bars.length).toEqual(6);
	// second series should be hidden
	expect(bars[0]).toHaveAttribute('fill', colors['categorical-100']);
	expect(bars[1]).toHaveAttribute('fill', colors['categorical-300']);
	expect(bars[2]).toHaveAttribute('fill', colors['categorical-100']);

	// Mac should be lighter gray
	expect(screen.getByText('Windows')).toHaveAttribute('fill', colors['gray-700']);
	expect(screen.getByText('Mac')).toHaveAttribute('fill', colors['gray-500']);
});

test('DefaultHiddenSeries should be hidden on render', async () => {
	render(<DefaultHiddenSeries {...DefaultHiddenSeries.args} />);
	const prism = await findPrism();

	let bars = await findAllMarksByGroupName(prism, 'bar0');
	// there should only be 6 bars (2 series 3 categories)
	expect(bars.length).toEqual(6);

	const entries = getAllLegendEntries(prism);
	await clickNthElement(entries, 2);

	bars = await findAllMarksByGroupName(prism, 'bar0');
	// there should now be 9 bars (3 series 3 categories)
	expect(bars.length).toEqual(9);
});

test('Hidden series should not highlight any marks', async () => {
	render(<DefaultHiddenSeries {...DefaultHiddenSeries.args} />);
	const prism = await findPrism();

	const entries = getAllLegendEntries(prism);

	// hovering the second entry should lower the opacity of the first series
	await hoverNthElement(entries, 1);
	let bars = await findAllMarksByGroupName(prism, 'bar0');
	expect(bars[0]).toHaveAttribute('fill-opacity', '0.2');

	// hovering the third entry should not adjust the opcity of any of the bars since it is a hidden series
	await hoverNthElement(entries, 2);
	bars = await findAllMarksByGroupName(prism, 'bar0');
	expect(bars[0]).toHaveAttribute('fill-opacity', '1');
});
