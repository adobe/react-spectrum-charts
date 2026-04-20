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
import { AreaMark, GroupMark, LineMark, SourceData, SymbolMark } from 'vega';

import {
  BACKGROUND_COLOR,
  CONTROLLED_HIGHLIGHTED_SERIES,
  CONTROLLED_HIGHLIGHTED_TABLE,
  DEFAULT_METRIC,
  DEFAULT_SYMBOL_SIZE,
  DEFAULT_SYMBOL_STROKE_WIDTH,
  FILTERED_TABLE,
  HOVERED_ITEM,
  SELECTED_SERIES,
  SERIES_ID,
} from '@spectrum-charts/constants';

import { AreaMarkOptions, getAreaMark } from '../area/areaUtils';
import { getFilteredIsValidData } from '../line/lineDataUtils';
import { getLineMark, getLineYEncoding } from '../line/lineMarkUtils';
import { LineMarkOptions } from '../line/lineUtils';
import { getColorProductionRule, getOpacityProductionRule, getXProductionRule } from '../marks/markUtils';
import { getFacetsFromOptions } from '../specUtils';
import { LineSpecOptions, MetricRangeOptions, MetricRangeSpecOptions } from '../types';

export type MetricRangeParentOptions = LineSpecOptions;

export const getMetricRanges = (markOptions: MetricRangeParentOptions): MetricRangeSpecOptions[] => {
  return markOptions.metricRanges.map((metricRange, index) =>
    applyMetricRangeOptionDefaults(metricRange, markOptions.name, index)
  );
};

export const applyMetricRangeOptionDefaults = (
  {
    chartTooltips = [],
    hoverPoint = false,
    lineType = 'dashed',
    lineWidth = 'S',
    rangeOpacity = 0.2,
    metric = DEFAULT_METRIC,
    displayOnHover = false,
    ...options
  }: MetricRangeOptions,
  markName: string,
  index: number
): MetricRangeSpecOptions => ({
  chartTooltips,
  hoverPoint,
  lineType,
  lineWidth,
  name: `${markName}MetricRange${index}`,
  rangeOpacity,
  metric,
  displayOnHover,
  ...options,
});

/**
  * gets the metric range group mark including the metric range line and area marks.
 * @param lineMarkOptions
 */
export const getMetricRangeGroupMarks = (lineMarkOptions: LineSpecOptions): GroupMark[] => {
  const { color, lineType } = lineMarkOptions;
  const { facets } = getFacetsFromOptions({ color, lineType });

  const marks: GroupMark[] = [];
  const metricRanges = getMetricRanges(lineMarkOptions);

  for (const metricRangeOptions of metricRanges) {
    const { displayOnHover, name } = metricRangeOptions;
    // if displayOnHover is true, use the highlightedData source, otherwise use the filtered table
    const data = displayOnHover === true ? `${name}_highlightedData` : FILTERED_TABLE;
    marks.push({
      name: `${name}_group`,
      type: 'group',
      clip: true,
      from: {
        facet: {
          name: `${name}_facet`,
          data,
          groupby: facets,
        },
      },
      marks: getMetricRangeMark(lineMarkOptions, metricRangeOptions),
    });
  }

  return marks;
};

/**
 * Gets all hover point marks for all metric ranges on a line.
 * These must be pushed after all other marks (including line hover marks) so they render
 * on top of the clipped metric range group layers.
 * @param lineMarkOptions
 */
export const getMetricRangeAllHoverPoints = (lineMarkOptions: LineSpecOptions): SymbolMark[] => {
  const marks: SymbolMark[] = [];
  const metricRanges = getMetricRanges(lineMarkOptions);

  for (const metricRangeOptions of metricRanges) {
    if (metricRangeOptions.hoverPoint && lineMarkOptions.interactiveMarkName) {
      marks.push(...getMetricRangeHoverPoints(lineMarkOptions, metricRangeOptions));
    }
  }

  return marks;
};

/**
 * Gets the background and highlight point marks for a metric range, displayed at the hovered position.
 * Sources from the parent line's highlightedData so points appear when hovering the parent line.
 * @param lineMarkOptions
 * @param metricRangeOptions
 */
export const getMetricRangeHoverPoints = (
  lineMarkOptions: LineSpecOptions,
  metricRangeOptions: MetricRangeSpecOptions
): SymbolMark[] => {
  const { color: lineColor, colorScheme, dimension, scaleType } = lineMarkOptions;
  const { color: rangeColor, metric, name } = metricRangeOptions;
  const highlightedData = `${name}_hoverPointData`;
  const color = rangeColor ? { value: rangeColor } : lineColor;

  const validMetricTest = `isValid(datum["${metric}"])`;

  const backgroundPoint: SymbolMark = {
    name: `${name}_pointBackground`,
    description: `${name}_pointBackground`,
    type: 'symbol',
    from: { data: highlightedData },
    interactive: false,
    encode: {
      enter: {
        fill: { signal: BACKGROUND_COLOR },
        stroke: { signal: BACKGROUND_COLOR },
        y: getLineYEncoding(lineMarkOptions, metric),
      },
      update: {
        size: { value: DEFAULT_SYMBOL_SIZE },
        strokeWidth: { value: DEFAULT_SYMBOL_STROKE_WIDTH },
        x: getXProductionRule(scaleType, dimension),
        opacity: [{ test: validMetricTest, value: 1 }, { value: 0 }],
      },
    },
  };

  const highlightPoint: SymbolMark = {
    name: `${name}_point_highlight`,
    description: `${name}_point_highlight`,
    type: 'symbol',
    from: { data: highlightedData },
    interactive: false,
    encode: {
      enter: {
        y: getLineYEncoding(lineMarkOptions, metric),
        stroke: getColorProductionRule(color, colorScheme),
      },
      update: {
        fill: { signal: BACKGROUND_COLOR },
        size: { value: DEFAULT_SYMBOL_SIZE },
        stroke: getColorProductionRule(color, colorScheme),
        strokeOpacity: getOpacityProductionRule(lineMarkOptions.opacity),
        strokeWidth: { value: DEFAULT_SYMBOL_STROKE_WIDTH },
        x: getXProductionRule(scaleType, dimension),
        opacity: [{ test: validMetricTest, value: 1 }, { value: 0 }],
      },
    },
  };

  return [backgroundPoint, highlightPoint];
};

/**
 * gets the area and line marks for the metric range by combining line and metric range options.
 * @param lineMarkOptions
 * @param metricRangeOptions
 */
export const getMetricRangeMark = (
  lineMarkOptions: LineSpecOptions,
  metricRangeOptions: MetricRangeSpecOptions
): (LineMark | AreaMark)[] => {
  const areaOptions: AreaMarkOptions = {
    name: `${metricRangeOptions.name}_area`,
    color: lineMarkOptions.color,
    colorScheme: lineMarkOptions.colorScheme,
    opacity: metricRangeOptions.rangeOpacity,
    metricStart: metricRangeOptions.metricStart,
    metricEnd: metricRangeOptions.metricEnd,
    isStacked: false,
    scaleType: 'time',
    dimension: lineMarkOptions.dimension,
    isMetricRange: true,
    parentName: lineMarkOptions.name,
    // 'metric' means only the line is hidden on hover — area is always visible
    displayOnHover: metricRangeOptions.displayOnHover === 'metric' ? false : metricRangeOptions.displayOnHover,
    interactiveMarkName: lineMarkOptions.interactiveMarkName,
  };
  const { interactiveMarkName, ...baseLineMarkOptions } = lineMarkOptions;
  const lineOptions: LineMarkOptions = {
    ...baseLineMarkOptions,
    name: `${metricRangeOptions.name}_line`,
    color: metricRangeOptions.color ? { value: metricRangeOptions.color } : lineMarkOptions.color,
    metric: metricRangeOptions.metric,
    lineType: { value: metricRangeOptions.lineType },
    lineWidth: { value: metricRangeOptions.lineWidth },
    // 'range' means only the area is hidden on hover — line is always visible and should not fade on hover
    displayOnHover: metricRangeOptions.displayOnHover === 'range' ? false : metricRangeOptions.displayOnHover,
    opacity: metricRangeOptions.lineOpacity ? metricRangeOptions.lineOpacity : { value: 1 },
    ...(metricRangeOptions.displayOnHover !== 'range' && { interactiveMarkName }),
  };

  const dataSource = `${metricRangeOptions.name}_facet`;
  const lineMark = getLineMark(lineOptions, dataSource);
  const areaMark = getAreaMark(areaOptions, dataSource);

  return [lineMark, areaMark];
};

/**
 * gets the data source for the metricRange
 * @param markOptions
 */
export const getMetricRangeData = (markOptions: LineSpecOptions): SourceData[] => {
  const data: SourceData[] = [];
  const metricRanges = getMetricRanges(markOptions);

  for (const metricRangeOptions of metricRanges) {
    const { displayOnHover, hoverPoint, metric, name } = metricRangeOptions;
    // if hoverPoint is true and the line is interactive, add a filtered data source to rows where the
    // MetricRange metric is valid. This prevents hover marks from being created at NaN y positions
    // for rows where the metric is null.
    if (hoverPoint && markOptions.interactiveMarkName) {
      data.push(getFilteredIsValidData(`${name}_hoverPointData`, `${markOptions.name}_highlightedData`, metric));
    }
    // if displayOnHover is true, add a data source for the highlighted data
    if (displayOnHover === true) {
      const hoveredItem = `isValid(${markOptions.interactiveMarkName}_${HOVERED_ITEM}) && ${markOptions.interactiveMarkName}_${HOVERED_ITEM}.${SERIES_ID} === datum.${SERIES_ID}`;
      const selectedSeries = `isValid(${SELECTED_SERIES}) && ${SELECTED_SERIES} === datum.${SERIES_ID}`;
      const controlledHighlightedItem = `indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'),'${SERIES_ID}'), datum.${SERIES_ID}) > -1`;
      const controlledHighlightedSeries = `isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) && ${CONTROLLED_HIGHLIGHTED_SERIES} === datum.${SERIES_ID}`;
      data.push({
        name: `${name}_highlightedData`,
        source: FILTERED_TABLE,
        transform: [
          {
            type: 'filter',
            expr: [hoveredItem, selectedSeries, controlledHighlightedItem, controlledHighlightedSeries].join(' || '),
          },
        ],
      });
    }
  }

  return data;
};
