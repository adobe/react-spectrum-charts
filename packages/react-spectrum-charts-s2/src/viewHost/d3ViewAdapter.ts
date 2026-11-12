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
import { ChartEnv, D3Chart, D3ChartOptions, Datum, createChart } from '@spectrum-charts/chart-d3';
import { SELECTED_GROUP, SELECTED_ITEM, SELECTED_SERIES } from '@spectrum-charts/core-s2/constants';

import { SplitSpec, ViewAdapter, ViewChanges, ViewSize } from './viewAdapter.js';

/** Chart options plus the host-controlled values the Vega engine would set as signals. */
export interface D3ViewSpec {
  options: D3ChartOptions;
  signals?: Record<string, unknown>;
}

export type D3Environment = Pick<ChartEnv, 'colorScheme' | 'locale' | 'padding' | 'renderer'>;

/** Signals that map onto chart options; any other signal is either chart state or ignored. */
const OPTION_SIGNALS = ['hiddenSeries'] as const;

interface LiveChart {
  options: D3ChartOptions;
  signals: Record<string, unknown>;
}

const live = new WeakMap<D3Chart, LiveChart>();

const withSignals = (options: D3ChartOptions, signals: Record<string, unknown>): D3ChartOptions => {
  const next = { ...options };
  for (const name of OPTION_SIGNALS) {
    if (name in signals) Object.assign(next, { [name]: signals[name] });
  }
  return next;
};

/** Signals that map onto chart state, like the Vega selection signals. */
const STATE_SIGNALS: Record<string, 'selectedId' | 'selectedSeries' | 'selectedGroup'> = {
  [SELECTED_ITEM]: 'selectedId',
  [SELECTED_SERIES]: 'selectedSeries',
  [SELECTED_GROUP]: 'selectedGroup',
};

const applyLive = (chart: D3Chart, current: LiveChart, size?: ViewSize, rebuildOptions = true): void => {
  if (rebuildOptions || size) chart.update(withSignals(current.options, current.signals), size);
};

/** Applies changed selection signals; unchanged ones are left alone since interactions also set chart state. */
const applyState = (chart: D3Chart, signals: [string, unknown][]): void => {
  const state = Object.fromEntries(
    signals.filter(([name]) => name in STATE_SIGNALS).map(([name, value]) => [STATE_SIGNALS[name], value ?? null])
  );
  if (Object.keys(state).length) chart.setState(state);
};

const getProgram = ({ options }: D3ViewSpec): string =>
  JSON.stringify({
    ...options,
    data: undefined,
    ...Object.fromEntries(OPTION_SIGNALS.map((name) => [name, undefined])),
  });

const mergeChanges = (current: LiveChart, { signals, table }: ViewChanges): boolean => {
  signals.forEach(([name, value]) => (current.signals[name] = value));
  if (table) current.options = { ...current.options, data: table as Datum[] };
  return Boolean(table) || signals.some(([name]) => (OPTION_SIGNALS as readonly string[]).includes(name));
};

/** Builds and updates `chart-d3` charts for the view host. */
export const d3ViewAdapter: ViewAdapter<D3ViewSpec, D3Chart, D3Environment> = {
  prepareSpec: ({ options }, table, signals) => ({
    options: { ...options, data: (table ?? options.data) as Datum[] },
    signals: { ...signals },
  }),

  splitSpec: (spec): SplitSpec => {
    const signalValues = new Map<string, unknown>(Object.entries(spec.signals ?? {}));
    for (const name of OPTION_SIGNALS) {
      if (!signalValues.has(name) && spec.options[name] !== undefined) signalValues.set(name, spec.options[name]);
    }
    return { program: getProgram(spec), signalValues, table: spec.options.data };
  },

  isSameEnvironment: (previous, next) =>
    previous.colorScheme === next.colorScheme &&
    previous.renderer === next.renderer &&
    JSON.stringify(previous.locale) === JSON.stringify(next.locale) &&
    JSON.stringify(previous.padding) === JSON.stringify(next.padding),

  createView: (container, spec, environment, size) => {
    const current: LiveChart = { options: spec.options, signals: { ...spec.signals } };
    const chart = createChart(container, withSignals(current.options, current.signals), { ...environment, ...size });
    live.set(chart, current);
    applyState(chart, Object.entries(current.signals));
    return Promise.resolve(chart);
  },

  startView: () => {},

  updateView: (chart, changes) => {
    const current = live.get(chart);
    if (!current) return;
    applyLive(chart, current, changes.size, mergeChanges(current, changes));
    applyState(chart, changes.signals);
  },

  updateProgram: (chart, spec, changes) => {
    const current = live.get(chart);
    if (!current) return false;
    current.options = spec.options;
    mergeChanges(current, changes);
    applyLive(chart, current, changes.size);
    applyState(chart, changes.signals);
    return true;
  },

  destroyView: (chart) => {
    live.delete(chart);
    chart.destroy();
  },
};
