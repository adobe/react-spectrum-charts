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
import React, { createRef } from 'react';

import { HIGHLIGHT_CONTRAST_RATIO } from '@spectrum-charts/constants';

import { Chart } from '../Chart';
import { Axis, Bar, ChartTooltip, Line } from '../components';
import { findChart, getAllMarksByGroupName, hoverNthElement, render, screen } from '../test-utils';
import '../test-utils/__mocks__/matchMedia.mock.js';
import { ChartHandle } from '../types';
import { getElement } from '../utils';
import { BackgroundColor, Basic, Config, Height, HighlightedItem, Locale, TooltipAnchor, Width } from './Chart.story';
import {
	CssColors,
	SpectrumColorNames,
	SpectrumDivergentColorScheme,
	SpectrumSequentialColorScheme,
} from './ChartColors.story';
import { EmptyState, LoadingState } from './ChartStates.story';
import { data } from './data/data';

const PopoverTest = (
	<Chart data={[]} renderer="svg">
		<Axis position="left" />
		<Bar />
		<Bar>
			<ChartTooltip />
		</Bar>
	</Chart>
);

describe('Chart', () => {
	test('Basic renders properly', async () => {
		render(<Basic {...Basic.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Config renders properly', async () => {
		render(<Config {...Config.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	describe('Locale', () => {
		test('Locale sets the time and number format correctly for fr-FR', async () => {
			render(<Locale {...Locale.args} locale="fr-FR" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(screen.getByText('nov.')).toBeInTheDocument();
			expect(screen.getByText('5 000,00')).toBeInTheDocument();
		});
		test('Locale sets the time and number format correctly for de-DE', async () => {
			render(<Locale {...Locale.args} locale="de-DE" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(screen.getByText('Nov')).toBeInTheDocument();
			expect(screen.getByText('5.000,00')).toBeInTheDocument();
		});
		test('Locale sets the time and number format correctly for en-US', async () => {
			render(<Locale {...Locale.args} locale="en-US" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			expect(screen.getByText('Nov')).toBeInTheDocument();
			expect(screen.getByText('5,000.00')).toBeInTheDocument();
		});
	});

	test('Width renders properly', async () => {
		render(<Width {...Width.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Width renders properly with invalid width', async () => {
		render(<Width {...Width.args} width="50.2%" />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Height renders properly', async () => {
		render(<Height {...Height.args} />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Height renders properly with invalid Height', async () => {
		render(<Height {...Height.args} height="50.2%" />);
		const chart = await findChart();
		expect(chart).toBeInTheDocument();
	});

	test('Chart does not render if the width or height are 0', () => {
		render(<Width {...Width.args} width={0} />);
		expect(screen.queryByRole('graphics-document')).not.toBeInTheDocument();
		render(<Width {...Width.args} height={0} />);
		expect(screen.queryByRole('graphics-document')).not.toBeInTheDocument();
	});

	test('Existence of children and UNSAFE_vegaSpec throw an error', async () => {
		expect(() => {
			render(<Basic UNSAFE_vegaSpec={{}} {...Basic.args} />);
		}).toThrowError();
	});

	describe('Color stories', () => {
		test('Spectrum colors render correctly (light)', async () => {
			render(<SpectrumColorNames {...SpectrumColorNames.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();
			const bars = getAllMarksByGroupName(chart, 'bar0');

			expect(bars[0].getAttribute('fill')).toEqual('rgb(34, 34, 34)');
			expect(bars[1].getAttribute('fill')).toEqual('rgb(70, 70, 70)');
			expect(bars[2].getAttribute('fill')).toEqual('rgb(109, 109, 109)');
			expect(bars[3].getAttribute('fill')).toEqual('rgb(144, 144, 144)');
		});

		test('Spectrum colors render correctly (dark)', async () => {
			render(<SpectrumColorNames {...SpectrumColorNames.args} colorScheme="dark" />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();
			const bars = getAllMarksByGroupName(chart, 'bar0');

			expect(bars[0].getAttribute('fill')).toEqual('rgb(235, 235, 235)');
			expect(bars[1].getAttribute('fill')).toEqual('rgb(208, 208, 208)');
			expect(bars[2].getAttribute('fill')).toEqual('rgb(176, 176, 176)');
			expect(bars[3].getAttribute('fill')).toEqual('rgb(141, 141, 141)');
		});

		test('Spectrum diverging color scheme renders correctly', async () => {
			render(<SpectrumDivergentColorScheme {...SpectrumDivergentColorScheme.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();
			const bars = getAllMarksByGroupName(chart, 'bar0');

			expect(bars[0].getAttribute('fill')).toEqual('rgb(88, 0, 0)');
			expect(bars[1].getAttribute('fill')).toEqual('rgb(221, 134, 41)');
			expect(bars[2].getAttribute('fill')).toEqual('rgb(255, 255, 224)');
			expect(bars[3].getAttribute('fill')).toEqual('rgb(62, 168, 166)');
		});

		test('Spectrum sequential color scheme renders correctly', async () => {
			render(<SpectrumSequentialColorScheme {...SpectrumSequentialColorScheme.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();
			const bars = getAllMarksByGroupName(chart, 'bar0');

			expect(bars[0].getAttribute('fill')).toEqual('rgb(113, 213, 202)');
			expect(bars[1].getAttribute('fill')).toEqual('rgb(234, 255, 241)');
			expect(bars[2].getAttribute('fill')).toEqual('rgb(48, 145, 170)');
			expect(bars[3].getAttribute('fill')).toEqual('rgb(29, 76, 129)');
		});

		test('CSS colors renders correctly', async () => {
			render(<CssColors {...CssColors.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();
			const bars = getAllMarksByGroupName(chart, 'bar0');

			expect(bars[0].getAttribute('fill')).toEqual('purple');
			expect(bars[1].getAttribute('fill')).toEqual('rgb(38, 142, 108)');
			expect(bars[2].getAttribute('fill')).toEqual('#0d66d0');
			expect(bars[3].getAttribute('fill')).toEqual('hsl(32deg, 86%, 46%)');
		});

		test('background color gets set', async () => {
			render(<BackgroundColor {...BackgroundColor.args} />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();

			const svg = chart.querySelector('svg');
			expect(svg).toHaveStyle('background-color: rgb(255, 255, 255);');

			const container = document.querySelector('.rsc-container > div');
			expect(container).toHaveStyle('background-color: rgb(255, 255, 255);');
		});
	});

	describe('State stories', () => {
		test('Empty state renders correctly', async () => {
			render(<EmptyState {...EmptyState.args} />);
			const text = screen.getByText('No data found');
			expect(text).toBeInTheDocument();
		});

		test('Loading state renders correctly', async () => {
			render(<LoadingState {...LoadingState.args} />);
			const progressCircle = screen.getByRole('progressbar');
			expect(progressCircle).toBeInTheDocument();
		});
	});

	describe('Handles', () => {
		test('Copy and download resolve/reject', async () => {
			const ref = createRef<ChartHandle>();
			render(
				<Chart data={data} ref={ref}>
					<Line dimension="x" metric="y" />
				</Chart>
			);
			if (ref.current) {
				// should reject since the chart isn't done rendering
				await expect(ref.current.copy()).rejects.toThrowError(
					"There isn't a chart to copy, copy to clipboard failed"
				);
				await expect(ref.current.download()).rejects.toThrowError(
					"There isn't a chart to download, download failed"
				);
				const chart = await findChart();
				expect(chart).toBeInTheDocument();
				// should reject because fetch isn't mocked
				await expect(ref.current.copy()).rejects.toThrowError(
					'Error occurred while fetching image, copy to clipboard failed'
				);
				// should resolve
				await expect(ref.current.download()).resolves.toBe('Chart downloaded as chart_export.png');
			}
		});
		test('download uses supplied filename', async () => {
			const ref = createRef<ChartHandle>();
			render(
				<Chart data={data} ref={ref} width={200}>
					<Line dimension="x" metric="y" />
				</Chart>
			);
			if (ref.current) {
				// should reject since the chart isn't done rendering
				await expect(ref.current.download()).rejects.toThrowError(
					"There isn't a chart to download, download failed"
				);
				const chart = await findChart();
				expect(chart).toBeInTheDocument();
				// should resolve
				await expect(ref.current.download('My filename')).resolves.toBe('Chart downloaded as My filename.png');
			}
		});
		test('getBase64Png returns an svg string', async () => {
			const ref = createRef<ChartHandle>();
			render(
				<Chart data={data} ref={ref} width={200}>
					<Line dimension="x" metric="y" />
				</Chart>
			);
			if (ref.current) {
				// should reject since the chart isn't done rendering
				await expect(ref.current.getBase64Png()).rejects.toThrowError(
					"There isn't a chart to get the PNG from, get base64 PNG failed"
				);
			}
		});
		test('getSvg returns an svg string', async () => {
			const ref = createRef<ChartHandle>();
			render(
				<Chart data={data} ref={ref} width={200}>
					<Line dimension="x" metric="y" />
				</Chart>
			);
			if (ref.current) {
				// should reject since the chart isn't done rendering
				await expect(ref.current.getSvg()).rejects.toThrowError(
					"There isn't a chart to get the SVG from, get SVG failed"
				);
				const chart = await findChart();
				expect(chart).toBeInTheDocument();
				// should resolve and return an svg string
				await expect(ref.current.getSvg()).resolves.toMatch(/^<svg/i);
			}
		});
	});

	describe('getElement()', () => {
		test('should find the first tooltip', () => {
			expect(getElement(PopoverTest, ChartTooltip)).toStrictEqual(<ChartTooltip />);
		});

		test('should find the first bar', () => {
			expect(getElement(PopoverTest, Bar)).toStrictEqual(<Bar />);
		});

		test("shouldn't find a line", () => {
			expect(getElement(PopoverTest, Line)).toStrictEqual(undefined);
		});
	});

	describe('TooltipAnchor()', () => {
		// get the integer value from a px string
		const getPxValue = (pxString: string) => parseInt(pxString.replace('px', ''), 10);

		test('should render the tooltip relative to the cursor if `tooltipAnchor` is set to `cursor`', async () => {
			render(<TooltipAnchor {...TooltipAnchor.args} tooltipAnchor="cursor" />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();
			const bars = getAllMarksByGroupName(chart, 'bar0');

			await hoverNthElement(bars, 0);
			const tooltip = document.getElementById('vg-tooltip-element');
			expect(tooltip).toBeInTheDocument();
			if (!tooltip) return;

			// will be at 10, 10 since the cursor is at 0, 0 and the offset is 10
			expect(getPxValue(tooltip.style.getPropertyValue('top'))).toBe(10);
			expect(getPxValue(tooltip.style.getPropertyValue('left'))).toBe(10);
		});

		test('should render the tooltip relative to the mark if `tooltipAnchor` is set to `mark`', async () => {
			render(<TooltipAnchor {...TooltipAnchor.args} tooltipAnchor="mark" tooltipPlacement="top" />);

			const chart = await findChart();
			expect(chart).toBeInTheDocument();
			const bars = getAllMarksByGroupName(chart, 'bar0');

			await hoverNthElement(bars, 0);
			const tooltip = document.getElementById('vg-tooltip-element');
			expect(tooltip).toBeInTheDocument();
			if (!tooltip) return;

			expect(getPxValue(tooltip.style.getPropertyValue('top'))).toBe(239);
			expect(getPxValue(tooltip.style.getPropertyValue('left'))).toBe(35);
		});

		test('should render the tooltip to the right of the mark if placement is right', async () => {
			render(<TooltipAnchor {...TooltipAnchor.args} tooltipAnchor="mark" tooltipPlacement="bottom" />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();
			const bars = getAllMarksByGroupName(chart, 'bar0');

			await hoverNthElement(bars, 0);
			const tooltip = document.getElementById('vg-tooltip-element');
			expect(tooltip).toBeInTheDocument();
			if (!tooltip) return;

			expect(getPxValue(tooltip.style.getPropertyValue('top'))).toBe(284);
			expect(getPxValue(tooltip.style.getPropertyValue('left'))).toBe(35);
		});
	});

	describe('HighlightedItem', () => {
		test('highlightedItem should be highlighted', async () => {
			render(<HighlightedItem {...HighlightedItem.args} />);
			const chart = await findChart();
			expect(chart).toBeInTheDocument();
			const bars = getAllMarksByGroupName(chart, 'bar0');

			expect(bars[14]).toHaveAttribute('opacity', '1');
			expect(bars[13]).toHaveAttribute('opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
			expect(bars[15]).toHaveAttribute('opacity', `${1 / HIGHLIGHT_CONTRAST_RATIO}`);
		});
	});
});
