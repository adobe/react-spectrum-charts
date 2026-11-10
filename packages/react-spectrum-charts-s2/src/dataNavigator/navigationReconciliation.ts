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
import { NodeObject } from 'data-navigator';
import { View } from 'vega';

import { SimpleData } from '@spectrum-charts/vega-spec-builder-s2';

import { NavigableChartType, getNodeIdForDatum } from './buildChartStructure.js';
import { getNodeRegion } from './composeRegions.js';
import { findSceneItems } from './focusedItemTooltip.js';

export interface NavigationMismatch {
  /** Leaf ids no rendered item maps to, so focusing them shows nothing */
  missing: string[];
  /** Ids of rendered items no leaf reaches, so keyboard users can't reach them */
  unreachable: string[];
}

/**
 * Gets the ids of the chart content's leaves: the nodes that stand for one rendered item.
 * @param nodes
 * @returns string[]
 */
export const getContentLeafIds = (nodes: Record<string, NodeObject>): string[] =>
  Object.values(nodes)
    .filter((node) => (getNodeRegion(node) ?? 'content') === 'content' && node.dimensionLevel == null)
    .map((node) => node.id);

/**
 * Gets the leaf id each item of the navigable mark maps to, skipping zero-value bars as navigation does.
 * @param view
 * @param options
 * @returns (string | undefined)[]
 */
export const getRenderedItemIds = (
  view: View,
  {
    chartType,
    markName,
    dimension,
    metric,
    seriesField,
  }: { chartType: NavigableChartType; markName: string; dimension?: string; metric: string; seriesField?: string }
): (string | undefined)[] =>
  findSceneItems(view, 'rect', markName)
    .filter((item) => Number(item.datum?.[metric]) !== 0)
    .map((item) => item.datum && getNodeIdForDatum(chartType, item.datum as SimpleData, { dimension, seriesField }));

/**
 * Compares the navigation's leaves with the rendered items they should map to one-to-one.
 * @param leafIds
 * @param renderedIds
 * @returns NavigationMismatch | undefined
 */
export const reconcileNavigation = (
  leafIds: string[],
  renderedIds: (string | undefined)[]
): NavigationMismatch | undefined => {
  const leaves = new Set(leafIds);
  const rendered = new Set(renderedIds.map((id) => id ?? '(unkeyed item)'));
  const missing = leafIds.filter((id) => !rendered.has(id));
  const unreachable = [...rendered].filter((id) => !leaves.has(id));
  return missing.length || unreachable.length ? { missing, unreachable } : undefined;
};

// The consumer's bundler replaces `process.env.NODE_ENV`; the build has no Node types.
declare const process: { env: { NODE_ENV?: string } };

/** Whether this is a development build, where navigation checks itself against the rendered chart. */
export const isDevelopment = (): boolean => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    // An unbundled browser build has no `process`.
    return false;
  }
};
