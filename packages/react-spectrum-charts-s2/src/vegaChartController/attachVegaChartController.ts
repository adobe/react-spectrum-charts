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
import { Config, Padding, Renderers, Spec, View, expressionFunction } from 'vega';
import embed from 'vega-embed';
import { Options as TooltipOptions } from 'vega-tooltip';

import { TABLE } from '@spectrum-charts/constants';
import { UserMeta, applyUserMetaConfigPatches, getVegaEmbedOptions } from '@spectrum-charts/vega-spec-builder-s2';

import { ChartProps } from '../types';
import { VegaChartInteractionConfig } from './interactionConfig';
import { attachInteractionListeners } from './interactionHandlers';

// Register a custom expression function that returns the full container width (including axis space).
// `view._viewWidth` is the container width minus spec-level padding; adding padding back gives the
// true container width. Passing `width` as an argument creates a reactive dependency so the signal
// re-evaluates on every resize.
//
// Guarded to browser-only execution: this used to run unconditionally at module load, which crashed
// SSR frameworks server-rendering a "use client" component using this library (there is no `window`
// in Node's module evaluation). jsdom (used by this file's tests) provides `window`, so this still
// registers under Jest.
if (typeof window !== 'undefined') {
  expressionFunction('rscContainerWidth', function (this: { context: { dataflow: View } }) {
    const view = this.context.dataflow;
    const p = view.padding() as { left?: number; right?: number };
    const viewWidth = (view as unknown as { _viewWidth?: number })._viewWidth ?? 0;
    return viewWidth + (p.left ?? 0) + (p.right ?? 0);
  });
}

/**
 * Resizes an existing Vega view without recreating it.
 */
export const resizeView = (view: View | undefined, width: number, height: number): void => {
  if (view && width && height) {
    // Two passes: first updates width/height signals; second lets Vega re-settle layout
    // after dependent changes (e.g. legend column count → legend height → plot area height).
    view.width(width).height(height).resize().runAsync().then(() => view.runAsync());
  }
};

export interface VegaChartControllerProps {
  config: Config;
  chartData: { table?: unknown[] } & Record<string, unknown[]>;
  data: unknown[];
  height: number;
  interactionConfig?: VegaChartInteractionConfig;
  locale: ChartProps['locale'];
  onNewView: (view: View) => void;
  padding: Padding;
  renderer: Renderers;
  signals?: Record<string, unknown>;
  spec: Spec;
  tooltip: TooltipOptions;
  width: number;
}

export interface VegaChartControllerHandle {
  /** Cheap resize of the existing view — does not recreate it. */
  resize: (width: number, height: number) => void;
  /** Recreates the view with a new spec/data/config. */
  updateSpec: (props: VegaChartControllerProps) => void;
  /** The live Vega View, if one currently exists. */
  getView: () => View | undefined;
  /** Cheap live signal write on the existing view — does not recreate it. */
  setSignal: (name: string, value: unknown) => void;
  /** Tears down the current view. Safe to call more than once. */
  destroy: () => void;
}

/**
 * Mounts and manages a Vega view inside `container`, replacing what used to be VegaChart.tsx's
 * two React effects (embed + resize) with plain function calls.
 * @param container the DOM element to embed the chart into
 * @param initialProps the chart's initial props
 * @returns a handle for resizing, updating, reading, and destroying the view
 */
export function attachVegaChartController(
  container: HTMLElement,
  initialProps: VegaChartControllerProps
): VegaChartControllerHandle {
  let currentProps = initialProps;
  let view: View | undefined;
  // Doubles as: (1) "has an embed ever been attempted" (generation === 0 vs not), replacing the old
  // needsInitEmbed React state, and (2) the Strict Mode cancellation guard — embed() is async, so a
  // superseded recreate() must not wire up a view that's no longer the authoritative one.
  let generation = 0;
  let destroyed = false;

  function recreate(props: VegaChartControllerProps): void {
    currentProps = props;
    const { chartData, config, height, interactionConfig, locale, onNewView, padding, renderer, signals, spec, tooltip, width } =
      props;
    if (!width || !height || destroyed) return;

    // Capture the outgoing view's live hiddenSeries value before finalizing it, so an unrelated
    // recreate (e.g. a data prop change) doesn't silently reset a legend toggle.
    const outgoingHiddenSeries = interactionConfig?.legend?.isToggleable
      ? (view?.signal('hiddenSeries') as string[] | undefined)
      : undefined;

    if (view) {
      view.finalize();
      view = undefined;
    }

    const myGeneration = ++generation;
    const specCopy = JSON.parse(JSON.stringify(spec)) as Spec;
    const tableData = specCopy.data?.find((d) => d.name === TABLE);
    if (tableData && 'values' in tableData) {
      tableData.values = chartData.table ?? [];
    }
    const mergedSignals: Record<string, unknown> = { ...signals };
    if (interactionConfig?.legend?.isToggleable) {
      // No outgoing view means this is the first-ever mount — seed from Legend.defaultHiddenSeries
      // instead, since useLegend no longer holds its own state to do this.
      mergedSignals.hiddenSeries = outgoingHiddenSeries ?? interactionConfig.legend.defaultHiddenSeries ?? [];
    }
    if (Object.keys(mergedSignals).length) {
      specCopy.signals = specCopy.signals?.map((signal) => {
        if (signal.name in mergedSignals && mergedSignals[signal.name] !== undefined && 'value' in signal) {
          signal.value = mergedSignals[signal.name];
        }
        return signal;
      });
    }
    const embedOptions = getVegaEmbedOptions({ locale, height, width, padding, renderer, config });
    const { patches } = (specCopy.usermeta as UserMeta | undefined) ?? {};
    const finalConfig = applyUserMetaConfigPatches(patches, embedOptions.config);

    embed(container, specCopy, { ...embedOptions, config: finalConfig, tooltip }).then(({ view: newView }) => {
      // This mount lost the race — either the controller was destroyed, or a newer recreate()
      // started (e.g. React Strict Mode's synchronous mount→cleanup→mount double-invoke) before
      // this embed() resolved. Finalize it immediately instead of wiring it up.
      if (destroyed || myGeneration !== generation) {
        newView.finalize();
        return;
      }
      view = newView;
      if (interactionConfig) {
        interactionConfig.refs.chartView.current = newView;
        attachInteractionListeners(newView, interactionConfig, setSignal);
      }
      onNewView(newView);
      newView.resize();
      newView.runAsync();
      // One additional render to settle all resize calculations
      setTimeout(() => newView.runAsync(), 0);
    });
  }

  function resize(width: number, height: number): void {
    if (destroyed) return;
    currentProps = { ...currentProps, width, height };
    if (view) {
      resizeView(view, width, height);
    } else if (width && height && generation === 0) {
      // AN-445759: started at 0×0 with no embed ever attempted — do the initial embed now.
      recreate(currentProps);
    }
    // else: an embed is already in flight (generation > 0, view still undefined) — it will pick up
    // the current dimensions via embedOptions when it resolves.
  }

  function updateSpec(props: VegaChartControllerProps): void {
    recreate(props);
  }

  function getView(): View | undefined {
    return view;
  }

  function setSignal(name: string, value: unknown): void {
    if (destroyed || !view) return;
    view.signal(name, value);
    view.runAsync();
  }

  function destroy(): void {
    destroyed = true;
    if (view) {
      view.finalize();
      view = undefined;
    }
  }

  if (initialProps.width && initialProps.height) {
    recreate(initialProps);
  }

  return { resize, updateSpec, getView, setSignal, destroy };
}
