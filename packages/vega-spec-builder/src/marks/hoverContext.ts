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

import {
  CONTROLLED_HIGHLIGHTED_ITEM,
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
  DIMENSION_HOVER_AREA,
  GROUP_ID,
  HOVERED_ITEM,
  INTERACTION_MODE,
  SELECTED_ITEM,
  SELECTED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { isHighlightedByGroup } from '../chartTooltip/chartTooltipUtils';
import { getDimensionField } from '../line/lineDataUtils';
import { LineSpecOptions } from '../types';
import { hasPopover, hasTooltip, isInteractive } from './markUtils';

export interface HoverContext {
  /** Mark namespaces that have an active `<prefix>_hoveredItem` signal (point-level hover). */
  itemPrefixes: string[];
  /** Mark namespaces that have an active `<prefix>_dimensionHoverArea_hoveredItem` signal (x-strip hover). */
  dimensionPrefixes: string[];
  /** Whether parent hover uses group-key matching (highlightBy !== 'item'). */
  isHighlightedByGroupParent: boolean;
  /** Whether trendline hover uses group-key matching. False today — trendlines don't support highlightBy. */
  isHighlightedByGroupTrendline: boolean;
  /** Whether the mark has a popover. When true, `getItemHoverPredicate` gates its expression behind the selection check. */
  hasPopoverInteractivity: boolean;
  /** Resolved dimension field (e.g. `datetimeStart` for time scale). Present only when dimension mode is active. */
  dimensionField?: string;
  /** True when any interactive component is present, meaning selection signals participate in predicate expressions. */
  hasSelection: boolean;
}

export const getHoverContext = (markOptions: LineSpecOptions): HoverContext => {
  const { name, interactionMode, trendlines } = markOptions;

  const parentInteractive = isInteractive(markOptions);
  const trendlineInteractive = trendlines.some(hasTooltip);
  const isDimension = interactionMode === INTERACTION_MODE.DIMENSION;

  const itemPrefixes: string[] = [];
  const dimensionPrefixes: string[] = [];

  if (parentInteractive) {
    itemPrefixes.push(name);
    if (isDimension) {
      dimensionPrefixes.push(name);
    }
  }

  if (trendlineInteractive) {
    const trendlinePrefix = `${name}Trendline`;
    itemPrefixes.push(trendlinePrefix);
    if (isDimension) {
      dimensionPrefixes.push(trendlinePrefix);
    }
  }

  const anyInteractive = parentInteractive || trendlineInteractive;

  return {
    itemPrefixes,
    dimensionPrefixes,
    isHighlightedByGroupParent: isHighlightedByGroup(markOptions),
    isHighlightedByGroupTrendline: false,
    hasPopoverInteractivity: hasPopover(markOptions),
    dimensionField: isDimension ? getDimensionField(markOptions.scaleType, markOptions.dimension) : undefined,
    hasSelection: anyInteractive,
  };
};

const isTrendlinePrefix = (prefix: string): boolean => prefix.endsWith('Trendline');

export const getSeriesHoverPredicate = (ctx: HoverContext): string => {
  const clauses: string[] = [];

  for (const prefix of ctx.itemPrefixes) {
    const useGroup = isTrendlinePrefix(prefix) ? ctx.isHighlightedByGroupTrendline : ctx.isHighlightedByGroupParent;
    const matchField = useGroup ? GROUP_ID : SERIES_ID;
    clauses.push(
      `isValid(${prefix}_${HOVERED_ITEM}) && ${prefix}_${HOVERED_ITEM}.${matchField} === datum.${matchField}`
    );
  }

  for (const prefix of ctx.dimensionPrefixes) {
    clauses.push(`isValid(${prefix}_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM})`);
  }

  if (ctx.hasSelection) {
    clauses.push(`isValid(${SELECTED_SERIES}) && ${SELECTED_SERIES} === datum.${SERIES_ID}`);
  }

  clauses.push(
    `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1`,
    `isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) && ${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID}`
  );

  return clauses.join(' || ');
};

export const getItemHoverPredicate = (ctx: HoverContext, idKey: string): string => {
  const clauses: string[] = [
    `isArray(${CONTROLLED_HIGHLIGHTED_ITEM}) && indexof(${CONTROLLED_HIGHLIGHTED_ITEM}, datum.${idKey}) > -1`,
  ];

  for (const prefix of ctx.itemPrefixes) {
    const useGroup = isTrendlinePrefix(prefix) ? ctx.isHighlightedByGroupTrendline : ctx.isHighlightedByGroupParent;
    if (useGroup) {
      const groupKey = `${prefix}_${GROUP_ID}`;
      clauses.push(
        `isValid(${prefix}_${HOVERED_ITEM}) && ${prefix}_${HOVERED_ITEM}.${groupKey} === datum.${groupKey}`
      );
    } else {
      clauses.push(`isValid(${prefix}_${HOVERED_ITEM}) && ${prefix}_${HOVERED_ITEM}.${idKey} === datum.${idKey}`);
    }
  }

  if (ctx.dimensionField) {
    for (const prefix of ctx.dimensionPrefixes) {
      const dimSignal = `${prefix}_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`;
      clauses.push(`isValid(${dimSignal}) && +${dimSignal}.${ctx.dimensionField} === +datum.${ctx.dimensionField}`);
    }
  }

  const coreExpr = clauses.join(' || ');

  if (ctx.hasPopoverInteractivity) {
    return `${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${idKey} || !${SELECTED_ITEM} && (${coreExpr})`;
  }

  return coreExpr;
};
