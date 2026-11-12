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
import { Data, Spec } from 'vega';

import { ChartOptions as BaseChartOptions, SimpleData } from '@spectrum-charts/core-s2/options';

import { PartiallyRequired } from './specUtil.types.js';

export type {
  ChartColors,
  ChartHandle,
  ColorScheme,
  Height,
  HighlightedItem,
  LineTypes,
  MarkOptions,
  Opacities,
  SimpleData,
  SymbolShapes,
  TooltipAnchor,
  TooltipPlacement,
  Width,
} from '@spectrum-charts/core-s2/options';
export type { BaseChartOptions };

export type ChartData = SimpleData | Data;

/** Vega engine chart options: the shared chart contract plus Vega-only escape hatches. */
export interface ChartOptions extends BaseChartOptions<ChartData> {
  UNSAFE_vegaSpec?: Spec;
}

type ChartOptionsWithDefaults =
  | 'axes'
  | 'backgroundColor'
  | 'colors'
  | 'colorScheme'
  | 'hiddenSeries'
  | 'idKey'
  | 'legends'
  | 'lineTypes'
  | 'lineWidths'
  | 'marks'
  | 'symbolShapes'
  | 'symbolSizes'
  | 'titles';

export interface ChartSpecOptions extends PartiallyRequired<ChartOptions, ChartOptionsWithDefaults> {}
