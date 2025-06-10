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
import { PartiallyRequired, ScaleType } from '../specUtil.types';

export interface AreaOptions {
  markType: 'area';

  /** Sets the name of the component. */
  name?: string;
  /** Key in the data that is used as the color facet */
  color?: string;
  /** Key in the data that is used as the metric */
  metric?: string;
  /** Data field that the metric is trended against (x-axis for horizontal orientation) */
  dimension?: string;
  /** Optional field used to set the stack order of the area (higher order = stacked on top/right) */
  order?: string;
  /** Optional field used to set the area opacity */
  opacity?: number;
  /** Sets the horizontal padding, this is a ratio from 0 to 1 for categorical scales (point) and a pixel value for continuous scales (time, linear) */
  padding?: number;
  /** Sets the type of scale that should be used for the trend */
  scaleType?: ScaleType;

  // define area using start/end
  /** Data field for the start of the area */
  metricStart?: string;
  /** Data field for the end of the area */
  metricEnd?: string;

  // children
  /** Popover that is shown when hovering over the area */
  chartPopovers?: ChartPopoverOptions[];
  /** Tooltip that is shown when hovering over the area */
  chartTooltips?: ChartTooltipOptions[];
}

type AreaOptionsWithDefaults =
  | 'chartTooltips'
  | 'chartPopovers'
  | 'color'
  | 'dimension'
  | 'metric'
  | 'name'
  | 'opacity'
  | 'scaleType';

export interface AreaSpecOptions extends PartiallyRequired<AreaOptions, AreaOptionsWithDefaults> {
  colorScheme: ColorScheme;
  highlightedItem?: HighlightedItem;
  idKey: string;
  index: number;
}
