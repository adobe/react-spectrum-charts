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
import { Trendline } from '@components/Trendline';
import {
	FILTERED_TABLE,
	MS_PER_DAY,
	TRENDLINE_VALUE } from '@constants';
import { sanitizeTrendlineChildren } from '@utils';
import { SignalRef } from 'vega';

import {
	AggregateMethod,
	BarSpecProps,
	ColorFacet,
	LineSpecProps,
	LineTypeFacet,
	Orientation,
	RegressionMethod as RscRegressionMethod,
	ScaleType as RscScaleType,
	ScatterSpecProps,
	TrendlineElement,
	TrendlineMethod,
	TrendlineProps,
	TrendlineSpecProps,
	WindowMethod,
} from '../../types';

/** These are all the spec props that currently support trendlines */
export type TrendlineParentProps = LineSpecProps | ScatterSpecProps | BarSpecProps;

/**
 * gets all the trendlines from the children and applies all the default trendline props
 * @param children
 * @param markName
 * @returns TrendlineSpecProps[]
 */
export const getTrendlines = (markProps: TrendlineParentProps): TrendlineSpecProps[] => {
	const trendlineElements = markProps.children.filter((child) => child.type === Trendline) as TrendlineElement[];
	return trendlineElements.map((trendline, index) => applyTrendlinePropDefaults(markProps, trendline.props, index));
};

/**
 * applies all the default trendline props
 * @param param0
 * @param markName
 * @param index
 * @returns TrendlineSpecProps
 */
export const applyTrendlinePropDefaults = (
	markProps: TrendlineParentProps,
	{
		children,
		color,
		dimensionExtent,
		dimensionRange = [null, null],
		displayOnHover = false,
		highlightRawPoint = false,
		lineType = 'dashed',
		lineWidth = 'M',
		method = 'linear',
		opacity = 1,
		orientation = 'horizontal',
		...props
	}: TrendlineProps,
	index: number
): TrendlineSpecProps => {
	const dimensionScaleType = getTrendlineScaleType(markProps, orientation);
	const isDimensionNormalized =
		dimensionScaleType === 'time' && isRegressionMethod(method) && orientation === 'horizontal';
	const { trendlineDimension, trendlineMetric } = getTrendlineDimensionMetric(
		markProps.dimension,
		markProps.metric,
		orientation,
		isDimensionNormalized
	);
	const trendlineColor = color ? { value: color } : getTrendlineColorFromMarkProps(markProps.color);
	return {
		children: sanitizeTrendlineChildren(children),
		colorScheme: markProps.colorScheme,
		displayOnHover,
		dimensionExtent: dimensionExtent ?? dimensionRange,
		dimensionRange,
		dimensionScaleType,
		highlightRawPoint,
		isDimensionNormalized,
		lineType,
		lineWidth,
		method,
		metric: TRENDLINE_VALUE,
		name: `${markProps.name}Trendline${index}`,
		opacity,
		orientation,
		trendlineColor,
		trendlineDimension,
		trendlineMetric,
		...props,
	};
};

/**
 * Gets the color from the parent props.
 * Simplifies dual facet colors into a single facet
 * @param color
 * @returns color
 */
export const getTrendlineColorFromMarkProps = (color: TrendlineParentProps['color']): ColorFacet => {
	return Array.isArray(color) ? color[0] : color;
};

/**
 * Gets the color from the parent props.
 * Simplifies dual facet colors into a single facet
 * @param lineType
 * @returns color
 */
export const getTrendlineLineTypeFromMarkProps = (lineType: TrendlineParentProps['lineType']): LineTypeFacet => {
	return Array.isArray(lineType) ? lineType[0] : lineType;
};

/**
 * Gets the metric and dimension for the trendline, taking into account the orientation.
 * if isDimensionNormalized is true, the trendlineDimension will have `Normalized` appended to it
 * @param dimension
 * @param metric
 * @param orientation
 * @param isDimensionNormalized
 * @returns \{trendlineDimension: string, trendlineMetric: string}
 */
export const getTrendlineDimensionMetric = (
	dimension: string,
	metric: string,
	orientation: Orientation,
	isDimensionNormalized: boolean
): { trendlineDimension: string; trendlineMetric: string } => {
	return orientation === 'horizontal'
		? {
				trendlineDimension: normalizeTrendlineDimensionName(dimension, isDimensionNormalized),
				trendlineMetric: metric,
		  }
		: {
				trendlineDimension: metric,
				trendlineMetric: dimension,
		  };
};

/**
 * If the dimension should be normalized, returns the normalized dimension name, otherwise returns the original dimension
 * @param dimension
 * @param method
 * @param scaleType
 * @returns dimension name
 */
export const normalizeTrendlineDimensionName = (dimension: string, isDimensionNormalized: boolean) =>
	isDimensionNormalized ? `${dimension}Normalized` : dimension;

/**
 * determines if the supplied method is an aggregate method (average, median)
 * @see https://vega.github.io/vega/docs/transforms/aggregate/
 * @param method
 * @returns boolean
 */
export const isAggregateMethod = (method: TrendlineMethod): method is AggregateMethod =>
	['average', 'median'].includes(method);

/**
 * determines if the supplied method is a regression method
 * @see https://vega.github.io/vega/docs/transforms/regression/
 * @param method
 * @returns boolean
 */
export const isRegressionMethod = (method: TrendlineMethod): method is RscRegressionMethod =>
	isPolynomialMethod(method) || ['exponential', 'logarithmic', 'power'].includes(method);

/**
 * determines if the supplied method is a windowing method
 * @see https://vega.github.io/vega/docs/transforms/window/
 * @param method
 * @returns boolean
 */
export const isWindowMethod = (method: TrendlineMethod): method is WindowMethod => method.startsWith('movingAverage-');

/**
 * determines if the supplied method is a polynomial method
 * @see https://vega.github.io/vega/docs/transforms/regression/
 * @param method
 * @returns boolean
 */
export const isPolynomialMethod = (method: TrendlineMethod): boolean =>
	method.startsWith('polynomial-') || ['linear', 'quadratic'].includes(method);

/**
 * determines if any trendlines use the normalized dimension
 * @param markProps
 * @returns boolean
 */
export const hasTrendlineWithNormalizedDimension = (markProps: TrendlineParentProps): boolean => {
	const trendlines = getTrendlines(markProps);

	// only need to add the normalized dimension transform if there is a regression trendline and the dimension scale type is time
	return trendlines.some(
		({ dimensionScaleType, method }) => isRegressionMethod(method) && dimensionScaleType === 'time'
	);
};

/**
 * gets the order of the polynomial
 * y = a + b * x + … + k * pow(x, order)
 * @see https://vega.github.io/vega/docs/transforms/regression/
 * @param method trendline method
 * @returns order
 */
export const getPolynomialOrder = (method: TrendlineMethod): number => {
	// method is one of the named polynomial methods
	switch (method) {
		case 'linear':
			return 1;
		case 'quadratic':
			return 2;
	}

	// method is of the form polynomial-<order>
	const order = parseInt(method.split('-')[1]);
	if (order < 1) {
		throw new Error(`Invalid polynomial order: ${order}, order must be an interger greater than 0`);
	}
	return order;
};

/**
 * gets the extent used in the regression transform
 * @param dimensionExtent
 * @param name
 * @param isNormalized
 * @returns
 */
export const getRegressionExtent = (
	dimensionExtent: TrendlineSpecProps['dimensionExtent'],
	name: string,
	isNormalized: boolean
): SignalRef => {
	const extentName = `${name}_extent`;
	const extentSignal = dimensionExtent
		.map((value, i) => {
			switch (value) {
				case null:
					return `${extentName}[${i}]`;
				case 'domain':
					return `${extentName}[${i}] ${i === 0 ? '-' : '+'} (${extentName}[1] - ${extentName}[0]) * 0.3`;
				default:
					// if this is a normalized date, we need to normalize the value
					if (isNormalized) {
						return `(${value} - data('${FILTERED_TABLE}')[0].datetimeMin + ${MS_PER_DAY}) / ${MS_PER_DAY}`;
					}
					return value;
			}
		})
		.join(', ');

	return { signal: `[${extentSignal}]` };
};

export const getTrendlineScaleType = (
	markProps: TrendlineParentProps,
	trendlineOrientation: Orientation
): RscScaleType => {
	// y axis only support linear... for now...
	if (trendlineOrientation === 'vertical') return 'linear';
	return 'scaleType' in markProps ? markProps.scaleType : markProps.dimensionScaleType;
