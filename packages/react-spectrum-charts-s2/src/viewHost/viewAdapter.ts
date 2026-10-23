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

// The contract between the view host and a rendering library. Must not depend on React or a rendering library.

/** A spec split into the parts that are routed separately. */
export interface SplitSpec {
  /** Serialized structure of the spec; any change rebuilds the view */
  program: string;
  /** Signal values that can be applied to a live view, keyed by name */
  signalValues: Map<string, unknown>;
  /** Table rows, or undefined when the spec has no inline table */
  table: unknown[] | undefined;
}

export interface ViewSize {
  width: number;
  height: number;
}

/** Changes to apply to a live view in one update. */
export interface ViewChanges {
  /** Changed [name, value] signal pairs */
  signals: [string, unknown][];
  /** Replacement table rows, when the table changed */
  table?: unknown[];
  /** New size, when the size changed */
  size?: ViewSize;
}

/** Draw-in and animation ticker support for the views of one rendering library. */
export interface ViewAnimation<TSpec, TView> {
  /** Checks whether a spec animates, so its view is driven by the animation ticker */
  isAnimated: (spec: TSpec) => boolean;
  /** Checks whether a spec draws in */
  hasDrawIn: (spec: TSpec) => boolean;
  /** Checks whether a spec has any table rows to draw */
  hasRows: (spec: TSpec) => boolean;
  /** Prepares a spec for the ticker and continues an earlier draw-in, mutating it before the view is created */
  prepareSpec: (spec: TSpec, drawInStart: number | undefined, now: number) => void;
  /** Gets the draw-in start a view latched, to carry into the next view */
  getDrawInStart: (view: TView | undefined, spec: TSpec) => number | undefined;
  /** Attaches a view to the animation ticker and returns a function that detaches it */
  attachTicker: (view: TView, container: HTMLElement, holdUntil?: number) => () => void;
}

/** Creates, updates and destroys the views of one rendering library for the view host. */
export interface ViewAdapter<TSpec, TView, TEnvironment> {
  /** Draw-in and ticker support; views from an adapter without it don't animate */
  animation?: ViewAnimation<TSpec, TView>;
  /** Copies a spec with the table rows and signal values it should be built with */
  prepareSpec: (spec: TSpec, table: unknown[] | undefined, signals?: Record<string, unknown>) => TSpec;
  /** Splits a prepared spec into its program, signal values and table rows */
  splitSpec: (spec: TSpec) => SplitSpec;
  /** Checks whether a view built in one environment can be kept for another */
  isSameEnvironment: (previous: TEnvironment, next: TEnvironment) => boolean;
  /** Creates a view that renders the spec into the container */
  createView: (container: HTMLElement, spec: TSpec, environment: TEnvironment, size: ViewSize) => Promise<TView>;
  /** Runs a new view once its listeners are attached */
  startView: (view: TView) => void;
  /** Applies changes to a live view, then runs it once */
  updateView: (view: TView, changes: ViewChanges) => void;
  /** Releases a view */
  destroyView: (view: TView) => void;
}

/**
 * Gets the signal values that differ between two splits of the same program.
 * @param previous - signal values the view was last updated with
 * @param next - signal values to apply
 * @returns changed [name, value] pairs
 */
export const getChangedSignals = (previous: Map<string, unknown>, next: Map<string, unknown>): [string, unknown][] =>
  [...next].filter(([name, value]) => JSON.stringify(previous.get(name)) !== JSON.stringify(value));
