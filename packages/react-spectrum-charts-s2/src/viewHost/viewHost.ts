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

import { DRAW_IN_PAINT_FADE_MS, S2_EASE_OUT } from '@spectrum-charts/core-s2/constants';

import {
  attachAnimationTicker,
  getDrawInHoldDeadline,
  isAnimatedSpec,
  isDrawInHoldOver,
  removeAnimationTimerEvents,
} from '../animation/animationTicker.js';
import { getDrawInStart, hasDrawIn, hasTableRows, restoreDrawInStart } from '../animation/drawInContinuity.js';
import { VegaEnvironment, vegaViewAdapter } from './vegaViewAdapter.js';
import { SplitSpec, ViewAdapter, getChangedSignals } from './viewAdapter.js';

// Framework-agnostic owner of a chart's view: creation, update routing, the animation ticker and teardown.
// Views are created and updated through a ViewAdapter. Must not depend on React.

/** Everything a view is built or updated from. */
export interface ViewHostInputs {
  /** Inputs outside the spec that a view only takes when it's created; a change rebuilds the view */
  environment: VegaEnvironment;
  height: number;
  /** Called once per new view; a new function rebuilds the view */
  onNewView: (view: View) => void;
  /** Values that override the spec's signal initial values */
  signals?: Record<string, unknown>;
  spec: Spec;
  /** Rows for the table dataset */
  table: unknown[] | undefined;
  width: number;
}

/** How an update was applied to the chart. */
export type UpdateRoute = 'none' | 'deferred' | 'rebuild' | 'incremental' | 'noop';

export interface ViewHost {
  /** Routes new inputs to a rebuild, signal and data updates, a resize, or nothing; equal inputs are a no-op */
  update: (inputs: ViewHostInputs) => UpdateRoute;
  /** Finalizes the view and detaches it from the animation ticker */
  destroy: () => void;
}

/** Adapter for the views the host creates. */
export type ViewHostAdapter = ViewAdapter<Spec, View, VegaEnvironment>;

type PendingDrawIn = { holdUntil: number; faded: boolean };

/** A view that has been embedded or is being embedded, and the inputs it currently reflects. */
interface ActiveView {
  view?: View;
  cancelled: boolean;
  failed: boolean;
  inputs: ViewHostInputs;
  /** Spec as embedded, for carrying draw-in to the next view */
  spec: Spec;
  embeddedAt: number;
  pending?: PendingDrawIn;
  detachTicker?: () => void;
  program: string;
  signalValues: Map<string, unknown>;
  table: unknown[] | undefined;
  tableJson: string;
  hasRows: boolean;
}

/**
 * Gets the unstarted draw-in a fresh embed belongs to, starting one if none is pending.
 * @param freshDrawIn - whether this embed draws in from the start
 * @param pendingDrawIn - the chart's unstarted draw-in, kept across rebuilds
 * @returns pending draw-in, or undefined when this embed doesn't draw in fresh
 */
const getPendingDrawIn = (
  freshDrawIn: boolean,
  pendingDrawIn: PendingDrawIn | undefined
): PendingDrawIn | undefined => {
  if (!freshDrawIn) {
    return undefined;
  }
  return pendingDrawIn ?? { holdUntil: getDrawInHoldDeadline(), faded: false };
};

/**
 * Fades a draw-in's first paint in from transparent, once per unstarted draw-in.
 * @param container - element the view renders into
 * @param pending - the unstarted draw-in being painted
 */
const fadeInFirstPaint = (container: HTMLElement, pending: PendingDrawIn | undefined): void => {
  if (pending) {
    pending.faded = true;
  }
  container.style.opacity = '';
  container.animate?.([{ opacity: 0 }, { opacity: 1 }], {
    duration: DRAW_IN_PAINT_FADE_MS,
    easing: `cubic-bezier(${S2_EASE_OUT.join(', ')})`,
  });
};

/**
 * Gets the draw-in start for the next view; past the hold, rebuilds too fast to tick start from this embed instead.
 * @param active - the view being retired
 * @returns start time, or undefined to draw in fresh
 */
const getCarriedDrawInStart = ({ view, spec, pending, embeddedAt }: ActiveView): number | undefined => {
  const start = getDrawInStart(view, spec);
  if (start || !pending) {
    return start;
  }
  return isDrawInHoldOver(pending.holdUntil) ? embeddedAt : undefined;
};

/**
 * Checks whether an update can't be applied to the current view.
 * @param adapter - view adapter
 * @param active - current view
 * @param inputs - next inputs
 * @param split - next spec, split
 * @returns boolean
 */
const needsRebuild = (
  adapter: ViewHostAdapter,
  active: ActiveView,
  inputs: ViewHostInputs,
  split: SplitSpec
): boolean =>
  active.failed ||
  active.program !== split.program ||
  !adapter.isSameEnvironment(active.inputs.environment, inputs.environment) ||
  active.inputs.onNewView !== inputs.onNewView ||
  // an empty chart has nothing drawn, so data arriving or leaving restarts draw-in in a new view
  (hasDrawIn(active.spec) && active.hasRows !== Boolean(split.table?.length));

/**
 * Creates the host that owns the view rendered into a container.
 * @param container - element the view renders into
 * @param adapter - creates and updates the views
 * @returns ViewHost
 */
export const createViewHost = (container: HTMLElement, adapter: ViewHostAdapter = vegaViewAdapter): ViewHost => {
  let active: ActiveView | undefined;
  let latest: ViewHostInputs | undefined;
  let destroyed = false;
  // carried across rebuilds so draw-in plays once per host
  let drawInStart: number | undefined;
  // a draw-in that hasn't started yet keeps one hold deadline and one paint fade across rebuilds
  let pendingDrawIn: PendingDrawIn | undefined;

  const retire = (): void => {
    const retired = active;
    if (!retired) {
      return;
    }
    active = undefined;
    retired.cancelled = true;
    container.style.opacity = '';
    retired.detachTicker?.();
    drawInStart ??= getCarriedDrawInStart(retired);
    if (drawInStart) {
      pendingDrawIn = undefined;
    }
    if (retired.view) {
      adapter.destroyView(retired.view);
    }
  };

  const build = (inputs: ViewHostInputs, spec: Spec, split: SplitSpec): void => {
    retire();
    const { environment, height, width } = inputs;
    const embeddedAt = Date.now();
    const isAnimated = isAnimatedSpec(spec);
    const hasRows = hasTableRows(spec);
    if (!hasRows) {
      drawInStart = undefined;
      pendingDrawIn = undefined;
    }
    const freshDrawIn = hasDrawIn(spec) && hasRows && !drawInStart;
    const pending = getPendingDrawIn(freshDrawIn, pendingDrawIn);
    pendingDrawIn = pending ?? pendingDrawIn;
    const fadeIn = pending?.faded === false;
    restoreDrawInStart(spec, drawInStart, embeddedAt);
    // animated charts are driven by the shared animation ticker instead of Vega's always-on timer
    if (isAnimated) {
      removeAnimationTimerEvents(spec);
    }
    // hidden until the first paint, which then fades in instead of flickering in
    if (fadeIn) {
      container.style.opacity = '0';
    }

    const next: ActiveView = {
      cancelled: false,
      failed: false,
      inputs,
      spec,
      embeddedAt,
      pending,
      program: split.program,
      signalValues: split.signalValues,
      table: split.table,
      // serialized before vega adds fields to the rows
      tableJson: JSON.stringify(split.table),
      hasRows,
    };
    active = next;

    adapter
      .createView(container, spec, environment, { width, height })
      .then((view) => {
        // retired (destroyed or rebuilt) before the view was created, so discard it
        if (next.cancelled) {
          adapter.destroyView(view);
          return;
        }
        next.view = view;
        if (fadeIn) {
          fadeInFirstPaint(container, pending);
        }
        if (isAnimated) {
          next.detachTicker = attachAnimationTicker(view, container, pending?.holdUntil);
        }
        inputs.onNewView(view);
        adapter.startView(view);
        // inputs that arrived while the view was being created
        if (latest && latest !== inputs) {
          update(latest);
        }
      })
      .catch((error: unknown) => {
        next.failed = true;
        console.error('Failed to render chart:', error);
      });
  };

  const applyIncremental = (current: ActiveView, view: View, inputs: ViewHostInputs, split: SplitSpec): UpdateRoute => {
    const signals = getChangedSignals(current.signalValues, split.signalValues);
    const tableJson = split.table === current.table ? current.tableJson : JSON.stringify(split.table);
    const tableChanged = tableJson !== current.tableJson;
    const resized = inputs.width !== current.inputs.width || inputs.height !== current.inputs.height;
    Object.assign(current, { inputs, signalValues: split.signalValues, table: split.table, tableJson });

    if (!signals.length && !tableChanged && !resized) {
      return 'noop';
    }
    adapter.updateView(view, {
      signals,
      table: tableChanged ? split.table ?? [] : undefined,
      size: resized ? { width: inputs.width, height: inputs.height } : undefined,
    });
    return 'incremental';
  };

  const update = (inputs: ViewHostInputs): UpdateRoute => {
    latest = inputs;
    if (destroyed || !inputs.width || !inputs.height) {
      return 'none';
    }
    if (active?.inputs === inputs) {
      return 'noop';
    }
    const spec = adapter.prepareSpec(inputs.spec, inputs.table, inputs.signals);
    const split = adapter.splitSpec(spec);
    if (!active || needsRebuild(adapter, active, inputs, split)) {
      build(inputs, spec, split);
      return 'rebuild';
    }
    // applied once the pending view is created
    if (!active.view) {
      return 'deferred';
    }
    return applyIncremental(active, active.view, inputs, split);
  };

  const destroy = (): void => {
    destroyed = true;
    retire();
  };

  return { update, destroy };
};
