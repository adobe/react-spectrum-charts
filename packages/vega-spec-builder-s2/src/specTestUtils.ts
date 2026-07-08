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
import { Signal } from 'vega';

import {
  CHART_SIZE_BREAKPOINTS,
  CHART_SIZE_FONT_SIZE,
  CHART_SIZE_HOVER_STROKE_WIDTH,
  CHART_SIZE_HOVER_STROKE_WIDTHS,
  CHART_SIZE_LABEL_GAP,
  CHART_SIZE_LABEL_GAPS,
  CHART_SIZE_POINT_SIZE,
  CHART_SIZE_POINT_SIZES,
  CHART_SIZE_STROKE_WIDTH,
  CHART_SIZE_STROKE_WIDTHS,
  CONTROLLED_HIGHLIGHTED_ITEM,
  CONTROLLED_HIGHLIGHTED_SERIES,
  DIRECT_LABEL_FONT_SIZE_L,
  DIRECT_LABEL_FONT_SIZE_M,
  DIRECT_LABEL_FONT_SIZE_S,
  HIGHLIGHTED_GROUP,
  SELECTED_GROUP,
  SELECTED_ITEM,
  SELECTED_SERIES,
} from '@spectrum-charts/constants';

import { getGenericValueSignal } from './signal/signalSpecBuilder';

export const defaultHighlightedItemSignal = getGenericValueSignal(CONTROLLED_HIGHLIGHTED_ITEM);
export const defaultHighlightedGroupSignal = getGenericValueSignal(HIGHLIGHTED_GROUP);
export const defaultHighlightedSeriesSignal = getGenericValueSignal(CONTROLLED_HIGHLIGHTED_SERIES);
export const defaultSelectedItemSignal = getGenericValueSignal(SELECTED_ITEM);
export const defaultSelectedSeriesSignal = getGenericValueSignal(SELECTED_SERIES);
export const defaultSelectedGroupSignal = getGenericValueSignal(SELECTED_GROUP);

export const defaultChartSizeStrokeWidthSignal = {
  name: CHART_SIZE_STROKE_WIDTH,
  update: `rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.M} ? ${CHART_SIZE_STROKE_WIDTHS.S} : rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.L} ? ${CHART_SIZE_STROKE_WIDTHS.M} : ${CHART_SIZE_STROKE_WIDTHS.L}`,
};

export const defaultChartSizeHoverStrokeWidthSignal = {
  name: CHART_SIZE_HOVER_STROKE_WIDTH,
  update: `rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.M} ? ${CHART_SIZE_HOVER_STROKE_WIDTHS.S} : rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.L} ? ${CHART_SIZE_HOVER_STROKE_WIDTHS.M} : ${CHART_SIZE_HOVER_STROKE_WIDTHS.L}`,
};

export const defaultChartSizePointSizeSignal = {
  name: CHART_SIZE_POINT_SIZE,
  update: `rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.M} ? ${CHART_SIZE_POINT_SIZES.S} : rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.L} ? ${CHART_SIZE_POINT_SIZES.M} : ${CHART_SIZE_POINT_SIZES.L}`,
};

export const defaultChartSizeFontSizeSignal = {
  name: CHART_SIZE_FONT_SIZE,
  update: `rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.M} ? ${DIRECT_LABEL_FONT_SIZE_S} : rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.L} ? ${DIRECT_LABEL_FONT_SIZE_M} : ${DIRECT_LABEL_FONT_SIZE_L}`,
};

export const defaultChartSizeLabelGapSignal = {
  name: CHART_SIZE_LABEL_GAP,
  update: `rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.M} ? ${CHART_SIZE_LABEL_GAPS.S} : rscContainerWidth(width) < ${CHART_SIZE_BREAKPOINTS.L} ? ${CHART_SIZE_LABEL_GAPS.M} : ${CHART_SIZE_LABEL_GAPS.L}`,
};

export const defaultSignals: Signal[] = [
  defaultHighlightedItemSignal,
  defaultHighlightedGroupSignal,
  defaultHighlightedSeriesSignal,
  defaultSelectedItemSignal,
  defaultSelectedSeriesSignal,
  defaultSelectedGroupSignal,
  defaultChartSizeStrokeWidthSignal,
  defaultChartSizeHoverStrokeWidthSignal,
  defaultChartSizePointSizeSignal,
  defaultChartSizeFontSizeSignal,
  defaultChartSizeLabelGapSignal,
];
