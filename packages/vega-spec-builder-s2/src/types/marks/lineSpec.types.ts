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
import { INTERACTION_MODE } from '@spectrum-charts/constants';

import { ChartData, ColorScheme, HighlightedItem } from '../chartSpec.types';
import { ChartPopoverOptions } from '../dialogs/chartPopoverSpec.types';
import { ChartInspectOptions } from '../dialogs/chartInspectSpec.types';
import {
  ColorFacet,
  FacetRef,
  LineType,
  LineTypeFacet,
  LineWidth,
  OpacityFacet,
  PartiallyRequired,
  ScaleType,
} from '../specUtil.types';
import { LineForecastOptions } from './supplemental/lineForecastSpec.types';
import { LineDirectLabelOptions } from './supplemental/lineDirectLabelSpec.types';
import { LinePointAnnotationOptions } from './supplemental/linePointAnnotationSpec.types';
import { MetricRangeOptions } from './supplemental/metricRangeSpec.types';
import { TrendlineOptions } from './supplemental/trendlineSpec.types';

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
  pointSize?: number;
  /** Line to be interpreted and rendered as a sparkline. For example, Changes the fill of static points. */
  isSparkline?: boolean;
  /** Sparkline's method is last - meaning that last element of data has the static point */
  isMethodLast?: boolean;
  /** Sets the type of scale that should be used for the trend */
  scaleType?: ScaleType;
  /** Key in the data that if it exists and the value resolves to true for each data object, a point will be drawn for that data point on the line. */
  staticPoint?: string;
  /** Sets the interaction mode for the line */
  interactionMode?: InteractionMode;
  /** Axis that the metric is trended against (y-axis) */
  metricAxis?: string;
  /** Enables dual metric axis mode where the last series uses a secondary axis with independent scale */
  dualMetricAxis?: boolean;
  /** If true, displays a gradient fill beneath the line fading from the line color to transparent */
  gradient?: boolean;
  /** Sets the interpolation method for the line */
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
  /**
   * Designates which series render with full color. Remaining series render in a de-emphasized gray
   * color with direct labels suppressed.
   * - `number`: the first N series by color scale order are primary.
   * - `string[]`: the named series are primary, regardless of color scale order.
   */
  primarySeries?: number | string[];
  /**
   * Overrides the default gray color used for series beyond the `primarySeries`.
   * Accepts any Spectrum 2 color token (e.g. `'gray-400'`) or CSS color value.
   */
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
  chartPopovers?: ChartPopoverOptions[];
  chartInspects?: ChartInspectOptions[];
  forecasts?: LineForecastOptions[];
  lineDirectLabels?: LineDirectLabelOptions[];
  linePointAnnotations?: LinePointAnnotationOptions[];
  metricRanges?: MetricRangeOptions[];
  trendlines?: TrendlineOptions[];
}

type LineOptionsWithDefaults =
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
  /** Resolved in addLine: whether this line uses the hover-animation system (see usesHoverAnimation). */
  isAnimate?: boolean;
  backgroundColor?: string;
  colorScheme: ColorScheme;
  comboSiblingNames?: string[];
  highlightedItem?: HighlightedItem;
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
