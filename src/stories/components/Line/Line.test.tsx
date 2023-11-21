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

import { HIGHLIGHT_CONTRAST_RATIO } from '@constants';
import '@matchMediaMock';
import { Line } from '@rsc';
import {
	clickNthElement,
	findAllMarksByGroupName,
	findChart,
	findMarksByGroupName,
	getAllLegendEntries,
	getAllLegendSymbols,
	hoverNthElement,
	render,
	screen,
	unhoverNthElement,
	within,
} from '@test-utils';

import {
	Basic,
	HistoricalCompare,
	LineType,
	LineWithAxisAndLegend,
	LinearTrendScale,
	Opacity,
	Tooltip,
	TrendScale,
	WithStaticPoints,
	WithStaticPointsAndDialogs,
} from './Line.story';

describe('Line', () => {
	// Line is not a real React component. This is test just provides test coverage for sonarqube
	test('Line pseudo element', () => {
		render(<Line />);
	});

	test('Basic renders', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get lines
		const lines = await findAllMarksByGroupName(chart, 'line0');
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
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get lines
		const lines = await findAllMarksByGroupName(chart, 'line0');
		expect(lines.length).toEqual(4);
		expect(lines[0].getAttribute('stroke-dasharray')).toEqual('');
		expect(lines[1].getAttribute('stroke-dasharray')).toEqual('7,4');
		expect(lines[2].getAttribute('stroke-dasharray')).toEqual('2,3');
		expect(lines[3].getAttribute('stroke-dasharray')).toEqual('2,3,7,4');
	});

	test('Opacity renders', async () => {
		render(<Opacity {...Opacity.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get lines
		const lines = await findAllMarksByGroupName(chart, 'line0');
		expect(lines.length).toEqual(4);
		expect(lines[0].getAttribute('stroke-opacity')).toEqual('0.6');
	});

	test('HistoricalCompare renders', async () => {
		render(<HistoricalCompare {...HistoricalCompare.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		// get lines
		const lines = await findAllMarksByGroupName(chart, 'line0');
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
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const entries = getAllLegendEntries(chart);
		expect(entries.length).toEqual(4);
		await hoverNthElement(entries, 0);

		// symbol stroke and fill opacity should be divided by the HIGHLIGHT_CONTRAST_RATIO for all but the first symbol
		let symbols = getAllLegendSymbols(chart);
		expect(symbols[0]).toHaveAttribute('fill-opacity', '0.5');
		expect(symbols[0]).toHaveAttribute('stroke-opacity', '1');
		expect(symbols[1]).toHaveAttribute('fill-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[1]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[2]).toHaveAttribute('fill-opacity', `${0.5 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[2]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[3]).toHaveAttribute('fill-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[3]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);

		// stroke opacity should be divided by the HIGHLIGHT_CONTRAST_RATIO for all but the first line
		let lines = await findAllMarksByGroupName(chart, 'line0');
		expect(lines[0]).toHaveAttribute('stroke-opacity', '1');
		expect(lines[1]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(lines[2]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(lines[3]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);

		await unhoverNthElement(entries, 0);
		await hoverNthElement(entries, 3);

		// symbol stroke and fill opacity should be divided by the HIGHLIGHT_CONTRAST_RATIO for all but the last symbol
		symbols = getAllLegendSymbols(chart);
		expect(symbols[0]).toHaveAttribute('fill-opacity', `${0.5 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[0]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[1]).toHaveAttribute('fill-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[1]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[2]).toHaveAttribute('fill-opacity', `${0.5 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[2]).toHaveAttribute('stroke-opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		expect(symbols[3]).toHaveAttribute('fill-opacity', '1');
		expect(symbols[3]).toHaveAttribute('stroke-opacity', '1');

		// stroke opacity should be divided by the HIGHLIGHT_CONTRAST_RATIO for all but the last line
		lines = await findAllMarksByGroupName(chart, 'line0');
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

	describe('Tooltip', () => {
		test('Tooltip should show on hover', async () => {
			render(<Tooltip {...Tooltip.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			// get voronoi paths
			const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');

			// hover and validate all hover components are visible
			await hoverNthElement(paths, 0);
			const tooltip = await screen.findByTestId('rsc-tooltip');
			expect(tooltip).toBeInTheDocument();
			expect(within(tooltip).getByText('Nov 8')).toBeInTheDocument();
		});
		test('should fade the opacity of non-hovered lines', async () => {
			render(<Tooltip {...Tooltip.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const lines = await findAllMarksByGroupName(chart, 'line0');
			expect(lines).toHaveLength(4);
			expect(lines[0]).toHaveAttribute('stroke-opacity', '1');
			expect(lines[1]).toHaveAttribute('stroke-opacity', '1');

			// get voronoi paths
			const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');

			// hover and validate all hover components are visible
			await hoverNthElement(paths, 0);

			expect(lines[0]).toHaveAttribute('stroke-opacity', '1');
			expect(lines[1]).toHaveAttribute('stroke-opacity', '0.2');
		});
	});

	test('Static points render', async () => {
		render(<WithStaticPoints {...WithStaticPoints.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();

		const points = await findAllMarksByGroupName(chart, 'line0_staticPoints');
		expect(points.length).toEqual(6);

		expect(points[0].getAttribute('fill')).toEqual('rgb(15, 181, 174)');
		expect(points[1].getAttribute('fill')).toEqual('rgb(15, 181, 174)');
		expect(points[2].getAttribute('fill')).toEqual('rgb(15, 181, 174)');
		expect(points[3].getAttribute('fill')).toEqual('rgb(64, 70, 202)');
		expect(points[4].getAttribute('fill')).toEqual('rgb(64, 70, 202)');
		expect(points[5].getAttribute('fill')).toEqual('rgb(64, 70, 202)');

		expect(points[0].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
		expect(points[1].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
		expect(points[2].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
		expect(points[3].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
		expect(points[4].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
		expect(points[5].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');

		expect(points[0].getAttribute('stroke-opacity')).toBeNull();
		expect(points[1].getAttribute('stroke-opacity')).toBeNull();
		expect(points[2].getAttribute('stroke-opacity')).toBeNull();
		expect(points[3].getAttribute('stroke-opacity')).toBeNull();
		expect(points[4].getAttribute('stroke-opacity')).toBeNull();
		expect(points[5].getAttribute('stroke-opacity')).toBeNull();
	});

	describe('Static point highlighting when there are interactive children', () => {
		test('Points show on hover', async () => {
			render(<WithStaticPointsAndDialogs {...WithStaticPointsAndDialogs.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
			// hover a place on the line without a static point
			await hoverNthElement(paths, 0);

			const backgroundPoints = await findAllMarksByGroupName(chart, 'line0_pointBackground');
			expect(backgroundPoints.length).toBe(1);
			expect(backgroundPoints[0].getAttribute('fill')).toEqual('rgb(255, 255, 255)');
			expect(backgroundPoints[0].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
			expect(backgroundPoints[0]).toHaveAttribute('stroke-width', '2');
			expect(backgroundPoints[0]).not.toHaveAttribute('fill-opacity');
			expect(backgroundPoints[0]).not.toHaveAttribute('stroke-opacity');

			const hoverPoints = await findAllMarksByGroupName(chart, 'line0_point');
			expect(hoverPoints.length).toBe(1);
			expect(hoverPoints[0].getAttribute('fill')).toEqual('rgb(255, 255, 255)');
			expect(hoverPoints[0].getAttribute('stroke')).toEqual('rgb(15, 181, 174)');
			expect(hoverPoints[0]).toHaveAttribute('stroke-width', '2');
			expect(hoverPoints[0]).toHaveAttribute('stroke-opacity', '1');
			expect(hoverPoints[0]).not.toHaveAttribute('fill-opacity');
		});

		test('Static point hovering', async () => {
			render(<WithStaticPointsAndDialogs {...WithStaticPointsAndDialogs.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const points = await findAllMarksByGroupName(chart, 'line0_staticPoints');
			expect(points.length).toEqual(6);

			expect(points[0].getAttribute('fill')).toEqual('rgb(15, 181, 174)');
			expect(points[1].getAttribute('fill')).toEqual('rgb(15, 181, 174)');
			expect(points[2].getAttribute('fill')).toEqual('rgb(15, 181, 174)');
			expect(points[3].getAttribute('fill')).toEqual('rgb(64, 70, 202)');
			expect(points[4].getAttribute('fill')).toEqual('rgb(64, 70, 202)');
			expect(points[5].getAttribute('fill')).toEqual('rgb(64, 70, 202)');

			expect(points[0].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
			expect(points[1].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
			expect(points[2].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
			expect(points[3].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
			expect(points[4].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
			expect(points[5].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');

			expect(points[0].getAttribute('stroke-opacity')).toBeNull();
			expect(points[1].getAttribute('stroke-opacity')).toBeNull();
			expect(points[2].getAttribute('stroke-opacity')).toBeNull();
			expect(points[3].getAttribute('stroke-opacity')).toBeNull();
			expect(points[4].getAttribute('stroke-opacity')).toBeNull();
			expect(points[5].getAttribute('stroke-opacity')).toBeNull();

			const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
			// hover a static point
			await hoverNthElement(paths, 1);

			const backgroundPoints = await findAllMarksByGroupName(chart, 'line0_pointBackground');
			expect(backgroundPoints.length).toBe(1);
			expect(backgroundPoints[0].getAttribute('fill')).toEqual('rgb(255, 255, 255)');
			expect(backgroundPoints[0].getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
			expect(backgroundPoints[0]).toHaveAttribute('stroke-width', '6');
			expect(backgroundPoints[0]).not.toHaveAttribute('fill-opacity');
			expect(backgroundPoints[0]).not.toHaveAttribute('stroke-opacity');

			const hoverPoints = await findAllMarksByGroupName(chart, 'line0_point');
			expect(hoverPoints.length).toBe(1);
			expect(hoverPoints[0].getAttribute('fill')).toEqual('rgb(15, 181, 174)');
			expect(hoverPoints[0].getAttribute('stroke')).toEqual('rgb(15, 181, 174)');
			expect(hoverPoints[0]).toHaveAttribute('stroke-width', '6');
			expect(hoverPoints[0]).toHaveAttribute('stroke-opacity', '0.2');
			expect(hoverPoints[0]).not.toHaveAttribute('fill-opacity');
		});
	});

	describe('selected point styling', () => {
		test('points on a line should have a selection ring around them when selected', async () => {
			render(<WithStaticPointsAndDialogs {...WithStaticPointsAndDialogs.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
			// hover a static point
			await clickNthElement(paths, 1);

			const point = await findMarksByGroupName(chart, 'line0_pointSelectRing');
			expect(point).toBeInTheDocument();

			expect(point.getAttribute('stroke')).toEqual('rgb(20, 115, 230)');
			expect(point.getAttribute('stroke-width')).toEqual('2');
		});

		test('static points should have extra wide, low opacity, series color border and series color fill when selected', async () => {
			render(<WithStaticPointsAndDialogs {...WithStaticPointsAndDialogs.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
			// select a static point
			await clickNthElement(paths, 1);

			const point = await findMarksByGroupName(chart, 'line0_point');
			expect(point).toBeInTheDocument();

			// series color fill
			expect(point.getAttribute('fill')).toEqual('rgb(15, 181, 174)');
			// extra widt low opacity series color border
			expect(point.getAttribute('stroke')).toEqual('rgb(15, 181, 174)');
			expect(point.getAttribute('stroke-opacity')).toEqual('0.2');
			expect(point.getAttribute('stroke-width')).toEqual('6');
		});

		test('standard points should have backgroundColor border and series color fill when selected', async () => {
			render(<WithStaticPointsAndDialogs {...WithStaticPointsAndDialogs.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const paths = await findAllMarksByGroupName(chart, 'line0_voronoi');
			// select a standard point
			await clickNthElement(paths, 2);

			const point = await findMarksByGroupName(chart, 'line0_point');
			expect(point).toBeInTheDocument();

			// series color fill
			expect(point.getAttribute('fill')).toEqual('rgb(15, 181, 174)');
			// full opacity backgroundColor border
			expect(point.getAttribute('stroke')).toEqual('rgb(255, 255, 255)');
			expect(point.getAttribute('stroke-opacity')).toEqual('1');
			expect(point.getAttribute('stroke-width')).toEqual('2');
		});
	});
});
