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
import { ChartInspectOptions } from '../dialogs/chartInspectSpec.types.js';
import { ChartPopoverOptions } from '../dialogs/chartPopoverSpec.types.js';
import { PartiallyRequired } from '../specUtil.types.js';
import { DonutSummaryOptions } from './supplemental/donutSummarySpec.types.js';
import { SegmentLabelOptions } from './supplemental/segmentLabelSpec.types.js';

export interface DonutOptions {
  markType: 'donut';

  /** Key in the data that is used as the color facet */
  color?: string;
  /** Inner radius as a share of the outer radius. `0` draws a pie. Defaults to `0.85`. */
  holeRatio?: number;
  /** Shows the first row's value as a percent in the center. Use with two rows whose values sum to 1. */
  isBoolean?: boolean;
  /** Key in the data that is used as the metric */
  metric?: string;
  /** Sets the name of the component. */
  name?: string;
  /** Categorical segment ordering. Use `data` to preserve source order; boolean donuts always preserve source order. */
  sortOrder?: 'valueDescending' | 'data';
  /**
   * Designates which segments (by their `color` facet value) render with full categorical color.
   * Remaining segments render as a solid color swap to gray at full opacity. Their
   * labels stay fully visible and normally colored, unlike Line's `primarySeries` which suppresses
   * non-primary direct labels entirely.
   */
  emphasizedItems?: (string | number)[];
  /** Hides labels for segments not in `emphasizedItems`. */
  hideDeemphasizedLabels?: boolean;
  /**
   * Renders a top-half arc instead of a full circle. Data is automatically sorted
   * descending by `metric` so the largest segment always renders leftmost. `segmentLabels` are not
   * supported and are silently omitted when set to `'semicircle'`.
   */
  variant?: 'circle' | 'semicircle';

  // children
  chartPopovers?: ChartPopoverOptions[];
  chartInspects?: ChartInspectOptions[];
  donutSummaries?: DonutSummaryOptions[];
  segmentLabels?: SegmentLabelOptions[];
}

type DonutOptionsWithDefaults =
  | 'chartPopovers'
  | 'chartInspects'
  | 'color'
  | 'donutSummaries'
  | 'holeRatio'
  | 'isBoolean'
  | 'metric'
  | 'name'
  | 'segmentLabels'
  | 'sortOrder'
  | 'variant';

export interface DonutSpecOptions extends PartiallyRequired<DonutOptions, DonutOptionsWithDefaults> {
  colorScheme: ColorScheme;
  highlightedItem?: HighlightedItem;
  highlightedSeries?: string | number;
  idKey: string;
  index: number;
  isDrawInAnimate?: boolean;
  isHoverAnimate?: boolean;
  segmentIds?: number[];
  legendHighlightSignals?: string[];
  markType: 'donut';
}
