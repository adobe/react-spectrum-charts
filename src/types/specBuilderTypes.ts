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
	Animation,
	AreaProps,
	AxisAnnotationChildElement,
	AxisAnnotationProps,
	AxisProps,
	BarProps,
	ChartTooltipElement,
	ColorScheme,
	FacetRef,
	LegendProps,
	LineProps,
	LineWidth,
	MarkChildElement,
	MetricRangeProps,
	TrendlineProps,
} from './Chart';

export type PickRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type PartiallyRequired<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;

type AreaPropsWithDefaults = 'name' | 'dimension' | 'metric' | 'color' | 'scaleType' | 'opacity';

export interface AreaSpecProps
	extends PickRequired<AreaProps & { colorScheme: ColorScheme; index: number }, AreaPropsWithDefaults> {
	children: MarkChildElement[];
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

export type AxisSpecProps = PickRequired<
	AxisProps & { name: string; colorScheme: ColorScheme; index: number; scaleType: ScaleType } & InternalAxisProps,
	AxisPropsWithDefaults
>;

type AxisAnnotationPropsWithDefaults = 'name' | 'offset' | 'dataKey' | 'color' | 'options' | 'format';

export interface AxisAnnotationSpecProps
	extends PickRequired<
		AxisAnnotationProps & { axisName: string; colorScheme: ColorScheme },
		AxisAnnotationPropsWithDefaults
	> {
	children: AxisAnnotationChildElement[];
}

type BarPropsWithDefaults =
	| 'color'
	| 'dimension'
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
	extends PickRequired<BarProps & { colorScheme: ColorScheme; index: number }, BarPropsWithDefaults> {
	children: MarkChildElement[];
}

type LegendPropsWithDefaults = 'hiddenEntries' | 'highlight' | 'isToggleable' | 'position' | 'name';

export interface LegendSpecProps
	extends PickRequired<
		LegendProps & { colorScheme: ColorScheme; index: number; hiddenSeries: string[]; highlightedSeries?: string },
		LegendPropsWithDefaults
	> {
	color?: FacetRef<string>;
	lineType?: FacetRef<number[]>;
	lineWidth?: FacetRef<number>;
	symbolShape?: FacetRef<string>;
}

type LinePropsWithDefaults = 'name' | 'dimension' | 'metric' | 'color' | 'scaleType' | 'lineType' | 'opacity';

export interface LineSpecProps extends PickRequired<LineProps, LinePropsWithDefaults> {
	children: MarkChildElement[];
	colorScheme: ColorScheme;
	index: number;
	interactiveMarkName: string | undefined;
	lineWidth?: FacetRef<LineWidth>;
	popoverMarkName: string | undefined;
	animate?: Animation;
}

type MetricRangePropsWithDefaults = 'lineType' | 'lineWidth' | 'rangeOpacity' | 'metricEnd' | 'metricStart' | 'metric';
export interface MetricRangeSpecProps
	extends PickRequired<MetricRangeProps & { name: string }, MetricRangePropsWithDefaults> {}

type TrendlinePropsWithDefaults =
	| 'dimensionRange'
	| 'displayOnHover'
	| 'highlightRawPoint'
	| 'lineType'
	| 'lineWidth'
	| 'method'
	| 'metric'
	| 'opacity';

export interface TrendlineSpecProps
	extends PickRequired<TrendlineProps & { metric?: string; name: string }, TrendlinePropsWithDefaults> {
	children: ChartTooltipElement[];
}
