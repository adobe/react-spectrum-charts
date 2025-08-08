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
import { BaseLegendLayout, Config } from 'vega';

import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_FONT_COLOR,
  DEFAULT_FONT_SIZE,
  DEFAULT_LEGEND_COLUMN_PADDING,
  DEFAULT_LEGEND_LABEL_LIMIT,
  DEFAULT_LEGEND_SYMBOL_SIZE,
  DEFAULT_SYMBOL_SIZE,
  DEFAULT_SYMBOL_STROKE_WIDTH,
  ROUNDED_SQUARE_PATH,
} from '@spectrum-charts/constants';

import { categorical16 } from './categoricalColorPalette';
import { divergentOrangeYellowSeafoam15 } from './divergingColorPalette';
import { sequentialViridis16 } from './sequentialColorPalette';
import { spectrumColors } from './spectrumColors';
import { getColorValue } from './utils';

export const ADOBE_CLEAN_FONT =
  "adobe-clean, 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, 'Trebuchet MS', 'Lucida Grande', sans-serif";

export function getSpectrumVegaConfig(colorScheme: 'light' | 'dark'): Config {
  const FONT_COLOR = getColorValue(DEFAULT_FONT_COLOR, colorScheme);
  const {
    'blue-400': blue400,
    'gray-200': gray200,
    'gray-300': gray300,
    'gray-700': gray700,
    'gray-900': gray900,
  } = spectrumColors[colorScheme];
  const horizontalLegendLayout: BaseLegendLayout = {
    anchor: 'middle',
    direction: 'horizontal',
    center: true,
    offset: 24,
    bounds: 'full',
    margin: 48,
  };
  const verticalLegendLayout: BaseLegendLayout = {
    anchor: 'middle',
    direction: 'vertical',
    center: false,
    offset: 24,
    bounds: 'full',
    margin: 24,
  };

  const defaultColor = spectrumColors[colorScheme]['categorical-100'];

  return {
    axis: {
      bandPosition: 0.5,
      domain: false,
      domainWidth: 2,
      domainColor: gray900,
      gridColor: gray200,
      labelFont: ADOBE_CLEAN_FONT,
      labelFontSize: DEFAULT_FONT_SIZE,
      labelFontWeight: 'normal',
      labelPadding: 8,
      labelOverlap: true,
      labelColor: FONT_COLOR,
      ticks: false,
      tickColor: gray300,
      tickRound: true,
      tickSize: 8,
      tickCap: 'round',
      tickWidth: 1,
      titleAnchor: 'middle',
      titleColor: FONT_COLOR,
      titleFont: ADOBE_CLEAN_FONT,
      titleFontSize: DEFAULT_FONT_SIZE,
      titleFontWeight: 'bold',
      titlePadding: 16,
    },
    range: {
      category: categorical16,
      diverging: divergentOrangeYellowSeafoam15,
      ordinal: categorical16,
      ramp: sequentialViridis16,
    },
    background: DEFAULT_BACKGROUND_COLOR,
    legend: {
      columnPadding: DEFAULT_LEGEND_COLUMN_PADDING,
      labelColor: FONT_COLOR,
      labelFont: ADOBE_CLEAN_FONT,
      labelFontSize: DEFAULT_FONT_SIZE,
      labelFontWeight: 'normal',
      labelLimit: DEFAULT_LEGEND_LABEL_LIMIT,
      layout: {
        bottom: horizontalLegendLayout,
        top: horizontalLegendLayout,
        left: verticalLegendLayout,
        right: verticalLegendLayout,
      },
      rowPadding: 8,
      symbolSize: DEFAULT_LEGEND_SYMBOL_SIZE,
      symbolType: ROUNDED_SQUARE_PATH,
      symbolStrokeColor: gray700,
      titleColor: FONT_COLOR,
      titleFont: ADOBE_CLEAN_FONT,
      titleFontSize: DEFAULT_FONT_SIZE,
      titlePadding: 8,
    },
    arc: {
      fill: defaultColor,
    },
    area: {
      fill: defaultColor,
      opacity: 0.8,
    },
    line: {
      strokeWidth: 2,
      stroke: defaultColor,
    },
    path: {
      stroke: defaultColor,
    },
    rect: {
      strokeWidth: 0,
      stroke: blue400,
      fill: defaultColor,
    },
    rule: {
      stroke: gray900,
      strokeWidth: 2,
    },
    shape: {
      stroke: defaultColor,
    },
    symbol: {
      strokeWidth: DEFAULT_SYMBOL_STROKE_WIDTH,
      size: DEFAULT_SYMBOL_SIZE,
      fill: defaultColor,
    },
    text: {
      fill: FONT_COLOR,
      font: ADOBE_CLEAN_FONT,
      fontSize: DEFAULT_FONT_SIZE,
    },
    title: {
      offset: 10,
      font: ADOBE_CLEAN_FONT,
      fontSize: 18,
      color: FONT_COLOR,
    },
    autosize: {
      type: 'fit',
      contains: 'padding',
      resize: true,
    },
  };
}
