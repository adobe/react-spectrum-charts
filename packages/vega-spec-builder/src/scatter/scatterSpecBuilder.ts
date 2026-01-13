/*
 * Copyright 2024 Adobe. All rights reserved.
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
import { Data, Scale, Signal } from 'vega';

import {
  COLOR_SCALE,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_DIMENSION_SCALE_TYPE,
  DEFAULT_LINEAR_DIMENSION,
  DEFAULT_METRIC,
  FILTERED_TABLE,
  LINEAR_COLOR_SCALE,
  LINE_TYPE_SCALE,
  LINE_WIDTH_SCALE,
  OPACITY_SCALE,
  SELECTED_ITEM,
  SYMBOL_SIZE_SCALE,
} from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';

import { addTooltipData, addTooltipSignals } from '../chartTooltip/chartTooltipUtils';
import { addTimeTransform, getFilteredTooltipData, getTableData } from '../data/dataUtils';
import { getInteractiveMarkName, hasPopover, isInteractive } from '../marks/markUtils';
import { addContinuousDimensionScale, addFieldToFacetScaleDomain, addMetricScale } from '../scale/scaleSpecBuilder';
import { setScatterPathScales } from '../scatterPath';
import { addHoveredItemSignal } from '../signal/signalSpecBuilder';
import { addUserMetaInteractiveMark } from '../specUtils';
import { addTrendlineData, getTrendlineScales, setTrendlineSignals } from '../trendline';
import { ColorScheme, HighlightedItem, ScSpec, ScatterOptions, ScatterSpecOptions } from '../types';
import { addScatterMarks } from './scatterMarkUtils';

/**
 * Adds all the necessary parts of a scatter to the spec
 * @param spec Spec
 * @param scatterOptions ScatterOptions
 */
export const addScatter = produce<
  ScSpec,
  [ScatterOptions & { colorScheme?: ColorScheme; highlightedItem?: HighlightedItem; index?: number; idKey: string }]
>(
  (
    spec,
    {
      chartPopovers = [],
      chartTooltips = [],
      color = { value: 'categorical-100' },
      colorScaleType = 'ordinal',
      colorScheme = DEFAULT_COLOR_SCHEME,
      dimension = DEFAULT_LINEAR_DIMENSION,
      dimensionScaleType = DEFAULT_DIMENSION_SCALE_TYPE,
      index = 0,
      lineType = { value: 'solid' },
      lineWidth = { value: 0 },
      metric = DEFAULT_METRIC,
      name,
      opacity = { value: 1 },
      scatterAnnotations = [],
      scatterPaths = [],
      size = { value: 'M' },
      trendlines = [],
      stroke,
      transparentPoints,
      ...options
    }
  ) => {
    const scatterName = toCamelCase(name || `scatter${index}`);
    // put options back together now that all the defaults have been set

    const scatterOptions: ScatterSpecOptions = {
      chartPopovers,
      chartTooltips,
      color,
      colorScaleType,
      colorScheme,
      dimension,
      dimensionScaleType,
      index,
      interactiveMarkName: getInteractiveMarkName(
        { chartPopovers, chartTooltips, highlightedItem: options.highlightedItem, trendlines },
        scatterName
      ),
      lineType,
      lineWidth,
      metric,
      stroke,
      name: scatterName,
      opacity,
      scatterAnnotations,
      scatterPaths,
      size,
      transparentPoints,
      trendlines,
      ...options,
    };

    spec.usermeta = addUserMetaInteractiveMark(spec.usermeta, scatterOptions.interactiveMarkName);
    spec.data = addData(spec.data ?? [], scatterOptions);
    spec.signals = addSignals(spec.signals ?? [], scatterOptions);
    spec.scales = setScales(spec.scales ?? [], scatterOptions);
    spec.marks = addScatterMarks(spec.marks ?? [], scatterOptions);
  }
);

export const addData = produce<Data[], [ScatterSpecOptions]>((data, scatterOptions) => {
  const { chartTooltips, dimension, dimensionScaleType, highlightedItem, idKey, name } = scatterOptions;
  if (dimensionScaleType === 'time') {
    const tableData = getTableData(data);
    tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
  }

  if (isInteractive(scatterOptions) || highlightedItem !== undefined) {
    data.push(getFilteredTooltipData(chartTooltips));
  }

  if (hasPopover(scatterOptions)) {
    data.push({
      name: `${name}_selectedData`,
      source: FILTERED_TABLE,
      transform: [
        {
          type: 'filter',
          expr: `${SELECTED_ITEM} === datum.${idKey}`,
        },
      ],
    });
  }
  addTooltipData(data, scatterOptions);
  addTrendlineData(data, scatterOptions);
});

/**
 * Adds the signals for scatter to the signals array
 * @param signals Signal[]
 * @param scatterOptions ScatterSpecOptions
 */
export const addSignals = produce<Signal[], [ScatterSpecOptions]>((signals, scatterOptions) => {
  const { name: scatterName } = scatterOptions;
  // trendline signals
  setTrendlineSignals(signals, scatterOptions);

  if (!isInteractive(scatterOptions)) return;
  // interactive signals
  addHoveredItemSignal(signals, scatterName, `${scatterName}_voronoi`, 2);
  addTooltipSignals(signals, scatterOptions);
});

/**
 * Sets up all the scales for scatter on the scales array
 * @param scales Scale[]
 * @param scatterOptions ScatterSpecOptions
 */
export const setScales = produce<Scale[], [ScatterSpecOptions]>((scales, scatterOptions) => {
  const { color, colorScaleType, dimension, dimensionScaleType, lineType, lineWidth, metric, opacity, size } =
    scatterOptions;
  // add dimension scale
  addContinuousDimensionScale(scales, { scaleType: dimensionScaleType, dimension });
  // add metric scale
  addMetricScale(scales, [metric]);
  if (colorScaleType === 'linear') {
    // add color to the color domain
    addFieldToFacetScaleDomain(scales, LINEAR_COLOR_SCALE, color);
  } else {
    // add color to the color domain
    addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
  }
  // add lineType to the lineType domain
  addFieldToFacetScaleDomain(scales, LINE_TYPE_SCALE, lineType);
  // add lineWidth to the lineWidth domain
  addFieldToFacetScaleDomain(scales, LINE_WIDTH_SCALE, lineWidth);
  // add opacity to the opacity domain
  addFieldToFacetScaleDomain(scales, OPACITY_SCALE, opacity);
  // add size to the size domain
  addFieldToFacetScaleDomain(scales, SYMBOL_SIZE_SCALE, size);

  setScatterPathScales(scales, scatterOptions);
  scales.push(...getTrendlineScales(scatterOptions));
});