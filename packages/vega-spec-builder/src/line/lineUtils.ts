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
import {
  BarAnnotationOptions,
  ChartPopoverOptions,
  ChartTooltipOptions,
  ColorFacet,
  ColorScheme,
  DonutSummaryOptions,
  HighlightedItem,
  InteractionMode,
  LineTypeFacet,
  LineWidthFacet,
  MetricRangeOptions,
  OpacityFacet,
  ScaleType,
  ScatterPathOptions,
  SegmentLabelOptions,
  TrendlineOptions,
} from '../types';

export const getPopoverMarkName = (chartPopovers: ChartPopoverOptions[], lineName: string): string | undefined => {
  // if the line has a popover, this line is the target for the popover
  if (chartPopovers.length) {
    return lineName;
  }
};

/**
 * Checks if the line chart is a dual metric axis chart
 * @param options - The line chart options
 * @returns True if the line chart is a dual metric axis chart, false otherwise
 */
export const isDualMetricAxis = (options: { dualMetricAxis?: boolean }): boolean => {
  return Boolean(options.dualMetricAxis);
};

export interface LineMarkOptions {
  barAnnotations?: BarAnnotationOptions[];
  chartPopovers?: ChartPopoverOptions[];
  chartTooltips?: ChartTooltipOptions[];
  color: ColorFacet;
  colorScheme: ColorScheme;
  comboSiblingNames?: string[];
  dimension: string;
  displayOnHover?: boolean;
  donutSummaries?: DonutSummaryOptions[];
  dualMetricAxis?: boolean;
  hasOnClick?: boolean;
  highlightedItem?: HighlightedItem;
  idKey: string;
  interactiveMarkName?: string; // optional name of the mark that is used for hover and click interactions
  interactionMode?: InteractionMode;
  isHighlightedByDimension?: boolean;
  isHighlightedByGroup?: boolean;
  lineType: LineTypeFacet;
  lineWidth?: LineWidthFacet;
  metric: string;
  metricAxis?: string;
  metricRanges?: MetricRangeOptions[];
  name: string;
  opacity: OpacityFacet;
  popoverMarkName?: string;
  scaleType: ScaleType;
  scatterPaths?: ScatterPathOptions[];
  segmentLabels?: SegmentLabelOptions[];
  staticPoint?: string;
  trendlines?: TrendlineOptions[];
}
