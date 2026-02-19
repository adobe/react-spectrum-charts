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

import { ColorScheme, HighlightedItem } from '../chartSpec.types';
import { ChartPopoverOptions } from '../dialogs/chartPopoverSpec.types';
import { ChartTooltipOptions } from '../dialogs/chartTooltipSpec.types';
import {
  ColorFacet,
  FacetRef,
  LineTypeFacet,
  LineWidth,
  OpacityFacet,
  PartiallyRequired,
  ScaleType,
} from '../specUtil.types';
import { LinePointAnnotationOptions } from './supplemental/linePointAnnotationSpec.types';
import { MetricRangeOptions } from './supplemental/metricRangeSpec.types';
import { TrendlineOptions } from './supplemental/trendlineSpec.types';

export type InteractionMode = `${INTERACTION_MODE}`;

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
  /** `true` if LineProps has an onClick callback. */
  hasOnClick?: boolean;
  /** `true` if LineProps has interaction callbacks (onMouseOver, onMouseOut).*/
  hasMouseInteraction?: boolean;
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

  // children
  chartPopovers?: ChartPopoverOptions[];
  chartTooltips?: ChartTooltipOptions[];
  linePointAnnotations?: LinePointAnnotationOptions[];
  metricRanges?: MetricRangeOptions[];
  trendlines?: TrendlineOptions[];
}

type LineOptionsWithDefaults =
  | 'chartPopovers'
  | 'chartTooltips'
  | 'color'
  | 'dimension'
  | 'hasOnClick'
  | 'linePointAnnotations'
  | 'lineType'
  | 'metric'
  | 'metricRanges'
  | 'name'
  | 'opacity'
  | 'scaleType'
  | 'trendlines';

export interface LineSpecOptions extends PartiallyRequired<LineOptions, LineOptionsWithDefaults> {
  colorScheme: ColorScheme;
  comboSiblingNames?: string[];
  highlightedItem?: HighlightedItem;
  idKey: string;
  index: number;
  interactiveMarkName: string | undefined;
  isHighlightedByGroup?: boolean;
  lineWidth?: FacetRef<LineWidth>;
  popoverMarkName: string | undefined;
  interactionMode?: InteractionMode;
}
