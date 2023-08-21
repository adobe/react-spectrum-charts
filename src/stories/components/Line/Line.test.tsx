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

import { HIGHLIGHT_CONTRAST_RATIO } from '@constants';
import '@matchMediaMock';
import { Line } from '@prism';
import {
	findAllMarksByGroupName,
	findPrism,
	getAllLegendEntries,
	getAllLegendSymbols,
	hoverNthElement,
	unhoverNthElement,
} from '@test-utils';
import { render, screen, within } from '@testing-library/react';
import React from 'react';

import {
	Basic,
	HistoricalCompare,
	LineType,
	LineWithAxisAndLegend,
	LinearTrendScale,
	Opacity,
	Tooltip,
	TrendScale,
} from './Line.story';

describe('Line', () => {
	// Line is not a real React component. This is test just provides test coverage for sonarqube
	test('Line pseudo element', () => {
		render(<Line />);
	});

	test('Basic renders', async () => {
		render(<Basic {...Basic.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get lines
		const lines = await findAllMarksByGroupName(prism, 'line0');
		expect(lines.length).toEqual(4);
	});

	test('Line with axis and legend renders', async () => {
		render(<LineWithAxisAndLegend {...LineWithAxisAndLegend.args} />);
		expect(await screen.findByText('Add Fallout')).toBeInTheDocument();
		expect(await screen.findByText('Users')).toBeInTheDocument();
		expect(await screen.findByText('Nov')).toBeInTheDocument();
		const graphicsObjects = await screen.findAllByRole('graphics-object');
		expect(graphicsObjects.length).toEqual(3);
		const lineGroup = graphicsObjects[1];
		const lines = await within(lineGroup).findAllByRole('graphics-symbol');
		expect(lines.length).toEqual(4);
		expect(lines[0]).toBeInTheDocument();
	});

	test('LineType renders', async () => {
		render(<LineType {...LineType.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get lines
		const lines = await findAllMarksByGroupName(prism, 'line0');
		expect(lines.length).toEqual(4);
		expect(lines[0].getAttribute('stroke-dasharray')).toEqual('');
		expect(lines[1].getAttribute('stroke-dasharray')).toEqual('7,4');
		expect(lines[2].getAttribute('stroke-dasharray')).toEqual('2,3');
		expect(lines[3].getAttribute('stroke-dasharray')).toEqual('2,3,7,4');
	});

	test('Opacity renders', async () => {
		render(<Opacity {...Opacity.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get lines
		const lines = await findAllMarksByGroupName(prism, 'line0');
		expect(lines.length).toEqual(4);
		expect(lines[0].getAttribute('stroke-opacity')).toEqual('0.6');
	});

	test('HistoricalCompare renders', async () => {
		render(<HistoricalCompare {...HistoricalCompare.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get lines
		const lines = await findAllMarksByGroupName(prism, 'line0');
		expect(lines.length).toEqual(4);
		// dotted teal line
		expect(lines[0].getAttribute('stroke-dasharray')).toEqual('2,3');
		expect(lines[0].getAttribute('stroke')).toEqual('rgb(15, 181, 174)');
		// solid teal line
		expect(lines[1].getAttribute('stroke-dasharray')).toEqual('');
		expect(lines[1].getAttribute('stroke')).toEqual('rgb(15, 181, 174)');
		// dotted purple line
		expect(lines[2].getAttribute('stroke-dasharray')).toEqual('2,3');
		expect(lines[3].getAttribute('stroke')).toEqual('rgb(64, 70, 202)');
		// solid purple line
		expect(lines[3].getAttribute('stroke-dasharray')).toEqual('');
		expect(lines[3].getAttribute('stroke')).toEqual('rgb(64, 70, 202)');
	});

	test('Hovering over the entries on HistoricalCompare should highlight hovered series', async () => {
		render(<HistoricalCompare {...HistoricalCompare.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		const entries = getAllLegendEntries(prism);
		expect(entries.length).toEqual(4);
		await hoverNthElement(entries, 0);

		// symbol stroke and fill opacity should be divided by the HIGHLIGHT_CONTRAST_RATIO for all but the first symbol
		let symbols = getAllLegendSymbols(prism);
		expect(symbols[0]).toHaveAttribute('fill-opacity', '0.5');
		expect(symbols[0]).toHaveAttribute('stroke-opacity', '1');
		expect(symbols[1]).toHaveAttribute('fill-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[1]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[2]).toHaveAttribute('fill-opacity', `${0.5 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[2]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[3]).toHaveAttribute('fill-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[3]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);

		// stroke opacity should be divided by the HIGHLIGHT_CONTRAST_RATIO for all but the first line
		let lines = await findAllMarksByGroupName(prism, 'line0');
		expect(lines[0]).toHaveAttribute('stroke-opacity', '1');
		expect(lines[1]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(lines[2]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(lines[3]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);

		await unhoverNthElement(entries, 0);
		await hoverNthElement(entries, 3);

		// symbol stroke and fill opacity should be divided by the HIGHLIGHT_CONTRAST_RATIO for all but the last symbol
		symbols = getAllLegendSymbols(prism);
		expect(symbols[0]).toHaveAttribute('fill-opacity', `${0.5 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[0]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[1]).toHaveAttribute('fill-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[1]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[2]).toHaveAttribute('fill-opacity', `${0.5 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[2]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[3]).toHaveAttribute('fill-opacity', '1');
		expect(symbols[3]).toHaveAttribute('stroke-opacity', '1');

		// stroke opacity should be divided by the HIGHLIGHT_CONTRAST_RATIO for all but the last line
		lines = await findAllMarksByGroupName(prism, 'line0');
		expect(lines[0]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(lines[1]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(lines[2]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(lines[3]).toHaveAttribute('stroke-opacity', '1');
	});

	test('Trend scale renders', async () => {
		render(<TrendScale {...TrendScale.args} />);
		expect(await screen.findByRole('graphics-document')).toBeInTheDocument();
	});

	test('Linear scale renders', async () => {
		render(<LinearTrendScale {...LinearTrendScale.args} />);
		expect(await screen.findByRole('graphics-document')).toBeInTheDocument();
		// if the linear axis isn't set correctly, 14 won't be on the x-axis
		expect(await screen.findByText('14')).toBeInTheDocument();
	});

	test('Tooltip should show on hover', async () => {
		render(<Tooltip {...Tooltip.args} />);
		const prism = await findPrism();
		expect(prism).toBeInTheDocument();

		// get voronoi paths
		const paths = await findAllMarksByGroupName(prism, 'line0Voronoi');

		// hover and validate all hover components are visible
		await hoverNthElement(paths, 0);
		const tooltip = await screen.findByTestId('prism-tooltip');
		expect(tooltip).toBeInTheDocument();
		expect(within(tooltip).getByText('Nov 8')).toBeInTheDocument();
	});
});
