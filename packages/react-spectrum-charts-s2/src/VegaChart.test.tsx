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
import { act, render, waitFor } from '@testing-library/react';
import { Spec, View, expressionFunction, parse } from 'vega';
import embed from 'vega-embed';

import { ANIMATION_TIMER } from '@spectrum-charts/core-s2/constants';

import { VegaChart, VegaChartProps } from './VegaChart.js';
import { attachAnimationTicker } from './animation/animationTicker.js';
import { resizeView } from './viewHost/index.js';

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
  } as unknown as View);

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
  tooltip: jest.fn(),
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

  describe('current render completion and failures', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockRunAsync.mockReset().mockResolvedValue(undefined);
      mockEmbed.mockResolvedValue({ view: createMockView() } as unknown as Awaited<ReturnType<typeof embed>>);
      mockAttachAnimationTicker.mockReturnValue(mockDetachAnimationTicker);
    });

    test('completes only after both asynchronous resize passes', async () => {
      let finishSecondPass: () => void = () => {};
      mockRunAsync
        .mockResolvedValueOnce(undefined)
        .mockReturnValueOnce(new Promise<void>((resolve) => (finishSecondPass = resolve)));
      const onRenderStart = jest.fn();
      const onRenderComplete = jest.fn();
      render(
        <VegaChart
          {...defaultProps}
          renderId="first"
          onRenderStart={onRenderStart}
          onRenderComplete={onRenderComplete}
        />
      );
      await waitFor(() => expect(mockRunAsync).toHaveBeenCalledTimes(2));
      expect(onRenderStart).toHaveBeenCalledWith({ generation: 1, renderId: 'first' });
      expect(onRenderComplete).not.toHaveBeenCalled();
      await act(async () => finishSecondPass());
      expect(onRenderComplete).toHaveBeenCalledWith({ generation: 1, renderId: 'first' });
    });

    test.each(['embed', 'first resize', 'second resize'])('reports %s failures without completing', async (failure) => {
      const error = new Error(failure);
      if (failure === 'embed') mockEmbed.mockRejectedValueOnce(error);
      else if (failure === 'first resize') mockRunAsync.mockRejectedValueOnce(error);
      else mockRunAsync.mockResolvedValueOnce(undefined).mockRejectedValueOnce(error);
      const onRenderError = jest.fn();
      const onRenderComplete = jest.fn();
      render(
        <VegaChart {...defaultProps} renderId={12} onRenderError={onRenderError} onRenderComplete={onRenderComplete} />
      );
      await waitFor(() =>
        expect(onRenderError).toHaveBeenCalledWith({
          generation: 1,
          renderId: 12,
          phase: failure === 'embed' ? 'embed' : 'resize',
          error,
        })
      );
      expect(onRenderComplete).not.toHaveBeenCalled();
    });

    test('resizes an existing view and identifies the new revision without embedding again', async () => {
      const onRenderComplete = jest.fn();
      const { rerender } = render(<VegaChart {...defaultProps} renderId="first" onRenderComplete={onRenderComplete} />);
      await waitFor(() => expect(onRenderComplete).toHaveBeenCalledTimes(1));
      rerender(<VegaChart {...defaultProps} width={500} renderId="second" onRenderComplete={onRenderComplete} />);
      await waitFor(() => expect(onRenderComplete).toHaveBeenLastCalledWith({ generation: 2, renderId: 'second' }));
      expect(mockEmbed).toHaveBeenCalledTimes(1);
      expect(mockWidth).toHaveBeenLastCalledWith(500);
      expect(mockRunAsync).toHaveBeenCalledTimes(4);
    });

    test('completes incremental data and signal updates without replacing the view', async () => {
      const spec: Spec = {
        data: [{ name: 'table', values: [] }],
        signals: [{ name: 'highlightedSeries', value: null }],
      };
      const view = new View(parse(spec), { renderer: 'none' }).width(800).height(600);
      mockEmbed.mockResolvedValue({ view } as Awaited<ReturnType<typeof embed>>);
      const onNewView = jest.fn();
      const onRenderComplete = jest.fn();
      const shared = { ...defaultProps, spec, onNewView, onRenderComplete };
      const { rerender, unmount } = render(
        <VegaChart {...shared} data={[{ value: 1 }]} signals={{ highlightedSeries: 'A' }} renderId={1} />
      );
      await waitFor(() => expect(onRenderComplete).toHaveBeenCalledTimes(1));
      rerender(<VegaChart {...shared} data={[{ value: 2 }]} signals={{ highlightedSeries: 'B' }} renderId={2} />);
      await waitFor(() => expect(onRenderComplete).toHaveBeenLastCalledWith({ generation: 2, renderId: 2 }));
      expect(view.data('table').map(({ value }) => value)).toEqual([2]);
      expect(view.signal('highlightedSeries')).toBe('B');
      expect(mockEmbed).toHaveBeenCalledTimes(1);
      expect(onNewView).toHaveBeenCalledTimes(1);
      unmount();
    });

    test('uses the newest layout and revision when dimensions change during embed', async () => {
      let finishEmbed: (value: Awaited<ReturnType<typeof embed>>) => void = () => {};
      mockEmbed.mockReturnValueOnce(new Promise((resolve) => (finishEmbed = resolve)));
      const onRenderComplete = jest.fn();
      const { rerender } = render(<VegaChart {...defaultProps} renderId={1} onRenderComplete={onRenderComplete} />);
      rerender(<VegaChart {...defaultProps} width={500} renderId={2} onRenderComplete={onRenderComplete} />);
      await act(async () => finishEmbed({ view: createMockView() } as unknown as Awaited<ReturnType<typeof embed>>));
      await waitFor(() => expect(onRenderComplete).toHaveBeenCalledTimes(1));
      expect(onRenderComplete).toHaveBeenCalledWith({ generation: 2, renderId: 2 });
      expect(mockWidth).toHaveBeenLastCalledWith(500);
      expect(mockEmbed).toHaveBeenCalledTimes(1);
    });

    test('ignores a superseded resize rejection and runs the latest resize', async () => {
      let failResize: (reason: Error) => void = () => {};
      mockRunAsync.mockReturnValueOnce(new Promise((_resolve, reject) => (failResize = reject)));
      const onRenderError = jest.fn();
      const onRenderComplete = jest.fn();
      const { rerender } = render(
        <VegaChart {...defaultProps} renderId={1} onRenderError={onRenderError} onRenderComplete={onRenderComplete} />
      );
      await waitFor(() => expect(mockRunAsync).toHaveBeenCalledTimes(1));
      rerender(
        <VegaChart
          {...defaultProps}
          width={500}
          renderId={2}
          onRenderError={onRenderError}
          onRenderComplete={onRenderComplete}
        />
      );
      await act(async () => failResize(new Error('superseded')));
      await waitFor(() => expect(onRenderComplete).toHaveBeenCalledWith({ generation: 2, renderId: 2 }));
      expect(onRenderError).not.toHaveBeenCalled();
      expect(onRenderComplete).toHaveBeenCalledTimes(1);
    });

    test('does not run the second resize pass or emit events after unmount', async () => {
      let finishResize: () => void = () => {};
      mockRunAsync.mockReturnValueOnce(new Promise<void>((resolve) => (finishResize = resolve)));
      const onRenderComplete = jest.fn();
      const onRenderError = jest.fn();
      const view = createMockView();
      mockEmbed.mockResolvedValueOnce({ view } as unknown as Awaited<ReturnType<typeof embed>>);
      const { unmount } = render(
        <VegaChart {...defaultProps} onRenderComplete={onRenderComplete} onRenderError={onRenderError} />
      );
      await waitFor(() => expect(mockRunAsync).toHaveBeenCalledTimes(1));
      unmount();
      await act(async () => finishResize());
      expect(mockRunAsync).toHaveBeenCalledTimes(1);
      expect(view.finalize).toHaveBeenCalledTimes(1);
      expect(onRenderComplete).not.toHaveBeenCalled();
      expect(onRenderError).not.toHaveBeenCalled();
    });

    test('resumes the current view when data changed at zero dimensions after an earlier initialization', async () => {
      const onRenderComplete = jest.fn();
      const { rerender } = render(<VegaChart {...defaultProps} width={0} onRenderComplete={onRenderComplete} />);
      rerender(<VegaChart {...defaultProps} onRenderComplete={onRenderComplete} />);
      await waitFor(() => expect(onRenderComplete).toHaveBeenCalledTimes(1));
      const data = [{ value: 12 }];
      rerender(<VegaChart {...defaultProps} data={data} width={0} onRenderComplete={onRenderComplete} />);
      rerender(<VegaChart {...defaultProps} data={data} onRenderComplete={onRenderComplete} />);
      await waitFor(() => expect(onRenderComplete).toHaveBeenCalledTimes(2));
      expect(mockEmbed).toHaveBeenCalledTimes(1);
    });
  });

  test('calls embed on initial mount with valid dimensions', async () => {
    render(<VegaChart {...defaultProps} />);

    await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
  });

  test('passes the tooltip handler to embed so it is set before the renderer is created', async () => {
    render(<VegaChart {...defaultProps} />);

    await waitFor(() => expect(mockEmbed).toHaveBeenCalledTimes(1));
    expect(mockEmbed.mock.calls[0][2]).toHaveProperty('tooltip', defaultProps.tooltip);
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

  test('logs instead of rejecting when embed fails', async () => {
    const error = new Error('embed failed');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockEmbed.mockRejectedValueOnce(error);

    render(<VegaChart {...defaultProps} />);

    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('Failed to render chart:', error));
    consoleSpy.mockRestore();
  });

  test('logs instead of rejecting when onNewView throws', async () => {
    const error = new Error('onNewView failed');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onNewView = jest.fn(() => {
      throw error;
    });

    render(<VegaChart {...defaultProps} onNewView={onNewView} />);

    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('Failed to render chart:', error));
    consoleSpy.mockRestore();
  });

  describe('animation ticker', () => {
    const animatedSpec: Spec = {
      signals: [
        { name: ANIMATION_TIMER, value: 0, on: [{ events: { type: 'timer', throttle: 33 }, update: 'now()' }] },
      ],
    };

    test('removes the vega timer event and attaches the ticker for animated specs', async () => {
      const { container } = render(<VegaChart {...defaultProps} spec={animatedSpec} />);

      await waitFor(() => expect(mockAttachAnimationTicker).toHaveBeenCalledTimes(1));
      expect((mockEmbed.mock.calls[0][1] as Spec).signals).toEqual([{ name: ANIMATION_TIMER, value: 0 }]);
      // the original spec is not mutated
      expect(animatedSpec.signals?.[0]).toHaveProperty('on');
      expect(mockAttachAnimationTicker).toHaveBeenCalledWith(
        expect.anything(),
        container.querySelector('.rsc'),
        undefined
      );
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

      await waitFor(() => expect(view.finalize).toHaveBeenCalledTimes(1));
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
