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
import { FILTERED_TABLE, MS_PER_DAY, TRENDLINE_VALUE } from '@constants';
import { sanitizeTrendlineChildren } from '@utils';
import {
	AggregateMethod,
	LineSpecProps,
	MarkChildElement,
	RegressionMethod as RscRegressionMethod,
	ScaleType as RscScaleType,
	ScatterSpecProps,
	TrendlineElement,
	TrendlineMethod,
	TrendlineProps,
	TrendlineSpecProps,
	WindowMethod,
} from 'types';
import { ScaleType, SignalRef } from 'vega';

/** These are all the spec props that currently support trendlines */
export type TrendlineParentProps = LineSpecProps | ScatterSpecProps;

/**
 * gets all the trendlines from the children and applies all the default trendline props
 * @param children
 * @param markName
 * @returns TrendlineSpecProps[]
 */
export const getTrendlines = (children: MarkChildElement[], markName: string): TrendlineSpecProps[] => {
	const trendlineElements = children.filter((child) => child.type === Trendline) as TrendlineElement[];
	return trendlineElements.map((trendline, index) => applyTrendlinePropDefaults(trendline.props, markName, index));
};

/**
 * applies all the default trendline props
 * @param param0
 * @param markName
 * @param index
 * @returns TrendlineSpecProps
 */
export const applyTrendlinePropDefaults = (
	{
		children,
		dimensionExtent,
		dimensionRange = [null, null],
		displayOnHover = false,
		highlightRawPoint = false,
		lineType = 'dashed',
		lineWidth = 'M',
		method = 'linear',
		opacity = 1,
		...props
	}: TrendlineProps,
	markName: string,
	index: number,
): TrendlineSpecProps => ({
	children: sanitizeTrendlineChildren(children),
	displayOnHover,
	dimensionExtent: dimensionExtent ?? dimensionRange,
	dimensionRange,
	highlightRawPoint,
	lineType,
	lineWidth,
	method,
	metric: TRENDLINE_VALUE,
	name: `${markName}Trendline${index}`,
	opacity,
	...props,
});

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
 * determines if the supplied method is a regression method that uses the normalized dimension
 * @see https://vega.github.io/vega/docs/transforms/regression/
 * @param method
 * @returns boolean
 */
export const trendlineUsesNormalizedDimension = (method: TrendlineMethod, scaleType: ScaleType | undefined): boolean =>
	scaleType === 'time' && isRegressionMethod(method);

/**
 * determines if any trendlines use the normalized dimension
 * @param markProps
 * @returns boolean
 */
export const hasTrendlineWithNormailizedDimension = (markProps: TrendlineParentProps): boolean => {
	const trendlines = getTrendlines(markProps.children, markProps.name);

	// only need to add the normalized dimension transform if there is a regression trendline and the dimension is time
	const hasRegressionTrendline = trendlines.some((trendline) => isRegressionMethod(trendline.method));
	const hasTimeScale = getTrendlineScaleType(markProps) === 'time';
	return hasRegressionTrendline && hasTimeScale;
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
	isNormalized: boolean,
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

export const getTrendlineScaleType = (markProps: TrendlineParentProps): RscScaleType => {
	return 'scaleType' in markProps ? markProps.scaleType : markProps.dimensionScaleType;
};
