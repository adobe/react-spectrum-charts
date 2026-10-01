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
import { Spec, View } from 'vega';

import { ANIMATION_ACTIVE, ANIMATION_FRAME_BUDGET_MS, ANIMATION_TIMER } from '@spectrum-charts/constants';

import { attachAnimationTicker, isAnimatedSpec, removeAnimationTimerEvents } from './animationTicker';

type Listener = (name: string, value: boolean) => void;

/** Minimal stand-in for a vega View: animationActive stays true for `activeTicks` timer updates. */
const createMockView = ({ activeTicks = 3, hasSignals = true } = {}) => {
  let active = activeTicks > 0;
  let ticksLeft = activeTicks;
  const listeners: Listener[] = [];
  const timerValues: number[] = [];
  const view = {
    signal: jest.fn((name: string, value?: number) => {
      if (!hasSignals) throw new Error(`Unrecognized signal name: ${name}`);
      if (value === undefined) return name === ANIMATION_ACTIVE ? active : timerValues.at(-1);
      timerValues.push(value);
      ticksLeft -= 1;
      return view;
    }),
    runAsync: jest.fn(async () => {
      const next = ticksLeft > 0;
      if (next !== active) {
        active = next;
        listeners.forEach((l) => l(ANIMATION_ACTIVE, active));
      }
      return view;
    }),
    addSignalListener: jest.fn((name: string, listener: Listener) => {
      if (!hasSignals) throw new Error(`Unrecognized signal name: ${name}`);
      listeners.push(listener);
      return view;
    }),
    removeSignalListener: jest.fn((_name: string, listener: Listener) => {
      listeners.splice(listeners.indexOf(listener), 1);
      return view;
    }),
  };
  /** Simulates a hover change inside the dataflow that restarts the animation. */
  const startAnimation = (ticks: number) => {
    ticksLeft = ticks;
    active = true;
    listeners.forEach((l) => l(ANIMATION_ACTIVE, true));
  };
  return { view: view as unknown as View, mock: view, timerValues, listeners, startAnimation };
};

const flushFrames = async (frames: number) => {
  for (let i = 0; i < frames; i++) {
    jest.advanceTimersByTime(16);
    // let the frame's sequential runAsync promises settle
    for (let j = 0; j < 10; j++) await Promise.resolve();
  }
};

describe('animationTicker', () => {
  let detachers: (() => void)[] = [];
  const attach = (view: View, container: Element = document.createElement('div')) => {
    const detach = attachAnimationTicker(view, container);
    detachers.push(detach);
    return detach;
  };

  beforeEach(() => {
    jest.useFakeTimers();
    detachers = [];
  });

  afterEach(() => {
    detachers.forEach((detach) => detach());
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('isAnimatedSpec()', () => {
    test('detects the animation timer signal', () => {
      expect(isAnimatedSpec({ signals: [{ name: ANIMATION_TIMER, value: 0 }] } as Spec)).toBe(true);
      expect(isAnimatedSpec({ signals: [{ name: 'other', value: 0 }] } as Spec)).toBe(false);
      expect(isAnimatedSpec({} as Spec)).toBe(false);
    });
  });

  describe('removeAnimationTimerEvents()', () => {
    test('strips the timer event from the animation timer signal only', () => {
      const spec = {
        signals: [
          { name: ANIMATION_TIMER, value: 0, on: [{ events: { type: 'timer', throttle: 33 }, update: 'now()' }] },
          { name: 'other', value: 0, on: [{ events: 'click', update: '1' }] },
        ],
      } as Spec;
      removeAnimationTimerEvents(spec);
      expect(spec.signals).toStrictEqual([
        { name: ANIMATION_TIMER, value: 0 },
        { name: 'other', value: 0, on: [{ events: 'click', update: '1' }] },
      ]);
    });

    test('is a no-op for specs without the animation timer', () => {
      const spec = {} as Spec;
      removeAnimationTimerEvents(spec);
      expect(spec).toStrictEqual({});
    });
  });

  describe('attachAnimationTicker()', () => {
    test('ticks an active view until animationActive goes false, then stops', async () => {
      const { view, mock, timerValues } = createMockView({ activeTicks: 3 });
      attach(view);
      await flushFrames(10);
      expect(timerValues).toHaveLength(3);
      expect(mock.runAsync).toHaveBeenCalledTimes(3);
    });

    test('does not tick a view that is idle on attach', async () => {
      const { view, mock } = createMockView({ activeTicks: 0 });
      attach(view);
      await flushFrames(10);
      expect(mock.runAsync).not.toHaveBeenCalled();
    });

    test('wakes when animationActive turns true and sleeps again once settled', async () => {
      const { view, timerValues, startAnimation } = createMockView({ activeTicks: 0 });
      attach(view);
      startAnimation(2);
      await flushFrames(10);
      expect(timerValues).toHaveLength(2);
      startAnimation(4);
      await flushFrames(10);
      expect(timerValues).toHaveLength(6);
    });

    test('drives multiple views from one shared frame loop', async () => {
      const rafSpy = jest.spyOn(window, 'requestAnimationFrame');
      const a = createMockView({ activeTicks: 3 });
      const b = createMockView({ activeTicks: 3 });
      attach(a.view);
      attach(b.view);
      // one frame request serves both views
      expect(rafSpy).toHaveBeenCalledTimes(1);
      await flushFrames(10);
      expect(a.timerValues).toHaveLength(3);
      expect(b.timerValues).toHaveLength(3);
      expect(a.timerValues).toEqual(b.timerValues);
      rafSpy.mockRestore();
    });

    test('uses wall-clock time for the animation timer', async () => {
      const { view, timerValues } = createMockView({ activeTicks: 1 });
      const now = Date.now();
      attach(view);
      await flushFrames(1);
      expect(timerValues[0]).toBeGreaterThanOrEqual(now);
    });

    test('stops ticking after detach', async () => {
      const { view, mock, listeners } = createMockView({ activeTicks: 100 });
      const detach = attach(view);
      await flushFrames(2);
      detach();
      const calls = mock.runAsync.mock.calls.length;
      await flushFrames(10);
      expect(mock.runAsync).toHaveBeenCalledTimes(calls);
      expect(listeners).toHaveLength(0);
    });

    test('returns a no-op detach for views without animation signals', async () => {
      const { view, mock } = createMockView({ hasSignals: false });
      const detach = attach(view);
      await flushFrames(5);
      expect(mock.runAsync).not.toHaveBeenCalled();
      expect(detach).not.toThrow();
    });

    test('re-attaching the same view replaces its previous registration', async () => {
      const { view, listeners } = createMockView({ activeTicks: 1 });
      attach(view);
      attach(view);
      expect(listeners).toHaveLength(1);
    });

    test('detaches a view whose tick throws (e.g. finalized)', async () => {
      const { view, mock, listeners } = createMockView({ activeTicks: 5 });
      attach(view);
      mock.signal.mockImplementation(() => {
        throw new Error('finalized');
      });
      await flushFrames(3);
      expect(listeners).toHaveLength(0);
    });
  });

  describe('frame budget', () => {
    test('stops ticking views once the budget is spent and resumes with the skipped ones next frame', async () => {
      let clockMs = 0;
      jest.spyOn(performance, 'now').mockImplementation(() => clockMs);
      const views = [0, 1, 2].map(() => createMockView({ activeTicks: 10 }));
      views.forEach(({ view, mock }) => {
        attach(view);
        const run = mock.runAsync.getMockImplementation();
        mock.runAsync.mockImplementation(async () => {
          clockMs += ANIMATION_FRAME_BUDGET_MS;
          return run?.() ?? view;
        });
      });
      await flushFrames(1);
      expect(views.map(({ timerValues }) => timerValues.length)).toEqual([1, 0, 0]);
      await flushFrames(1);
      expect(views.map(({ timerValues }) => timerValues.length)).toEqual([1, 1, 0]);
      await flushFrames(1);
      expect(views.map(({ timerValues }) => timerValues.length)).toEqual([1, 1, 1]);
      await flushFrames(1);
      expect(views.map(({ timerValues }) => timerValues.length)).toEqual([2, 1, 1]);
    });

    test('ticks every view in one frame while under budget', async () => {
      const views = [0, 1, 2].map(() => createMockView({ activeTicks: 10 }));
      views.forEach(({ view }) => attach(view));
      await flushFrames(1);
      expect(views.map(({ timerValues }) => timerValues.length)).toEqual([1, 1, 1]);
    });
  });

  describe('off-screen pausing', () => {
    let observerCallback: IntersectionObserverCallback;
    const observe = jest.fn();
    const unobserve = jest.fn();
    const disconnect = jest.fn();

    beforeEach(() => {
      observe.mockClear();
      unobserve.mockClear();
      disconnect.mockClear();
      (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = jest.fn(
        (callback: IntersectionObserverCallback) => {
          observerCallback = callback;
          return { observe, unobserve, disconnect };
        }
      );
    });

    afterEach(() => {
      delete (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
    });

    const setVisible = (target: Element, isIntersecting: boolean) =>
      observerCallback([{ target, isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);

    test('skips off-screen views and resumes when they become visible', async () => {
      const container = document.createElement('div');
      const { view, timerValues } = createMockView({ activeTicks: 3 });
      attach(view, container);
      expect(observe).toHaveBeenCalledWith(container);
      setVisible(container, false);
      await flushFrames(10);
      expect(timerValues).toHaveLength(0);
      setVisible(container, true);
      await flushFrames(10);
      expect(timerValues).toHaveLength(3);
    });

    test('unobserves on detach and disconnects when no views remain', () => {
      const container = document.createElement('div');
      const { view } = createMockView({ activeTicks: 0 });
      const detach = attach(view, container);
      detach();
      expect(unobserve).toHaveBeenCalledWith(container);
      expect(disconnect).toHaveBeenCalled();
    });
  });
});
