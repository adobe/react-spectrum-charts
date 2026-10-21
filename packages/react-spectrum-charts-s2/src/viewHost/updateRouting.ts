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
import { Spec } from 'vega';

import { TABLE } from '@spectrum-charts/core-s2/constants';

// Framework-agnostic: splits a spec into program, signal values and table data. Must not depend on React.

/** Signals that change legend symbol shapes, which Vega's legend layout does not re-measure after a signal update. */
export const PROGRAM_SIGNALS: ReadonlySet<string> = new Set(['hiddenSeries']);

/** A spec split into the parts that are routed separately. */
export interface SplitSpec {
  /** Serialized spec with table and signal values (except PROGRAM_SIGNALS) removed; any change rebuilds the view */
  program: string;
  /** Initial value of every signal that declares one, keyed by name */
  signalValues: Map<string, unknown>;
  /** Table rows, or undefined when the spec has no inline table */
  table: unknown[] | undefined;
}

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
 * Gets the signal values that differ between two splits of the same program.
 * @param previous - signal values the view was last updated with
 * @param next - signal values to apply
 * @returns changed [name, value] pairs
 */
export const getChangedSignals = (previous: Map<string, unknown>, next: Map<string, unknown>): [string, unknown][] =>
  [...next].filter(([name, value]) => JSON.stringify(previous.get(name)) !== JSON.stringify(value));
