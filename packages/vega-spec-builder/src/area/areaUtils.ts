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
import { AreaMark, NumericValueRef, ProductionRule } from 'vega';

import {
  DEFAULT_OPACITY_RULE,
  DEFAULT_TRANSFORMED_TIME_DIMENSION,
  HIGHLIGHTED_ITEM,
  HIGHLIGHTED_SERIES,
  HIGHLIGHT_CONTRAST_RATIO,
  HOVERED_ITEM,
  SELECTED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import {
  getBorderStrokeEncodings,
  getColorProductionRule,
  getCursor,
  getTooltip,
  isInteractive,
} from '../marks/markUtils';
import {
  ChartPopoverOptions,
  ChartTooltipOptions,
  ColorFacet,
  ColorScheme,
  HighlightedItem,
  ScaleType,
} from '../types';

export interface AreaMarkOptions {
  color: ColorFacet;
  colorScheme: ColorScheme;
  dimension: string;
  displayOnHover?: boolean;
  highlightedItem?: HighlightedItem;
  isHighlightedByGroup?: boolean;
  isMetricRange?: boolean;
  isStacked: boolean;
  metricStart: string;
  metricEnd: string;
  name: string;
  opacity: number;
  parentName?: string; // Optional name of mark that this area is a child of. Used for metric ranges.
  scaleType: ScaleType;

  chartPopovers?: ChartPopoverOptions[];
  chartTooltips?: ChartTooltipOptions[];
}

export const getAreaMark = (
  areaOptions: AreaMarkOptions,
  dataSource: string = `${areaOptions.name}_facet`
): AreaMark => {
  const {
    name,
    chartPopovers,
    chartTooltips,
    color,
    colorScheme,
    metricStart,
    metricEnd,
    isStacked,
    scaleType,
    dimension,
    opacity,
  } = areaOptions;
  return {
    name,
    description: name,
    type: 'area',
    from: { data: dataSource },
    interactive: isInteractive(areaOptions),
    encode: {
      enter: {
        y: { scale: 'yLinear', field: metricStart },
        y2: { scale: 'yLinear', field: metricEnd },
        fill: getColorProductionRule(color, colorScheme),
        tooltip: getTooltip(chartTooltips ?? [], name),
        ...getBorderStrokeEncodings(isStacked, true),
      },
      update: {
        // this has to be in update because when you resize the window that doesn't rebuild the spec
        // but it may change the x position if it causes the chart to resize
        x: getX(scaleType, dimension),
        cursor: getCursor(chartPopovers ?? []),
        fillOpacity: { value: opacity },
        opacity: getAreaOpacity(areaOptions),
      },
    },
  };
};

export function getAreaOpacity(areaOptions: AreaMarkOptions): ProductionRule<NumericValueRef> | undefined {
  const { chartPopovers, displayOnHover, isHighlightedByGroup, isMetricRange, highlightedItem, name } = areaOptions;
  // if metric ranges only display when hovering, we don't need to include other hover rules for this specific area
  const fadedOpacity = 1 / HIGHLIGHT_CONTRAST_RATIO;
  if (isMetricRange && displayOnHover) {
    return [
      { test: `isValid(${HIGHLIGHTED_SERIES}) && ${HIGHLIGHTED_SERIES} === datum.${SERIES_ID}`, value: 1 },
      {
        test: `isValid(${HIGHLIGHTED_ITEM}) && indexof(pluck(data('${name}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1`,
      },
      { test: `isValid(${SELECTED_SERIES}) && ${SELECTED_SERIES} === datum.${SERIES_ID}`, value: 1 },
      { value: 0 },
    ];
  }

  if (!isInteractive(areaOptions) && !highlightedItem) {
    return [DEFAULT_OPACITY_RULE];
  }

  const opacityRules: ProductionRule<NumericValueRef> = [];
  if (isHighlightedByGroup) {
    opacityRules.push({
      test: `indexof(pluck(data('${name}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1`,
      value: 1,
    });
  }
  // if an area is hovered or selected, all other areas should have half opacity
  if (!isMetricRange && chartPopovers?.length) {
    return [
      ...opacityRules,
      {
        test: `!isValid(${SELECTED_SERIES}) && isValid(${HIGHLIGHTED_SERIES}) && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`,
        value: fadedOpacity,
      },
      {
        test: `!isValid(${SELECTED_SERIES}) && length(data('${name}_highlightedData')) > 0 && indexof(pluck(data('${name}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) === -1`,
        value: fadedOpacity,
      },
      {
        test: `isValid(${SELECTED_SERIES}) && ${SELECTED_SERIES} !== datum.${SERIES_ID}`,
        value: fadedOpacity,
      },
      DEFAULT_OPACITY_RULE,
    ];
  }

  return [
    ...opacityRules,
    {
      test: `isValid(${name}_${HOVERED_ITEM})`,
      signal: `${name}_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : ${fadedOpacity}`,
    },
    {
      test: `isValid(${HIGHLIGHTED_SERIES}) && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`,
      value: fadedOpacity,
    },
    {
      test: `length(data('${name}_highlightedData')) > 0 && indexof(pluck(data('${name}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) === -1`,
      value: fadedOpacity,
    },
    DEFAULT_OPACITY_RULE,
  ];
}

export const getX = (scaleType: ScaleType, dimension: string): ProductionRule<NumericValueRef> => {
  if (scaleType === 'time') {
    return { scale: 'xTime', field: DEFAULT_TRANSFORMED_TIME_DIMENSION };
  } else if (scaleType === 'linear') {
    return { scale: 'xLinear', field: dimension };
  }
  return { scale: 'xPoint', field: dimension };
};
