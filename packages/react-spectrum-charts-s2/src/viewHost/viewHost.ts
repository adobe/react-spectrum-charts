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
import { Config, Padding, Renderers, Spec, TooltipHandler, View, changeset } from 'vega';
import embed from 'vega-embed';

import { DRAW_IN_PAINT_FADE_MS, S2_EASE_OUT, TABLE } from '@spectrum-charts/core-s2/constants';
import { UserMeta, applyUserMetaConfigPatches, getVegaEmbedOptions } from '@spectrum-charts/vega-spec-builder-s2';

import {
  attachAnimationTicker,
  getDrawInHoldDeadline,
  isAnimatedSpec,
  isDrawInHoldOver,
  removeAnimationTimerEvents,
} from '../animation/animationTicker.js';
import { getDrawInStart, hasDrawIn, hasTableRows, restoreDrawInStart } from '../animation/drawInContinuity.js';
import { SplitSpec, getChangedSignals, prepareSpec, splitSpec } from './updateRouting.js';

// Framework-agnostic owner of a chart's Vega view: creation, update routing, the animation ticker and teardown.
// Must not depend on React.

/** Everything a view is built or updated from. */
export interface ViewHostInputs {
  config: Config;
  height: number;
  locale: Parameters<typeof getVegaEmbedOptions>[0]['locale'];
  /** Called once per new view; a new function rebuilds the view */
  onNewView: (view: View) => void;
  padding: Padding;
  renderer: Renderers;
  /** Values that override the spec's signal initial values */
  signals?: Record<string, unknown>;
  spec: Spec;
  /** Rows for the table dataset */
  table: unknown[] | undefined;
  /** Set at embed, before the renderer exists; a new handler rebuilds the view */
  tooltip: TooltipHandler;
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
  environment: string;
  signalValues: Map<string, unknown>;
  table: unknown[] | undefined;
  tableJson: string;
  hasRows: boolean;
}

/**
 * Resizes an existing Vega view without recreating it.
 * @param view - vega view, if one exists
 * @param width - new width
 * @param height - new height
 */
export const resizeView = (view: View | undefined, width: number, height: number): void => {
  if (view && width && height) {
    // Two passes: first updates width/height signals; second lets Vega re-settle layout
    // after dependent changes (e.g. legend column count → legend height → plot area height).
    void view
      .width(width)
      .height(height)
      .resize()
      .runAsync()
      .then(() => view.runAsync());
  }
};

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
 * Serializes the inputs outside the spec that can only be applied by rebuilding.
 * @param inputs - view host inputs
 * @returns string
 */
const getEnvironment = ({ config, locale, padding, renderer }: ViewHostInputs): string =>
  JSON.stringify({ config, locale, padding, renderer });

/**
 * Checks whether an update can't be applied to the current view.
 * @param active - current view
 * @param inputs - next inputs
 * @param split - next spec, split
 * @param environment - next environment
 * @returns boolean
 */
const needsRebuild = (active: ActiveView, inputs: ViewHostInputs, split: SplitSpec, environment: string): boolean =>
  active.failed ||
  active.program !== split.program ||
  active.environment !== environment ||
  active.inputs.tooltip !== inputs.tooltip ||
  active.inputs.onNewView !== inputs.onNewView ||
  // an empty chart has nothing drawn, so data arriving or leaving restarts draw-in in a new view
  (hasDrawIn(active.spec) && active.hasRows !== Boolean(split.table?.length));

/**
 * Creates the host that owns the Vega view rendered into a container.
 * @param container - element the view renders into
 * @returns ViewHost
 */
export const createViewHost = (container: HTMLElement): ViewHost => {
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
    retired.view?.finalize();
  };

  const build = (inputs: ViewHostInputs, spec: Spec, split: SplitSpec, environment: string): void => {
    retire();
    const { config, height, locale, padding, renderer, tooltip, width } = inputs;
    const embeddedAt = Date.now();
    const embedOptions = getVegaEmbedOptions({ locale, height, width, padding, renderer, config });
    const { patches } = (spec.usermeta as UserMeta | undefined) ?? {};
    const finalConfig = applyUserMetaConfigPatches(patches, embedOptions.config);
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
      environment,
      signalValues: split.signalValues,
      table: split.table,
      // serialized before vega adds fields to the rows
      tableJson: JSON.stringify(split.table),
      hasRows,
    };
    active = next;

    void embed(container, spec, { ...embedOptions, config: finalConfig, tooltip })
      .then(({ view }) => {
        // retired (destroyed or rebuilt) before embed resolved, so discard this view
        if (next.cancelled) {
          view.finalize();
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
        view.resize();
        void view.runAsync();
        // One additional render to settle all resize calculations
        setTimeout(() => view.runAsync(), 0);
        // inputs that arrived while embedding
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
    const changedSignals = getChangedSignals(current.signalValues, split.signalValues);
    const tableJson = split.table === current.table ? current.tableJson : JSON.stringify(split.table);
    const tableChanged = tableJson !== current.tableJson;
    const resized = inputs.width !== current.inputs.width || inputs.height !== current.inputs.height;

    for (const [name, value] of changedSignals) {
      view.signal(name, value);
    }
    if (tableChanged) {
      view.change(
        TABLE,
        changeset()
          .remove(() => true)
          .insert(split.table ?? [])
      );
    }
    Object.assign(current, { inputs, signalValues: split.signalValues, table: split.table, tableJson });

    if (resized) {
      resizeView(view, inputs.width, inputs.height);
    } else if (changedSignals.length || tableChanged) {
      view
        .resize()
        .runAsync()
        .catch((error: unknown) => console.error('Failed to update chart:', error));
    } else {
      return 'noop';
    }
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
    const spec = prepareSpec(inputs.spec, inputs.table, inputs.signals);
    const split = splitSpec(spec);
    const environment = getEnvironment(inputs);
    if (!active || needsRebuild(active, inputs, split, environment)) {
      build(inputs, spec, split, environment);
      return 'rebuild';
    }
    // applied once the pending embed resolves
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
