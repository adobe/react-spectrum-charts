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

import { AnimationType } from '@spectrum-charts/core-s2/constants';

import { AxisOptions } from './axis/index.js';
import { LegendOptions } from './legendSpec.types.js';
import {
  AreaOptions,
  BarOptions,
  BigNumberOptions,
  BulletOptions,
  ComboOptions,
  DonutOptions,
  LineOptions,
  ScatterOptions,
  VennOptions,
} from './marks/index.js';
import { ChartSymbolShape, LineType, LineWidth, PartiallyRequired, SymbolSize } from './specUtil.types.js';
import { Colors } from './spectrumVizColor.types.js';
import { TitleOptions } from './titleSpec.types.js';

export type ColorScheme = 'light' | 'dark';
export type Height = number | `${number}%`;
export type HighlightedItem = string | number | (string | number)[];
export type TooltipAnchor = 'cursor' | 'mark';
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type Width = number | 'auto' | string;

export type ChartColors = Colors | Colors[];
export type LineTypes = LineType[] | LineType[][];
export type Opacities = number[] | number[][];
export type SymbolShapes = ChartSymbolShape[] | ChartSymbolShape[][];

export interface ChartHandle {
  copy: () => Promise<string>;
  download: (customFileName?: string) => Promise<string>;
  getBase64Png: () => Promise<string>;
  getSvg: () => Promise<string>;
}

export type SimpleData = Record<string, unknown>;

export type ChartData = SimpleData | Data;

export type MarkOptions =
  | AreaOptions
  | BarOptions
  | BigNumberOptions
  | BulletOptions
  | ComboOptions
  | DonutOptions
  | LineOptions
  | ScatterOptions
  | VennOptions;

// These are the vega spec specific types
// Notice that things like data and width/height are not included here
// This is intentional as we don't want to have to rebuild the entire spec anytime data updates or the width/height change
export interface ChartOptions {
  /** Set to `false` to turn off every animation, including hover and draw-in. Draw-in is skipped for users who prefer reduced motion. */
  animations?: boolean;
  /** Animations to play: `hover`, `drawIn`, or both. Defaults to `['hover', 'drawIn']`. */
  animationTypes?: AnimationType[];
  /** Background color of the chart, as a Spectrum color token or CSS color. Defaults to `transparent`. */
  backgroundColor?: string;
  /** Colors for series: a named palette, a list of Spectrum color tokens or CSS colors, or a list of lists when a mark's `color` uses two fields. Defaults to `s2Categorical20`. */
  colors?: ChartColors;
  /** Light or dark colors. Set it to match your app, since the chart doesn't read your app's theme. Defaults to `light`. */
  colorScheme?: ColorScheme;
  data?: ChartData[];
  /** Accessible name for the chart, read by screen readers. Describe what the chart shows. */
  description?: string;
  /** Shapes assigned to series when a mark's `symbolShape` uses a field. Defaults to `['rounded-square']`. */
  symbolShapes?: SymbolShapes;
  /** Smallest and largest symbol size when a mark's `size` uses a field. Defaults to `['XS', 'XL']`. */
  symbolSizes?: [SymbolSize, SymbolSize];
  /** Line types assigned to series when a mark's `lineType` uses a field. Defaults to `['solid', 'dashed', 'dotted', 'dotDash', 'longDash', 'twoDash']`. */
  lineTypes?: LineTypes;
  /** Line widths assigned to series when a mark's `lineWidth` uses a field. Defaults to `['M']`. */
  lineWidths?: LineWidth[];
  /** Opacities assigned to series when a mark's `opacity` uses a field. Defaults to `[1]`. */
  opacities?: Opacities;
  /** Title shown above the chart. A `Title` child replaces it. */
  title?: string;
  /** Vega spec to render instead of building one from children. Can't be combined with children. */
  UNSAFE_vegaSpec?: Spec;
  /** Names of series to hide. Defaults to `[]`. */
  hiddenSeries?: string[];
  /** ID or IDs of rows to highlight. Set `idKey` to a field with a unique value for each row. */
  highlightedItem?: HighlightedItem;
  /** Internal: set by `Chart` from `height`. Use `height` instead. */
  chartHeight?: number;
  /** Name of the series to highlight. */
  highlightedSeries?: string | number;
  /** Field with a unique ID for each row. Defaults to an ID the chart adds to each row. */
  idKey?: string;
  /** Internal: set by `Chart` from `width`. Use `width` instead. */
  chartWidth?: number;
  /** Experimental keyboard navigation. Only basic bar charts are supported. Defaults to `false`. */
  accessibleNavigation?: boolean;

  // children
  marks: MarkOptions[];
  axes?: AxisOptions[];
  legends?: LegendOptions[];
  titles?: TitleOptions[];
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
