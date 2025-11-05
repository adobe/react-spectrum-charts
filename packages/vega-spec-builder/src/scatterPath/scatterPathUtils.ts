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
import { GroupMark, NumericValueRef, Scale, TrailMark } from 'vega';

import {
  CONTROLLED_HIGHLIGHTED_ITEM,
  CONTROLLED_HIGHLIGHTED_SERIES,
  DEFAULT_OPACITY_RULE,
  FADE_FACTOR,
  FILTERED_TABLE,
  SELECTED_ITEM,
  SELECTED_SERIES,
  SYMBOL_PATH_WIDTH_SCALE,
} from '@spectrum-charts/constants';
import { getColorValue } from '@spectrum-charts/themes';

import { getXProductionRule } from '../marks/markUtils';
import { addFieldToFacetScaleDomain } from '../scale/scaleSpecBuilder';
import { getFacetsFromOptions, getLineWidthPixelsFromLineWidth } from '../specUtils';
import { LineWidthFacet, ScatterPathOptions, ScatterPathSpecOptions, ScatterSpecOptions } from '../types';

/**
 * Gets the path spec options, applying defaults.
 * @param scatterPathOptions
 * @param index
 * @param markName
 * @param colorScheme
 * @returns ScatterPathSpecOptions
 */
export const getScatterPathSpecOptions = (
  { color = 'gray-500', groupBy, pathWidth = { value: 'M' }, opacity = 0.5, ...scatterPathOptions }: ScatterPathOptions,
  index: number,
  {
    color: scatterColor,
    colorScheme,
    dimension,
    dimensionScaleType,
    lineType,
    metric,
    name: scatterName,
    opacity: scatterOpacity,
    size,
  }: ScatterSpecOptions
): ScatterPathSpecOptions => {
  const { facets } = getFacetsFromOptions({ color: scatterColor, lineType, size, opacity: scatterOpacity });
  return {
    color,
    colorScheme,
    dimension,
    dimensionScaleType,
    groupBy: groupBy ?? facets,
    metric,
    index,
    pathWidth,
    name: `${scatterName}Path${index}`,
    opacity,
    ...scatterPathOptions,
  };
};

/**
 * Gets all the paths on a scatter
 * @param scatterOptions
 * @returns ScatterPathSpecOptions[]
 */
export const getScatterPaths = (scatterOptions: ScatterSpecOptions): ScatterPathSpecOptions[] => {
  return scatterOptions.scatterPaths.map((path, index) => getScatterPathSpecOptions(path, index, scatterOptions));
};

/**
 * Sets the scales up for the scatter path marks
 * Note: This mutates the scales array so it should only be called from an immer produce function
 * @param scales
 * @param scatterOptions
 */
export const setScatterPathScales = (scales: Scale[], scatterOptions: ScatterSpecOptions) => {
  const paths = getScatterPaths(scatterOptions);

  for (const path of paths) {
    addFieldToFacetScaleDomain(scales, SYMBOL_PATH_WIDTH_SCALE, path.pathWidth);
  }
};

export const getScatterPathMarks = (scatterOptions: ScatterSpecOptions): GroupMark[] => {
  const marks: GroupMark[] = [];
  const paths = getScatterPaths(scatterOptions);

  for (const path of paths) {
    const { groupBy, name } = path;
    marks.push({
      name: `${name}_group`,
      type: 'group',
      from: {
        facet: {
          name: `${name}_facet`,
          data: FILTERED_TABLE,
          groupby: groupBy,
        },
      },
      marks: [getScatterPathTrailMark(path)],
    });
  }

  return marks;
};

export const getScatterPathTrailMark = ({
  color,
  colorScheme,
  dimension,
  dimensionScaleType,
  pathWidth,
  metric,
  name,
  opacity,
}: ScatterPathSpecOptions): TrailMark => {
  return {
    name,
    type: 'trail',
    from: { data: `${name}_facet` },
    encode: {
      enter: {
        fill: {
          value: getColorValue(color, colorScheme),
        },
        fillOpacity: { value: opacity },
        size: getPathWidth(pathWidth),
      },
      update: {
        opacity: getOpacity(),
        x: getXProductionRule(dimensionScaleType, dimension),
        y: { scale: 'yLinear', field: metric },
      },
    },
  };
};

/**
 * Gets the opacity production rule for the scatterPath trail marks.
 * This is used for highlighting trails on hover and selection.
 * @param scatterOptions ScatterSpecOptions
 * @returns opacity production rule
 */
export const getOpacity = (): ({ test?: string } & NumericValueRef)[] => {
  return [
    {
      test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES}) || isArray(${CONTROLLED_HIGHLIGHTED_ITEM}) || isValid(${SELECTED_SERIES}) || isValid(${SELECTED_ITEM})`,
      value: FADE_FACTOR,
    },
    DEFAULT_OPACITY_RULE,
  ];
};

export const getPathWidth = (pathWidth: LineWidthFacet): NumericValueRef => {
  if (typeof pathWidth === 'string') {
    return { scale: SYMBOL_PATH_WIDTH_SCALE, field: pathWidth };
  }
  return { value: getLineWidthPixelsFromLineWidth(pathWidth.value) };
};
