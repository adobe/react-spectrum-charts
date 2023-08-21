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

import { Align, Baseline, NumberValue } from 'vega';
import {
	AreaProps,
	AxisProps,
	BarProps,
	ChartTooltipElement,
	ColorScheme,
	FacetRef,
	LegendProps,
	LineProps,
	MarkChildElement,
	TrendlineProps,
} from './Prism';

type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

type AreaPropsWithDefaults = 'name' | 'dimension' | 'metric' | 'color' | 'scaleType' | 'opacity';

export interface AreaSpecProps extends PartiallyRequired<AreaProps, AreaPropsWithDefaults> {
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

export type AxisSpecProps = PartiallyRequired<
	AxisProps & { name: string; colorScheme?: ColorScheme } & InternalAxisProps,
	AxisPropsWithDefaults
>;

type BarPropsWithDefaults =
	| 'color'
	| 'dimension'
	| 'lineType'
	| 'lineWidth'
	| 'metric'
	| 'name'
	| 'opacity'
	| 'paddingRatio'
	| 'colorScheme'
	| 'orientation'
	| 'trellisOrientation'
	| 'type';

export interface BarSpecProps
	extends PartiallyRequired<BarProps & { colorScheme?: ColorScheme }, BarPropsWithDefaults> {
	children: MarkChildElement[];
}

type LegendPropsWithDefaults = 'highlight' | 'hiddenEntries' | 'position' | 'colorScheme';

export interface LegendSpecProps
	extends PartiallyRequired<LegendProps & { colorScheme?: ColorScheme }, LegendPropsWithDefaults> {
	color?: FacetRef<string>;
	lineType?: FacetRef<number[]>;
	lineWidth?: FacetRef<number>;
	symbolShape?: FacetRef<string>;
}

type LinePropsWithDefaults =
	| 'name'
	| 'dimension'
	| 'metric'
	| 'color'
	| 'scaleType'
	| 'lineType'
	| 'opacity'
	| 'colorScheme';

export interface LineSpecProps
	extends PartiallyRequired<LineProps & { colorScheme?: ColorScheme }, LinePropsWithDefaults> {
	children: MarkChildElement[];
}

type TrendlinePropsWithDefaults =
	| 'dimensionRange'
	| 'highlightRawPoint'
	| 'lineType'
	| 'lineWidth'
	| 'method'
	| 'metric'
	| 'opacity'
	| 'rollingWindow';

export interface TrendlineSpecProps
	extends PartiallyRequired<TrendlineProps & { metric?: string; name: string }, TrendlinePropsWithDefaults> {
	children: ChartTooltipElement[];
}
