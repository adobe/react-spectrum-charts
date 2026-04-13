/*
 * Copyright 2023 Adobe. All rights reserved.
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
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  DIMENSION_HOVER_AREA,
  FILTERED_TABLE,
  GROUP_ID,
  HOVERED_ITEM,
  INTERACTION_MODE,
  SELECTED_ITEM,
} from '@spectrum-charts/constants';

import { isHighlightedByGroup } from '../chartTooltip/chartTooltipUtils';
import { hasPopover, isInteractive } from '../marks/markUtils';
import { LineSpecOptions, ScaleType } from '../types';

import { staticPointTestExpr } from './lineUtils';

/**
 * Gets the dimension field name used for x encoding based on scale type
 * @param scaleType
 * @param dimension
 * @returns the field name to use for dimension grouping
 */
export const getDimensionField = (scaleType: ScaleType, dimension: string): string => {
  if (scaleType === 'time') return DEFAULT_TRANSFORMED_TIME_DIMENSION;
  return dimension;
};

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

    if (options.interactionMode === INTERACTION_MODE.DIMENSION) {
      // For dimension mode, highlight on both point hover and time-based dimension hover
      const dimensionHoverSignal = `${lineName}_${DIMENSION_HOVER_AREA}_${HOVERED_ITEM}`;
      const dimensionField = getDimensionField(options.scaleType, options.dimension);

      expr += ` || isValid(${hoveredItemSignal}) && ${hoveredItemSignal}.${idKey} === datum.${idKey}`;
      expr += ` || isValid(${dimensionHoverSignal}) && +${dimensionHoverSignal}.${dimensionField} === +datum.${dimensionField}`;
    } else if (isHighlightedByGroup(options)) {
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
 * Gets a dataset of unique dimension values for the x-axis voronoi in dimension interaction mode
 * @param lineName - the name of the line mark
 * @param scaleType - the scale type (time, linear, point)
 * @param dimension - the dimension field name
 * @returns SourceData with aggregate transform grouping by the dimension field
 */
export const getUniqueDimensionData = (lineName: string, scaleType: ScaleType, dimension: string): SourceData => {
  const dimensionField = getDimensionField(scaleType, dimension);
  return {
    name: `${lineName}_uniqueXValues`,
    source: FILTERED_TABLE,
    transform: [
      {
        type: 'aggregate',
        groupby: [dimensionField],
      },
    ],
  };
};

/**
 * Gets a data source filtered to rows where the given metric is valid.
 * Used to prevent hover marks from being created at NaN y positions when a metric is null.
 * @param outputName - name of the output data source
 * @param sourceName - name of the upstream data source to filter
 * @param metric - data field to validate
 */
export const getFilteredIsValidData = (outputName: string, sourceName: string, metric: string): SourceData => ({
  name: outputName,
  source: sourceName,
  transform: [{ type: 'filter', expr: `isValid(datum["${metric}"])` }],
});

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
  const staticPointExpr = staticPoint ? staticPointTestExpr(staticPoint) : 'false';
  const expr =
    isSparkline && isMethodLast
      ? "datum === data('table')[data('table').length - 1]"
      : staticPointExpr;
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
