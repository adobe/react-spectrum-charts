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
// Guarded to browser-only: `window` doesn't exist during SSR. jsdom (used by this file's tests)
// provides `window`, so this still registers under Jest.
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
 * Reads the outgoing view's live `hiddenSeries` value, if the chart has a toggleable legend.
 * @param view the view about to be finalized, or undefined if there isn't one yet
 * @param interactionConfig the chart's interaction config, if any
 * @returns the live value, or undefined if there's no toggleable legend / no outgoing view
 */
function getOutgoingHiddenSeries(
  view: View | undefined,
  interactionConfig: VegaChartInteractionConfig | undefined
): string[] | undefined {
  return interactionConfig?.legend?.isToggleable ? (view?.signal('hiddenSeries') as string[] | undefined) : undefined;
}

/**
 * Deep-clones `spec`, injects the real row data, and resolves each declared signal's starting value.
 * @param spec the raw spec, still holding the builder's empty TABLE placeholder
 * @param chartData the real row data to inject
 * @param signals externally-driven signal values (e.g. backgroundColor, selected item/series)
 * @param interactionConfig the chart's interaction config, if any
 * @param outgoingHiddenSeries the previous view's live hiddenSeries value, if any
 * @returns a self-contained spec ready to pass to embed()
 */
function prepareSpecForEmbed(
  spec: Spec,
  chartData: VegaChartControllerProps['chartData'],
  signals: Record<string, unknown> | undefined,
  interactionConfig: VegaChartInteractionConfig | undefined,
  outgoingHiddenSeries: string[] | undefined
): Spec {
  // JSON.stringify/parse (not structuredClone) so keys with an undefined value are stripped from the spec.
  const specCopy = JSON.parse(JSON.stringify(spec)) as Spec; // NOSONAR
  const tableData = specCopy.data?.find((d) => d.name === TABLE);
  if (tableData && 'values' in tableData) {
    tableData.values = chartData.table ?? [];
  }

  const mergedSignals: Record<string, unknown> = { ...signals };
  if (interactionConfig?.legend?.isToggleable) {
    // outgoingHiddenSeries is undefined on the first-ever mount (no previous view to read it from).
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
  return specCopy;
}

/**
 * Mounts and manages a Vega view inside `container`, driven entirely by plain function calls (no
 * React effects).
 * @param container the DOM element to embed the chart into
 * @param initialProps the chart's initial props
 * @returns a handle for resizing, updating, reading, and destroying the view
 */
export function attachVegaChartController(
  container: HTMLElement,
  initialProps: VegaChartControllerProps
): VegaChartControllerHandle {
  const state = {
    props: initialProps,
    view: undefined as View | undefined,
    // Bumped on every embedView() attempt. An in-flight attempt whose generation no longer matches
    // state.generation by the time its embed() resolves has been superseded — see isStale().
    generation: 0,
    destroyed: false,
  };

  // True once `myGeneration` is no longer the controller's current attempt, or the controller has
  // been torn down — either way, the attempt's result must not be wired up.
  const isStale = (myGeneration: number): boolean => state.destroyed || myGeneration !== state.generation;

  // Finishes wiring up a freshly embedded view: interaction listeners, the onNewView callback, and
  // the resize passes needed to settle layout after the initial render.
  function wireNewView(newView: View, interactionConfig: VegaChartInteractionConfig | undefined, onNewView: (view: View) => void): void {
    state.view = newView;
    if (interactionConfig) {
      interactionConfig.refs.chartView.current = newView;
      attachInteractionListeners(newView, interactionConfig, setSignal);
    }
    onNewView(newView);
    newView.resize();
    newView.runAsync();
    // One additional render to settle all resize calculations
    setTimeout(() => newView.runAsync(), 0);
  }

  // Embeds a fresh view for `props`, finalizing any existing one first. Used both for the first-ever
  // mount and for later recreates (a spec/data/config change).
  function embedView(props: VegaChartControllerProps): void {
    state.props = props;
    const { chartData, config, height, interactionConfig, locale, onNewView, padding, renderer, signals, spec, tooltip, width } =
      props;
    if (!width || !height || state.destroyed) return;

    const outgoingHiddenSeries = getOutgoingHiddenSeries(state.view, interactionConfig);
    if (state.view) {
      state.view.finalize();
      state.view = undefined;
    }

    const myGeneration = ++state.generation;
    const specCopy = prepareSpecForEmbed(spec, chartData, signals, interactionConfig, outgoingHiddenSeries);
    const embedOptions = getVegaEmbedOptions({ locale, height, width, padding, renderer, config });
    const { patches } = (specCopy.usermeta as UserMeta | undefined) ?? {};
    const finalConfig = applyUserMetaConfigPatches(patches, embedOptions.config);

    embed(container, specCopy, { ...embedOptions, config: finalConfig, tooltip }).then(({ view: newView }) => {
      if (isStale(myGeneration)) {
        newView.finalize();
        return;
      }
      wireNewView(newView, interactionConfig, onNewView);
    });
  }

  function resize(width: number, height: number): void {
    if (state.destroyed) return;
    state.props = { ...state.props, width, height };
    if (state.view) {
      resizeView(state.view, width, height);
    } else if (width && height && state.generation === 0) {
      // Started at 0×0 with no embed ever attempted — do the initial embed now.
      embedView(state.props);
    }
    // else: an embed is already in flight (generation > 0, view still undefined) — it will pick up
    // the current dimensions via embedOptions when it resolves.
  }

  function updateSpec(props: VegaChartControllerProps): void {
    embedView(props);
  }

  function getView(): View | undefined {
    return state.view;
  }

  function setSignal(name: string, value: unknown): void {
    if (state.destroyed || !state.view) return;
    state.view.signal(name, value);
    state.view.runAsync();
  }

  function destroy(): void {
    state.destroyed = true;
    if (state.view) {
      state.view.finalize();
      state.view = undefined;
    }
  }

  if (initialProps.width && initialProps.height) {
    embedView(initialProps);
  }

  return { resize, updateSpec, getView, setSignal, destroy };
}
