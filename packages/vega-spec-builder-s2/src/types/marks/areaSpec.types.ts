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
import { PartiallyRequired, ScaleType } from '../specUtil.types.js';

export interface AreaOptions {
  markType: 'area';

  /** Name used for the area's marks and signals in the Vega spec. Defaults to `area0`, `area1`, and so on. */
  name?: string;
  /** Data field that splits the data into series, each with its own color. Defaults to `series`. */
  color?: string;
  /** Data field for each series' value; series stack from zero. Defaults to `value`. */
  metric?: string;
  /** Data field plotted along the x-axis. Defaults to `datetime`. */
  dimension?: string;
  /** Data field that sets the stack order; higher values stack on top. Defaults to data order. */
  order?: string;
  /** Fill opacity of the areas, from 0 to 1. Defaults to `0.8`. */
  opacity?: number;
  /** Space before the first and after the last x value: a ratio from 0 to 1 for `point` scales (default `0.5`), pixels for `time` and `linear` (default `0`). */
  padding?: number;
  /** Scale for `dimension`: `time`, `linear`, or `point`. Defaults to `time`. */
  scaleType?: ScaleType;

  // define area using start/end
  /** Data field for the bottom edge of a floating area; requires `metricEnd` and replaces `metric`. */
  metricStart?: string;
  /** Data field for the top edge of a floating area; requires `metricStart` and replaces `metric`. */
  metricEnd?: string;

  // children
  /** Popover that is shown when clicking the area */
  chartPopovers?: ChartPopoverOptions[];
  /** Inspect shown when hovering over the area */
  chartInspects?: ChartInspectOptions[];
}

type AreaOptionsWithDefaults =
  | 'chartInspects'
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
  interactiveMarkName?: string;
  index: number;
}
