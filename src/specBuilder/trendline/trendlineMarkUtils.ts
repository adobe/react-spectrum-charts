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
	getXProductionRule,
	hasTooltip,
} from '@specBuilder/marks/markUtils';
import { getScaleName } from '@specBuilder/scale/scaleSpecBuilder';
import { getDimensionField, getFacetsFromProps } from '@specBuilder/specUtils';
import { ScaleType, TrendlineSpecProps } from 'types';
import { GroupMark, LineMark, NumericValueRef, RuleMark } from 'vega';
import {
	TrendlineParentProps,
	getTrendlineScaleType,
	getTrendlines,
	isAggregateMethod,
	isRegressionMethod,
	trendlineUsesNormalizedDimension,
} from './trendlineUtils';

export const getTrendlineMarks = (markProps: TrendlineParentProps): (GroupMark | RuleMark)[] => {
	const { children, color, lineType, name } = markProps;
	const { facets } = getFacetsFromProps({ color, lineType });

	const marks: (GroupMark | RuleMark)[] = [];
	const trendlines = getTrendlines(children, name);
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
	const { dimension, colorScheme } = markProps;
	const { dimensionExtent, lineType, lineWidth, metric, name } = trendlineProps;
	const color = trendlineProps.color ? { value: trendlineProps.color } : markProps.color;
	const scaleType = getTrendlineScaleType(markProps);
	const dimensionField = getDimensionField(dimension, scaleType);

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
				y: { scale: 'yLinear', field: metric },
				stroke: getColorProductionRule(color, colorScheme),
				strokeDash: getStrokeDashProductionRule({ value: lineType }),
				strokeOpacity: getOpacityProductionRule({ value: trendlineProps.opacity }),
				strokeWidth: getLineWidthProductionRule({ value: lineWidth }),
			},
			update: {
				x: getRuleXProductionRule(dimensionExtent[0], dimensionField, scaleType),
				x2: getRuleX2ProductionRule(dimensionExtent[1], dimensionField, scaleType),
				opacity: getLineOpacity(getLineMarkProps(markProps, trendlineProps)),
			},
		},
	};
};

/**
 * gets the production rule for the x encoding of a rule mark
 * @param startDimensionExtent
 * @param dimension
 * @param scaleType
 * @returns x production rule
 */
export const getRuleXProductionRule = (
	startDimensionExtent: number | 'domain' | null,
	dimension: string,
	scaleType: ScaleType,
): NumericValueRef => {
	const scale = getScaleName('x', scaleType);
	switch (startDimensionExtent) {
		case null:
			return { scale, field: `${dimension}Min` };
		case 'domain':
			return { value: 0 };
		default:
			return { scale, value: startDimensionExtent };
	}
};

/**
 * gets the production rule for the x2 encoding of a rule mark
 * @param endDimensionExtent
 * @param dimension
 * @param scaleType
 * @returns x2 production rule
 */
export const getRuleX2ProductionRule = (
	endDimensionExtent: number | 'domain' | null,
	dimension: string,
	scaleType: ScaleType,
): NumericValueRef => {
	const scale = getScaleName('x', scaleType);
	switch (endDimensionExtent) {
		case null:
			return { scale, field: `${dimension}Max` };
		case 'domain':
			return { signal: 'width' };
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
	const { colorScheme, dimension } = markProps;
	const scaleType = getTrendlineScaleType(markProps);
	const { lineType, lineWidth, metric, name } = trendlineProps;

	const x = trendlineUsesNormalizedDimension(trendlineProps.method, scaleType)
		? { scale: 'xTrendline', field: `${dimension}Normalized` }
		: getXProductionRule(scaleType, dimension);
	const color = trendlineProps.color ? { value: trendlineProps.color } : markProps.color;

	return {
		name,
		type: 'line',
		from: { data: `${name}_facet` },
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: metric },
				stroke: getColorProductionRule(color, colorScheme),
				strokeDash: getStrokeDashProductionRule({ value: lineType }),
				strokeOpacity: getOpacityProductionRule({ value: trendlineProps.opacity }),
				strokeWidth: getLineWidthProductionRule({ value: lineWidth }),
			},
			update: {
				x,
				opacity: getLineOpacity(getLineMarkProps(markProps, trendlineProps)),
			},
		},
	};
};

const getTrendlineHoverMarks = (lineProps: TrendlineParentProps, highlightRawPoint: boolean): GroupMark => {
	const { children, metric, name } = lineProps;
	const trendlines = getTrendlines(children, name);
	const trendlineHoverProps: LineMarkProps = getLineMarkProps(lineProps, trendlines[0], {
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
	{ displayOnHover, lineWidth, metric, name, opacity }: TrendlineSpecProps,
	override?: Partial<LineMarkProps>,
): LineMarkProps => {
	const { children, color, colorScheme, dimension, interactiveMarkName, lineType } = markProps;
	const popoverMarkName = 'popoverMarkName' in markProps ? markProps.popoverMarkName : undefined;
	const scaleType = getTrendlineScaleType(markProps);
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
		scaleType,
		staticPoint,
		...override,
	};
};
