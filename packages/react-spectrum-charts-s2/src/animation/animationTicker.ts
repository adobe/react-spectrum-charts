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

import {
  ANIMATION_ACTIVE,
  ANIMATION_FRAME_BUDGET_MS,
  ANIMATION_MIN_FRAME_INTERVAL,
  ANIMATION_TIMER,
} from '@spectrum-charts/constants';

// Framework-agnostic, page-wide animation scheduler: one frame loop drives every animating chart
// and stops entirely once none are animating. Must not depend on React.

interface TickerEntry {
  view: View;
  container: Element;
  awake: boolean;
  visible: boolean;
  running: boolean;
  onActiveChange: (name: string, active: boolean) => void;
}

const entries = new Map<View, TickerEntry>();
const entriesByContainer = new Map<Element, TickerEntry>();
let frameHandle: number | undefined;
let frameRunning = false;
let lastFrameTime = -Infinity;
let observer: IntersectionObserver | undefined;

const requestFrame = (callback: (time: number) => void): number =>
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame(callback)
    : (setTimeout(() => callback(Date.now()), 16) as unknown as number);

const cancelFrame = (handle: number): void => {
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(handle);
  else clearTimeout(handle);
};

const hasPendingWork = (): boolean => {
  for (const entry of entries.values()) {
    if (entry.awake && entry.visible) return true;
  }
  return false;
};

const scheduleFrame = (): void => {
  if (frameHandle === undefined && !frameRunning && hasPendingWork()) {
    frameHandle = requestFrame(frame);
  }
};

const readActive = (view: View): boolean => {
  try {
    return Boolean(view.signal(ANIMATION_ACTIVE));
  } catch {
    return false;
  }
};

const clock = (): number => (typeof performance === 'undefined' ? Date.now() : performance.now());

const tick = async (entry: TickerEntry, now: number): Promise<void> => {
  const { view } = entry;
  entry.running = true;
  try {
    await view.signal(ANIMATION_TIMER, now).runAsync();
  } catch {
    entry.running = false;
    detach(entry);
    return;
  }
  entry.running = false;
  if (entries.get(view) !== entry) return;
  // only sleep once the spec reports every animation (including its final grace tick) has settled
  if (!readActive(view)) entry.awake = false;
};

const runFrame = async (now: number, frameStart: number): Promise<void> => {
  const due = [...entries.values()].filter((entry) => entry.awake && entry.visible && !entry.running);
  for (const entry of due) {
    await tick(entry, now);
    // ticked charts move to the back so charts skipped by the budget go first next frame
    if (entries.get(entry.view) === entry) {
      entries.delete(entry.view);
      entries.set(entry.view, entry);
    }
    if (clock() - frameStart >= ANIMATION_FRAME_BUDGET_MS) break;
  }
};

function frame(time: number): void {
  frameHandle = undefined;
  // time < lastFrameTime means the frame clock was reset (e.g. a new document timeline)
  if (time < lastFrameTime || time - lastFrameTime >= ANIMATION_MIN_FRAME_INTERVAL) {
    lastFrameTime = time;
    frameRunning = true;
    // wall-clock time to match the spec's now()-based animation timestamps
    runFrame(Date.now(), clock()).finally(() => {
      frameRunning = false;
      scheduleFrame();
    });
    return;
  }
  scheduleFrame();
}

const wake = (entry: TickerEntry): void => {
  entry.awake = true;
  scheduleFrame();
};

const getObserver = (): IntersectionObserver | undefined => {
  if (observer || typeof IntersectionObserver === 'undefined') return observer;
  observer = new IntersectionObserver((observed) => {
    for (const { target, isIntersecting } of observed) {
      const entry = entriesByContainer.get(target);
      if (entry) entry.visible = isIntersecting;
    }
    scheduleFrame();
  });
  return observer;
};

function detach(entry: TickerEntry): void {
  if (entries.get(entry.view) !== entry) return;
  entries.delete(entry.view);
  entriesByContainer.delete(entry.container);
  entry.view.removeSignalListener(ANIMATION_ACTIVE, entry.onActiveChange);
  observer?.unobserve(entry.container);
  if (!entries.size) {
    observer?.disconnect();
    observer = undefined;
  }
  if (frameHandle !== undefined && !hasPendingWork()) {
    cancelFrame(frameHandle);
    frameHandle = undefined;
  }
}

/**
 * Checks whether a spec contains the shared animation timer that the ticker drives.
 * @param spec - vega spec
 * @returns boolean
 */
export const isAnimatedSpec = (spec: Spec): boolean =>
  Boolean(spec.signals?.some((signal) => signal.name === ANIMATION_TIMER));

/**
 * Removes Vega's always-on timer event from the animation timer signal so the animation ticker is its only clock.
 * @param spec - vega spec, mutated in place
 */
export const removeAnimationTimerEvents = (spec: Spec): void => {
  const timer = spec.signals?.find((signal) => signal.name === ANIMATION_TIMER);
  if (timer && 'on' in timer) delete timer.on;
};

/**
 * Registers a view with the shared animation ticker; its spec should have had `removeAnimationTimerEvents` applied.
 * @param view - vega view whose spec contains the animation timer and animationActive signals
 * @param container - element the view renders into, used to pause ticking while off-screen
 * @returns function that detaches the view from the ticker
 */
export const attachAnimationTicker = (view: View, container: Element): (() => void) => {
  const existing = entries.get(view);
  if (existing) detach(existing);

  const entry: TickerEntry = {
    view,
    container,
    awake: false,
    visible: true,
    running: false,
    onActiveChange: (_name, active) => {
      if (active) wake(entry);
    },
  };
  try {
    view.addSignalListener(ANIMATION_ACTIVE, entry.onActiveChange);
  } catch {
    // spec has no animations to drive
    return () => {};
  }
  entries.set(view, entry);
  const previous = entriesByContainer.get(container);
  if (previous) detach(previous);
  entriesByContainer.set(container, entry);
  getObserver()?.observe(container);
  if (readActive(view)) wake(entry);

  return () => detach(entry);
};
