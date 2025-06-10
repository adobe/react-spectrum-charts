/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ColorScheme, HighlightedItem } from '../chartSpec.types';
import { ChartPopoverOptions } from '../dialogs/chartPopoverSpec.types';
import { ChartTooltipOptions } from '../dialogs/chartTooltipSpec.types';
import { ColorFacet, LineTypeFacet, LineWidth, OpacityFacet, Orientation, PartiallyRequired } from '../specUtil.types';
import { BarAnnotationOptions } from './supplemental/barAnnotationSpec.types';
import { TrendlineOptions } from './supplemental/trendlineSpec.types';

export type DualFacet = [string, string]; // two keys used for a secondary facet on Bar charts
export type BarType = 'dodged' | 'stacked';

export interface BarOptions {
  markType: 'bar';

  /** Key in the data that is used as the metric */
  metric?: string;
  /** Bar color or key in the data that is used as the color facet */
  color?: ColorFacet | DualFacet;
  /** Data field used for the bar categories (x-axis for a vertical bar) */
  dimension?: string;
  /** Data type field used for the bar categories (x-axis for a vertical bar) */
  dimensionDataType?: string;
  /** Whether to scale the last series in the data separately using the secondary metric axis */
  dualMetricAxis?: boolean;
  /** Sets the inner padding between bars in a group */
  groupedPadding?: number;
  /** `true` if BarProps has an onClick callback. Will add the mouse pointer to the bar on hover. */
  hasOnClick?: boolean;
  /** Should the top-left and top-right corners of the bars be square? Round by default */
  hasSquareCorners?: boolean;
  /** Line type or key in the data that is used as the line type facet */
  lineType?: LineTypeFacet | DualFacet;
  /** Border width of the bar */
  lineWidth?: LineWidth;
  /** Sets the name of the component. */
  name?: string;
  /** Optional field used to set the stack order of the bar (higher order = higher on bar) */
  order?: string;
  /** The direction of the bars. Defaults to "vertical". */
  orientation?: Orientation;
  /** Opacity or key in the data that is used as the opacity facet */
  opacity?: OpacityFacet | DualFacet;
  /** Sets inner padding (https://vega.github.io/vega/docs/scales/#band) */
  paddingRatio?: number;
  /** Sets the chart area padding, this is a ratio between 0 and 1 (https://vega.github.io/vega/docs/scales/#band) */
  paddingOuter?: number;
  /** The data field used for the trellis categories */
  trellis?: string;
  /** Orientation of the trellis. Only applicable if `trellis` is also defined. Defaults to "horizontal". */
  trellisOrientation?: Orientation;
  /** Padding between trellis groups; ratio between 0 and 1 (https://vega.github.io/vega/docs/scales/#band). Only applicable if `trellis` is also defined. Defaults to 0.2. */
  trellisPadding?: number;
  /** Bar type. */
  type?: BarType;
  /** Axis that the metric is trended against (y-axis for a vertical bar) */
  metricAxis?: string;

  // children
  barAnnotations?: BarAnnotationOptions[];
  chartPopovers?: ChartPopoverOptions[];
  chartTooltips?: ChartTooltipOptions[];
  trendlines?: TrendlineOptions[];
}

type BarOptionsWithDefaults =
  | 'barAnnotations'
  | 'color'
  | 'chartPopovers'
  | 'chartTooltips'
  | 'dimension'
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
  colorScheme: ColorScheme;
  dimensionScaleType: 'band';
  highlightedItem?: HighlightedItem;
  idKey: string;
  index: number;
  interactiveMarkName: string | undefined;
}
