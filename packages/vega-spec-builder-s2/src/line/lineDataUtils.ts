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
  FILTERED_TABLE,
  GROUP_ID,
  HOVERED_ITEM,
  SELECTED_ITEM,
  SELECTED_SERIES,
  SERIES_ID,
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
} from '@spectrum-charts/constants';

import { hasPopover, isInteractive } from '../marks/markUtils';
import { getCascadeTransforms } from './directLabelUtils';
import { LineSpecOptions } from '../types';
import { HoverMatchRule } from '../marks/hoverAnimationUtils';

/**
 * gets the data used for highlighting hovered data points
 * @param name
 * @param source
 * @returns
 */
export const getLineHighlightedData = (options: LineSpecOptions): SourceData => {
  const { name: lineName, idKey } = options;

  let expr = `isArray(${CONTROLLED_HIGHLIGHTED_ITEM}) && indexof(${CONTROLLED_HIGHLIGHTED_ITEM}, datum.${idKey}) > -1`;

  if (isInteractive(options)) {
    const hoveredItemSignal = `${lineName}_${HOVERED_ITEM}`;
    const groupKey = `${lineName}_${GROUP_ID}`;
    if (options.isHighlightedByGroup) {
      expr += ` || isValid(${hoveredItemSignal}) && ${hoveredItemSignal}.${groupKey} === datum.${groupKey}`;
    } else {
      expr += ` || isValid(${hoveredItemSignal}) && ${hoveredItemSignal}.${idKey} === datum.${idKey}`;
    }
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
  const { metric, name, metricAxis } = options;
  const yScaleName = metricAxis || 'yLinear';

  return {
    name: `${name}_hoverLabelData`,
    source: `${name}_highlightedData`,
    transform: getCascadeTransforms(yScaleName, metric, 'hover'),
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
 * @param param0 
 * @returns 
 */
export const getLineHoverRules = (
  { interactiveMarkName, popoverMarkName, comboSiblingNames, isHighlightedByGroup }: LineSpecOptions
): HoverMatchRule[] => {
  const rules: HoverMatchRule[] = [];
  if (interactiveMarkName) {
    const expr = isHighlightedByGroup 
      ? `length(data('${interactiveMarkName}_highlightedData')) ? (indexof(pluck(data('${interactiveMarkName}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1 ? 1 : 0) : null` 
      : `isValid(${interactiveMarkName}_${HOVERED_ITEM}) ? (${interactiveMarkName}_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : 0) : null`;
    rules.push({ as: 'hoveredMatch', expr: expr });
  }
  rules.push(
    { as: 'controlledTableMatch',  expr: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}')) ? (indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : 0) : null` },
    { as: 'controlledSeriesMatch', expr: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) ? (${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : 0) : null` },
  );
  if (popoverMarkName) rules.push({ as: 'popoverMatch', expr: `isValid(${SELECTED_SERIES}) ? (${SELECTED_SERIES} === datum.${SERIES_ID} ? 1 : 0) : null` });
  if (comboSiblingNames?.length) {
    const siblingTest = comboSiblingNames.map((s) => `isValid(${s}_${HOVERED_ITEM})`).join(' || ')
    rules.push({ as: 'comboSiblingMatch', expr: `(${siblingTest}) ? 1 : 0` });
  }
  return rules;
};
