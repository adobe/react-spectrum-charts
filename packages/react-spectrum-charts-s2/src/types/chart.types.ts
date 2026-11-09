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
import { JSXElementConstructor, ReactElement } from 'react';

import { Config, Locale, NumberLocale, Padding, TimeLocale, View } from 'vega';

import { LocaleCode, NumberLocaleCode, TimeLocaleCode } from '@spectrum-charts/core-s2/locales';
import {
  ChartData,
  ChartOptions,
  Height,
  PartiallyRequired,
  TooltipAnchor,
  TooltipPlacement,
  Width,
} from '@spectrum-charts/vega-spec-builder-s2';

import { AxisElement } from './axis/index.js';
import { ChartInspectElement, ChartPopoverElement } from './dialogs/index.js';
import { LegendElement } from './legend.types.js';
import {
  AreaElement,
  BarAnnotationElement,
  BarElement,
  BulletElement,
  ComboElement,
  DonutElement,
  DonutSummaryElement,
  LineElement,
} from './marks/index.js';
import { ScatterElement } from './marks/scatter.types.js';
import { TitleElement } from './title.types.js';
import { Children } from './util.types.js';

export type ChartChildElement =
  | AreaElement
  | AxisElement
  | BarElement
  | BulletElement
  | ComboElement
  | DonutElement
  | LegendElement
  | LineElement
  | ScatterElement
  | TitleElement;
export type MarkChildElement = BarAnnotationElement | ChartInspectElement | ChartPopoverElement | DonutSummaryElement;

export interface SharedChartProps extends Omit<ChartOptions, 'axes' | 'legends' | 'marks' | 'titles'> {
  // children is optional because it is a pain to make this required with how children get defined in stories
  // we have a check at the beginning of Chart to make sure this isn't undefined
  // if it is undefined, we log an error and render nothing
  children?: Children<ChartChildElement>;
  /** Vega config for low-level style overrides. @see https://vega.github.io/vega/docs/config/ */
  config?: Config;
  /** Rows of data to chart. */
  data: ChartData[];
  /** Logs the generated Vega spec and inspected rows to the console. Defaults to `false`. */
  debug?: boolean;
  /** Number and time locales for formatting, as a locale code, separate number and time locales, or a Vega locale. Defaults to `en-US`. */
  locale?: Locale | LocaleCode | { number?: NumberLocaleCode | NumberLocale; time?: TimeLocaleCode | TimeLocale };
  /** Space around the chart contents in pixels, as one number or per side. Defaults to `0`. */
  padding?: Padding;
  /** Called with the Vega view each time the chart creates one, such as after data or props change. */
  onVegaViewReady?: (view: View) => void;
  /** Draws the chart as `svg` or `canvas`. `canvas` is faster for large data sets but exposes less to screen readers. Defaults to `svg`. */
  renderer?: 'svg' | 'canvas';
  /** Whether `ChartInspect` content follows the cursor or anchors to the hovered mark. Defaults to `cursor`. */
  tooltipAnchor?: TooltipAnchor;
  /** Where `ChartInspect` content sits relative to the mark when `tooltipAnchor` is `mark`. Defaults to `top`. */
  tooltipPlacement?: TooltipPlacement;
}

type RscChartPropsWithDefaults =
  | 'backgroundColor'
  | 'colors'
  | 'colorScheme'
  | 'debug'
  | 'hiddenSeries'
  | 'idKey'
  | 'lineTypes'
  | 'lineWidths'
  | 'locale'
  | 'padding'
  | 'renderer'
  | 'tooltipAnchor'
  | 'tooltipPlacement';

export interface RscChartProps extends PartiallyRequired<SharedChartProps, RscChartPropsWithDefaults> {
  chartWidth: number;
  chartHeight: number;
}

type SpecPropsWithDefaults =
  | 'backgroundColor'
  | 'colors'
  | 'colorScheme'
  | 'hiddenSeries'
  | 'idKey'
  | 'lineTypes'
  | 'lineWidths'
  | 'symbolShapes'
  | 'symbolSizes';

export interface SanitizedSpecProps
  extends PartiallyRequired<Omit<ChartOptions, 'axes' | 'legends' | 'marks' | 'titles'>, SpecPropsWithDefaults> {
  /** Children with all non-RSC components removed */
  children: ChartChildElement[];
  data?: ChartData[];
}

export interface ChartProps extends SharedChartProps {
  /** Value for the chart container's `data-testid` attribute. */
  dataTestId?: string;
  /** Text to display when the data set is empty and loading is complete. Defaults to `No data found`. */
  emptyStateText?: string;
  /** Shows a loading spinner in place of the chart. Defaults to `false`. */
  loading?: boolean;
  /** Maximum chart width in pixels when `width` is `auto` or a percentage. */
  maxWidth?: number;
  /** Minimum chart width in pixels when `width` is `auto` or a percentage. Defaults to `100`. */
  minWidth?: number;
  /** Chart height in pixels, or a percentage of the container height. Defaults to `300`. */
  height?: Height;
  /** Maximum chart height in pixels when `height` is a percentage. */
  maxHeight?: number;
  /** Minimum chart height in pixels when `height` is a percentage. Defaults to `100`. */
  minHeight?: number;
  /** Chart width in pixels, `auto` to fill the container, or a percentage of the container width. Defaults to `auto`. */
  width?: Width;
}

export type ChartElement = ReactElement<ChartProps, JSXElementConstructor<ChartProps>>;

/**
 * @deprecated
 */
export interface MarkProps {
  name?: string;
  children?: Children<MarkChildElement>;
  color?: string;
  metric?: string;
}
