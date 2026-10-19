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
import { ColorScheme } from '../../chartSpec.types.js';
import { ChartInspectOptions } from '../../dialogs/chartInspectSpec.types.js';
import { ColorFacet, LineType, LineWidth, Orientation, PartiallyRequired, ScaleType } from '../../specUtil.types.js';
import { SpectrumColor } from '../../spectrumVizColor.types.js';
import { TrendlineAnnotationOptions } from './trendlineAnnotationSpec.types.js';

/** trendline methods that use a joinaggregate transform */
export type AggregateMethod = 'average' | 'median';
/** trendline methods that use a regression transform */
export type RegressionMethod =
  | 'exponential'
  | 'linear'
  | 'logarithmic'
  | `polynomial-${number}`
  | 'power'
  | 'quadratic';
/** trendline methods that use a window transform */
export type WindowMethod = `movingAverage-${number}`;

/** avaliable methods for generating a trendline */
export type TrendlineMethod = AggregateMethod | RegressionMethod | WindowMethod;

export interface TrendlineOptions {
  /** Trendline color. Defaults to the color of its series. */
  color?: SpectrumColor | string;
  /** Range of `dimension` to draw the trendline over. `domain` extends it to the edge of the chart; `null` stops at the first or last row. Defaults to `dimensionRange`. */
  dimensionExtent?: [number | 'domain' | null, number | 'domain' | null];
  /** Range of `dimension` the trendline is calculated from; `null` leaves that end unbounded. Defaults to `[null, null]`. */
  dimensionRange?: [number | null, number | null];
  /** Whether the trendline should only be visible when hovering over the parent line */
  displayOnHover?: boolean;
  /** Data points where these keys have truthy values will not be included in the trendline calculation */
  excludeDataKeys?: string[];
  /** If there is an inspect on this trendline, then this will highlight the raw point in addition to the hovered trendline point. */
  highlightRawPoint?: boolean;
  /** Hides the first points of a moving average, which are calculated from less than a full window. Defaults to `false`. */
  hidePartialWindows?: boolean;
  /** Line type of the trendline. Defaults to `dashed`. */
  lineType?: LineType;
  /** Line width of the trendline. Defaults to `M`. */
  lineWidth?: LineWidth;
  /** Statistical method used to calculate the trendline. Defaults to `linear`. */
  method?: TrendlineMethod;
  /** Opacity of the trendline. Defaults to `1`. */
  opacity?: number;
  /** Orientation of the trendline; `vertical` calculates the dimension across the metric. Only supported on scatter plots. Defaults to `horizontal`. */
  orientation?: Orientation;

  // children
  chartInspects?: ChartInspectOptions[];
  trendlineAnnotations?: TrendlineAnnotationOptions[];
}

type TrendlineOptionsWithDefaults =
  | 'chartInspects'
  | 'dimensionExtent'
  | 'dimensionRange'
  | 'displayOnHover'
  | 'hidePartialWindows'
  | 'highlightRawPoint'
  | 'lineType'
  | 'lineWidth'
  | 'method'
  | 'opacity'
  | 'orientation'
  | 'trendlineAnnotations';

export interface TrendlineSpecOptions extends PartiallyRequired<TrendlineOptions, TrendlineOptionsWithDefaults> {
  colorScheme: ColorScheme;
  dimensionScaleType: ScaleType;
  isDimensionNormalized: boolean;
  metric: string;
  name: string;
  trendlineColor: ColorFacet;
  trendlineDimension: string;
  trendlineMetric: string;
}
