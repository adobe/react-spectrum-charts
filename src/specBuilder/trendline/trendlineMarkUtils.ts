/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { TRENDLINE_VALUE } from '@constants';
import { getLineHoverMarks, getLineOpacity } from '@specBuilder/line/lineMarkUtils';
import { LineMarkProps } from '@specBuilder/line/lineUtils';
import {
	getColorProductionRule,
	getLineWidthProductionRule,
	getOpacityProductionRule,
	getStrokeDashProductionRule,
	hasTooltip,
} from '@specBuilder/marks/markUtils';
import { getScaleName } from '@specBuilder/scale/scaleSpecBuilder';
import { getFacetsFromProps } from '@specBuilder/specUtils';
import { Orientation, ScaleType, TrendlineSpecProps } from 'types';
import { EncodeEntry, GroupMark, LineMark, NumericValueRef, RuleMark } from 'vega';
import {
	TrendlineParentProps,
	getTrendlineDimensionMetric,
	getTrendlines,
	isAggregateMethod,
	isRegressionMethod,
	trendlineUsesNormalizedDimension,
} from './trendlineUtils';

export const getTrendlineMarks = (markProps: TrendlineParentProps): (GroupMark | RuleMark)[] => {
	const { color, lineType } = markProps;
	const { facets } = getFacetsFromProps({ color, lineType });

	const marks: (GroupMark | RuleMark)[] = [];
	const trendlines = getTrendlines(markProps);
	for (const trendlineProps of trendlines) {
		if (isAggregateMethod(trendlineProps.method)) {
			marks.push(getTrendlineRuleMark(markProps, trendlineProps));
		} else {
			const dataSuffix = isRegressionMethod(trendlineProps.method) ? '_highResolutionData' : '_data';
			marks.push({
				name: `${trendlineProps.name}_group`,
				type: 'group',
				clip: true,
				from: {
					facet: {
						name: `${trendlineProps.name}_facet`,
						data: trendlineProps.name + dataSuffix,
						groupby: facets,
					},
				},
				marks: [getTrendlineLineMark(markProps, trendlineProps)],
			});
		}
	}

	if (trendlines.some((trendline) => hasTooltip(trendline.children))) {
		marks.push(
			getTrendlineHoverMarks(
				markProps,
				trendlines.some((trendlineProps) => trendlineProps.highlightRawPoint),
			),
		);
	}

	return marks;
};

/**
 * gets the trendline rule mark used for aggregate methods (mean, median)
 * @param markProps
 * @param trendlineProps
 * @returns rule mark
 */
export const getTrendlineRuleMark = (markProps: TrendlineParentProps, trendlineProps: TrendlineSpecProps): RuleMark => {
	const { dimension, colorScheme, metric } = markProps;
	const { dimensionExtent, dimensionScaleType, lineType, lineWidth, name, orientation } = trendlineProps;
	const color = trendlineProps.color ? { value: trendlineProps.color } : markProps.color;
	const { trendlineDimension } = getTrendlineDimensionMetric(dimension, metric, orientation, false);

	return {
		name,
		type: 'rule',
		clip: true,
		from: {
			data: `${name}_highResolutionData`,
		},
		interactive: false,
		encode: {
			enter: {
				...getRuleYEncodings(dimensionExtent, trendlineDimension, orientation),
				stroke: getColorProductionRule(color, colorScheme),
				strokeDash: getStrokeDashProductionRule({ value: lineType }),
				strokeOpacity: getOpacityProductionRule({ value: trendlineProps.opacity }),
				strokeWidth: getLineWidthProductionRule({ value: lineWidth }),
			},
			update: {
				...getRuleXEncodings(dimensionExtent, trendlineDimension, dimensionScaleType, orientation),
				opacity: getLineOpacity(getLineMarkProps(markProps, trendlineProps)),
			},
		},
	};
};

/**
 * gets the production rules for the y and y2 encoding of a rule mark
 * @param dimensionExtent
 * @param dimension
 * @param orientation
 * @returns x production rules
 */
export const getRuleYEncodings = (
	dimensionExtent: TrendlineSpecProps['dimensionExtent'],
	dimension: string,
	orientation: Orientation,
): EncodeEntry => {
	if (orientation === 'horizontal') {
		return { y: { scale: 'yLinear', field: TRENDLINE_VALUE } };
	}
	return {
		y: getStartDimensionExtentProductionRule(dimensionExtent[0], dimension, 'yLinear'),
		y2: getEndDimensionExtentProductionRule(dimensionExtent[1], dimension, 'yLinear', 'y'),
	};
};

/**
 * gets the production rules for the x and x2 encoding of a rule mark
 * @param dimensionExtent
 * @param dimension
 * @param scaleType
 * @param orientation
 * @returns x production rules
 */
export const getRuleXEncodings = (
	dimensionExtent: TrendlineSpecProps['dimensionExtent'],
	dimension: string,
	scaleType: ScaleType,
	orientation: Orientation,
): EncodeEntry => {
	const scale = getScaleName('x', scaleType);
	if (orientation === 'vertical') {
		return { x: { scale, field: TRENDLINE_VALUE } };
	}
	return {
		x: getStartDimensionExtentProductionRule(dimensionExtent[0], dimension, scale),
		x2: getEndDimensionExtentProductionRule(dimensionExtent[1], dimension, scale, 'x'),
	};
};

const getStartDimensionExtentProductionRule = (
	startDimensionExtent: number | 'domain' | null,
	dimension: string,
	scale: string,
): NumericValueRef => {
	switch (startDimensionExtent) {
		case null:
			return { scale, field: `${dimension}Min` };
		case 'domain':
			return { value: 0 };
		default:
			return { scale, value: startDimensionExtent };
	}
};

const getEndDimensionExtentProductionRule = (
	endDimensionExtent: number | 'domain' | null,
	dimension: string,
	scale: string,
	axis: 'x' | 'y',
): NumericValueRef => {
	switch (endDimensionExtent) {
		case null:
			return { scale, field: `${dimension}Max` };
		case 'domain':
			return { signal: axis === 'x' ? 'width' : 'height' };
		default:
			return { scale, value: endDimensionExtent };
	}
};

/**
 * gets the trendline line mark used for regression and window methods
 * @param markProps
 * @param trendlineProps
 * @returns
 */
export const getTrendlineLineMark = (markProps: TrendlineParentProps, trendlineProps: TrendlineSpecProps): LineMark => {
	const { colorScheme, dimension, metric } = markProps;
	const { dimensionScaleType, lineType, lineWidth, method, name, orientation } = trendlineProps;

	const isDimensionNormalized =
		trendlineUsesNormalizedDimension(method, dimensionScaleType) && orientation === 'horizontal';
	const { trendlineDimension } = getTrendlineDimensionMetric(dimension, metric, orientation, isDimensionNormalized);

	const color = trendlineProps.color ? { value: trendlineProps.color } : markProps.color;

	return {
		name,
		type: 'line',
		from: { data: `${name}_facet` },
		interactive: false,
		encode: {
			enter: {
				y: getLineYProductionRule(trendlineDimension, orientation),
				stroke: getColorProductionRule(color, colorScheme),
				strokeDash: getStrokeDashProductionRule({ value: lineType }),
				strokeOpacity: getOpacityProductionRule({ value: trendlineProps.opacity }),
				strokeWidth: getLineWidthProductionRule({ value: lineWidth }),
			},
			update: {
				x: getLineXProductionRule(trendlineDimension, dimensionScaleType, orientation, isDimensionNormalized),
				opacity: getLineOpacity(getLineMarkProps(markProps, trendlineProps)),
			},
		},
	};
};

const getLineYProductionRule = (trendlineDimension: string, orientation: Orientation): NumericValueRef => {
	const scale = 'yLinear';
	if (orientation === 'horizontal') {
		return { scale, field: TRENDLINE_VALUE };
	}
	return { scale, field: trendlineDimension };
};

const getLineXProductionRule = (
	trendlineDimension: string,
	scaleType: ScaleType,
	orientation: Orientation,
	isDimensionNormalized: boolean,
): NumericValueRef => {
	const scale = getScaleName('x', scaleType);
	if (orientation === 'vertical') {
		return { scale, field: TRENDLINE_VALUE };
	}
	return isDimensionNormalized
		? { scale: 'xTrendline', field: trendlineDimension }
		: { scale, field: trendlineDimension };
};

const getTrendlineHoverMarks = (markProps: TrendlineParentProps, highlightRawPoint: boolean): GroupMark => {
	const { metric, name } = markProps;
	const trendlines = getTrendlines(markProps);
	const trendlineHoverProps: LineMarkProps = getLineMarkProps(markProps, trendlines[0], {
		name: `${name}Trendline`,
		children: trendlines.map((trendline) => trendline.children).flat(),
		metric: TRENDLINE_VALUE,
	});

	return {
		name: `${name}Trendline_hoverGroup`,
		type: 'group',
		clip: true,
		marks: getLineHoverMarks(
			trendlineHoverProps,
			`${name}_allTrendlineData`,
			highlightRawPoint ? metric : undefined,
		),
	};
};

const getLineMarkProps = (
	markProps: TrendlineParentProps,
	{ dimensionScaleType, displayOnHover, lineWidth, metric, name, opacity }: TrendlineSpecProps,
	override?: Partial<LineMarkProps>,
): LineMarkProps => {
	const { children, color, colorScheme, dimension, interactiveMarkName, lineType } = markProps;
	const popoverMarkName = 'popoverMarkName' in markProps ? markProps.popoverMarkName : undefined;
	const staticPoint = 'staticPoint' in markProps ? markProps.staticPoint : undefined;
	return {
		children,
		color,
		colorScheme,
		dimension,
		displayOnHover,
		interactiveMarkName,
		lineType,
		lineWidth: { value: lineWidth },
		metric,
		name,
		opacity: { value: opacity },
		popoverMarkName,
		scaleType: dimensionScaleType,
		staticPoint,
		...override,
	};
};
