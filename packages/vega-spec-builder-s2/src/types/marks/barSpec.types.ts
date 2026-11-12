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
import { BarOptions } from '@spectrum-charts/core-s2/options';

import { ColorScheme, HighlightedItem } from '../chartSpec.types.js';
import { PartiallyRequired } from '../specUtil.types.js';

export type { BarOptions, BarType, DualFacet } from '@spectrum-charts/core-s2/options';

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
