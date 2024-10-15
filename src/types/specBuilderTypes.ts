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
	AnnotationProps,
	AreaProps,
	AxisAnnotationChildElement,
	AxisAnnotationProps,
	AxisProps,
	BarProps,
	ChartPopoverProps,
	ChartTooltipProps,
	ColorFacet,
	ColorScheme,
	DonutProps,
	DonutSummaryProps,
	FacetRef,
	InteractionMode,
	LegendProps,
	LineProps,
	LineWidth,
	MarkChildElement,
	MetricRangeProps,
	Orientation,
	ScaleType as RscScaleType,
	ScatterPathProps,
	ScatterProps,
	SegmentLabelProps,
	TrendlineAnnotationProps,
	TrendlineChildElement,
	TrendlineProps,
} from './Chart';

type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

type AreaPropsWithDefaults = 'name' | 'dimension' | 'metric' | 'color' | 'scaleType' | 'opacity';

export interface AreaSpecProps
	extends PartiallyRequired<AreaProps & { colorScheme: ColorScheme; index: number }, AreaPropsWithDefaults> {
	children: MarkChildElement[];
	markType: 'area';
}

type AxisPropsWithDefaults =
	| 'baseline'
	| 'baselineOffset'
	| 'colorScheme'
	| 'granularity'
	| 'grid'
	| 'hideDefaultLabels'
	| 'labelAlign'
	| 'labelFontWeight'
	| 'labelOrientation'
	| 'labels'
	| 'numberFormat'
	| 'subLabels'
	| 'ticks';

/**
 * these are props that are used interally to control the axis spec
 */
export interface InternalAxisProps {
	vegaLabelAlign?: Align;
	vegaLabelBaseline?: Baseline;
	vegaLabelOffset?: NumberValue;
	vegaLabelPadding?: number;
}

export type AxisSpecProps = PartiallyRequired<
	AxisProps & { name: string; colorScheme: ColorScheme; index: number; scaleType: ScaleType } & InternalAxisProps,
	AxisPropsWithDefaults
>;

type AxisAnnotationPropsWithDefaults = 'name' | 'offset' | 'dataKey' | 'color' | 'options' | 'format';

export interface AxisAnnotationSpecProps
	extends PartiallyRequired<
		AxisAnnotationProps & { axisName: string; colorScheme: ColorScheme },
		AxisAnnotationPropsWithDefaults
	> {
	children: AxisAnnotationChildElement[];
}

type BarPropsWithDefaults =
	| 'color'
	| 'dimension'
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
	| 'type';

export interface BarSpecProps
	extends PartiallyRequired<BarProps & { colorScheme: ColorScheme; index: number }, BarPropsWithDefaults> {
	markType: 'bar';
	children: MarkChildElement[];
	interactiveMarkName: string | undefined;
	dimensionScaleType: 'band';
}

type AnnotationPropsWithDefaults = 'textKey';

export interface AnnotationSpecProps extends PartiallyRequired<AnnotationProps, AnnotationPropsWithDefaults> {
	barProps: BarSpecProps;
	dataName: string;
	dimensionField: string;
	dimensionScaleName: string;
}

type ChartTooltipPropsWithDefaults = 'highlightBy';

export interface ChartTooltipSpecProps extends PartiallyRequired<ChartTooltipProps, ChartTooltipPropsWithDefaults> {
	markName: string;
}

type ChartPopoverPropsWithDefaults = 'UNSAFE_highlightBy';

export interface ChartPopoverSpecProps extends PartiallyRequired<ChartPopoverProps, ChartPopoverPropsWithDefaults> {
	markName: string;
}

type DonutPropsWithDefaults = 'color' | 'metric' | 'name' | 'startAngle' | 'holeRatio' | 'isBoolean';

export interface DonutSpecProps
	extends PartiallyRequired<DonutProps & { colorScheme: ColorScheme; index: number }, DonutPropsWithDefaults> {
	children: MarkChildElement[];
	markType: 'donut';
}

type DonutSummaryPropsWithDefaults = 'numberFormat';

export interface DonutSummarySpecProps extends PartiallyRequired<DonutSummaryProps, DonutSummaryPropsWithDefaults> {
	donutProps: DonutSpecProps;
}

type SegmentLabelPropsWithDefaults = 'percent' | 'value' | 'valueFormat';

export interface SegmentLabelSpecProps extends PartiallyRequired<SegmentLabelProps, SegmentLabelPropsWithDefaults> {
	donutProps: DonutSpecProps;
}

type LegendPropsWithDefaults = 'hiddenEntries' | 'highlight' | 'isToggleable' | 'position' | 'name';

export interface LegendSpecProps
	extends PartiallyRequired<
		LegendProps & { colorScheme: ColorScheme; index: number; hiddenSeries: string[]; highlightedSeries?: string },
		LegendPropsWithDefaults
	> {
	color?: FacetRef<string>;
	lineType?: FacetRef<number[]>;
	lineWidth?: FacetRef<number>;
	symbolShape?: FacetRef<string>;
}

type LinePropsWithDefaults = 'name' | 'dimension' | 'metric' | 'color' | 'scaleType' | 'lineType' | 'opacity';

export interface LineSpecProps extends PartiallyRequired<LineProps, LinePropsWithDefaults> {
	children: MarkChildElement[];
	colorScheme: ColorScheme;
	index: number;
	interactiveMarkName: string | undefined;
	isHighlightedByGroup?: boolean;
	lineWidth?: FacetRef<LineWidth>;
	markType: 'line';
	popoverMarkName: string | undefined;
	interactionMode?: InteractionMode;
}

type ScatterPropsWithDefaults =
	| 'color'
	| 'colorScaleType'
	| 'dimension'
	| 'dimensionScaleType'
	| 'lineType'
	| 'lineWidth'
	| 'metric'
	| 'name'
	| 'opacity'
	| 'size';

export interface ScatterSpecProps extends PartiallyRequired<ScatterProps, ScatterPropsWithDefaults> {
	children: MarkChildElement[];
	colorScheme: ColorScheme;
	index: number;
	interactiveMarkName: string | undefined;
	markType: 'scatter';
}

type ScatterPathPropsWithDefaults = 'color' | 'groupBy' | 'pathWidth' | 'opacity';

export interface ScatterPathSpecProps extends PartiallyRequired<ScatterPathProps, ScatterPathPropsWithDefaults> {
	colorScheme: ColorScheme;
	dimension: string;
	dimensionScaleType: RscScaleType;
	metric: string;
	index: number;
	name: string;
}

type MetricRangePropsWithDefaults = 'lineType' | 'lineWidth' | 'rangeOpacity' | 'metricEnd' | 'metricStart' | 'metric';
export interface MetricRangeSpecProps
	extends PartiallyRequired<MetricRangeProps & { name: string }, MetricRangePropsWithDefaults> {}

type TrendlinePropsWithDefaults =
	| 'dimensionExtent'
	| 'dimensionRange'
	| 'displayOnHover'
	| 'highlightRawPoint'
	| 'lineType'
	| 'lineWidth'
	| 'method'
	| 'metric'
	| 'opacity'
	| 'orientation';

export interface TrendlineSpecProps
	extends PartiallyRequired<TrendlineProps & { metric?: string }, TrendlinePropsWithDefaults> {
	children: TrendlineChildElement[];
	colorScheme: ColorScheme;
	dimensionScaleType: RscScaleType;
	isDimensionNormalized: boolean;
	name: string;
	trendlineColor: ColorFacet;
	trendlineDimension: string;
	trendlineMetric: string;
}

type TrendlineAnnotationPropsWithDefaults = 'badge' | 'dimensionValue' | 'numberFormat' | 'prefix';

export interface TrendlineAnnotationSpecProps
	extends PartiallyRequired<TrendlineAnnotationProps, TrendlineAnnotationPropsWithDefaults> {
	colorScheme: ColorScheme;
	displayOnHover: boolean;
	markName: string;
	name: string;
	trendlineColor: ColorFacet;
	trendlineDimension: string;
	trendlineDimensionExtent: TrendlineSpecProps['dimensionExtent'];
	trendlineDimensionScaleType: RscScaleType;
	trendlineName: string;
	trendlineOrientation: Orientation;
	trendlineWidth: number;
}
