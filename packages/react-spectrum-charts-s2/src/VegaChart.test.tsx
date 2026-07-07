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

import { getTitleFontShorthand } from '@spectrum-charts/vega-spec-builder-s2';

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

// Overrides document.fonts (not implemented by jsdom) for the duration of a test. jest.spyOn
// can't reach it because it lives on the prototype, not the document instance.
const stubDocumentFonts = (fonts: unknown): (() => void) => {
	const savedDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts');
	Object.defineProperty(document, 'fonts', { get: () => fonts, configurable: true });
	return () => {
		if (savedDescriptor) {
			Object.defineProperty(document, 'fonts', savedDescriptor);
		} else {
			delete (document as unknown as Record<string, unknown>).fonts;
		}
	};
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

describe('title wrapping after font load', () => {
	let mockView: View;

	beforeEach(() => {
		jest.clearAllMocks();
		mockView = createMockView();
		mockEmbed.mockResolvedValue({ view: mockView } as unknown as Awaited<ReturnType<typeof embed>>);
	});

  afterEach(() => {
		jest.restoreAllMocks();
	});

	test('does not call view.signal when spec has no title signals', async () => {
		render(<VegaChart {...defaultProps} />);
		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
		// flush all pending promises so the fonts.ready path would have had a chance to run
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(mockView.signal).not.toHaveBeenCalled();
	});

	test('sets rscWrappedTitleText after fonts load when spec has a title signal', async () => {
		const titleSpec: Spec = {
			signals: [{ name: 'rscTitleText', value: 'My Title' }],
		};
		(mockView.signal as jest.Mock)
			.mockReturnValueOnce('My Title') // read rscTitleText
			.mockReturnValueOnce(440) // read rscTitleLimit
			.mockReturnValue(mockView); // write rscWrappedTitleText — return view for .runAsync() chaining

		render(<VegaChart {...defaultProps} spec={titleSpec} />);

		await waitFor(() =>
			expect(mockView.signal).toHaveBeenCalledWith('rscWrappedTitleText', expect.any(Array))
		);
	});

	test('skips signal update when title text is empty', async () => {
		const titleSpec: Spec = {
			signals: [{ name: 'rscTitleText', value: '' }],
		};
		(mockView.signal as jest.Mock).mockReturnValueOnce('');

		render(<VegaChart {...defaultProps} spec={titleSpec} />);
		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(mockView.signal).not.toHaveBeenCalledWith('rscWrappedTitleText', expect.any(Array));
	});

	test('skips signal update when view is stale at font load time', async () => {
		let resolveFontsReady!: () => void;
		const deferred = new Promise<void>((resolve) => {
			resolveFontsReady = resolve;
		});

		// `load` resolves immediately so the pre-embed gate doesn't block this test's initial
		// embed() call; `ready` stays pending so we control when the post-embed corrective path fires.
		const restoreFonts = stubDocumentFonts({ load: jest.fn().mockResolvedValue([]), ready: deferred });

		const titleSpec: Spec = {
			signals: [{ name: 'rscTitleText', value: 'My Title' }],
		};

		const { unmount } = render(<VegaChart {...defaultProps} spec={titleSpec} />);
		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));

		// Unmount sets chartView.current = undefined via effect cleanup
		unmount();

		// Resolve fonts.ready after unmount — stale view guard should prevent signal update
		resolveFontsReady();
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(mockView.signal).not.toHaveBeenCalledWith('rscWrappedTitleText', expect.any(Array));

		restoreFonts();
	});
});

describe('initial embed font readiness gate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockEmbed.mockResolvedValue({ view: createMockView() } as unknown as Awaited<ReturnType<typeof embed>>);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	const titleSpec: Spec = { signals: [{ name: 'rscTitleText', value: 'My Title' }] };

	test('delays the initial embed until document.fonts.load resolves when a title is present', async () => {
		let resolveLoad!: () => void;
		const load = jest.fn().mockReturnValue(new Promise<void>((resolve) => (resolveLoad = resolve)));
		const restoreFonts = stubDocumentFonts({ load });

		render(<VegaChart {...defaultProps} spec={titleSpec} />);

		expect(load).toHaveBeenCalledTimes(1);
		expect(mockEmbed).not.toHaveBeenCalled();

		resolveLoad();
		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));

		restoreFonts();
	});

	test('calls document.fonts.load with the same font shorthand wrapTitleText measures with', async () => {
		const load = jest.fn().mockResolvedValue([]);
		const restoreFonts = stubDocumentFonts({ load });

		render(<VegaChart {...defaultProps} spec={titleSpec} />);

		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
		expect(load).toHaveBeenCalledWith(getTitleFontShorthand());

		restoreFonts();
	});

	test('does not call document.fonts.load and embeds immediately when there is no title', async () => {
		const load = jest.fn().mockResolvedValue([]);
		const restoreFonts = stubDocumentFonts({ load });

		render(<VegaChart {...defaultProps} />);

		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
		expect(load).not.toHaveBeenCalled();

		restoreFonts();
	});

	test('does not call document.fonts.load and embeds immediately when the title is an empty string', async () => {
		const load = jest.fn().mockResolvedValue([]);
		const restoreFonts = stubDocumentFonts({ load });
		const emptyTitleSpec: Spec = { signals: [{ name: 'rscTitleText', value: '' }] };

		render(<VegaChart {...defaultProps} spec={emptyTitleSpec} />);

		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
		expect(load).not.toHaveBeenCalled();

		restoreFonts();
	});

	test('still embeds if document.fonts.load rejects', async () => {
		const load = jest.fn().mockRejectedValue(new Error('font fetch failed'));
		const restoreFonts = stubDocumentFonts({ load });

		render(<VegaChart {...defaultProps} spec={titleSpec} />);

		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));

		restoreFonts();
	});

	test('proceeds with the initial embed after the timeout even if document.fonts.load never resolves', async () => {
		jest.useFakeTimers();
		const load = jest.fn().mockReturnValue(new Promise(() => {}));
		const restoreFonts = stubDocumentFonts({ load });

		render(<VegaChart {...defaultProps} spec={titleSpec} />);
		expect(mockEmbed).not.toHaveBeenCalled();

		await jest.advanceTimersByTimeAsync(250);

		expect(mockEmbed).toHaveBeenCalledTimes(1);

		restoreFonts();
	});

	test('gates only the first embed — a later re-embed does not wait on document.fonts.load again', async () => {
		const load = jest.fn().mockResolvedValue([]);
		const restoreFonts = stubDocumentFonts({ load });

		const { rerender } = render(<VegaChart {...defaultProps} spec={titleSpec} />);
		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
		expect(load).toHaveBeenCalledTimes(1);

		// A new spec object reference (e.g. from a hover-driven prop update upstream) re-runs the
		// embed effect; it must re-embed synchronously rather than waiting on the font again.
		const secondTitleSpec: Spec = { signals: [{ name: 'rscTitleText', value: 'My Title' }] };
		rerender(<VegaChart {...defaultProps} spec={secondTitleSpec} />);

		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(2));
		expect(load).toHaveBeenCalledTimes(1);

		restoreFonts();
	});

	test('does not gate a title that first appears after an untitled initial mount', async () => {
		const load = jest.fn().mockResolvedValue([]);
		const restoreFonts = stubDocumentFonts({ load });

		const { rerender } = render(<VegaChart {...defaultProps} spec={defaultSpec} />);
		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
		expect(load).not.toHaveBeenCalled();

		// Title arrives on a later render (e.g. computed from async data) — this must not be
		// treated as the "initial" embed and delayed, since the chart is already visible.
		rerender(<VegaChart {...defaultProps} spec={titleSpec} />);

		await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(2));
		expect(load).not.toHaveBeenCalled();

		restoreFonts();
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
