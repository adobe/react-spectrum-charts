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
import { COMPONENT_NAME, DIMENSION_HOVER_AREA, HOVERED_ITEM, MARK_ID } from '@spectrum-charts/core-s2/constants';

import { ActionItem, getItemBounds } from '../utils/markClickUtils.js';
import { applyHoverParitySignals, findFocusedRow, findFocusedStackRow, getNodeFieldValues } from './barHoverParity.js';
import { ChartNavStrategy } from './chartNavStrategy.js';
import {
  findFocusedBarSceneItem,
  findFocusedDimensionAreaSceneItem,
  pageBoundsForItem,
  showFocusedItemTooltip,
} from './focusedItemTooltip.js';

/** Bars anchor focus to their rendered rects and mirror mouse hover through the bar's own hover signals. */
export const barNavStrategy: ChartNavStrategy = {
  findLeafRow: (view, node, { dimension, color }) => findFocusedRow(view, node, dimension, color),
  findLeafSceneItem: (view, row, { markName }) => findFocusedBarSceneItem(view, markName, row[MARK_ID]),
  resolveDivisionBounds: (view, container, node, { markName, dimension }) => {
    // Resolved directly rather than via findFocusedStackRow, which reads a stacked-only data source and would throw for a dodged bar.
    const { dimensionValue } = getNodeFieldValues(node, dimension);
    const item =
      dimensionValue != null ? findFocusedDimensionAreaSceneItem(view, markName, dimension, dimensionValue) : undefined;
    return item ? pageBoundsForItem(view, container, item) : undefined;
  },
  resolveLeafBounds: (view, container, row, ctx) => {
    const item = barNavStrategy.findLeafSceneItem(view, row, ctx);
    return item ? pageBoundsForItem(view, container, item) : undefined;
  },
  resolveLeafPopoverBounds: (view, row, { markName }) => {
    const item = findFocusedBarSceneItem(view, markName, row[MARK_ID]);
    return item ? getItemBounds(item as ActionItem) : undefined;
  },
  resolveDivisionPopover: (view, node, { markName, dimension }) => {
    // The whole-stack popover a real click on the stack's exposed padding opens.
    const row = findFocusedStackRow(view, node, dimension, markName);
    if (!row) return undefined;
    const item = findFocusedDimensionAreaSceneItem(view, markName, dimension, row[dimension]);
    return item ? { row, bounds: getItemBounds(item as ActionItem) } : undefined;
  },
  applyFocusedLook: (view, node, { markName, dimension, color }, dimensionOnly) =>
    applyHoverParitySignals(view, { markName, dimension, color }, node, dimensionOnly),
  getHoverSignals: ({ markName }) => [
    `${markName}_${HOVERED_ITEM}`,
    `${markName}_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`,
  ],
  showLeafTooltip: (container, view, _row, value, { markName }) =>
    showFocusedItemTooltip(container, view, `${markName}_focusRing`, value),
  showDivisionTooltip: (container, view, node, { markName, dimension }) => {
    // Empty unless a dimensionArea-targeted ChartInspect exists, matching real hover.
    const row = findFocusedStackRow(view, node, dimension, markName);
    const value = row ? { ...row, [COMPONENT_NAME]: `${markName}_${DIMENSION_HOVER_AREA}`, dimension } : null;
    showFocusedItemTooltip(container, view, `${markName}_stackFocusRing`, value);
  },
};
