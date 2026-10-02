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

import { ANIMATION_TIMER } from '@spectrum-charts/constants';

import { VegaChart, VegaChartProps, resizeView } from './VegaChart';
import { attachAnimationTicker } from './animation/animationTicker';

jest.mock('vega-embed');
jest.mock('./animation/animationTicker', () => ({
	...jest.requireActual('./animation/animationTicker'),
	attachAnimationTicker: jest.fn(),
}));

const mockAttachAnimationTicker = jest.mocked(attachAnimationTicker);
const mockDetachAnimationTicker = jest.fn();

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
		mockAttachAnimationTicker.mockReturnValue(mockDetachAnimationTicker);
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

	describe('animation ticker', () => {
		const animatedSpec: Spec = {
			signals: [{ name: ANIMATION_TIMER, value: 0, on: [{ events: { type: 'timer', throttle: 33 }, update: 'now()' }] }],
		};

		test('removes the vega timer event and attaches the ticker for animated specs', async () => {
			const { container } = render(<VegaChart {...defaultProps} spec={animatedSpec} />);

			await waitFor(() => expect(mockAttachAnimationTicker).toHaveBeenCalledTimes(1));
			expect((mockEmbed.mock.calls[0][1] as Spec).signals).toEqual([{ name: ANIMATION_TIMER, value: 0 }]);
			// the original spec is not mutated
			expect(animatedSpec.signals?.[0]).toHaveProperty('on');
			expect(mockAttachAnimationTicker).toHaveBeenCalledWith(expect.anything(), container.querySelector('.rsc'));
		});

		test('detaches the ticker on unmount', async () => {
			const { unmount } = render(<VegaChart {...defaultProps} spec={animatedSpec} />);
			await waitFor(() => expect(mockAttachAnimationTicker).toHaveBeenCalledTimes(1));

			unmount();

			expect(mockDetachAnimationTicker).toHaveBeenCalledTimes(1);
		});

		test('discards a view whose embed resolves after unmount', async () => {
			let resolveEmbed: (value: Awaited<ReturnType<typeof embed>>) => void = () => {};
			mockEmbed.mockReturnValueOnce(new Promise((resolve) => (resolveEmbed = resolve)));
			const view = createMockView();
			const { unmount } = render(<VegaChart {...defaultProps} spec={animatedSpec} />);
			await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));

			unmount();
			resolveEmbed({ view } as unknown as Awaited<ReturnType<typeof embed>>);
			await Promise.resolve();

			expect(view.finalize).toHaveBeenCalledTimes(1);
			expect(mockAttachAnimationTicker).not.toHaveBeenCalled();
			expect(defaultProps.onNewView).not.toHaveBeenCalled();
		});

		test('does not attach the ticker for non-animated specs', async () => {
			render(<VegaChart {...defaultProps} />);

			await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
			expect(mockAttachAnimationTicker).not.toHaveBeenCalled();
		});
	});
});
