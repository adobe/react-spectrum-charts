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
import { SymbolMark } from 'vega';

import {
  BACKGROUND_COLOR,
} from '@spectrum-charts/constants';

import {
  getColorProductionRule,
  getXProductionRule,
} from '../marks/markUtils';
import { LineSpecOptions } from '../types';
import { getLineYEncoding } from './lineMarkUtils';
import { LineMarkOptions } from './lineUtils';

/**
 * Gets the point mark for static points on a line chart.
 * @param lineMarkOptions
 * @returns SymbolMark
 */
export const getLineStaticPoint = (lineOptions: LineSpecOptions): SymbolMark => {
  const {
    name,
    metric,
    color,
    colorScheme,
    scaleType,
    dimension,
    pointSize = 64,
  } = lineOptions;
  return {
    name: `${name}_staticPoints`,
    description: `${name}_staticPoints`,
    type: 'symbol',
    from: { data: `${name}_staticPointData` },
    interactive: false,
    encode: {
      enter: {
        size: { value: pointSize },
        fill: { signal: BACKGROUND_COLOR },
        stroke: getColorProductionRule(color, colorScheme),
        y: getLineYEncoding(lineOptions, metric),
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
      },
    },
  };
};

/**
 * Gets a background to points to prevent opacity from displaying elements behind the point.
 * @param lineMarkOptions
 * @returns SymbolMark
 */
export const getHighlightBackgroundPoint = (lineOptions: LineMarkOptions): SymbolMark => {
  const { dimension, metric, name, pointSize = 64, scaleType } = lineOptions;
  return {
    name: `${name}_pointBackground`,
    description: `${name}_pointBackground`,
    type: 'symbol',
    from: { data: `${name}_highlightedData` },
    interactive: false,
    encode: {
      enter: {
        size: { value: pointSize },
        y: getLineYEncoding(lineOptions, metric),
        fill: { signal: BACKGROUND_COLOR },
        stroke: { signal: BACKGROUND_COLOR },
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
      },
    },
  };
};

const getHighlightOrSelectionPoint = (lineOptions: LineMarkOptions, useHighlightedData = true): SymbolMark => {
  const { color, colorScheme, dimension, metric, name, pointSize = 64, scaleType } = lineOptions;
  return {
    name: `${name}_point_${useHighlightedData ? 'highlight' : 'select'}`,
    description: `${name}_point_${useHighlightedData ? 'highlight' : 'select'}`,
    type: 'symbol',
    from: { data: `${name}${useHighlightedData ? '_highlightedData' : '_selectedData'}` },
    interactive: false,
    encode: {
      enter: {
        size: { value: pointSize },
        fill: { signal: BACKGROUND_COLOR },
        stroke: getColorProductionRule(color, colorScheme),
        y: getLineYEncoding(lineOptions, metric),
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
      },
    },
  };
};

/**
 * Displays a point on hover on the line.
 * @param lineMarkOptions
 * @returns SymbolMark
 */
export const getHighlightPoint = (lineOptions: LineMarkOptions): SymbolMark => {
  return getHighlightOrSelectionPoint(lineOptions, true);
};

/**
 * Displays a point on select on the line.
 * @param lineMarkOptions
 * @returns SymbolMark
 */
export const getSelectionPoint = (lineOptions: LineMarkOptions): SymbolMark => {
  return getHighlightOrSelectionPoint(lineOptions, false);
};

/**
 * Displays a secondary highlight point on hover or select on the line.
 * @param lineMarkOptions
 * @param secondaryHighlightedMetric
 * @returns SymbolMark
 */
export const getSecondaryHighlightPoint = (
  lineOptions: LineMarkOptions,
  secondaryHighlightedMetric: string
): SymbolMark => {
  const { color, colorScheme, dimension, name, scaleType } = lineOptions;
  return {
    name: `${name}_secondaryPoint`,
    description: `${name}_secondaryPoint`,
    type: 'symbol',
    from: { data: `${name}_highlightedData` },
    interactive: false,
    encode: {
      enter: {
        y: getLineYEncoding(lineOptions, secondaryHighlightedMetric),
        fill: { signal: BACKGROUND_COLOR },
        stroke: getColorProductionRule(color, colorScheme),
      },
      update: {
        x: getXProductionRule(scaleType, dimension),
      },
    },
  };
};
