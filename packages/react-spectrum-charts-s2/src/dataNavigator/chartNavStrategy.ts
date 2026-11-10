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

import { MarkBounds } from '@spectrum-charts/vega-spec-builder-s2';

import { Row } from './barHoverParity.js';
import { SceneNode } from './focusedItemTooltip.js';
import { Bounds } from './navigationRegion.js';

/** The navigable mark's fields a ChartNavStrategy reads. */
export interface StrategyContext {
  markName: string;
  dimension: string;
  /** The field a row's series is keyed by */
  color?: string;
  metric?: string;
}

/** Everything about focusing chart content that differs by chart type. */
export interface ChartNavStrategy {
  /** The live row a leaf node represents */
  findLeafRow: (view: View, node: NodeObject, ctx: StrategyContext) => Row | undefined;
  /** The rendered mark for a leaf's row, which pointer events target */
  findLeafSceneItem: (view: View, row: Row, ctx: StrategyContext) => SceneNode | undefined;
  /** Page bounds for a division node's rendered mark */
  resolveDivisionBounds: (
    view: View,
    container: HTMLElement,
    node: NodeObject,
    ctx: StrategyContext
  ) => Bounds | undefined;
  /** Page bounds for a leaf's rendered mark */
  resolveLeafBounds: (view: View, container: HTMLElement, row: Row, ctx: StrategyContext) => Bounds | undefined;
  /** Chart bounds a leaf's popover anchors to; `undefined` skips opening it */
  resolveLeafPopoverBounds: (view: View, row: Row, ctx: StrategyContext) => MarkBounds | undefined;
  /** The row and bounds of a division's popover; omitted when divisions have no popover */
  resolveDivisionPopover?: (
    view: View,
    node: NodeObject,
    ctx: StrategyContext
  ) => { row: Row; bounds: MarkBounds } | undefined;
  /** Shows the "focused" look; `dimensionOnly` highlights only the node's dimension value */
  applyFocusedLook: (view: View, node: NodeObject | null, ctx: StrategyContext, dimensionOnly?: boolean) => void;
  /** Signals the mouse clears that also carry the focused look */
  getHoverSignals?: (ctx: StrategyContext) => string[];
  /** Shows a leaf's tooltip; a null `value` hides it */
  showLeafTooltip: (
    container: HTMLElement,
    view: View,
    row: Row | undefined,
    value: Row | null,
    ctx: StrategyContext
  ) => void;
  /** Shows a division's tooltip */
  showDivisionTooltip: (container: HTMLElement, view: View, node: NodeObject, ctx: StrategyContext) => void;
}
