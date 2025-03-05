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
import { findChart, getAllLegendSymbols, render, screen } from '@test-utils';
import { spectrumColors } from '@themes';

import { Color, LineType, LineWidth, Opacity, Supreme, Symbols } from './LegendSymbol.story';

const colors = spectrumColors.light;

test('Symbols renders properly', async () => {
	render(<Symbols {...Symbols.args} />);
	const view = await screen.findByRole('graphics-document');
	expect(view).toBeInTheDocument();
});

test('Color renders correctly', async () => {
	render(<Color {...Color.args} />);
	const chart = await findChart();
	expect(chart).toBeInTheDocument();

	const symbols = getAllLegendSymbols(chart);
	expect(symbols[0].getAttribute('fill')).toEqual(colors['gray-700']);
	expect(symbols[0].getAttribute('stroke')).toEqual(colors['gray-700']);
});

test('LineType renders correctly', async () => {
	render(<LineType {...LineType.args} />);
	const chart = await findChart();
	expect(chart).toBeInTheDocument();

	const symbols = getAllLegendSymbols(chart);
	expect(symbols[0].getAttribute('stroke-dasharray')).toEqual('');
});

test('LineWidth renders correctly', async () => {
	render(<LineWidth {...LineWidth.args} />);
	const chart = await findChart();
	expect(chart).toBeInTheDocument();

	const symbols = getAllLegendSymbols(chart);
	expect(symbols[0].getAttribute('stroke-width')).toEqual('1');
});

test('Opacity renders correctly', async () => {
	render(<Opacity {...Opacity.args} />);
	const chart = await findChart();
	expect(chart).toBeInTheDocument();

	const symbols = getAllLegendSymbols(chart);
	expect(symbols[0].getAttribute('fill-opacity')).toEqual('1');
	expect(symbols[1].getAttribute('fill-opacity')).toEqual('0.75');
	expect(symbols[2].getAttribute('fill-opacity')).toEqual('0.5');
});

test('Symbols renders correctly', async () => {
	render(<Symbols {...Symbols.args} />);
	const chart = await findChart();
	expect(chart).toBeInTheDocument();

	const symbols = getAllLegendSymbols(chart);
	// Square SVG path
	expect(symbols[0].getAttribute('d')).toEqual('M-7.906,-7.906h15.811v15.811h-15.811Z');
	// Triangle SVG path
	expect(symbols[1].getAttribute('d')).toEqual('M0,-9.129L-7.906,4.564L7.906,4.564Z');
	// Custom rounded square SVG path
	expect(symbols[2].getAttribute('d')).toEqual(
		'M-4.348,-7.906L4.348,-7.906C6.313,-7.906,7.906,-6.313,7.906,-4.348L7.906,4.348C7.906,6.313,6.313,7.906,4.348,7.906L-4.348,7.906C-6.313,7.906,-7.906,6.313,-7.906,4.348L-7.906,-4.348C-7.906,-6.313,-6.313,-7.906,-4.348,-7.906Z'
	);
});

test('Supreme renders correctly', async () => {
	render(<Supreme {...Supreme.args} />);
	const chart = await findChart();
	expect(chart).toBeInTheDocument();

	const symbols = getAllLegendSymbols(chart);
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
		'M-4.348,-7.906L4.348,-7.906C6.313,-7.906,7.906,-6.313,7.906,-4.348L7.906,4.348C7.906,6.313,6.313,7.906,4.348,7.906L-4.348,7.906C-6.313,7.906,-7.906,6.313,-7.906,4.348L-7.906,-4.348C-7.906,-6.313,-6.313,-7.906,-4.348,-7.906Z'
	);
});
