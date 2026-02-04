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
import { produce } from 'immer';
import { Data, Mark, Scale, Signal } from 'vega';

import {
  COLOR_SCALE,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_METRIC,
  DEFAULT_TIME_DIMENSION,
  FILTERED_TABLE,
  INTERACTION_MODE,
  LAST_RSC_SERIES_ID,
  LINE_TYPE_SCALE,
  OPACITY_SCALE,
  SERIES_ID,
} from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';

import { addPopoverData } from '../chartPopover/chartPopoverUtils';
import { addTooltipData, addTooltipSignals, isHighlightedByGroup } from '../chartTooltip/chartTooltipUtils';
import { addTimeTransform, getFilteredTooltipData, getTableData } from '../data/dataUtils';
import { getHoverMarkNames, getInteractiveMarkName, isInteractive } from '../marks/markUtils';
import { getMetricRangeData, getMetricRangeGroupMarks, getMetricRanges } from '../metricRange/metricRangeUtils';
import { addContinuousDimensionScale, addFieldToFacetScaleDomain, addMetricScale } from '../scale/scaleSpecBuilder';
import { getDualAxisScaleNames } from '../scale/scaleUtils';
import { addHoveredItemSignal, getFirstRscSeriesIdSignal, getLastRscSeriesIdSignal } from '../signal/signalSpecBuilder';
import { addUserMetaInteractiveMark, getFacetsFromOptions } from '../specUtils';
import { addTrendlineData, getTrendlineMarks, getTrendlineScales, setTrendlineSignals } from '../trendline';
import { ColorScheme, HighlightedItem, LineOptions, LineSpecOptions, ScSpec } from '../types';
import { getLineHighlightedData, getLineStaticPointData } from './lineDataUtils';
import { getLineHoverMarks, getLineMark } from './lineMarkUtils';
import { getLineStaticPoint } from './linePointUtils';
import { getPopoverMarkName, isDualMetricAxis } from './lineUtils';

export const addLine = produce<
  ScSpec,
  [
    LineOptions & {
      colorScheme?: ColorScheme;
      highlightedItem?: HighlightedItem;
      index?: number;
      idKey: string;
      comboSiblingNames?: string[];
    }
  ]
>(
  (
    spec,
    {
      chartPopovers = [],
      chartTooltips = [],
      color = { value: 'categorical-100' },
      colorScheme = DEFAULT_COLOR_SCHEME,
      dimension = DEFAULT_TIME_DIMENSION,
      dualMetricAxis = false,
      hasOnClick = false,
      hasMouseInteraction = false,
      index = 0,
      lineType = { value: 'solid' },
      metric = DEFAULT_METRIC,
      metricAxis,
      metricRanges = [],
      name,
      opacity = { value: 1 },
      scaleType = 'time',
      trendlines = [],
      ...options
    }
  ) => {
    const lineName = toCamelCase(name || `line${index}`);
    // put options back together now that all defaults are set
    const lineOptions: LineSpecOptions = {
      chartPopovers,
      chartTooltips,
      color,
      colorScheme,
      dimension,
      dualMetricAxis,
      hasOnClick,
      index,
      hasMouseInteraction,
      interactiveMarkName: getInteractiveMarkName(
        {
          chartPopovers,
          chartTooltips,
          hasOnClick,
          hasMouseInteraction,
          highlightedItem: options.highlightedItem,
          metricRanges,
          trendlines,
        },
        lineName
      ),
      lineType,
      metric,
      metricAxis,
      metricRanges,
      name: lineName,
      opacity,
      popoverMarkName: getPopoverMarkName(chartPopovers, lineName),
      scaleType,
      trendlines,
      ...options,
    };
    lineOptions.isHighlightedByGroup = isHighlightedByGroup(lineOptions);

    spec.usermeta = addUserMetaInteractiveMark(spec.usermeta, lineOptions.interactiveMarkName);
    spec.data = addData(spec.data ?? [], lineOptions);
    spec.signals = addSignals(spec.signals ?? [], lineOptions);
    spec.scales = setScales(spec.scales ?? [], lineOptions);
    spec.marks = addLineMarks(spec.marks ?? [], lineOptions);

    return spec;
  }
);

export const addData = produce<Data[], [LineSpecOptions]>((data, options) => {
  const { chartTooltips, dimension, highlightedItem, isSparkline, isMethodLast, name, scaleType, staticPoint } =
    options;
  if (scaleType === 'time') {
    const tableData = getTableData(data);
    tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
  }
  if (isInteractive(options) || highlightedItem !== undefined) {
    data.push(getLineHighlightedData(options), getFilteredTooltipData(chartTooltips));
  }
  if (staticPoint || isSparkline)
    data.push(getLineStaticPointData(name, staticPoint, FILTERED_TABLE, isSparkline, isMethodLast));
  addDualMetricAxisData(data, options);
  addTrendlineData(data, options);
  addTooltipData(data, options, false);
  addPopoverData(data, options);
  data.push(...getMetricRangeData(options));
});

/**
 * Adds data sources for dual metric axis feature
 * Creates filtered datasets for primary (all except last series) and secondary (last series only) scales
 */
export const addDualMetricAxisData = (data: Data[], options: LineSpecOptions) => {
  if (isDualMetricAxis(options)) {
    const { metricAxis } = options;
    const baseScaleName = metricAxis || 'yLinear';
    const scaleNames = getDualAxisScaleNames(baseScaleName);

    if (scaleNames.primaryDomain && scaleNames.secondaryDomain) {
      data.push(
        {
          name: scaleNames.primaryDomain,
          source: FILTERED_TABLE,
          transform: [{ type: 'filter', expr: `datum.${SERIES_ID} !== ${LAST_RSC_SERIES_ID}` }],
        },
        {
          name: scaleNames.secondaryDomain,
          source: FILTERED_TABLE,
          transform: [{ type: 'filter', expr: `datum.${SERIES_ID} === ${LAST_RSC_SERIES_ID}` }],
        }
      );
    }
  }
};

export const addSignals = produce<Signal[], [LineSpecOptions]>((signals, options) => {
  const { name } = options;
  setTrendlineSignals(signals, options);

  if (isDualMetricAxis(options)) {
    signals.push(getFirstRscSeriesIdSignal(), getLastRscSeriesIdSignal());
  }

  if (!isInteractive(options)) return;
  // we don't need to include the excludeDataKeys here because they will be excluded from the points for voronoi
  addHoveredItemSignal(signals, name, `${name}_voronoi`, 2);
  addHoverSignals(signals, options);
  addTooltipSignals(signals, options);
});

export const setScales = produce<Scale[], [LineSpecOptions]>((scales, options) => {
  const { metricAxis, dimension, color, lineType, opacity, padding, scaleType } = options;
  // add dimension scale
  addContinuousDimensionScale(scales, { scaleType, dimension, padding });
  // add color to the color domain
  addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
  // add lineType to the lineType domain
  addFieldToFacetScaleDomain(scales, LINE_TYPE_SCALE, lineType);
  // add opacity to the opacity domain
  addFieldToFacetScaleDomain(scales, OPACITY_SCALE, opacity);
  // find the linear scale and add our fields to it
  addMetricScale(scales, getMetricKeys(options));
  // add linear scale with custom name
  if (metricAxis) {
    addMetricScale(scales, getMetricKeys(options), 'y', metricAxis);
  }
  // add dual metric axis scales
  if (isDualMetricAxis(options)) {
    const baseScaleName = metricAxis || 'yLinear';
    const scaleNames = getDualAxisScaleNames(baseScaleName);
    addMetricScale(scales, getMetricKeys(options), 'y', scaleNames.primaryScale, scaleNames.primaryDomain);
    addMetricScale(scales, getMetricKeys(options), 'y', scaleNames.secondaryScale, scaleNames.secondaryDomain);
  }
  // add trendline scales
  scales.push(...getTrendlineScales(options));
  return scales;
});

// The order that marks are added is important since it determines the draw order.
export const addLineMarks = produce<Mark[], [LineSpecOptions]>((marks, options) => {
  const { color, highlightedItem, isSparkline, lineType, name, opacity, staticPoint } = options;

  const { facets } = getFacetsFromOptions({ color, lineType, opacity });

  marks.push({
    name: `${name}_group`,
    type: 'group',
    from: {
      facet: {
        name: `${name}_facet`,
        data: FILTERED_TABLE,
        groupby: facets,
      },
    },
    marks: [getLineMark(options, `${name}_facet`)],
  });
  if (staticPoint || isSparkline) marks.push(getLineStaticPoint(options));
  marks.push(...getMetricRangeGroupMarks(options));
  if (isInteractive(options) || highlightedItem !== undefined) {
    marks.push(...getLineHoverMarks(options, `${FILTERED_TABLE}ForTooltip`));
  }
  marks.push(...getTrendlineMarks(options));
});

const getMetricKeys = (lineOptions: LineSpecOptions) => {
  const metricKeys = [lineOptions.metric];

  // metric range fields should be added if metric-axis will be scaled to fit
  const metricRanges = getMetricRanges(lineOptions);
  metricRanges.forEach((metricRange) => {
    if (metricRange.scaleAxisToFit) metricKeys.push(metricRange.metricStart, metricRange.metricEnd);
  });

  return metricKeys;
};

const addHoverSignals = (signals: Signal[], options: LineSpecOptions) => {
  const { interactionMode, name: lineName } = options;
  if (interactionMode !== INTERACTION_MODE.ITEM) return;
  for (const hoverMarkName of getHoverMarkNames(lineName)) {
    addHoveredItemSignal(signals, lineName, hoverMarkName);
  }
};
