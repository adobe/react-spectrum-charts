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
} from '@spectrum-charts/core-s2/constants';

// Framework-agnostic, page-wide animation scheduler: one frame loop drives every animating chart
// and stops entirely once none are animating. Must not depend on React.

interface TickerEntry {
  view: View;
  container: Element;
  /** Has animation work; cleared only after a tick reports `animationActive` false */
  awake: boolean;
  /** On screen per the IntersectionObserver; off-screen charts skip ticks */
  visible: boolean;
  /** A `runAsync` is in flight; prevents overlapping runs on the same view */
  running: boolean;
  onActiveChange: (name: string, active: boolean) => void;
}

// Map insertion order is the tick order; ticked entries are re-inserted at the back (round-robin)
const entries = new Map<View, TickerEntry>();
const entriesByContainer = new Map<Element, TickerEntry>();
let frameHandle: number | undefined;
// true while a frame's async runs are pending; the next frame is requested after they finish, so frames never overlap
let frameRunning = false;
let lastFrameTime = -Infinity;
let observer: IntersectionObserver | undefined;

// setTimeout fallback for environments without rAF (SSR, some test runners)
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
  // a finalized view or a spec without the signal throws; treat both as inactive
  try {
    return Boolean(view.signal(ANIMATION_ACTIVE));
  } catch {
    return false;
  }
};

// precise elapsed time within a frame for the budget; the spec's animation timer uses Date.now() separately
const clock = (): number => (typeof performance === 'undefined' ? Date.now() : performance.now());

const tick = async (entry: TickerEntry, now: number): Promise<void> => {
  const { view } = entry;
  entry.running = true;
  try {
    await view.signal(ANIMATION_TIMER, now).runAsync();
  } catch {
    // drop a failed or finalized view so it can't stall the loop for other charts
    entry.running = false;
    detach(entry);
    return;
  }
  entry.running = false;
  // the view was detached or re-attached while the run was pending
  if (entries.get(view) !== entry) return;
  // only sleep once the spec reports every animation (including its final grace tick) has settled
  if (!readActive(view)) entry.awake = false;
};

const runFrame = async (now: number, frameStart: number): Promise<void> => {
  // snapshot, because the loop reorders entries
  const due = [...entries.values()].filter((entry) => entry.awake && entry.visible && !entry.running);
  // sequential so the budget can be measured; the check is after the tick, so at least one chart always ticks
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
  if (time - lastFrameTime >= ANIMATION_MIN_FRAME_INTERVAL) {
    lastFrameTime = time;
    frameRunning = true;
    // wall-clock time to match the spec's now()-based animation timestamps
    runFrame(Date.now(), clock()).finally(() => {
      frameRunning = false;
      scheduleFrame();
    });
    return;
  }
  // too soon for ANIMATION_MIN_FRAME_INTERVAL; skip this frame but keep the loop alive
  scheduleFrame();
}

const wake = (entry: TickerEntry): void => {
  entry.awake = true;
  scheduleFrame();
};

// one shared observer for every chart; lazily created and disconnected when the last chart detaches
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
  // don't wake for a frame that has nothing left to tick
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
  // removed from the spec rather than blocked with config.events.timer, which logs a warning per chart
  if (timer && 'on' in timer) delete timer.on;
};

/**
 * Registers a view with the shared animation ticker; its spec should have had `removeAnimationTimerEvents` applied.
 * @param view - vega view whose spec contains the animation timer and animationActive signals
 * @param container - element the view renders into, used to pause ticking while off-screen
 * @returns function that detaches the view from the ticker
 */
export const attachAnimationTicker = (view: View, container: Element): (() => void) => {
  // re-attaching the same view replaces its entry
  const existing = entries.get(view);
  if (existing) detach(existing);

  const entry: TickerEntry = {
    view,
    container,
    awake: false,
    // assume visible until the observer's first callback so the first frames aren't skipped
    visible: true,
    running: false,
    // only wakes; sleeping waits for a tick to see animationActive false so the final grace tick still runs
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
  // a re-embed into the same container replaces the old view, which may not have been detached yet
  const previous = entriesByContainer.get(container);
  if (previous) detach(previous);
  entriesByContainer.set(container, entry);
  getObserver()?.observe(container);
  // the listener only fires on changes, so start ticking now if the spec begins active (e.g. draw-in)
  if (readActive(view)) wake(entry);

  return () => detach(entry);
};
