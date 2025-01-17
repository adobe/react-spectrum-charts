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
import { CORNER_RADIUS, DISCRETE_PADDING, FILTERED_TABLE, SELECTED_GROUP, SELECTED_ITEM, STACK_ID } from '@constants';
import { getPopovers } from '@specBuilder/chartPopover/chartPopoverUtils';
import {
	getColorProductionRule,
	getCursor,
	getMarkOpacity,
	getOpacityProductionRule,
	getStrokeDashProductionRule,
	getTooltip,
	hasPopover,
} from '@specBuilder/marks/markUtils';
import { getAnimationMarks, getColorValue, getLineWidthPixelsFromLineWidth } from '@specBuilder/specUtils';
import { sanitizeMarkChildren } from '@utils';
import {
	ArrayValueRef,
	ColorValueRef,
	EncodeEntry,
	GroupMark,
	NumericValueRef,
	ProductionRule,
	RectEncodeEntry,
	RectMark,
} from 'vega';

import { BarSpecProps, Orientation, BarSpecProps, Orientation } from '../../types';
import { getTrellisProperties, isTrellised } from './trellisedBarUtils';

/**
 * checks to see if the bar is faceted in the stacked and dodged dimensions
 * @param color
 */
export const isDodgedAndStacked = ({ color, lineType, opacity }: BarSpecProps): boolean => {
	return [color, lineType, opacity].some((facet) => Array.isArray(facet) && facet.length === 2);
};

export const getDodgedGroupMark = (props: BarSpecProps): GroupMark => {
	const { dimension, groupedPadding, orientation, name, paddingRatio } = props;

	const { dimensionScaleKey, dimensionAxis, rangeScale } = getOrientationProperties(orientation);

	return {
		name: `${name}_group`,
		type: 'group',
		from: {
			facet: {
				data: isTrellised(props) ? getTrellisProperties(props).facetName : FILTERED_TABLE,
				name: `${name}_facet`,
				groupby: dimension,
			},
		},
		encode: {
			enter: {
				[dimensionAxis]: {
					scale: dimensionScaleKey,
					field: dimension,
				},
			},
		},
		signals: [{ name: rangeScale, update: `bandwidth("${dimensionScaleKey}")` }],
		scales: [
			{
				name: `${name}_position`,
				type: 'band',
				range: rangeScale,
				// want to reference the FILTERED_TABLE and not the facet table because we want the bar widths and positioning to be consistent across facets
				// if we don't do this, the bar widths could be different for the different groups if one of the groups is missing a value
				domain: { data: FILTERED_TABLE, field: `${name}_dodgeGroup` },
				paddingInner: groupedPadding ?? paddingRatio,
			},
		],
	};
};

export const getDodgedDimensionEncodings = (props: BarSpecProps): RectEncodeEntry => {
	const { animations, dimension, metric, previousData, data} = props;

	const { dimensionAxis, metricAxis: startKey, rangeScale, metricScaleKey: scaleKey } = getOrientationProperties(props.orientation);

	const scale = `${props.name}_position`;
	const field = `${props.name}_dodgeGroup`;

	const isStacked = isDodgedAndStacked(props);

	const startMetric = isStacked ? `${metric}0` : metric;
	const endMetric = `${metric}1`;

	const endAnimations = isStacked ? getAnimationMarks(dimension, endMetric, data, previousData, scaleKey)
		: { scale: 'yLinear', signal: "0" }

	const endKey = `${startKey}2`;

	return {
		...(animations !== false && {
			[startKey]: getAnimationMarks(dimension, startMetric, data, previousData, scaleKey),
			[endKey]: endAnimations
		}),
		[dimensionAxis]: { scale, field },
		[rangeScale]: { scale, band: 1 },
	};
};

export const getTrellisedDimensionEncodings = (props: BarSpecProps): RectEncodeEntry => {
	const { dimensionAxis, rangeScale, dimensionScaleKey } = getOrientationProperties(props.orientation);

	return {
		[dimensionAxis]: { scale: dimensionScaleKey, field: props.dimension },
		[rangeScale]: { scale: dimensionScaleKey, band: 1 },
	};
};

export const getMetricEncodings = (props: BarSpecProps): RectEncodeEntry => {
	const { metric, type } = props;
	const { metricAxis: startKey, metricScaleKey: scaleKey } = getOrientationProperties(
		props.orientation,
		props.metricAxis
	);
	const endKey = `${startKey}2`;

	if (type === 'stacked' || isDodgedAndStacked(props)) {
		return getStackedMetricEncodings(props);
	}
	return {
		[startKey]: { scale: scaleKey, value: 0 },
		[endKey]: { scale: scaleKey, field: metric },
	};
};

export const getStackedMetricEncodings = (props: BarSpecProps): RectEncodeEntry => {
	const { metric, orientation } = props;
	const { metricAxis: startKey, metricScaleKey: scaleKey } = getOrientationProperties(
		props.orientation,
		props.metricAxis
	);
	const endKey = `${startKey}2`;

	const startValue = `datum.${metric}0`;
	const endValue = `datum.${metric}1`;

	const pixelGapBetweenBars = 1.5;

	if (orientation === 'vertical') {
		return {
			[startKey]: [
				// if the bar starts at 0, no need to calculate any shifts
				{ test: `${startValue} === 0`, signal: `scale('${scaleKey}', ${startValue})` },
				// if the bar is positive, shift the start up by 1.5px gap
				{
					test: `${endValue} > 0`,
					signal: `max(scale('${scaleKey}', ${startValue}) - ${pixelGapBetweenBars}, scale('${scaleKey}', ${endValue}))`,
				},
				// if the bar is negative, shift the start down by 1.5px gap
				{
					signal: `min(scale('${scaleKey}', ${startValue}) + ${pixelGapBetweenBars}, scale('${scaleKey}', ${endValue}))`,
				},
			],
			[endKey]: { scale: scaleKey, field: `${metric}1` },
		};
	}

	return {
		[startKey]: [
			// if the bar starts at 0, no need to calculate any shifts
			{ test: `${startValue} === 0`, signal: `scale('${scaleKey}', ${startValue})` },
			// if the bar is positive, shift the start right by 1.5px gap
			{
				test: `${endValue} > 0`,
				signal: `min(scale('${scaleKey}', ${startValue}) + ${pixelGapBetweenBars}, scale('${scaleKey}', ${endValue}))`,
			},
			// if the bar is negative, shift the start left by 1.5px gap
			{
				signal: `max(scale('${scaleKey}', ${startValue}) - ${pixelGapBetweenBars}, scale('${scaleKey}', ${endValue}))`,
			},
		],
		[endKey]: { scale: scaleKey, field: `${metric}1` },
	};
};

export const getCornerRadiusEncodings = (props: BarSpecProps): RectEncodeEntry => {
	const { type, lineWidth, metric, hasSquareCorners } = props;
	const value = hasSquareCorners ? 0 : Math.max(1, CORNER_RADIUS - getLineWidthPixelsFromLineWidth(lineWidth) / 2);

	let rectEncodeEntry: RectEncodeEntry;

	if (type === 'dodged' && !isDodgedAndStacked(props)) {
		rectEncodeEntry = {
			cornerRadiusTopLeft: [{ test: `datum.${metric} > 0`, value }, { value: 0 }],
			cornerRadiusTopRight: [{ test: `datum.${metric} > 0`, value }, { value: 0 }],
			cornerRadiusBottomLeft: [{ test: `datum.${metric} < 0`, value }, { value: 0 }],
			cornerRadiusBottomRight: [{ test: `datum.${metric} < 0`, value }, { value: 0 }],
		};
	} else {
		rectEncodeEntry = getStackedCornerRadiusEncodings(props);
	}

	return rotateRectClockwiseIfNeeded(rectEncodeEntry, props);
};

export const getStackedCornerRadiusEncodings = ({
	name,
	metric,
	lineWidth,
	hasSquareCorners,
}: BarSpecProps): RectEncodeEntry => {
	const topTestString = `datum.${metric}1 > 0 && data('${name}_stacks')[indexof(pluck(data('${name}_stacks'), '${STACK_ID}'), datum.${STACK_ID})].max_${metric}1 === datum.${metric}1`;
	const bottomTestString = `datum.${metric}1 < 0 && data('${name}_stacks')[indexof(pluck(data('${name}_stacks'), '${STACK_ID}'), datum.${STACK_ID})].min_${metric}1 === datum.${metric}1`;
	const value = hasSquareCorners ? 0 : Math.max(1, CORNER_RADIUS - getLineWidthPixelsFromLineWidth(lineWidth) / 2);

	return {
		cornerRadiusTopLeft: [{ test: topTestString, value }, { value: 0 }],
		cornerRadiusTopRight: [{ test: topTestString, value }, { value: 0 }],
		cornerRadiusBottomLeft: [{ test: bottomTestString, value }, { value: 0 }],
		cornerRadiusBottomRight: [{ test: bottomTestString, value }, { value: 0 }],
	};
};

export const rotateRectClockwiseIfNeeded = (
	rectEncodeEntry: RectEncodeEntry,
	{ orientation }: BarSpecProps
): RectEncodeEntry => {
	if (orientation === 'vertical') return rectEncodeEntry;
	return {
		cornerRadiusTopLeft: rectEncodeEntry.cornerRadiusBottomLeft,
		cornerRadiusTopRight: rectEncodeEntry.cornerRadiusTopLeft,
		cornerRadiusBottomLeft: rectEncodeEntry.cornerRadiusBottomRight,
		cornerRadiusBottomRight: rectEncodeEntry.cornerRadiusTopRight,
	};
};

export const getBaseBarEnterEncodings = (props: BarSpecProps): EncodeEntry => ({
	...getMetricEncodings(props),
	...getCornerRadiusEncodings(props),
});

export const getBarEnterEncodings = ({ children, color, colorScheme, name, opacity }: BarSpecProps): EncodeEntry => ({
	fill: getColorProductionRule(color, colorScheme),
	fillOpacity: getOpacityProductionRule(opacity),
	tooltip: getTooltip(children, name),
});

export const getBarUpdateEncodings = (props: BarSpecProps): EncodeEntry => ({
	cursor: getCursor(props.children, props),
	opacity: getMarkOpacity(props),
	stroke: getStroke(props),
	strokeDash: getStrokeDash(props),
	strokeWidth: getStrokeWidth(props),
});

export const getStroke = ({
	name,
	children,
	color,
	colorScheme,
	idKey,
}: BarSpecProps): ProductionRule<ColorValueRef> => {
	const defaultProductionRule = getColorProductionRule(color, colorScheme);
	if (!hasPopover(children)) {
		return [defaultProductionRule];
	}

	return [
		{
			test: `(${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${idKey}) || (${SELECTED_GROUP} && ${SELECTED_GROUP} === datum.${name}_selectedGroupId)`,
			value: getColorValue('static-blue', colorScheme),
		},
		defaultProductionRule,
	];
};

export const getDimensionSelectionRing = (props: BarSpecProps): RectMark => {
	const { name, colorScheme, paddingRatio, orientation } = props;

	const update =
		orientation === 'vertical'
			? {
					y: { value: 0 },
					y2: { signal: 'height' },
					xc: { signal: `scale('xBand', datum.${name}_selectedGroupId) + bandwidth('xBand')/2` },
					width: { signal: `bandwidth('xBand')/(1 - ${paddingRatio} / 2)` },
			  }
			: {
					x: { value: 0 },
					x2: { signal: 'width' },
					yc: { signal: `scale('yBand', datum.${name}_selectedGroupId) + bandwidth('yBand')/2` },
					height: { signal: `bandwidth('yBand')/(1 - ${paddingRatio} / 2)` },
			  };

	return {
		name: `${name}_selectionRing`,
		type: 'rect',
		from: {
			data: `${name}_selectedData`,
		},
		interactive: false,
		encode: {
			enter: {
				fill: { value: 'transparent' },
				strokeWidth: { value: 2 },
				stroke: { value: getColorValue('static-blue', colorScheme) },
				cornerRadius: { value: 6 },
			},
			update,
		},
	};
};

export const getStrokeDash = ({ children, idKey, lineType }: BarSpecProps): ProductionRule<ArrayValueRef> => {
	const defaultProductionRule = getStrokeDashProductionRule(lineType);
	if (!hasPopover(children)) {
		return [defaultProductionRule];
	}

	return [
		{ test: `isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} === datum.${idKey}`, value: [] },
		defaultProductionRule,
	];
};

export const getStrokeWidth = (props: BarSpecProps): ProductionRule<NumericValueRef> => {
	const { idKey, lineWidth, name } = props;
	const lineWidthValue = getLineWidthPixelsFromLineWidth(lineWidth);
	const defaultProductionRule = { value: lineWidthValue };
	const popovers = getPopovers(props);
	const popoverWithDimensionHighlightExists = popovers.some(
		({ UNSAFE_highlightBy }) => UNSAFE_highlightBy === 'dimension'
	);

	if (popovers.length === 0 || popoverWithDimensionHighlightExists) {
		return [defaultProductionRule];
	}

	return [
		{
			test: `(isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} === datum.${idKey}) || (isValid(${SELECTED_GROUP}) && ${SELECTED_GROUP} === datum.${name}_selectedGroupId)`,
			value: Math.max(lineWidthValue, 2),
		},
		defaultProductionRule,
	];
};

export const getBarPadding = (paddingRatio: number, paddingOuter?: number) => {
	const paddingInner = paddingRatio;
	return {
		paddingInner,
		paddingOuter: paddingOuter === undefined ? DISCRETE_PADDING - (1 - paddingInner) / 2 : paddingOuter,
	};
};

export const getScaleValues = (props: BarSpecProps) => {
	return props.type === 'stacked' || isDodgedAndStacked(props) ? [`${props.metric}1`] : [props.metric];
};

export interface BarOrientationProperties {
	metricAxis: 'x' | 'y';
	dimensionAxis: 'x' | 'y';
	metricScaleKey: string;
	dimensionScaleKey: 'xBand' | 'yBand';
	rangeScale: 'width' | 'height';
}

export const getOrientationProperties = (orientation: Orientation, scaleName?: string): BarOrientationProperties =>
	orientation === 'vertical'
		? {
				metricAxis: 'y',
				dimensionAxis: 'x',
				metricScaleKey: scaleName || 'yLinear',
				dimensionScaleKey: 'xBand',
				rangeScale: 'width',
		  }
		: {
				metricAxis: 'x',
				dimensionAxis: 'y',
				metricScaleKey: scaleName || 'xLinear',
				dimensionScaleKey: 'yBand',
				rangeScale: 'height',
		  };
