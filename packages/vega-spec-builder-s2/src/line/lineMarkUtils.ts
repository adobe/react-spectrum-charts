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
import { LineMark, Mark, NumericValueRef, ProductionRule, RuleMark } from 'vega';

import {
  COLOR_SCALE,
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
  DEFAULT_INTERACTION_MODE,
  DEFAULT_OPACITY_RULE,
  FADE_FACTOR,
  HOVERED_ITEM,
  LAST_RSC_SERIES_ID,
  LINE_TYPE_SCALE,
  OPACITY_SCALE,
  SELECTED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { getPopovers } from '../chartPopover/chartPopoverUtils';
import {
  getColorProductionRule,
  getColorProductionRuleSignalString,
  getItemHoverArea,
  getLineWidthProductionRule,
  getOpacityProductionRule,
  getStrokeDashProductionRule,
  getVoronoiPath,
  getXProductionRule,
  hasPopover,
} from '../marks/markUtils';
import { getDualAxisScaleNames } from '../scale/scaleUtils';
import { ScaleType } from '../types';
import {
  getHighlightBackgroundPoint,
  getHighlightPoint,
  getSecondaryHighlightPoint,
  getSelectRingPoint,
  getSelectionPoint,
} from './linePointUtils';
import { isDualMetricAxis, LineMarkOptions } from './lineUtils';

/**
 * Gets the Y encoding for line marks with dual metric axis support
 * @param lineMarkOptions - Line mark options including metricAxis and dualMetricAxis
 * @param metric - The metric field name
 * @returns Y encoding with conditional scale selection for dual metric axis
 */
export const getLineYEncoding = (lineMarkOptions: LineMarkOptions, metric: string): ProductionRule<NumericValueRef> => {
  const { metricAxis } = lineMarkOptions;
  
  if (isDualMetricAxis(lineMarkOptions)) {
    const baseScaleName = metricAxis || 'yLinear';
    const scaleNames = getDualAxisScaleNames(baseScaleName);
    
    return [
      {
        test: `datum.${SERIES_ID} === ${LAST_RSC_SERIES_ID}`,
        scale: scaleNames.secondaryScale,
        field: metric,
      },
      {
        scale: scaleNames.primaryScale,
        field: metric,
      },
    ];
  }
  
  return [{ scale: metricAxis || 'yLinear', field: metric }];
};

const GRADIENT_BASE_OPACITY = 0.2;

/**
 * Generates an area mark with a gradient fill beneath the line, fading from the line's color to transparent.
 */
export const getLineGradientMark = (lineMarkOptions: LineMarkOptions, dataSource: string): Mark => {
  const { dimension, metric, name, scaleType } = lineMarkOptions;

  return {
    name: `${name}_gradient`,
    description: `${name}_gradient`,
    type: 'area',
    from: { data: dataSource },
    interactive: false,
    encode: {
      enter: {
        y: getLineYEncoding(lineMarkOptions, metric),
        y2: { signal: 'height' },
        defined: { signal: `isValid(datum["${metric}"])` },
        ...getGradientFillEncoding(lineMarkOptions),
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
        opacity: [
          { test: `length(domain('${COLOR_SCALE}')) > 1 || length(domain('${LINE_TYPE_SCALE}')) > 1 || length(domain('${OPACITY_SCALE}')) > 1`, value: 0 },
          ...[getLineOpacity(lineMarkOptions)].flat(),
        ],
      },
    },
  };
};

const getGradientFillEncoding = ({ color, colorScheme, opacity }: LineMarkOptions) => {
  const colorSignal = getColorProductionRuleSignalString(color, colorScheme);
  return {
    fill: {
      signal: `{gradient: 'linear', stops: [{offset: 0, color: ${colorSignal}}, {offset: 1, color: 'transparent'}], x1: 0, y1: 0, x2: 0, y2: 1}`,
    },
    fillOpacity: getGradientOpacity(opacity),
  };
};

const getGradientOpacity = (opacity: LineMarkOptions['opacity']): { value: number } | { signal: string } => {
  if (typeof opacity === 'string') {
    return { signal: `scale('${OPACITY_SCALE}', datum.${opacity}) * ${GRADIENT_BASE_OPACITY}` };
  }
  return { value: opacity.value * GRADIENT_BASE_OPACITY };
};

/**
 * generates a line mark
 * @param lineOptions
 * @param dataSource
 * @returns LineMark
 */
export const getLineMark = (lineMarkOptions: LineMarkOptions, dataSource: string): LineMark => {
  const {
    chartPopovers,
    color,
    colorScheme,
    dimension,
    lineType,
    lineWidth,
    metric,
    name,
    opacity,
    scaleType,
  } = lineMarkOptions;
  const popovers = getPopovers(chartPopovers ?? [], name);
  const popoverWithDimensionHighlightExists = popovers.some(
    ({ UNSAFE_highlightBy }) => UNSAFE_highlightBy === 'dimension'
  );

  return {
    name,
    description: name,
    type: 'line',
    from: { data: dataSource },
    interactive: false,
    encode: {
      enter: {
        y: getLineYEncoding(lineMarkOptions, metric),
        stroke: getColorProductionRule(color, colorScheme),
        strokeDash: getStrokeDashProductionRule(lineType),
        strokeOpacity: getOpacityProductionRule(opacity),
        strokeWidth: getLineWidthProductionRule(lineWidth),
      },
      update: {
        // this has to be in update because when you resize the window that doesn't rebuild the spec
        // but it may change the x position if it causes the chart to resize
        x: getXProductionRule(scaleType, dimension),
        ...(popoverWithDimensionHighlightExists ? {} : { opacity: getLineOpacity(lineMarkOptions) }),
      },
    },
  };
};

export const getLineOpacity = ({
  displayOnHover,
  comboSiblingNames,
  interactiveMarkName,
  popoverMarkName,
  isHighlightedByGroup,
  highlightedItem,
}: LineMarkOptions): ProductionRule<NumericValueRef> => {
  if ((!interactiveMarkName || displayOnHover) && highlightedItem === undefined) return [DEFAULT_OPACITY_RULE];
  const strokeOpacityRules: ProductionRule<NumericValueRef> = [];

  if (interactiveMarkName) {
    if (isHighlightedByGroup) {
      strokeOpacityRules.push({
        test: `length(data('${interactiveMarkName}_highlightedData'))`,
        signal: `indexof(pluck(data('${interactiveMarkName}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1 ? 1 : ${FADE_FACTOR}`,
      });
    } else {
      strokeOpacityRules.push({
        test: `isValid(${interactiveMarkName}_${HOVERED_ITEM})`,
        signal: `${interactiveMarkName}_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
      });
    }
  }

  strokeOpacityRules.push(
    {
      test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
      signal: `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), datum.${SERIES_ID}) > -1 ? 1 : ${FADE_FACTOR}`,
    },
    {
      test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
      signal: `${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
    }
  );

  if (popoverMarkName) {
    strokeOpacityRules.push({
      test: `isValid(${SELECTED_SERIES})`,
      signal: `${SELECTED_SERIES} === datum.${SERIES_ID} ? 1 : ${FADE_FACTOR}`,
    });
  }

  if (comboSiblingNames?.length) {
    const test = comboSiblingNames.map((siblingName) => `isValid(${siblingName}_${HOVERED_ITEM})`).join(' || ');
    strokeOpacityRules.push({
      test,
      value: FADE_FACTOR,
    });
  }

  // This allows us to only show the metric range when hovering over the parent line component.
  strokeOpacityRules.push(DEFAULT_OPACITY_RULE);

  return strokeOpacityRules;
};

/**
 * All the marks that get displayed when hovering or selecting a point on a line
 * @param lineMarkOptions
 * @param dataSource
 * @param secondaryHighlightedMetric
 * @returns
 */
export const getLineHoverMarks = (
  lineOptions: LineMarkOptions,
  dataSource: string,
  secondaryHighlightedMetric?: string
): Mark[] => {
  const { dimension, name, scaleType } = lineOptions;
  return [
    // vertical rule shown for the hovered or selected point
    getHoverRule(dimension, name, scaleType),
    // point behind the hovered or selected point used to prevent bacgorund elements from being visible through low opacity point
    getHighlightBackgroundPoint(lineOptions),
    // if has popover, add selection ring and selection point
    ...(hasPopover(lineOptions) ? [getSelectRingPoint(lineOptions), getSelectionPoint(lineOptions)] : []),
    // hover or select point
    getHighlightPoint(lineOptions),
    // additional point that gets highlighted like the trendline or raw line point
    ...(secondaryHighlightedMetric ? [getSecondaryHighlightPoint(lineOptions, secondaryHighlightedMetric)] : []),
    // get interactive marks for the line
    ...getInteractiveMarks(dataSource, lineOptions),
  ];
};

const getHoverRule = (dimension: string, name: string, scaleType: ScaleType): RuleMark => {
  return {
    name: `${name}_hoverRule`,
    description: `${name}_hoverRule`,
    type: 'rule',
    from: { data: `${name}_highlightedData` },
    interactive: false,
    encode: {
      enter: {
        y: { value: 0 },
        y2: { signal: 'height' },
        strokeWidth: { value: 1 },
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
        opacity: { signal: `length(data('${name}_selectedData')) > 0 ? 0 : 1` },
      },
    },
  };
};

const getInteractiveMarks = (dataSource: string, lineOptions: LineMarkOptions): Mark[] => {
  const { interactionMode = DEFAULT_INTERACTION_MODE } = lineOptions;

  const tooltipMarks = {
    nearest: getVoronoiMarks,
    item: getItemHoverMarks,
  };

  return tooltipMarks[interactionMode](lineOptions, dataSource);
};

const getVoronoiMarks = (lineOptions: LineMarkOptions, dataSource: string): Mark[] => {
  const { name } = lineOptions;

  return [
    // points used for the voronoi transform
    getLinePointsForVoronoi(lineOptions, dataSource),
    // voronoi transform used to get nearest point paths
    getVoronoiPath(lineOptions, `${name}_pointsForVoronoi`),
  ];
};

/**
 * Gets the points used for the voronoi calculation for line charts with dual metric axis support
 * @param lineOptions - Line options including dual metric axis settings
 * @param dataSource - the name of the data source that will be used in the voronoi calculation
 * @returns SymbolMark
 */
const getLinePointsForVoronoi = (lineOptions: LineMarkOptions, dataSource: string): Mark => {
  const { dimension, metric, name, scaleType } = lineOptions;
  
  return {
    name: `${name}_pointsForVoronoi`,
    description: `${name}_pointsForVoronoi`,
    type: 'symbol',
    from: { data: dataSource },
    interactive: false,
    encode: {
      enter: {
        y: getLineYEncoding(lineOptions, metric),
        fill: { value: 'transparent' },
        stroke: { value: 'transparent' },
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
      },
    },
  };
};

const getItemHoverMarks = (lineOptions: LineMarkOptions, dataSource: string): Mark[] => {
  const { chartTooltips = [], dimension, metric, name, scaleType } = lineOptions;

  return [
    // area around item that triggers hover
    getItemHoverArea(chartTooltips, dataSource, dimension, metric, name, scaleType, getLineYEncoding(lineOptions, metric)),
  ];
};

