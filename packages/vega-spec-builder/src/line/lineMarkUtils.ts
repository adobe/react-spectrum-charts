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
import { LineMark, Mark, NumericValueRef, ProductionRule, RuleMark } from 'vega';

import {
  DEFAULT_INTERACTION_MODE,
  DEFAULT_OPACITY_RULE,
  HIGHLIGHTED_SERIES,
  HIGHLIGHT_CONTRAST_RATIO,
  SELECTED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { getPopovers } from '../chartPopover/chartPopoverUtils';
import {
  getColorProductionRule,
  getItemHoverArea,
  getLineWidthProductionRule,
  getOpacityProductionRule,
  getPointsForVoronoi,
  getStrokeDashProductionRule,
  getVoronoiPath,
  getXProductionRule,
  getYProductionRule,
  hasPopover,
} from '../marks/markUtils';
import { ScaleType } from '../types';
import {
  getHighlightBackgroundPoint,
  getHighlightPoint,
  getSecondaryHighlightPoint,
  getSelectRingPoint,
  getSelectionPoint,
} from './linePointUtils';
import { LineMarkOptions } from './lineUtils';

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
    metricAxis,
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
        y: getYProductionRule(metricAxis, metric),
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
  interactiveMarkName,
  popoverMarkName,
  isHighlightedByGroup,
  highlightedItem,
}: LineMarkOptions): ProductionRule<NumericValueRef> => {
  if ((!interactiveMarkName || displayOnHover) && highlightedItem === undefined) return [DEFAULT_OPACITY_RULE];
  const strokeOpacityRules: ProductionRule<NumericValueRef> = [];

  if (isHighlightedByGroup) {
    strokeOpacityRules.push({
      test: `indexof(pluck(data('${interactiveMarkName}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1`,
      value: 1,
    });
  }

  // add a rule that will lower the opacity of the line if there is a hovered series, but this line is not the one hovered
  strokeOpacityRules.push(
    {
      test: `isValid(${HIGHLIGHTED_SERIES}) && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`,
      value: 1 / HIGHLIGHT_CONTRAST_RATIO,
    },
    {
      test: `length(data('${interactiveMarkName}_highlightedData')) > 0 && indexof(pluck(data('${interactiveMarkName}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) === -1`,
      value: 1 / HIGHLIGHT_CONTRAST_RATIO,
    }
  );

  if (popoverMarkName) {
    strokeOpacityRules.push({
      test: `isValid(${SELECTED_SERIES}) && ${SELECTED_SERIES} !== datum.${SERIES_ID}`,
      value: 1 / HIGHLIGHT_CONTRAST_RATIO,
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
  const { dimension, metric, metricAxis, name, scaleType } = lineOptions;

  return [
    // points used for the voronoi transform
    getPointsForVoronoi(dataSource, dimension, metric, name, scaleType, metricAxis),
    // voronoi transform used to get nearest point paths
    getVoronoiPath(lineOptions, `${name}_pointsForVoronoi`),
  ];
};

const getItemHoverMarks = (lineOptions: LineMarkOptions, dataSource: string): Mark[] => {
  const { chartTooltips = [], dimension, metric, metricAxis, name, scaleType } = lineOptions;

  return [
    // area around item that triggers hover
    getItemHoverArea(chartTooltips, dataSource, dimension, metric, name, scaleType, metricAxis),
  ];
};
