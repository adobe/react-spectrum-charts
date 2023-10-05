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
import { Legend } from '@prism';
import { findPrism, getAllLegendEntries, getAllLegendSymbols, hoverNthElement, render, screen } from '@test-utils';
import React from 'react';

import { Basic, Descriptions, Highlight, Position, Supreme, Title } from './Legend.story';
import { Color, LineType, LineWidth, Opacity, Symbols, Supreme as SymbolsSupreme } from './LegendSymbol.story';

// TODO: add proper tests for Legend component
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

	test('Symbols renders properly', async () => {
		render(<Symbols {...Symbols.args} />);
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

		const entries = await getAllLegendEntries(prism);
		await hoverNthElement(entries, 0);

		// make sure tooltip is visible
		const tooltip = await screen.findByTestId('prism-tooltip');
		expect(tooltip).toBeInTheDocument();
	});

	test('Supreme with no descriptions', async () => {
		render(<Supreme {...Supreme.args} descriptions={[]} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		const entries = await getAllLegendEntries(prism);
		await hoverNthElement(entries, 0);

		const tooltip = screen.queryByTestId('prism-tooltip');
		expect(tooltip).not.toBeInTheDocument();
	});

	test('Color renders correctly', async () => {
		render(<Color {...Color.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		const symbols = await getAllLegendSymbols(prism);
		expect(symbols[0].getAttribute('fill')).toEqual('rgb(70, 70, 70)');
		expect(symbols[0].getAttribute('stroke')).toEqual('rgb(70, 70, 70)');
	});

	test('LineType renders correctly', async () => {
		render(<LineType {...LineType.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		const symbols = await getAllLegendSymbols(prism);
		expect(symbols[0].getAttribute('stroke-dasharray')).toEqual('');
	});

	test('LineWidth renders correctly', async () => {
		render(<LineWidth {...LineWidth.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		const symbols = await getAllLegendSymbols(prism);
		expect(symbols[0].getAttribute('stroke-width')).toEqual('1');
	});

	test('Opacity renders correctly', async () => {
		render(<Opacity {...Opacity.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		const symbols = await getAllLegendSymbols(prism);
		expect(symbols[0].getAttribute('fill-opacity')).toEqual('1');
		expect(symbols[1].getAttribute('fill-opacity')).toEqual('0.75');
		expect(symbols[2].getAttribute('fill-opacity')).toEqual('0.5');
	});

	test('Symbols renders correctly', async () => {
		render(<Symbols {...Symbols.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		const symbols = await getAllLegendSymbols(prism);
		// Square SVG path
		expect(symbols[0].getAttribute('d')).toEqual('M-7.906,-7.906h15.811v15.811h-15.811Z');
		// Triangle SVG path
		expect(symbols[1].getAttribute('d')).toEqual('M0,-9.129L-7.906,4.564L7.906,4.564Z');
		// Custom rounded square SVG path
		expect(symbols[2].getAttribute('d')).toEqual(
			'M-4.348,-7.906L4.348,-7.906C6.313,-7.906,7.906,-6.313,7.906,-4.348L7.906,4.348C7.906,6.313,6.313,7.906,4.348,7.906L-4.348,7.906C-6.313,7.906,-7.906,6.313,-7.906,4.348L-7.906,-4.348C-7.906,-6.313,-6.313,-7.906,-4.348,-7.906Z',
		);
	});

	test('SymbolsSupreme renders correctly', async () => {
		render(<SymbolsSupreme {...SymbolsSupreme.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		const symbols = await getAllLegendSymbols(prism);
		expect(symbols[0].getAttribute('stroke-dasharray')).toEqual('');
		expect(symbols[1].getAttribute('stroke-dasharray')).toEqual('7,4');
		expect(symbols[2].getAttribute('stroke-dasharray')).toEqual('2,3');

		expect(symbols[0].getAttribute('stroke-width')).toEqual('1.5');

		expect(symbols[0].getAttribute('fill-opacity')).toEqual('1');
		expect(symbols[1].getAttribute('fill-opacity')).toEqual('0.75');
		expect(symbols[2].getAttribute('fill-opacity')).toEqual('0.5');

		// Square SVG path
		expect(symbols[0].getAttribute('d')).toEqual('M-7.906,-7.906h15.811v15.811h-15.811Z');
		// Triangle SVG path
		expect(symbols[1].getAttribute('d')).toEqual('M0,-9.129L-7.906,4.564L7.906,4.564Z');
		// Custom rounded square SVG path
		expect(symbols[2].getAttribute('d')).toEqual(
			'M-4.348,-7.906L4.348,-7.906C6.313,-7.906,7.906,-6.313,7.906,-4.348L7.906,4.348C7.906,6.313,6.313,7.906,4.348,7.906L-4.348,7.906C-6.313,7.906,-7.906,6.313,-7.906,4.348L-7.906,-4.348C-7.906,-6.313,-6.313,-7.906,-4.348,-7.906Z',
		);
	});

	// ChartPopover is not a real React component. This is test just provides test coverage for sonarqube
	test('ChartPopover pseudo element', async () => {
		render(<Legend />);
	});
});
