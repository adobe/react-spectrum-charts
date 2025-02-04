/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Align, Baseline, NumberValue, ScaleType } from 'vega';

import {
	AreaOptions,
	AxisAnnotationOptions,
	AxisOptions,
	BarAnnotationOptions,
	BarOptions,
	ChartOptions,
	ChartPopoverOptions,
	ChartTooltipOptions,
	ColorFacet,
	ColorScheme,
	DonutOptions,
	DonutSummaryOptions,
	FacetRef,
	HighlightedItem,
	InteractionMode,
	LegendOptions,
	LineOptions,
	LineWidth,
	MetricRangeOptions,
	Orientation,
	ReferenceLineOptions,
	ScaleType as RscScaleType,
	ScatterOptions,
	ScatterPathOptions,
	SegmentLabelOptions,
	TrendlineAnnotationOptions,
	TrendlineOptions,
} from '.';

type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

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

type AreaOptionsWithDefaults =
	| 'chartTooltips'
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
	index: number;
}

type AxisOptionsWithDefaults =
	| 'axisAnnotations'
	| 'baseline'
	| 'baselineOffset'
	| 'granularity'
	| 'grid'
	| 'hideDefaultLabels'
	| 'labelAlign'
	| 'labelFontWeight'
	| 'labelOrientation'
	| 'labels'
	| 'numberFormat'
	| 'referenceLines'
	| 'subLabels'
	| 'ticks';

export interface AxisSpecOptions extends PartiallyRequired<AxisOptions, AxisOptionsWithDefaults> {
	name: string;
	colorScheme: ColorScheme;
	index: number;
	scaleType: ScaleType;
	vegaLabelAlign?: Align;
	vegaLabelBaseline?: Baseline;
	vegaLabelOffset?: NumberValue;
	vegaLabelPadding?: number;
}

type AxisAnnotationOptionsWithDefaults =
	| 'chartPopovers'
	| 'chartTooltips'
	| 'color'
	| 'dataKey'
	| 'format'
	| 'name'
	| 'offset'
	| 'options';

export interface AxisAnnotationSpecOptions
	extends PartiallyRequired<AxisAnnotationOptions, AxisAnnotationOptionsWithDefaults> {
	axisName: string;
	colorScheme: ColorScheme;
}

type BarOptionsWithDefaults =
	| 'barAnnotations'
	| 'color'
	| 'chartPopovers'
	| 'chartTooltips'
	| 'dimension'
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
	colorScheme: ColorScheme;
	dimensionScaleType: 'band';
	highlightedItem?: HighlightedItem;
	idKey: string;
	index: number;
	interactiveMarkName: string | undefined;
}

type BarAnnotationOptionsWithDefaults = 'textKey';

export interface BarAnnotationSpecOptions
	extends PartiallyRequired<BarAnnotationOptions, BarAnnotationOptionsWithDefaults> {
	barOptions: BarSpecOptions;
	dataName: string;
	dimensionField: string;
	dimensionScaleName: string;
}

type ChartTooltipOptionsWithDefaults = 'highlightBy';

export interface ChartTooltipSpecOptions
	extends PartiallyRequired<ChartTooltipOptions, ChartTooltipOptionsWithDefaults> {
	markName: string;
}

type ChartPopoverOptionsWithDefaults = 'UNSAFE_highlightBy';

export interface ChartPopoverSpecOptions
	extends PartiallyRequired<ChartPopoverOptions, ChartPopoverOptionsWithDefaults> {
	markName: string;
}

type DonutOptionsWithDefaults =
	| 'chartPopovers'
	| 'chartTooltips'
	| 'color'
	| 'donutSummaries'
	| 'holeRatio'
	| 'isBoolean'
	| 'metric'
	| 'name'
	| 'segmentLabels'
	| 'startAngle';

export interface DonutSpecOptions extends PartiallyRequired<DonutOptions, DonutOptionsWithDefaults> {
	colorScheme: ColorScheme;
	highlightedItem?: HighlightedItem;
	idKey: string;
	index: number;
	markType: 'donut';
}

type DonutSummaryOptionsWithDefaults = 'numberFormat';

export interface DonutSummarySpecOptions
	extends PartiallyRequired<DonutSummaryOptions, DonutSummaryOptionsWithDefaults> {
	donutOptions: DonutSpecOptions;
}

type SegmentLabelOptionsWithDefaults = 'percent' | 'value' | 'valueFormat';

export interface SegmentLabelSpecOptions
	extends PartiallyRequired<SegmentLabelOptions, SegmentLabelOptionsWithDefaults> {
	donutOptions: DonutSpecOptions;
}

type LegendOptionsWithDefaults =
	| 'hasMouseInteraction'
	| 'hasOnClick'
	| 'hiddenEntries'
	| 'highlight'
	| 'isToggleable'
	| 'position'
	| 'name';

export interface LegendSpecOptions extends PartiallyRequired<LegendOptions, LegendOptionsWithDefaults> {
	color?: FacetRef<string>;
	colorScheme: ColorScheme;
	hiddenSeries: string[];
	highlightedSeries?: string | number;
	index: number;
	lineType?: FacetRef<number[]>;
	lineWidth?: FacetRef<number>;
	symbolShape?: FacetRef<string>;
}

type LineOptionsWithDefaults =
	| 'chartPopovers'
	| 'chartTooltips'
	| 'color'
	| 'dimension'
	| 'hasOnClick'
	| 'lineType'
	| 'metric'
	| 'metricRanges'
	| 'name'
	| 'opacity'
	| 'scaleType'
	| 'trendlines';

export interface LineSpecOptions extends PartiallyRequired<LineOptions, LineOptionsWithDefaults> {
	colorScheme: ColorScheme;
	highlightedItem?: HighlightedItem;
	idKey: string;
	index: number;
	interactiveMarkName: string | undefined;
	isHighlightedByGroup?: boolean;
	lineWidth?: FacetRef<LineWidth>;
	popoverMarkName: string | undefined;
	interactionMode?: InteractionMode;
}

type ScatterOptionsWithDefaults =
	| 'chartPopovers'
	| 'chartTooltips'
	| 'color'
	| 'colorScaleType'
	| 'dimension'
	| 'dimensionScaleType'
	| 'lineType'
	| 'lineWidth'
	| 'metric'
	| 'name'
	| 'opacity'
	| 'size'
	| 'scatterPaths'
	| 'trendlines';

export interface ScatterSpecOptions extends PartiallyRequired<ScatterOptions, ScatterOptionsWithDefaults> {
	colorScheme: ColorScheme;
	highlightedItem?: HighlightedItem;
	idKey: string;
	index: number;
	interactiveMarkName: string | undefined;
}

type ScatterPathOptionsWithDefaults = 'color' | 'groupBy' | 'pathWidth' | 'opacity';

export interface ScatterPathSpecOptions extends PartiallyRequired<ScatterPathOptions, ScatterPathOptionsWithDefaults> {
	colorScheme: ColorScheme;
	dimension: string;
	dimensionScaleType: RscScaleType;
	metric: string;
	index: number;
	name: string;
}

type MetricRangeOptionsWithDefaults =
	| 'chartTooltips'
	| 'lineType'
	| 'lineWidth'
	| 'metric'
	| 'metricEnd'
	| 'metricStart'
	| 'rangeOpacity';

export interface MetricRangeSpecOptions extends PartiallyRequired<MetricRangeOptions, MetricRangeOptionsWithDefaults> {
	name: string;
}

type TrendlineOptionsWithDefaults =
	| 'chartTooltips'
	| 'dimensionExtent'
	| 'dimensionRange'
	| 'displayOnHover'
	| 'highlightRawPoint'
	| 'lineType'
	| 'lineWidth'
	| 'method'
	| 'opacity'
	| 'orientation'
	| 'trendlineAnnotations';

export interface TrendlineSpecOptions extends PartiallyRequired<TrendlineOptions, TrendlineOptionsWithDefaults> {
	colorScheme: ColorScheme;
	dimensionScaleType: RscScaleType;
	isDimensionNormalized: boolean;
	metric: string;
	name: string;
	trendlineColor: ColorFacet;
	trendlineDimension: string;
	trendlineMetric: string;
}

type TrendlineAnnotationOptionsWithDefaults = 'badge' | 'dimensionValue' | 'numberFormat' | 'prefix';

export interface TrendlineAnnotationSpecOptions
	extends PartiallyRequired<TrendlineAnnotationOptions, TrendlineAnnotationOptionsWithDefaults> {
	colorScheme: ColorScheme;
	displayOnHover: boolean;
	markName: string;
	name: string;
	trendlineColor: ColorFacet;
	trendlineDimension: string;
	trendlineDimensionExtent: TrendlineSpecOptions['dimensionExtent'];
	trendlineDimensionScaleType: RscScaleType;
	trendlineName: string;
	trendlineOrientation: Orientation;
	trendlineWidth: number;
}

type ReferenceLineOptionsWithDefaults = 'color' | 'iconColor' | 'labelColor' | 'layer' | 'labelFontWeight';

export interface ReferenceLineSpecOptions
	extends PartiallyRequired<ReferenceLineOptions, ReferenceLineOptionsWithDefaults> {
	colorScheme: ColorScheme;
	name: string;
}
