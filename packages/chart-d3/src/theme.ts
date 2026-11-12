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
import {
  CHART_SIZE_BREAKPOINTS,
  CHART_SIZE_HOVER_STROKE_WIDTHS,
  CHART_SIZE_LABEL_GAPS,
  CHART_SIZE_POINT_SIZES,
  CHART_SIZE_STROKE_WIDTHS,
  DEFAULT_LEGEND_COLUMN_PADDING,
  DEFAULT_LEGEND_LABEL_LIMIT,
  DEFAULT_LEGEND_SYMBOL_SIZE,
  DIRECT_LABEL_FONT_SIZE_L,
  DIRECT_LABEL_FONT_SIZE_M,
  DIRECT_LABEL_FONT_SIZE_S,
  ROUNDED_SQUARE_PATH,
} from '@spectrum-charts/core-s2/constants';
import { ADOBE_CLEAN_FONT, getColorSchemeColors, getS2ColorValue } from '@spectrum-charts/core-s2/tokens';

import { ColorScheme } from './types.js';

export type SizeTier = 'S' | 'M' | 'L';

/** Size-dependent values derived from the chart size. */
export interface ChartSize {
  tier: SizeTier;
  strokeWidth: number;
  hoverStrokeWidth: number;
  pointSize: number;
  fontSize: number;
  labelGap: number;
}

const FONT_SIZES: Record<SizeTier, number> = {
  S: DIRECT_LABEL_FONT_SIZE_S,
  M: DIRECT_LABEL_FONT_SIZE_M,
  L: DIRECT_LABEL_FONT_SIZE_L,
};

/**
 * Gets the chart-size tier values for a container width.
 * @param containerWidth
 * @returns ChartSize
 */
export const getChartSize = (containerWidth: number): ChartSize => {
  let tier: SizeTier = 'L';
  if (containerWidth < CHART_SIZE_BREAKPOINTS.M) tier = 'S';
  else if (containerWidth < CHART_SIZE_BREAKPOINTS.L) tier = 'M';
  return {
    tier,
    strokeWidth: CHART_SIZE_STROKE_WIDTHS[tier],
    hoverStrokeWidth: CHART_SIZE_HOVER_STROKE_WIDTHS[tier],
    pointSize: CHART_SIZE_POINT_SIZES[tier],
    fontSize: FONT_SIZES[tier],
    labelGap: CHART_SIZE_LABEL_GAPS[tier],
  };
};

/** Resolved S2 theme values; mirrors core-s2's spectrum2Theme so both engines read the same tokens. */
export interface Theme {
  font: string;
  colorScheme: ColorScheme;
  color: (token: string) => string;
  palette: (name: string) => string[];
  background: string;
  /** Fill for hollow points: the chart background color (gray-25 when the chart is transparent). */
  pointFill: string;
  axis: {
    labelColor: string;
    labelFontSize: number;
    labelPadding: number;
    titleColor: string;
    titleFontSize: number;
    titlePadding: number;
    gridColor: string;
    tickColor: string;
    tickSize: number;
    baselineColor: string;
  };
  textColor: string;
  legend: {
    labelColor: string;
    labelFontSize: number;
    labelLimit: number;
    symbolShape: string;
    symbolSize: number;
    symbolStrokeWidth: number;
    columnPadding: number;
    rowPadding: number;
    padding: number;
    offset: number;
    titlePadding: number;
    titleColor: string;
    titleLimit: number;
  };
  title: { fontSize: number; offset: number; color: string };
  ruleColor: string;
}

/**
 * Resolves the S2 theme for a color scheme.
 * @param colorScheme
 * @param backgroundColor
 * @returns Theme
 */
export const getTheme = (colorScheme: ColorScheme = 'light', backgroundColor = 'transparent'): Theme => {
  const color = (token: string) => getS2ColorValue(token, colorScheme);
  return {
    font: ADOBE_CLEAN_FONT,
    colorScheme,
    color,
    palette: (name: string) => getColorSchemeColors(name as Parameters<typeof getColorSchemeColors>[0], colorScheme),
    background: backgroundColor === 'transparent' ? 'transparent' : color(backgroundColor),
    pointFill: color(backgroundColor === 'transparent' ? 'gray-25' : backgroundColor),
    axis: {
      labelColor: color('gray-700'),
      labelFontSize: 14,
      labelPadding: 8,
      titleColor: color('gray-700'),
      titleFontSize: 14,
      titlePadding: 16,
      gridColor: color('gray-300'),
      tickColor: color('gray-300'),
      tickSize: 8,
      baselineColor: color('gray-800'),
    },
    textColor: color('gray-800'),
    legend: {
      labelColor: color('gray-700'),
      labelFontSize: 14,
      labelLimit: DEFAULT_LEGEND_LABEL_LIMIT,
      symbolShape: ROUNDED_SQUARE_PATH,
      symbolSize: DEFAULT_LEGEND_SYMBOL_SIZE,
      symbolStrokeWidth: 1.5,
      columnPadding: DEFAULT_LEGEND_COLUMN_PADDING,
      rowPadding: 8,
      padding: 8,
      offset: 24,
      titlePadding: 8,
      titleColor: color('gray-800'),
      titleLimit: 180,
    },
    title: { fontSize: 22, offset: 10, color: color('gray-800') },
    ruleColor: color('gray-800'),
  };
};
