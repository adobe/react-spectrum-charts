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
import { INTERACTION_MODE } from '@spectrum-charts/core-s2/constants';

import { ChartData, ColorScheme, HighlightedItem } from '../chartSpec.types.js';
import { ChartActionBarOptions } from '../dialogs/chartActionBarSpec.types.js';
import { ChartPopoverOptions } from '../dialogs/chartPopoverSpec.types.js';
import { ChartInspectOptions } from '../dialogs/chartInspectSpec.types.js';
import {
  ColorFacet,
  FacetRef,
  LineType,
  LineTypeFacet,
  LineWidth,
  OpacityFacet,
  PartiallyRequired,
  ScaleType,
} from '../specUtil.types.js';
import { LineForecastOptions } from './supplemental/lineForecastSpec.types.js';
import { LineDirectLabelOptions } from './supplemental/lineDirectLabelSpec.types.js';
import { LinePointAnnotationOptions } from './supplemental/linePointAnnotationSpec.types.js';
import { MetricRangeOptions } from './supplemental/metricRangeSpec.types.js';
import { TrendlineOptions } from './supplemental/trendlineSpec.types.js';

export type InteractionMode = `${INTERACTION_MODE}`;
export type InterpolationType = 'basis' | 'cardinal' | 'catmull-rom' | 'linear' | 'monotone' | 'natural' | 'step' | 'step-after' | 'step-before';
export type LineCap = 'round' | 'square';

export interface LineOptions {
  markType: 'line';

  /** Sets the name of the component. */
  name?: string;
  /** Key in the data that is used as the metric */
  metric?: string;
  /** Line color or key in the data that is used as the color facet */
  color?: ColorFacet;
  /** Data field that the value is trended against (x-axis) */
  dimension?: string;
  /** `true` if BarProps has an onClick callback. Will add the mouse pointer to the bar on hover. */
  hasOnClick?: boolean;
  /** `true` if LineProps has an onContextMenu callback. Ensures interactive marks are generated even without inspect/click. */
  hasOnContextMenu?: boolean;
  /** Line type or key in the data that is used as the line type facet */
  lineType?: LineTypeFacet;
  /** Opacity or key in the data that is used as the opacity facet */
  opacity?: OpacityFacet;
  /** Sets the chart area padding, this is a ratio from 0 to 1 for categorical scales (point) and a pixel value for continuous scales (time, linear) */
  padding?: number;
  /** Area of static points in square pixels. When omitted, points scale with chart width. */
  pointSize?: number;
  /** Renders the line as a sparkline. With `isMethodLast`, draws a static point on the last data point. */
  isSparkline?: boolean;
  /** With `isSparkline`, draws a static point on the last row of the chart data. */
  isMethodLast?: boolean;
  /** Sets the x scale type: `'time'`, `'linear'`, or `'point'`. */
  scaleType?: ScaleType;
  /** Data field that marks rows to highlight; a point is drawn on the line for each row where it's true. */
  staticPoint?: string;
  /** Sets how hovering picks a point: `'nearest'` uses the closest point, `'item'` only the point under the pointer. */
  interactionMode?: InteractionMode;
  /** Axis that the metric is trended against (y-axis) */
  metricAxis?: string;
  /** Enables dual metric axis mode where the last series uses a secondary axis with independent scale */
  dualMetricAxis?: boolean;
  /** Fills the area under the line with its color, fading to transparent. Use on charts with a single line. */
  gradient?: boolean;
  /** Sets the interpolation method for the line. `basis` doesn't pass through the data, so it draws no points. */
  interpolate?: InterpolationType;
  /**
   * Sets the stroke line cap style for the line ends and gap boundaries.
   * @default 'round'
   */
  lineCap?: LineCap;
  /**
   * Data field key whose truthy value marks a point as part of an alternate segment.
   * Alternate segments render with a different line type (see `alternateSegmentLineType`).
   */
  alternateSegmentKey?: string;
  /**
   * Line type used for alternate segments identified by `alternateSegmentKey`.
   * @default 'dotted'
   */
  alternateSegmentLineType?: LineType;
  /**
   * Text appended to the hover value label for alternate-segment points (e.g. `'(Estimated)'`).
   * No default — omitting means no append.
   */
  alternateSegmentLabel?: string;
  /** Series to keep in color; the rest turn gray and lose their direct labels. Pass a number N for the first N series, or a list of series names. */
  primarySeries?: number | string[];
  /** Color for series outside `primarySeries`, as a Spectrum color token or CSS color. */
  otherSeriesColor?: string;
  /**
   * If `true`, all series at the hovered x-dimension highlight simultaneously instead of
   * only the nearest series. Hover value labels show for every series at that dimension.
   * @default false
   */
  dimensionHover?: boolean;
  /**
   * If `true`, shows the metric value as a label adjacent to the hovered data point.
   * Suppressed when a `<ChartInspect>` child is present.
   * @default true
   */
  showHoverLabel?: boolean;
  /**
   * Data field key to display in the hover value label. Defaults to the `metric` field.
   * Use this to show a pre-formatted or alternate field (e.g. `'displayValue'`) instead of the raw metric.
   */
  hoverLabelKey?: string;

  // children
  chartActionBars?: ChartActionBarOptions[];
  chartPopovers?: ChartPopoverOptions[];
  chartInspects?: ChartInspectOptions[];
  forecasts?: LineForecastOptions[];
  lineDirectLabels?: LineDirectLabelOptions[];
  linePointAnnotations?: LinePointAnnotationOptions[];
  /** Shaded ranges drawn around the line, each between two data fields. */
  metricRanges?: MetricRangeOptions[];
  trendlines?: TrendlineOptions[];
}

type LineOptionsWithDefaults =
  | 'chartActionBars'
  | 'chartPopovers'
  | 'chartInspects'
  | 'color'
  | 'dimension'
  | 'dimensionHover'
  | 'forecasts'
  | 'gradient'
  | 'hasOnClick'
  | 'hasOnContextMenu'
  | 'lineCap'
  | 'lineDirectLabels'
  | 'linePointAnnotations'
  | 'lineType'
  | 'metric'
  | 'metricRanges'
  | 'name'
  | 'opacity'
  | 'scaleType'
  | 'showHoverLabel'
  | 'trendlines';

export interface LineSpecOptions extends PartiallyRequired<LineOptions, LineOptionsWithDefaults> {
  data?: ChartData[];
  seriesIds?: string[];
  isHoverAnimate?: boolean;
  isDrawInAnimate?: boolean;
  hasFixedMetricAxis?: boolean;
  backgroundColor?: string;
  colorScheme: ColorScheme;
  comboSiblingNames?: string[];
  highlightedItem?: HighlightedItem;
  highlightedSeries?: string | number;
  idKey: string;
  index: number;
  interactiveMarkName: string | undefined;
  isHighlightedByGroup?: boolean;
  legendHighlightSignals?: string[];
  lineWidth?: FacetRef<LineWidth>;
  popoverMarkName: string | undefined;
  interactionMode?: InteractionMode;
  interpolate?: InterpolationType;
}
