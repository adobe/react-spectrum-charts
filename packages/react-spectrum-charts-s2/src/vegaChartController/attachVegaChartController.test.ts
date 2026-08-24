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
import { Spec, View, expressionFunction } from 'vega';
import embed from 'vega-embed';

import { VegaChartInteractionConfig } from './interactionConfig';
import { VegaChartControllerProps, attachVegaChartController, resizeView } from './attachVegaChartController';

jest.mock('vega-embed');

const mockEmbed = jest.mocked(embed);

const mockRunAsync = jest.fn().mockResolvedValue(undefined);
const mockResize = jest.fn().mockReturnThis();
const mockHeight = jest.fn().mockReturnThis();
const mockWidth = jest.fn().mockReturnThis();
const mockSignal = jest.fn();
const mockAddEventListener = jest.fn();

const createMockView = (): View =>
  ({
    runAsync: mockRunAsync,
    resize: mockResize,
    height: mockHeight,
    width: mockWidth,
    finalize: jest.fn(),
    signal: mockSignal,
    addEventListener: mockAddEventListener,
  }) as unknown as View;

const defaultSpec: Spec = {};

const defaultProps: VegaChartControllerProps = {
  chartData: { table: [] },
  config: {},
  data: [],
  height: 600,
  locale: undefined,
  onNewView: jest.fn(),
  padding: 0,
  renderer: 'svg',
  spec: defaultSpec,
  tooltip: {},
  width: 800,
};

const makeInteractionConfig = (
  overrides: Partial<VegaChartInteractionConfig> = {}
): VegaChartInteractionConfig => ({
  chartId: 'test',
  idKey: 'id',
  markClickDetails: [],
  markMouseInputDetails: [],
  axisLabelOnClickDetails: [],
  legend: {},
  popovers: [],
  refs: {
    chartView: { current: undefined },
    selectedData: { current: null },
    selectedDataName: { current: '' },
    selectedDataBounds: { current: { x1: 0, x2: 0, y1: 0, y2: 0 } },
  },
  ...overrides,
});

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
  // The function is registered at module load time when attachVegaChartController.ts is imported
  // above, guarded to browser-only execution — jsdom provides `window`, so it still registers here.
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

describe('rscContainerWidth SSR guard', () => {
  test('does not throw when registered without a window (module load under SSR)', () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error -- simulating a non-browser module evaluation environment
    delete globalThis.window;

    jest.resetModules();
    expect(() => require('./attachVegaChartController')).not.toThrow();

    globalThis.window = originalWindow;
    jest.resetModules();
  });
});

describe('attachVegaChartController', () => {
  let container: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSignal.mockReturnValue(undefined);
    container = document.createElement('div');
  });

  test('embeds on construct, exposes the view via getView, and destroy tears it down', async () => {
    const mockView = createMockView();
    mockEmbed.mockResolvedValue({ view: mockView } as unknown as Awaited<ReturnType<typeof embed>>);

    const handle = attachVegaChartController(container, defaultProps);
    expect(handle.getView()).toBeUndefined();

    await Promise.resolve();
    await Promise.resolve();

    expect(mockEmbed).toHaveBeenCalledTimes(1);
    expect(defaultProps.onNewView).toHaveBeenCalledWith(mockView);
    expect(handle.getView()).toBe(mockView);

    handle.destroy();
    expect(mockView.finalize).toHaveBeenCalledTimes(1);
    expect(handle.getView()).toBeUndefined();
  });

  test('does not embed when width or height is 0', () => {
    attachVegaChartController(container, { ...defaultProps, width: 0, height: 0 });
    expect(mockEmbed).not.toHaveBeenCalled();
  });

  test('resize() triggers the initial embed when starting at 0×0 with no prior attempt', async () => {
    const mockView = createMockView();
    mockEmbed.mockResolvedValue({ view: mockView } as unknown as Awaited<ReturnType<typeof embed>>);

    const handle = attachVegaChartController(container, { ...defaultProps, width: 0, height: 0 });
    expect(mockEmbed).not.toHaveBeenCalled();

    handle.resize(800, 600);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockEmbed).toHaveBeenCalledTimes(1);
  });

  test('resize() calls resizeView (cheap path) once a view already exists', async () => {
    const mockView = createMockView();
    mockEmbed.mockResolvedValue({ view: mockView } as unknown as Awaited<ReturnType<typeof embed>>);

    const handle = attachVegaChartController(container, defaultProps);
    await Promise.resolve();
    await Promise.resolve();

    handle.resize(900, 700);
    await Promise.resolve();

    expect(mockEmbed).toHaveBeenCalledTimes(1); // no second embed call
    expect(mockWidth).toHaveBeenCalledWith(900);
    expect(mockHeight).toHaveBeenCalledWith(700);
  });

  // Regression test for the confirmed React Strict Mode double-invoke race: mount → cleanup → mount,
  // fully synchronous, both happening before either embed() promise has resolved.
  test('a destroy()ed instance finalizes its own late-resolving view instead of wiring it up, once a newer instance has taken over', async () => {
    const firstView = createMockView();
    const secondView = createMockView();
    mockEmbed
      .mockResolvedValueOnce({ view: firstView } as unknown as Awaited<ReturnType<typeof embed>>)
      .mockResolvedValueOnce({ view: secondView } as unknown as Awaited<ReturnType<typeof embed>>);
    const onNewView = jest.fn();
    const props = { ...defaultProps, onNewView };

    const firstHandle = attachVegaChartController(container, props);
    firstHandle.destroy(); // cleanup runs before embed() resolves, per Strict Mode's synchronous double-invoke
    const secondHandle = attachVegaChartController(container, props);

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(onNewView).toHaveBeenCalledTimes(1);
    expect(onNewView).toHaveBeenCalledWith(secondView);
    expect(firstView.finalize).toHaveBeenCalledTimes(1);
    expect(secondView.finalize).not.toHaveBeenCalled();
    expect(secondHandle.getView()).toBe(secondView);
  });

  // Regression test for the same race, but within a single instance: rapid prop updates before the
  // first embed() resolves should leave only the latest embedView()'s view wired up.
  test('a superseded embedView() call on the same instance finalizes its own late-resolving view', async () => {
    const firstView = createMockView();
    const secondView = createMockView();
    mockEmbed
      .mockResolvedValueOnce({ view: firstView } as unknown as Awaited<ReturnType<typeof embed>>)
      .mockResolvedValueOnce({ view: secondView } as unknown as Awaited<ReturnType<typeof embed>>);
    const onNewView = jest.fn();

    const handle = attachVegaChartController(container, { ...defaultProps, onNewView });
    handle.updateSpec({ ...defaultProps, onNewView, height: 601 });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(onNewView).toHaveBeenCalledTimes(1);
    expect(onNewView).toHaveBeenCalledWith(secondView);
    expect(firstView.finalize).toHaveBeenCalledTimes(1);
    expect(secondView.finalize).not.toHaveBeenCalled();
  });

  test('setSignal writes to the live view and triggers a run', async () => {
    const mockView = createMockView();
    mockEmbed.mockResolvedValue({ view: mockView } as unknown as Awaited<ReturnType<typeof embed>>);

    const handle = attachVegaChartController(container, defaultProps);
    await Promise.resolve();
    await Promise.resolve();

    handle.setSignal('hiddenSeries', ['a']);

    expect(mockSignal).toHaveBeenCalledWith('hiddenSeries', ['a']);
    expect(mockRunAsync).toHaveBeenCalled();
  });

  test('setSignal is a no-op before a view exists or after destroy', async () => {
    const handle = attachVegaChartController(container, { ...defaultProps, width: 0, height: 0 });
    handle.setSignal('hiddenSeries', ['a']);
    expect(mockSignal).not.toHaveBeenCalled();

    const mockView = createMockView();
    mockEmbed.mockResolvedValue({ view: mockView } as unknown as Awaited<ReturnType<typeof embed>>);
    const activeHandle = attachVegaChartController(container, defaultProps);
    await Promise.resolve();
    await Promise.resolve();
    activeHandle.destroy();
    activeHandle.setSignal('hiddenSeries', ['a']);
    expect(mockSignal).not.toHaveBeenCalled();
  });

  test("embedView() carries the outgoing view's live hiddenSeries value into the new spec's signal patch", async () => {
    const firstView = createMockView();
    const secondView = createMockView();
    mockSignal.mockReturnValue(['seriesA']);
    mockEmbed
      .mockResolvedValueOnce({ view: firstView } as unknown as Awaited<ReturnType<typeof embed>>)
      .mockResolvedValueOnce({ view: secondView } as unknown as Awaited<ReturnType<typeof embed>>);

    const interactionConfig = makeInteractionConfig({ legend: { isToggleable: true } });
    const specWithHiddenSeries: Spec = { signals: [{ name: 'hiddenSeries', value: [] }] };

    const handle = attachVegaChartController(container, {
      ...defaultProps,
      spec: specWithHiddenSeries,
      interactionConfig,
    });
    await Promise.resolve();
    await Promise.resolve();

    handle.updateSpec({ ...defaultProps, spec: specWithHiddenSeries, interactionConfig, height: 601 });
    await Promise.resolve();
    await Promise.resolve();

    const secondEmbedSpec = mockEmbed.mock.calls[1][1] as Spec;
    expect(secondEmbedSpec.signals?.find((s) => s.name === 'hiddenSeries')).toMatchObject({ value: ['seriesA'] });
  });

  test('embedView() seeds hiddenSeries from Legend.defaultHiddenSeries on the very first mount', async () => {
    const mockView = createMockView();
    mockEmbed.mockResolvedValue({ view: mockView } as unknown as Awaited<ReturnType<typeof embed>>);

    const interactionConfig = makeInteractionConfig({
      legend: { isToggleable: true, defaultHiddenSeries: ['seriesB'] },
    });
    const specWithHiddenSeries: Spec = { signals: [{ name: 'hiddenSeries', value: [] }] };

    attachVegaChartController(container, { ...defaultProps, spec: specWithHiddenSeries, interactionConfig });
    await Promise.resolve();
    await Promise.resolve();

    const embedSpec = mockEmbed.mock.calls[0][1] as Spec;
    expect(embedSpec.signals?.find((s) => s.name === 'hiddenSeries')).toMatchObject({ value: ['seriesB'] });
  });

  test('wires up interaction listeners and sets refs.chartView.current once interactionConfig is provided', async () => {
    const mockView = createMockView();
    mockEmbed.mockResolvedValue({ view: mockView } as unknown as Awaited<ReturnType<typeof embed>>);
    const interactionConfig = makeInteractionConfig();

    attachVegaChartController(container, { ...defaultProps, interactionConfig });
    await Promise.resolve();
    await Promise.resolve();

    expect(interactionConfig.refs.chartView.current).toBe(mockView);
    expect(mockAddEventListener).toHaveBeenCalled();
  });
});
