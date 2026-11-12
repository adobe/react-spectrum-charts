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
import { InteractionMode, InterpolationType, LineOptions } from '@spectrum-charts/core-s2/options';

import { ChartData, ColorScheme, HighlightedItem } from '../chartSpec.types.js';
import { FacetRef, LineWidth, PartiallyRequired } from '../specUtil.types.js';

export type { InteractionMode, InterpolationType, LineCap, LineOptions } from '@spectrum-charts/core-s2/options';

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
