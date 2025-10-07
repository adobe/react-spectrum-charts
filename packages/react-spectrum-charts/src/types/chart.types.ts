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
import { JSXElementConstructor, ReactElement } from 'react';

import { Config, Locale, NumberLocale, Padding, TimeLocale } from 'vega';

import { Theme } from '@react-types/provider';
import { LocaleCode, NumberLocaleCode, TimeLocaleCode } from '@spectrum-charts/locales';
import {
  ChartData,
  ChartOptions,
  Height,
  PartiallyRequired,
  TooltipAnchor,
  TooltipPlacement,
  Width,
} from '@spectrum-charts/vega-spec-builder';

import { AxisElement } from './axis';
import { ChartPopoverElement, ChartTooltipElement } from './dialogs';
import { LegendElement } from './legend.types';
import {
  AreaElement,
  BarAnnotationElement,
  BarElement,
  BigNumberElement,
  ComboElement,
  DonutElement,
  DonutSummaryElement,
  GaugeElement,
  LineElement,
  MetricRangeElement,
  ScatterElement,
  ScatterPathElement,
  SegmentLabelElement,
  TrendlineElement,
  VennElement,
} from './marks';
import { TitleElement } from './title.types';
import { Children } from './util.types';

export type ChartChildElement =
  | AreaElement
  | AxisElement
  | BarElement
  | BigNumberElement
  | DonutElement
  | ComboElement
  | GaugeElement
  | LegendElement
  | LineElement
  | ScatterElement
  | TitleElement
  | VennElement;
export type MarkChildElement =
  | BarAnnotationElement
  | ChartPopoverElement
  | ChartTooltipElement
  | DonutSummaryElement
  | MetricRangeElement
  | ScatterPathElement
  | SegmentLabelElement
  | TrendlineElement;

export interface SharedChartProps extends Omit<ChartOptions, 'axes' | 'legends' | 'marks' | 'titles'> {
  // children is optional because it is a pain to make this required with how children get defined in stories
  // we have a check at the beginning of Chart to make sure this isn't undefined
  // if it is undefined, we log an error and render a fragment
  children?: Children<ChartChildElement>;
  /** Vega config that can be used to tweak the style of the chart. @see https://vega.github.io/vega/docs/config/ */
  config?: Config;
  /** Chart data array. */
  data: ChartData[];
  /** Enables debug mode which will console log things like the generated vega spec and the datums for tooltips. */
  debug?: boolean;
  /** Number and time locales to use */
  locale?: Locale | LocaleCode | { number?: NumberLocaleCode | NumberLocale; time?: TimeLocaleCode | TimeLocale };
  /** Chart padding */
  padding?: Padding;
  /** Method to use for rendering the chart. 'canvas' is ideal for large data sets. */
  renderer?: 'svg' | 'canvas';
  /** Sets what the tooltip should be anchored to. Defaults to `cursor`. */
  tooltipAnchor?: TooltipAnchor;
  /** The placement of the tooltip with respect to the mark. Only applicable if `tooltipAnchor = 'mark'`. */
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
  /** Test id */
  dataTestId?: string;
  /** Optional text to display when the data set is empty and loading is complete. */
  emptyStateText?: string;
  /** Loading state. If true, a spinner will render in place of the chart. */
  loading?: boolean;
  /** Maximum chart width */
  maxWidth?: number;
  /** Minimum chart width. */
  minWidth?: number;
  /** Chart height */
  height?: Height;
  /** Maximum height of the chart */
  maxHeight?: number;
  /** Minimum height of the chart */
  minHeight?: number;
  /** react-spectrum theme. This sets the react-spectrum theming on tooltips and popovers. */
  theme?: Theme;
  /** Chart width */
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
