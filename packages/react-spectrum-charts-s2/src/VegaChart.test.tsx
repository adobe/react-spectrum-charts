/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { render, waitFor } from '@testing-library/react';
import { Spec, View, expressionFunction } from 'vega';
import embed from 'vega-embed';

import { VegaChart, VegaChartProps, resizeView } from './VegaChart';

jest.mock('vega-embed');

const mockEmbed = jest.mocked(embed);

const mockRunAsync = jest.fn().mockResolvedValue(undefined);
const mockResize = jest.fn().mockReturnThis();
const mockHeight = jest.fn().mockReturnThis();
const mockWidth = jest.fn().mockReturnThis();

const createMockView = (): View =>
	({
		runAsync: mockRunAsync,
		resize: mockResize,
		height: mockHeight,
		width: mockWidth,
		signal: jest.fn(),
		finalize: jest.fn(),
	}) as unknown as View;

const defaultSpec: Spec = {};

const defaultProps: VegaChartProps = {
	config: {},
	data: [],
	debug: false,
	height: 600,
	locale: undefined,
	onNewView: jest.fn(),
	padding: 0,
	renderer: 'svg',
	spec: defaultSpec,
	tooltip: {},
	width: 800,
};

describe('resizeView', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('calls width, height, resize, and runAsync twice when view exists and dimensions are valid', async () => {
		const mockView = createMockView();

		resizeView(mockView, 800, 600);
		await Promise.resolve();

		expect(mockWidth).toHaveBeenCalledWith(800);
		expect(mockHeight).toHaveBeenCalledWith(600);
		expect(mockResize).toHaveBeenCalled();
		expect(mockRunAsync).toHaveBeenCalledTimes(2);
	});

	test('does not call view methods when view is undefined', () => {
		resizeView(undefined, 800, 600);

		expect(mockWidth).not.toHaveBeenCalled();
		expect(mockHeight).not.toHaveBeenCalled();
		expect(mockResize).not.toHaveBeenCalled();
		expect(mockRunAsync).not.toHaveBeenCalled();
	});

	test('does not call view methods when width is 0', () => {
		const mockView = createMockView();

		resizeView(mockView, 0, 600);

		expect(mockWidth).not.toHaveBeenCalled();
	});

	test('does not call view methods when height is 0', () => {
		const mockView = createMockView();

		resizeView(mockView, 800, 0);

		expect(mockWidth).not.toHaveBeenCalled();
	});
});

describe('rscWrapTitle expression function', () => {
	// The function is registered at module load time when VegaChart.tsx is imported above.
	const fn = expressionFunction('rscWrapTitle') as (text: string, maxWidth: number) => string[];

	test('returns text as a single-element array when it fits on one line', () => {
		expect(fn('Page Views by Region', 440)).toStrictEqual(['Page Views by Region']);
	});

	test('wraps text onto multiple lines when it exceeds maxWidth', () => {
		// jsdom measureText returns text.length px; maxWidth=40 fits "...by Product" (35) but not "...Category" (44)
		expect(fn('Quarterly Revenue Growth by Product Category and Geographic Region', 40)).toStrictEqual([
			'Quarterly Revenue Growth by Product',
			'Category and Geographic Region',
		]);
	});
});

describe('rscContainerWidth expression function', () => {
	// The function is registered at module load time when VegaChart.tsx is imported above.
	const fn = expressionFunction('rscContainerWidth') as (this: unknown) => number;

	const makeCtx = (viewWidth: number | undefined, padding: unknown) => ({
		context: { dataflow: { padding: () => padding, _viewWidth: viewWidth } },
	});

	test('returns _viewWidth plus left and right padding', () => {
		expect(fn.call(makeCtx(380, { left: 10, right: 10, top: 5, bottom: 5 }))).toBe(400);
	});

	test('returns _viewWidth when padding has no left or right keys', () => {
		expect(fn.call(makeCtx(400, { top: 5, bottom: 5 }))).toBe(400);
	});

	test('returns padding sum when _viewWidth is undefined', () => {
		expect(fn.call(makeCtx(undefined, { left: 20, right: 20 }))).toBe(40);
	});
});

// AN-445759: regression tests for the init render cycle fix
describe('VegaChart init render cycle', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockEmbed.mockResolvedValue({ view: createMockView() } as unknown as Awaited<ReturnType<typeof embed>>);
	});

	test('calls embed on initial mount with valid dimensions', async () => {
		render(<VegaChart {...defaultProps} />);

		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
	});

	test('does not call embed on initial mount with zero dimensions', () => {
		render(<VegaChart {...defaultProps} width={0} height={0} />);

		expect(mockEmbed).not.toHaveBeenCalled();
	});

	test('calls embed when dimensions become valid after starting at zero', async () => {
		const { rerender } = render(<VegaChart {...defaultProps} width={0} height={0} />);
		expect(mockEmbed).not.toHaveBeenCalled();

		rerender(<VegaChart {...defaultProps} width={800} height={600} />);

		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
	});
});
