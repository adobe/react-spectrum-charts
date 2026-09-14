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

import { DIMENSION_HOVER_AREA, FILTERED_TABLE, HOVERED_ITEM } from '@spectrum-charts/constants';

export interface BarHoverParityOptions {
  /** The bar mark's own name (e.g. `bar0`) — signals are namespaced off of it, same as mouse hover. */
  markName: string;
  /** The bar's category field. */
  dimension: string;
  /** The bar's series/color field (stacked bars only). */
  color?: string;
}

export type Row = Record<string, unknown>;

/** The raw dimension/color value(s) a focused node represents: a leaf's `node.data`, or a division's dimension value via `derivedNode`. */
const getNodeFieldValues = (node: NodeObject, dimension: string, color?: string): { dimensionValue: unknown; colorValue?: unknown } => {
  const data = node.data as Row | undefined;
  if (node.dimensionLevel == null) {
    return { dimensionValue: data?.[dimension], colorValue: color ? data?.[color] : undefined };
  }
  return { dimensionValue: node.derivedNode ? data?.[node.derivedNode] : undefined };
};

/** Finds the live post-`identifier`-transform row matching a focused node, since `node.data` predates that transform. `undefined` for a division — no single row represents a whole stack. */
export const findFocusedRow = (view: View, node: NodeObject, dimension: string, color?: string): Row | undefined => {
  const { dimensionValue, colorValue } = getNodeFieldValues(node, dimension, color);
  if (dimensionValue == null) return undefined;
  const rows = (view.data(FILTERED_TABLE) ?? []) as Row[];
  // A division (whole stack) has no series of its own, so any row for that dimension value matches.
  return rows.find((row) => row[dimension] === dimensionValue && (colorValue === undefined || (color && row[color] === colorValue)));
};

/** The `${markName}_stacks` aggregate row for a focused division node — only meaningful for a division; a leaf's own row already has everything `formatTooltip` needs. */
export const findFocusedStackRow = (view: View, node: NodeObject, dimension: string, markName: string): Row | undefined => {
  const { dimensionValue } = getNodeFieldValues(node, dimension);
  if (dimensionValue == null) return undefined;
  const rows = (view.data(`${markName}_stacks`) ?? []) as Row[];
  return rows.find((row) => row[dimension] === dimensionValue);
};

/** Drives the same hover signals real mouse hover drives (see `addHoveredItemSignal`), so every existing hover rule gives keyboard focus exact parity for free. */
export const applyHoverParitySignals = (view: View, options: BarHoverParityOptions, node: NodeObject | null): void => {
  const { markName, dimension, color } = options;
  const itemSignal = `${markName}_${HOVERED_ITEM}`;
  const dimensionSignal = `${markName}_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`;

  const row = node ? findFocusedRow(view, node, dimension, color) ?? null : null;
  if (!row) {
    view.signal(itemSignal, null);
    view.signal(dimensionSignal, null);
    return;
  }

  const isLeaf = node?.dimensionLevel == null;
  // A division (whole stack) only matches the dimension-wide target — no single bar is hovered.
  view.signal(itemSignal, isLeaf ? row : null);
  view.signal(dimensionSignal, row);
};
