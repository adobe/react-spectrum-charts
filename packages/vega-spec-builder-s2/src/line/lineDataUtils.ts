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
import { SourceData } from 'vega';

import {
  CONTROLLED_HIGHLIGHTED_ITEM,
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
  FILTERED_TABLE,
  FOCUSED_DIMENSION,
  FOCUSED_ITEM,
  GROUP_ID,
  HOVERED_ITEM,
  INTERACTION_MODALITY,
  NAVIGATION_ID_SEPARATOR,
  NAVIGATION_INDEX_FIELD,
  SELECTED_ITEM,
  SELECTED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { getEffectiveMetricField } from '../lineForecast';
import { getFocusedGroupOrItemMatchExpr } from '../marks/focusMatchUtils';
import { HoverMatchRule } from '../marks/hoverAnimationUtils';
import { hasPopover, isInteractive } from '../marks/markUtils';
import { LineSpecOptions } from '../types';
import { getCascadeTransforms } from './directLabelUtils';

/** A Vega expression matching the point currently focused via keyboard navigation. */
const getFocusedItemMatchExpr = (color?: string): string => {
  const focusedId = color
    ? `datum.${color} + "${NAVIGATION_ID_SEPARATOR}" + datum.${NAVIGATION_INDEX_FIELD}`
    : `'' + datum.${NAVIGATION_INDEX_FIELD}`;
  return `${FOCUSED_ITEM} === ${focusedId}`;
};

/**
 * gets the data used for highlighting hovered data points
 * @param name
 * @param source
 * @returns
 */
export const getLineHighlightedData = (options: LineSpecOptions): SourceData => {
  const { accessibleNavigation, color, name: lineName, idKey } = options;

  let expr = `isArray(${CONTROLLED_HIGHLIGHTED_ITEM}) && indexof(${CONTROLLED_HIGHLIGHTED_ITEM}, datum.${idKey}) > -1`;

  if (isInteractive(options) || accessibleNavigation) {
    const hoveredItemSignal = `${lineName}_${HOVERED_ITEM}`;
    const groupKey = `${lineName}_${GROUP_ID}`;
    const hoverMatchExpr = options.isHighlightedByGroup
      ? `${hoveredItemSignal}.${groupKey} === datum.${groupKey}`
      : `${hoveredItemSignal}.${idKey} === datum.${idKey}`;

    // Whichever modality was used most recently wins; moving the mouse away (or the mouse never
    // having moved since the last keyboard interaction) reveals the focused point again — this
    // whole clause is an `isValid(hoveredItemSignal) && pointer-was-last ? hover match : focus
    // match`, never both.
    expr += accessibleNavigation
      ? ` || (isValid(${hoveredItemSignal}) && ${INTERACTION_MODALITY} !== 'keyboard' ? (${hoverMatchExpr}) : (${getFocusedItemMatchExpr(
          typeof color === 'string' ? color : undefined
        )}))`
      : ` || isValid(${hoveredItemSignal}) && (${hoverMatchExpr})`;

    if (hasPopover(options)) {
      expr = `${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${idKey} || !${SELECTED_ITEM} && ${expr}`;
    }
  }

  return {
    name: `${lineName}_highlightedData`,
    source: FILTERED_TABLE,
    transform: [
      {
        type: 'filter',
        expr,
      },
    ],
  };
};

/**
 * Builds a Vega expression that evaluates to true for series NOT in the primary set.
 * - number: first N series by color scale order
 * - string[]: explicitly named series
 */
export const getPrimarySeriesOtherExpr = (primarySeries: number | string[], datumPath: string): string => {
  const seriesRef = Array.isArray(primarySeries)
    ? JSON.stringify(primarySeries)
    : `slice(domain('color'), 0, ${primarySeries})`;
  return `indexof(${seriesRef}, ${datumPath}.${SERIES_ID}) < 0`;
};

/**
 * Gets a derived data source sorted so "other" series appear first,
 * causing Vega to draw them first (behind the primary series).
 */
export const getPrimarySeriesFacetData = (name: string, primarySeries: number | string[]): SourceData => ({
  name: `${name}_primarySeriesFacetData`,
  source: FILTERED_TABLE,
  transform: [
    {
      type: 'formula',
      as: `${name}_isOther`,
      expr: `${getPrimarySeriesOtherExpr(primarySeries, 'datum')} ? 1 : 0`,
    },
    { type: 'collect', sort: { field: `${name}_isOther`, order: 'descending' } },
  ],
});

/**
 * Derives from highlightedData and adds cascade transforms so labels for multiple series
 * at the same hovered dimension are spread apart rather than overlapping.
 */
export const getHoverLabelData = (options: LineSpecOptions): SourceData => {
  const { name, metricAxis } = options;
  const yScaleName = metricAxis || 'yLinear';

  return {
    name: `${name}_hoverLabelData`,
    source: `${name}_highlightedData`,
    transform: getCascadeTransforms(yScaleName, getEffectiveMetricField(options), 'hover'),
  };
};

/**
 * gets the data used for displaying points
 * @param name
 * @param staticPoint
 * @param source
 * @param isSparkline
 * @param isMethodLast
 * @returns
 */
export const getLineStaticPointData = (
  name: string,
  staticPoint: string | undefined,
  source: string,
  isSparkline: boolean | undefined,
  isMethodLast: boolean | undefined
): SourceData => {
  const expr =
    isSparkline && isMethodLast ? "datum === data('table')[data('table').length - 1]" : `datum.${staticPoint} === true`;
  return {
    name: `${name}_staticPointData`,
    source,
    transform: [
      {
        type: 'filter',
        expr,
      },
    ],
  };
};

/**
 * Constructs the conditions for the hover interaction rules, storing the hover state as target values for each hoverable item
 * @param lineOptions - the line spec options containing the interactive mark name, popover mark name, combo sibling names, and whether the series is highlighted by group
 * @returns HoverMatchRule[] - the hover interaction rules
 */
export const getLineHoverRules = (
  { accessibleNavigation, color, interactiveMarkName, popoverMarkName, comboSiblingNames, isHighlightedByGroup }: LineSpecOptions
): HoverMatchRule[] => {
  const rules: HoverMatchRule[] = [];

  if (interactiveMarkName) {
    const hoveredGroupExpr = `length(data('${interactiveMarkName}_highlightedData')) ? (indexof(pluck(data('${interactiveMarkName}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1 ? 1 : 0) : null`;
    const hoveredItemValidExpr = accessibleNavigation
      ? `isValid(${interactiveMarkName}_${HOVERED_ITEM}) && ${INTERACTION_MODALITY} !== 'keyboard'`
      : `isValid(${interactiveMarkName}_${HOVERED_ITEM})`;
    const hoveredItemExpr = `${hoveredItemValidExpr} ? (${interactiveMarkName}_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : 0) : null`;
    const hoveredMatchExpr = isHighlightedByGroup ? hoveredGroupExpr : hoveredItemExpr;
    rules.push({ as: 'hoveredMatch', expr: hoveredMatchExpr });
  }
  const controlledTableMatchExpr = `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}')) ? (indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : 0) : null`;
  const controlledSeriesMatchExpr = `isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) ? (${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : 0) : null`;
  rules.push(
    { as: 'controlledTableMatch',  expr: controlledTableMatchExpr },
    { as: 'controlledSeriesMatch', expr: controlledSeriesMatchExpr },
  );
  if (popoverMarkName) {
    const popoverMatchExpr = `isValid(${SELECTED_SERIES}) ? (${SELECTED_SERIES} === datum.${SERIES_ID} ? 1 : 0) : null`;
    rules.push({ as: 'popoverMatch', expr: popoverMatchExpr });
  }
  if (comboSiblingNames?.length) {
    const siblingTest = comboSiblingNames.map((s) => `isValid(${s}_${HOVERED_ITEM})`).join(' || ')
    const comboSiblingMatchExpr = `(${siblingTest}) ? 1 : 0`;
    rules.push({ as: 'comboSiblingMatch', expr: comboSiblingMatchExpr });
  }
  // Falls last (after hover/controlled/popover/combo) as the fallback once hoveredMatch is gated
  // out by interaction modality (see hoveredItemValidExpr above). Needed because the
  // hover-animation engine (used whenever this line is "animated" — e.g. has a popover, inspect,
  // or click handler) computes its own opacity signal, bypassing getLineOpacityRules entirely —
  // this keeps keyboard focus reflected either way.
  if (accessibleNavigation && typeof color === 'string') {
    const focusMatchExpr = `isValid(${FOCUSED_DIMENSION}) || isValid(${FOCUSED_ITEM}) ? (${getFocusedGroupOrItemMatchExpr(
      `datum.${color}`,
      'prefix'
    )} ? 1 : 0) : null`;
    rules.push({ as: 'focusMatch', expr: focusMatchExpr });
  }
  return rules;
};