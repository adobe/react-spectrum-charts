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
import type { Variation } from './VariationDashboard.js';

/** Variation ids that exercise a prop, or an explicit reason the dashboard does not cover it. */
export type CoverageEntry = readonly string[] | { skip: string };

/** Requires a coverage entry for every public prop, so new props fail type-checking until mapped. */
export type PropCoverage<P> = { [K in keyof Required<P>]-?: CoverageEntry };

/** Sibling components (Axis, Legend, ...) only map the props that interact with the chart under test. */
export type SiblingCoverage<P> = Partial<PropCoverage<P>>;

export interface DashboardDefinition {
  chartType: string;
  variations: Variation[];
  /** Component name to its prop coverage map, e.g. `{ Line: lineCoverage, Axis: axisCoverage }`. */
  coverage: Record<string, Partial<Record<string, CoverageEntry>>>;
}

/**
 * Returns human-readable problems with a dashboard's coverage map.
 * @param dashboard
 * @returns string[]
 */
export const getDashboardCoverageErrors = ({ chartType, variations, coverage }: DashboardDefinition): string[] => {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const { id } of variations) {
    if (ids.has(id)) errors.push(`${chartType}: duplicate variation id "${id}"`);
    ids.add(id);
  }
  for (const [component, props] of Object.entries(coverage)) {
    for (const [prop, entry] of Object.entries(props)) {
      const name = `${chartType}: ${component}.${prop}`;
      if (!entry) continue;
      if ('skip' in entry) {
        if (!entry.skip.trim()) errors.push(`${name} skips coverage without a reason`);
        continue;
      }
      if (entry.length === 0) errors.push(`${name} has no variations`);
      for (const id of entry) {
        if (!ids.has(id)) errors.push(`${name} references unknown variation "${id}"`);
      }
    }
  }
  return errors;
};
