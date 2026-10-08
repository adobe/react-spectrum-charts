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
 * Returns variation ids that appear more than once.
 * @param variations
 * @returns string[]
 */
const getDuplicateIds = (variations: Variation[]): string[] => {
  const ids = variations.map(({ id }) => id);
  return ids.filter((id, index) => ids.indexOf(id) !== index);
};

/**
 * Returns the problems with a single prop's coverage entry.
 * @param entry
 * @param knownIds
 * @returns string[]
 */
const getEntryErrors = (entry: CoverageEntry, knownIds: Set<string>): string[] => {
  if ('skip' in entry) {
    return entry.skip.trim() ? [] : ['skips coverage without a reason'];
  }
  if (entry.length === 0) {
    return ['has no variations'];
  }
  const unknownIds = entry.filter((id) => !knownIds.has(id));
  return unknownIds.map((id) => `references unknown variation "${id}"`);
};

/**
 * Returns human-readable problems with a dashboard's coverage map.
 * @param dashboard
 * @returns string[]
 */
export const getDashboardCoverageErrors = ({ chartType, variations, coverage }: DashboardDefinition): string[] => {
  const knownIds = new Set(variations.map(({ id }) => id));

  const duplicateErrors = getDuplicateIds(variations).map((id) => `${chartType}: duplicate variation id "${id}"`);

  const entryErrors = Object.entries(coverage).flatMap(([component, props]) =>
    Object.entries(props).flatMap(([prop, entry]) => {
      if (!entry) return [];
      return getEntryErrors(entry, knownIds).map((error) => `${chartType}: ${component}.${prop} ${error}`);
    })
  );

  return [...duplicateErrors, ...entryErrors];
};
