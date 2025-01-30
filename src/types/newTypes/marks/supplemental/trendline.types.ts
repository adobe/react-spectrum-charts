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

import { SpectrumColor } from '../../../SpectrumVizColor.types';
import { ChartTooltipElement, ChartTooltipOptions } from '../../dialogs/chartTooltip.types';
import { Children, LineType, LineWidth, Orientation } from '../../util.types';
import { TrendlineAnnotationElement, TrendlineAnnotationOptions } from './trendlineAnnotation.types';

/** trendline methods that use a joinaggregate transform */
export type AggregateMethod = 'average' | 'median';
/** trendline methods that use a regression transform */
export type RegressionMethod =
	| 'exponential'
	| 'linear'
	| 'logarithmic'
	| `polynomial-${number}`
	| 'power'
	| 'quadratic';
/** trendline methods that use a window transform */
export type WindowMethod = `movingAverage-${number}`;

/** avaliable methods for generating a trendline */
export type TrendlineMethod = AggregateMethod | RegressionMethod | WindowMethod;

export interface TrendlineOptions {
	/** The line color of the trendline. If undefined, will default to the color of the series that it represents. */
	color?: SpectrumColor | string;
	/**
	 * The dimenstion range to draw the trendline for. If undefined, the value will default to the value of dimensionRange.
	 *
	 * If 'domain' is used as a start or end value, this will extrapolate the trendline out to the beginning and end of the chart domain respectively.
	 *
	 * If null is used as a start or end value, the trendline will be be drawn from the first data point to the last data point respectively.
	 */
	dimensionExtent?: [number | 'domain' | null, number | 'domain' | null];
	/**
	 * The dimension range that the statistical transform should be calculated for. If undefined, the value will default to [null, null]
	 *
	 * If the start or end values are null, then the dimension range will not be bounded for the start or end respectively.
	 */
	dimensionRange?: [number | null, number | null];
	/** Whether the trendline should only be visible when hovering over the parent line */
	displayOnHover?: boolean;
	/** Data points where these keys have truthy values will not be included in the trendline calculation */
	excludeDataKeys?: string[];
	/** If there is a tooltip on this trendline, then this will highlight the raw point in addition to the hovered trendline point. */
	highlightRawPoint?: boolean;
	/** The line type of the trend line. */
	lineType?: LineType;
	/** The line width of the trend line. */
	lineWidth?: LineWidth;
	/** The type of statistical transform that will be calculated. */
	method?: TrendlineMethod;
	/** The opacity of the trendlines */
	opacity?: number;
	/** Orientation of the trendline. Only supported on scatter plots. */
	orientation?: Orientation;

	// children
	chartTooltips?: ChartTooltipOptions[];
	trendlineAnnotations?: TrendlineAnnotationOptions[];
}

export interface TrendlineProps extends Omit<TrendlineOptions, 'chartTooltips' | 'trendlineAnnotations'> {
	children?: Children<ChartTooltipElement | TrendlineAnnotationElement>;
}

export type TrendlineElement = ReactElement<TrendlineProps, JSXElementConstructor<TrendlineProps>>;
