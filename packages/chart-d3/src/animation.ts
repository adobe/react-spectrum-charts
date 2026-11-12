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
import {
  ANIMATION_HOVER_SPEED,
  DRAW_IN_STEADY_FRAMES,
  DRAW_IN_STEADY_FRAME_MS,
  DRAW_IN_SWEEP_DURATION_MS,
  FADE_FACTOR,
  HOVER_NEUTRAL_TARGET,
  S2_EASE_IN_OUT,
} from '@spectrum-charts/core-s2/constants';

const BEZIER_EPSILON = 1e-6;

/**
 * Evaluates a CSS-style cubic-bezier easing at progress t.
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @param t
 * @returns eased progress
 */
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number, t: number): number => {
  if (Number.isNaN(t) || t <= 0) return 0;
  if (t >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s;

  let s = t;
  for (let i = 0; i < 8; i++) {
    const error = sampleX(s) - t;
    if (Math.abs(error) < BEZIER_EPSILON) return sampleY(s);
    const slope = (3 * ax * s + 2 * bx) * s + cx;
    if (Math.abs(slope) < BEZIER_EPSILON) break;
    s -= error / slope;
  }

  let low = 0;
  let high = 1;
  s = t;
  for (let i = 0; i < 30; i++) {
    const x = sampleX(s);
    if (Math.abs(x - t) < BEZIER_EPSILON) break;
    if (x < t) low = s;
    else high = s;
    s = (low + high) / 2;
  }
  return sampleY(s);
};

const [e1, e2, e3, e4] = S2_EASE_IN_OUT;

/**
 * Eases progress with S2_EASE_IN_OUT.
 * @param t
 * @returns eased progress
 */
export const easeInOut = (t: number): number => cubicBezier(e1, e2, e3, e4, t);

/**
 * Converts a hover fraction (0 de-emphasized, 0.5 neutral, 1 emphasized) to opacity.
 * @param fraction
 * @returns opacity
 */
export const deemphasisOpacity = (fraction: number): number =>
  FADE_FACTOR + (1 - FADE_FACTOR) * Math.min(Math.max(fraction / HOVER_NEUTRAL_TARGET, 0), 1);

interface HoverTrack {
  startTime: number;
  startValue: number;
  target: number;
  /** Fraction from the last rendered frame; tweens retarget from this, not the exact current value. */
  rendered?: number;
}

/** Tweens each key's hover fraction toward its target with a speed-based duration and easing. */
export class HoverAnimator {
  private readonly tracks = new Map<string, HoverTrack>();

  /**
   * Sets each key's target, restarting tweens whose target changed from the last rendered fraction.
   * @param targets
   * @param now
   */
  setTargets(targets: Map<string, number>, now: number): void {
    for (const [key, target] of targets) {
      // each row starts at 1 with target 1
      let track = this.tracks.get(key);
      if (!track) {
        track = { startTime: 0, startValue: 1, target: 1 };
        this.tracks.set(key, track);
      }
      if (track.target !== target) {
        track.startValue = track.rendered ?? 1;
        track.startTime = now;
        track.target = target;
      }
    }
  }

  /**
   * Gets a key's eased fraction at time now and records it as the rendered value.
   * @param key
   * @param now
   * @returns fraction
   */
  fraction(key: string, now: number): number {
    const track = this.tracks.get(key);
    if (!track) return HOVER_NEUTRAL_TARGET;
    const { startTime, startValue, target } = track;
    const progress =
      target === startValue
        ? 1
        : Math.min(Math.max((now - startTime) / (ANIMATION_HOVER_SPEED * Math.abs(target - startValue)), 0), 1);
    track.rendered = startValue + (target - startValue) * easeInOut(progress);
    return track.rendered;
  }

  /**
   * Whether any tween is still running at time now.
   * @param now
   * @returns boolean
   */
  isAnimating(now: number): boolean {
    for (const { startTime, startValue, target } of this.tracks.values()) {
      if (target !== startValue && now - startTime < ANIMATION_HOVER_SPEED * Math.abs(target - startValue)) return true;
    }
    return false;
  }
}

/** The line draw-in clock: holds while the page settles, then sweeps for DRAW_IN_SWEEP_DURATION_MS. */
export class DrawInClock {
  start: number | undefined;
  private holdUntil: number | undefined;
  private steadyFrames = 0;
  private previousFrame = Number.NEGATIVE_INFINITY;

  /**
   * @param start - carried start time when a remount continues an in-flight draw-in
   * @param holdUntil - performance.now() deadline for waiting on steady frames before starting
   */
  constructor(start?: number, holdUntil?: number) {
    this.start = start;
    this.holdUntil = start === undefined ? holdUntil : undefined;
  }

  /**
   * Advances the hold on each animation frame; starts the sweep once frames are steady or the hold expires.
   * @param frameTime - requestAnimationFrame timestamp
   * @param now - wall-clock time used for animation progress
   */
  frame(frameTime: number, now: number): void {
    if (this.start !== undefined) return;
    if (this.holdUntil !== undefined) {
      this.steadyFrames = frameTime - this.previousFrame <= DRAW_IN_STEADY_FRAME_MS ? this.steadyFrames + 1 : 0;
      this.previousFrame = frameTime;
      if (this.steadyFrames < DRAW_IN_STEADY_FRAMES && frameTime < this.holdUntil) return;
      this.holdUntil = undefined;
    }
    this.start = now;
  }

  /**
   * Linear progress (0-1) at time now.
   * @param now
   * @returns progress
   */
  t(now: number): number {
    if (this.start === undefined) return 0;
    return Math.min(Math.max((now - this.start) / DRAW_IN_SWEEP_DURATION_MS, 0), 1);
  }

  /**
   * Whether the sweep has finished at time now.
   * @param now
   * @returns boolean
   */
  done(now: number): boolean {
    return this.t(now) >= 1;
  }
}

/** Clock source shared by the engine; wall-clock ms). */
export const now = (): number => Date.now();

/**
 * Schedules a frame callback with requestAnimationFrame, falling back to a timer outside the browser.
 * @param callback
 * @returns cancel function
 */
export const requestFrame = (callback: (time: number) => void): (() => void) => {
  if (typeof requestAnimationFrame === 'function') {
    const handle = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(handle);
  }
  const handle = setTimeout(() => callback(Date.now()), 16);
  return () => clearTimeout(handle);
};
