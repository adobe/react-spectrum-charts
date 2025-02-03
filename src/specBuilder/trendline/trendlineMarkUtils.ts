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
import { LineMarkOptions } from '@specBuilder/line/lineUtils';
import {
	getColorProductionRule,
	getLineWidthProductionRule,
	getOpacityProductionRule,
	getStrokeDashProductionRule,
	hasTooltip,
} from '@specBuilder/marks/markUtils';
import { getScaleName } from '@specBuilder/scale/scaleSpecBuilder';
import { getFacetsFromOptions } from '@specBuilder/specUtils';
import { getTrendlineAnnotationMarks } from '@specBuilder/trendlineAnnotation';
import { EncodeEntry, GroupMark, LineMark, NumericValueRef, RuleMark } from 'vega';

import { Orientation, ScaleType, TrendlineMethod, TrendlineSpecOptions, TrendlineSpecProps } from '../../types';
import {
	TrendlineParentOptions,
	getTrendlineColorFromMarkOptions,
	getTrendlineLineTypeFromMarkOptions,
	getTrendlines,
	isAggregateMethod,
	isRegressionMethod,
} from './trendlineUtils';

export const getTrendlineMarks = (markProps: TrendlineParentOptions): (GroupMark | RuleMark)[] => {
	const { color, lineType } = markProps;
	const { facets } = getFacetsFromOptions({ color, lineType });

	const marks: (GroupMark | RuleMark)[] = [];
	const trendlines = getTrendlines(markProps);
	for (const trendlineProps of trendlines) {
		const { displayOnHover, method, name } = trendlineProps;
		if (isAggregateMethod(method)) {
			marks.push(getTrendlineRuleMark(markProps, trendlineProps));
		} else {
			const data = getDataSourceName(name, method, displayOnHover);
			marks.push({
				name: `${name}_group`,
				type: 'group',
				clip: true,
				from: {
					facet: {
						name: `${name}_facet`,
						data,
						groupby: facets,
					},
				},
				marks: [getTrendlineLineMark(markProps, trendlineProps)],
			});
		}
		marks.push(...getTrendlineAnnotationMarks(trendlineProps, markProps.name));
	}

	if (trendlines.some((trendline) => hasTooltip(trendline))) {
		marks.push(
			getTrendlineHoverMarks(
				markProps,
				trendlines.some((trendlineProps) => trendlineProps.highlightRawPoint)
			)
		);
	}

	return marks;
};

const getDataSourceName = (trendlineName: string, method: TrendlineMethod, displayOnHover: boolean): string => {
	if (displayOnHover) return `${trendlineName}_highlightedData`;
	if (isRegressionMethod(method)) return `${trendlineName}_highResolutionData`;
	return `${trendlineName}_data`;
};

/**
 * gets the trendline rule mark used for aggregate methods (mean, median)
 * @param markOptions
 * @param trendlineOptions
 * @returns rule mark
 */
export const getTrendlineRuleMark = (
	markOptions: TrendlineParentOptions,
	trendlineOptions: TrendlineSpecOptions
): RuleMark => {
	const { colorScheme } = markOptions;
	const {
		dimensionExtent,
		dimensionScaleType,
		displayOnHover,
		lineType,
		lineWidth,
		name,
		orientation,
		trendlineColor,
		trendlineDimension,
	} = trendlineOptions;

	const data = displayOnHover ? `${name}_highlightedData` : `${name}_highResolutionData`;

	return {
		name,
		type: 'rule',
		clip: true,
		from: {
			data,
		},
		interactive: false,
		encode: {
			enter: {
				...getRuleYEncodings(dimensionExtent, trendlineDimension, orientation),
				stroke: getColorProductionRule(trendlineColor, colorScheme),
				strokeDash: getStrokeDashProductionRule({ value: lineType }),
				strokeOpacity: getOpacityProductionRule({ value: trendlineOptions.opacity }),
				strokeWidth: getLineWidthProductionRule({ value: lineWidth }),
			},
			update: {
				...getRuleXEncodings(dimensionExtent, trendlineDimension, dimensionScaleType, orientation),
				opacity: getLineOpacity(getLineMarkOptions(markOptions, trendlineOptions)),
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
	orientation: Orientation
): EncodeEntry => {
	if (orientation === 'horizontal') {
		return { y: { scale: 'yLinear', field: TRENDLINE_VALUE } };
	}
	return {
		y: getStartDimensionExtentProductionRule(dimensionExtent[0], dimension, 'yLinear', 'y'),
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
	orientation: Orientation
): EncodeEntry => {
	const scale = getScaleName('x', scaleType);
	if (orientation === 'vertical') {
		return { x: { scale, field: TRENDLINE_VALUE } };
	}
	return {
		x: getStartDimensionExtentProductionRule(dimensionExtent[0], dimension, scale, 'x'),
		x2: getEndDimensionExtentProductionRule(dimensionExtent[1], dimension, scale, 'x'),
	};
};

/**
 * Gets the production rule for the start dimension extent of a trendline
 * @param startDimensionExtent
 * @param dimension
 * @param scale
 * @param axis
 * @returns
 */
export const getStartDimensionExtentProductionRule = (
	startDimensionExtent: number | 'domain' | null,
	dimension: string,
	scale: string,
	axis: 'x' | 'y'
): NumericValueRef => {
	switch (startDimensionExtent) {
		case null:
			return { scale, field: `${dimension}Min` };
		case 'domain':
			if (axis === 'x') return { value: 0 };
			return { signal: 'height' };
		default:
			return { scale, value: startDimensionExtent };
	}
};

/**
 * gets the production rule for the end dimension extent of a trendline
 * @param endDimensionExtent
 * @param dimension
 * @param scale
 * @param axis
 * @returns
 */
export const getEndDimensionExtentProductionRule = (
	endDimensionExtent: number | 'domain' | null,
	dimension: string,
	scale: string,
	axis: 'x' | 'y'
): NumericValueRef => {
	switch (endDimensionExtent) {
		case null:
			return { scale, field: `${dimension}Max` };
		case 'domain':
			if (axis === 'x') return { signal: 'width' };
			return { value: 0 };
		default:
			return { scale, value: endDimensionExtent };
	}
};

/**
 * gets the trendline line mark used for regression and window methods
 * @param markOptions
 * @param trendlineOptions
 * @returns
 */
export const getTrendlineLineMark = (
	markOptions: TrendlineParentOptions,
	trendlineOptions: TrendlineSpecOptions
): LineMark => {
	const { colorScheme } = markOptions;
	const {
		dimensionScaleType,
		isDimensionNormalized,
		lineType,
		lineWidth,
		name,
		orientation,
		trendlineColor,
		trendlineDimension,
	} = trendlineOptions;

	return {
		name,
		type: 'line',
		from: { data: `${name}_facet` },
		interactive: false,
		encode: {
			enter: {
				y: getLineYProductionRule(trendlineDimension, orientation),
				stroke: getColorProductionRule(trendlineColor, colorScheme),
				strokeDash: getStrokeDashProductionRule({ value: lineType }),
				strokeOpacity: getOpacityProductionRule({ value: trendlineOptions.opacity }),
				strokeWidth: getLineWidthProductionRule({ value: lineWidth }),
			},
			update: {
				x: getLineXProductionRule(trendlineDimension, dimensionScaleType, orientation, isDimensionNormalized),
				opacity: getLineOpacity(getLineMarkOptions(markOptions, trendlineOptions)),
			},
		},
	};
};

/**
 * gets the production rule for the y encoding of a line mark
 * @param trendlineDimension
 * @param orientation
 * @returns
 */
export const getLineYProductionRule = (trendlineDimension: string, orientation: Orientation): NumericValueRef => {
	const scale = 'yLinear';
	if (orientation === 'horizontal') {
		return { scale, field: TRENDLINE_VALUE };
	}
	return { scale, field: trendlineDimension };
};

/**
 * gets the production rule for the x encoding of a line mark
 * @param trendlineDimension
 * @param scaleType
 * @param orientation
 * @param isDimensionNormalized
 * @returns
 */
export const getLineXProductionRule = (
	trendlineDimension: string,
	scaleType: ScaleType,
	orientation: Orientation,
	isDimensionNormalized: boolean
): NumericValueRef => {
	const scale = getScaleName('x', scaleType);
	if (orientation === 'vertical') {
		return { scale, field: TRENDLINE_VALUE };
	}
	return isDimensionNormalized
		? { scale: 'xTrendline', field: trendlineDimension }
		: { scale, field: trendlineDimension };
};

const getTrendlineHoverMarks = (markOptions: TrendlineParentOptions, highlightRawPoint: boolean): GroupMark => {
	const { metric, name } = markOptions;
	const trendlines = getTrendlines(markOptions);
	const trendlineHoverProps = getLineMarkOptions(markOptions, trendlines[0], {
		name: `${name}Trendline`,
		chartTooltips: trendlines.map((trendline) => trendline.chartTooltips).flat(),
		metric: TRENDLINE_VALUE,
	});

	return {
		name: `${name}Trendline_hoverGroup`,
		type: 'group',
		clip: true,
		marks: getLineHoverMarks(
			trendlineHoverProps,
			`${name}_allTrendlineData`,
			highlightRawPoint ? metric : undefined
		),
	};
};

const getLineMarkOptions = (
	markOptions: TrendlineParentOptions,
	{ dimensionScaleType, displayOnHover, lineWidth, metric, name, opacity }: TrendlineSpecOptions,
	override?: Partial<LineMarkOptions>
): LineMarkOptions => {
	const { color, lineType } = markOptions;
	const popoverMarkName = 'popoverMarkName' in markOptions ? markOptions.popoverMarkName : undefined;
	const staticPoint = 'staticPoint' in markOptions ? markOptions.staticPoint : undefined;
	return {
		...markOptions,
		color: getTrendlineColorFromMarkOptions(color),
		displayOnHover,
		lineType: getTrendlineLineTypeFromMarkOptions(lineType),
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
