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

import { TABLE } from '@spectrum-charts/core-s2/constants';
import { UserMeta, applyUserMetaConfigPatches, getVegaEmbedOptions } from '@spectrum-charts/vega-spec-builder-s2';

import { SplitSpec, ViewAdapter, ViewSize } from './viewAdapter.js';

// The view host's Vega views, embedded with vega-embed. Must not depend on React.

/** Inputs outside the spec that a Vega view can only take when it's embedded. */
export interface VegaEnvironment {
  config: Config;
  locale: Parameters<typeof getVegaEmbedOptions>[0]['locale'];
  padding: Padding;
  renderer: Renderers;
  /** Set at embed, before the renderer exists */
  tooltip: TooltipHandler;
}

/** Signals that change legend symbol shapes, which Vega's legend layout does not re-measure after a signal update. */
export const PROGRAM_SIGNALS: ReadonlySet<string> = new Set(['hiddenSeries']);

/**
 * Copies a spec with the table rows and signal values it should be embedded with.
 * @param spec - built spec, not mutated
 * @param table - rows for the table dataset
 * @param signals - signal values that override the spec's initial values
 * @returns Spec
 */
export const prepareSpec = (spec: Spec, table: unknown[] | undefined, signals?: Record<string, unknown>): Spec => {
  const prepared = structuredClone(spec);
  const tableData = prepared.data?.find((d) => d.name === TABLE);
  if (tableData && 'values' in tableData) {
    tableData.values = table as object[];
  }
  if (signals) {
    for (const signal of prepared.signals ?? []) {
      if (signal.name in signals && signals[signal.name] !== undefined && 'value' in signal) {
        signal.value = signals[signal.name];
      }
    }
  }
  return prepared;
};

/**
 * Splits a prepared spec into its program, signal values and table rows.
 * @param spec - prepared spec
 * @returns SplitSpec
 */
export const splitSpec = (spec: Spec): SplitSpec => {
  const signalValues = new Map<string, unknown>();
  let table: unknown[] | undefined;
  // null placeholders keep whether a value is declared, so adding or removing one changes the program
  const program = JSON.stringify({
    ...spec,
    data: spec.data?.map((data) => {
      if (data.name !== TABLE || !('values' in data)) {
        return data;
      }
      table = Array.isArray(data.values) ? data.values : undefined;
      return { ...data, values: null };
    }),
    signals: spec.signals?.map((signal) => {
      if (!('value' in signal) || PROGRAM_SIGNALS.has(signal.name)) {
        return signal;
      }
      signalValues.set(signal.name, signal.value);
      return { ...signal, value: null };
    }),
  });
  return { program, signalValues, table };
};

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
 * Serializes the environment, except the tooltip handler, which is compared by identity.
 * @param environment - embed-time inputs
 * @returns string
 */
const serializeEnvironment = ({ config, locale, padding, renderer }: VegaEnvironment): string =>
  JSON.stringify({ config, locale, padding, renderer });

/**
 * Embeds a Vega view for a spec.
 * @param container - element the view renders into
 * @param spec - prepared spec
 * @param environment - embed-time inputs
 * @param size - view size
 * @returns the embedded view
 */
const createView = (
  container: HTMLElement,
  spec: Spec,
  { config, locale, padding, renderer, tooltip }: VegaEnvironment,
  { width, height }: ViewSize
): Promise<View> => {
  const embedOptions = getVegaEmbedOptions({ locale, height, width, padding, renderer, config });
  const { patches } = (spec.usermeta as UserMeta | undefined) ?? {};
  const finalConfig = applyUserMetaConfigPatches(patches, embedOptions.config);
  return embed(container, spec, { ...embedOptions, config: finalConfig, tooltip }).then(({ view }) => view);
};

export const vegaViewAdapter: ViewAdapter<Spec, View, VegaEnvironment> = {
  prepareSpec,
  splitSpec,
  isSameEnvironment: (previous, next) =>
    previous === next ||
    (previous.tooltip === next.tooltip && serializeEnvironment(previous) === serializeEnvironment(next)),
  createView,
  startView: (view) => {
    view.resize();
    void view.runAsync();
    // One additional render to settle all resize calculations
    setTimeout(() => view.runAsync(), 0);
  },
  updateView: (view, { signals, table, size }) => {
    for (const [name, value] of signals) {
      view.signal(name, value);
    }
    if (table) {
      view.change(
        TABLE,
        changeset()
          .remove(() => true)
          .insert(table)
      );
    }
    if (size) {
      resizeView(view, size.width, size.height);
      return;
    }
    view
      .resize()
      .runAsync()
      .catch((error: unknown) => console.error('Failed to update chart:', error));
  },
  destroyView: (view) => view.finalize(),
};
