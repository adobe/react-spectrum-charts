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
import { JSXElementConstructor, MutableRefObject, ReactElement } from 'react';

import { Config, Data, Locale, NumberLocale, Padding, Spec, TimeLocale, View } from 'vega';

import { Theme } from '@react-types/provider';

import { Colors } from './SpectrumVizColor.types';
import { AxisElement, AxisOptions } from './axis/axis.types';
import { ChartPopoverElement, ChartTooltipElement } from './dialogs';
import { LegendElement, LegendOptions } from './legend.types';
import { LocaleCode, NumberLocaleCode, TimeLocaleCode } from './locale.types';
import {
	BarAnnotationElement,
	DonutElement,
	DonutOptions,
	DonutSummaryElement,
	MetricRangeElement,
	ScatterPathElement,
	SegmentLabelElement,
	TrendlineElement,
} from './marks';
import { AreaElement, AreaOptions } from './marks/area.types';
import { BarElement, BarOptions } from './marks/bar.types';
import { BigNumberElement, BigNumberOptions } from './marks/bigNumber.types';
import { ComboElement, ComboOptions } from './marks/combo.types';
import { LineElement, LineOptions } from './marks/line.types';
import { ScatterElement, ScatterOptions } from './marks/scatter.types';
import { TitleElement, TitleOptions } from './title.types';
import { ChartSymbolShape, Children, LineType, LineWidth, PartiallyRequired, SymbolSize } from './util.types';

export type SimpleData = Record<string, unknown>;

export type ColorScheme = 'light' | 'dark';
export type ChartData = SimpleData | Data;
export type Height = number | `${number}%`;
export type HighlightedItem = string | number | (string | number)[];
export type TooltipAnchor = 'cursor' | 'mark';
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type Width = number | string | 'auto';

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

export type MarkOptions =
	| AreaOptions
	| BarOptions
	| BigNumberOptions
	| ComboOptions
	| DonutOptions
	| LineOptions
	| ScatterOptions;

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
	/** Series name to highlight on the chart (controlled). */
	highlightedSeries?: string | number;
	/** Data key that contains a unique ID for each data point in the array. */
	idKey?: string;

	// children
	marks: MarkOptions[];
	axes?: AxisOptions[];
	legends?: LegendOptions[];
	titles?: TitleOptions[];
}

export type ChartChildElement =
	| AreaElement
	| AxisElement
	| BarElement
	| BigNumberElement
	| DonutElement
	| ComboElement
	| LegendElement
	| LineElement
	| ScatterElement
	| TitleElement;
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
	chartId: MutableRefObject<string>;
	chartView: MutableRefObject<View | undefined>;
	chartWidth: number;
	chartHeight: number;
	popoverIsOpen?: boolean;
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
