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
import { ColorScheme, HighlightedItem } from '../chartSpec.types.js';
import { ChartPopoverOptions } from '../dialogs/chartPopoverSpec.types.js';
import { ChartInspectOptions } from '../dialogs/chartInspectSpec.types.js';
import { ColorFacet, LineTypeFacet, LineWidth, OpacityFacet, Orientation, PartiallyRequired } from '../specUtil.types.js';
import { BarAnnotationOptions } from './supplemental/barAnnotationSpec.types.js';
import { BarDirectLabelOptions } from './supplemental/barDirectLabelSpec.types.js';
import { TrendlineOptions } from './supplemental/trendlineSpec.types.js';

export type DualFacet = [string, string]; // two keys used for a secondary facet on Bar charts
export type BarType = 'dodged' | 'stacked';

export interface BarOptions {
  markType: 'bar';

  /** Key in the data that is used as the metric. Defaults to `value`. */
  metric?: string;
  /** Bar color or key in the data that is used as the color facet; a two-key list dodges by the first key and stacks by the second. Defaults to `categorical-100`. */
  color?: ColorFacet | DualFacet;
  /** Data field whose value is the CSS color for each bar; overrides the color scale for the bar fill. */
  colorOverride?: string;
  /** Data field used for the bar categories (x-axis for a vertical bar). Defaults to `category`. */
  dimension?: string;
  /** Set to `time` when the dimension values are dates, so the axis can format them with `labelFormat="time"`. */
  dimensionDataType?: string;
  /** Whether to scale the last series separately on a secondary metric axis. Only applies to dodged bars with a single facet key and no trellis. Defaults to `false`. */
  dualMetricAxis?: boolean;
  /** Inner padding between dodged bars in a group, as a ratio between 0 and 1. Defaults to `paddingRatio`. */
  groupedPadding?: number;
  /** `true` if BarProps has an onClick callback. Will add the mouse pointer to the bar on hover. */
  hasOnClick?: boolean;
  /** Whether the corners at the end of each bar are square instead of rounded. Defaults to `false`. */
  hasSquareCorners?: boolean;
  /** Border line type or key in the data that is used as the line type facet. Only visible when `lineWidth` is greater than 0. Defaults to `solid`. */
  lineType?: LineTypeFacet | DualFacet;
  /** Border width of the bar, drawn in the bar's color. Defaults to `0`. */
  lineWidth?: LineWidth;
  /** Name used for the bar's marks and signals in the Vega spec. Defaults to `bar0`, `bar1`, and so on. */
  name?: string;
  /** Data field that sets the stack order; higher values stack on top. Defaults to data order. */
  order?: string;
  /** Direction of the bars. Defaults to `vertical`. */
  orientation?: Orientation;
  /** Bar opacity, or a data field that assigns an opacity to each series. Defaults to `1`. */
  opacity?: OpacityFacet | DualFacet;
  /** Space between bars, as a share of each category's width from 0 to 1. Defaults to `0.4`. */
  paddingRatio?: number;
  /** Space before the first bar and after the last, as a share of each category's width. Defaults to half of `paddingRatio`. */
  paddingOuter?: number;
  /** Data field that splits the chart into small multiples, one per value. */
  trellis?: string;
  /** Whether trellis groups sit side by side or stacked. Only applies with `trellis`. Defaults to `horizontal`. */
  trellisOrientation?: Orientation;
  /** Space between trellis groups, from 0 to 1. Only applies with `trellis`. Defaults to `0.2`. */
  trellisPadding?: number;
  /** Whether series stack on top of each other or sit side by side (dodged). Defaults to `stacked`. */
  type?: BarType;
  /** Diverging bar chart (metric spans positive and negative): moves the dimension axis to the zero baseline and flips each label to the opposite side of its bar. Single-series bars only; a no-op on dodged or faceted bars. Defaults to `false`. */
  diverging?: boolean;
  /** Axis that the metric is trended against (y-axis for a vertical bar) */
  metricAxis?: string;

  // children
  barAnnotations?: BarAnnotationOptions[];
  barDirectLabels?: BarDirectLabelOptions[];
  chartPopovers?: ChartPopoverOptions[];
  chartInspects?: ChartInspectOptions[];
  trendlines?: TrendlineOptions[];
}

type BarOptionsWithDefaults =
  | 'barAnnotations'
  | 'barDirectLabels'
  | 'color'
  | 'chartPopovers'
  | 'chartInspects'
  | 'dimension'
  | 'diverging'
  | 'hasOnClick'
  | 'hasSquareCorners'
  | 'lineType'
  | 'lineWidth'
  | 'metric'
  | 'name'
  | 'opacity'
  | 'paddingRatio'
  | 'orientation'
  | 'trellisOrientation'
  | 'trellisPadding'
  | 'trendlines'
  | 'type';

export interface BarSpecOptions extends PartiallyRequired<BarOptions, BarOptionsWithDefaults> {
  /** Unique composite hover-animation identity per rendered bar, computed from the real data (not `rscMarkId`). */
  barIds?: string[];
  /** Experimental: keyboard navigation focus rings/signals are emitted when true. @see ChartOptions.accessibleNavigation */
  accessibleNavigation?: boolean;
  colorScheme: ColorScheme;
  comboSiblingNames?: string[];
  dimensionScaleType: 'band';
  highlightedItem?: HighlightedItem;
  highlightedSeries?: string | number;
  idKey: string;
  index: number;
  interactiveMarkName: string | undefined;
  isHighlightedByGroup?: boolean;
  isHoverAnimate?: boolean;
  isDrawInAnimate?: boolean;
  legendHighlightSignals?: string[];
  popoverMarkName?: string;
}
