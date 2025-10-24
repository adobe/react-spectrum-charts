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
import { Data, Spec } from 'vega';

import { AxisOptions } from './axis';
import { LegendOptions } from './legendSpec.types';
import {
  AreaOptions,
  BarOptions,
  BigNumberOptions,
  BulletOptions,
  ComboOptions,
  DonutOptions,
  GaugeOptions,
  LineOptions,
  ScatterOptions,
  VennOptions,
} from './marks';
import { ChartSymbolShape, LineType, LineWidth, PartiallyRequired, SymbolSize } from './specUtil.types';
import { Colors } from './spectrumVizColor.types';
import { TitleOptions } from './titleSpec.types';

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
  | GaugeOptions
  | LineOptions
  | ScatterOptions
  | VennOptions;

// These are the vega spec specific types
// Notice that things like data and width/height are not included here
// This is intentional as we don't want to have to rebuild the entire spec anytime data updates or the width/height change
export interface ChartOptions {
  /** Background color of the chart. */
  backgroundColor?: string;
  /** Color scale. Defaults to the `categorical16' color scale. */
  colors?: ChartColors;
  /** react-spectrum color scheme. @see https://react-spectrum.adobe.com/react-spectrum/Provider.html#props */
  colorScheme?: ColorScheme;
  data?: ChartData[];
  /** Chart description. Sets the aria-label attribute for the chart container. @see https://vega.github.io/vega/docs/specification/ */
  description?: string;
  /** Symbol shape scale. */
  symbolShapes?: SymbolShapes;
  /** Symbol size scale. Values define the min and max size in that order. */
  symbolSizes?: [SymbolSize, SymbolSize];
  /** Line type scale. */
  lineTypes?: LineTypes;
  /** Line width scale. */
  lineWidths?: LineWidth[];
  /** Opacity scale*/
  opacities?: Opacities;
  /** Chart title. If the `Title` component is provided as a child, the component will override this prop. */
  title?: string;
  /** Vega spec to be used instead of generating one using the component API. */
  UNSAFE_vegaSpec?: Spec;
  /** Series names to hide from the chart (controlled). */
  hiddenSeries?: string[];
  /** Data item id or ids that should be highlighted on the chart (controlled). Be sure to supply an `idKey` where each data point has a unique ID if you are using controlled highlighting of items. */
  highlightedItem?: HighlightedItem;
  /** height of chart*/
  chartHeight?: number;
  /** Series name to highlight on the chart (controlled). */
  highlightedSeries?: string | number;
  /** Data key that contains a unique ID for each data point in the array. */
  idKey?: string;
  /** Width of chart */
  chartWidth?: number;

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
