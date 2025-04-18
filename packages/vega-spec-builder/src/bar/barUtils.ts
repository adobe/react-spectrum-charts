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

import { CORNER_RADIUS, FILTERED_TABLE, SELECTED_GROUP, SELECTED_ITEM, STACK_ID } from '@spectrum-charts/constants';
import { getColorValue } from '@spectrum-charts/themes';

import { getPopovers } from '../chartPopover/chartPopoverUtils';
import {
	getColorProductionRule,
	getCursor,
	getMarkOpacity,
	getOpacityProductionRule,
	getStrokeDashProductionRule,
	getTooltip,
	hasPopover,
} from '../marks/markUtils';
import { getBandPadding } from '../scale/scaleSpecBuilder';
import { getLineWidthPixelsFromLineWidth } from '../specUtils';
import { BarSpecOptions, Orientation } from '../types';
import { getTrellisProperties, isTrellised } from './trellisedBarUtils';

/**
 * checks to see if the bar is faceted in the stacked and dodged dimensions
 * @param color
 */
export const isDodgedAndStacked = ({ color, lineType, opacity }: BarSpecOptions): boolean => {
	return [color, lineType, opacity].some((facet) => Array.isArray(facet) && facet.length === 2);
};

export const getDodgedGroupMark = (options: BarSpecOptions): GroupMark => {
	const { dimension, groupedPadding, orientation, name, paddingRatio } = options;

	const { dimensionScaleKey, dimensionAxis, rangeScale } = getOrientationProperties(orientation);

	return {
		name: `${name}_group`,
		type: 'group',
		from: {
			facet: {
				data: isTrellised(options) ? getTrellisProperties(options).facetName : FILTERED_TABLE,
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

export const getDodgedDimensionEncodings = (options: BarSpecOptions): RectEncodeEntry => {
	const { dimensionAxis, rangeScale } = getOrientationProperties(options.orientation);

	const scale = `${options.name}_position`;
	const field = `${options.name}_dodgeGroup`;

	return {
		[dimensionAxis]: { scale, field },
		[rangeScale]: { scale, band: 1 },
	};
};

export const getTrellisedDimensionEncodings = (options: BarSpecOptions): RectEncodeEntry => {
	const { dimensionAxis, rangeScale, dimensionScaleKey } = getOrientationProperties(options.orientation);

	return {
		[dimensionAxis]: { scale: dimensionScaleKey, field: options.dimension },
		[rangeScale]: { scale: dimensionScaleKey, band: 1 },
	};
};

export const getMetricEncodings = (options: BarSpecOptions): RectEncodeEntry => {
	const { metric, type, dualYAxis } = options;
	const { metricAxis: startKey, metricScaleKey: scaleKey } = getOrientationProperties(
		options.orientation,
		options.metricAxis
	);
	const endKey = `${startKey}2`;

	if (type === 'stacked' || isDodgedAndStacked(options)) {
		return getStackedMetricEncodings(options);
	}

	if (dualYAxis) {
		return {
			[startKey]: [
				{
					test: 'datum.rscSeriesId === lastRscSeriesId',
					scale: `${scaleKey}SecondaryAxis`,
					value: 0,
				},
				{
					scale: `${scaleKey}PrimaryAxis`,
					value: 0,
				},
			],
			[endKey]: [
				{
					test: 'datum.rscSeriesId === lastRscSeriesId',
					scale: `${scaleKey}SecondaryAxis`,
					field: metric,
				},
				{
					scale: `${scaleKey}PrimaryAxis`,
					field: metric,
				},
			],
		};
	}

	return {
		[startKey]: { scale: scaleKey, value: 0 },
		[endKey]: { scale: scaleKey, field: metric },
	};
};

export const getStackedMetricEncodings = (options: BarSpecOptions): RectEncodeEntry => {
	const { metric, orientation } = options;
	const { metricAxis: startKey, metricScaleKey: scaleKey } = getOrientationProperties(
		options.orientation,
		options.metricAxis
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

export const getCornerRadiusEncodings = (options: BarSpecOptions): RectEncodeEntry => {
	const { type, lineWidth, metric, hasSquareCorners } = options;
	const value = hasSquareCorners ? 0 : Math.max(1, CORNER_RADIUS - getLineWidthPixelsFromLineWidth(lineWidth) / 2);

	let rectEncodeEntry: RectEncodeEntry;

	if (type === 'dodged' && !isDodgedAndStacked(options)) {
		rectEncodeEntry = {
			cornerRadiusTopLeft: [{ test: `datum.${metric} > 0`, value }, { value: 0 }],
			cornerRadiusTopRight: [{ test: `datum.${metric} > 0`, value }, { value: 0 }],
			cornerRadiusBottomLeft: [{ test: `datum.${metric} < 0`, value }, { value: 0 }],
			cornerRadiusBottomRight: [{ test: `datum.${metric} < 0`, value }, { value: 0 }],
		};
	} else {
		rectEncodeEntry = getStackedCornerRadiusEncodings(options);
	}

	return rotateRectClockwiseIfNeeded(rectEncodeEntry, options);
};

export const getStackedCornerRadiusEncodings = ({
	name,
	metric,
	lineWidth,
	hasSquareCorners,
}: BarSpecOptions): RectEncodeEntry => {
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
	{ orientation }: BarSpecOptions
): RectEncodeEntry => {
	if (orientation === 'vertical') return rectEncodeEntry;
	return {
		cornerRadiusTopLeft: rectEncodeEntry.cornerRadiusBottomLeft,
		cornerRadiusTopRight: rectEncodeEntry.cornerRadiusTopLeft,
		cornerRadiusBottomLeft: rectEncodeEntry.cornerRadiusBottomRight,
		cornerRadiusBottomRight: rectEncodeEntry.cornerRadiusTopRight,
	};
};

export const getBaseBarEnterEncodings = (options: BarSpecOptions): EncodeEntry => ({
	...getMetricEncodings(options),
	...getCornerRadiusEncodings(options),
});

export const getBarEnterEncodings = ({
	chartTooltips,
	color,
	colorScheme,
	name,
	opacity,
}: BarSpecOptions): EncodeEntry => ({
	fill: getColorProductionRule(color, colorScheme),
	fillOpacity: getOpacityProductionRule(opacity),
	tooltip: getTooltip(chartTooltips, name),
});

export const getBarUpdateEncodings = (options: BarSpecOptions): EncodeEntry => ({
	cursor: getCursor(options.chartPopovers, options.hasOnClick),
	opacity: getMarkOpacity(options),
	stroke: getStroke(options),
	strokeDash: getStrokeDash(options),
	strokeWidth: getStrokeWidth(options),
});

export const getStroke = ({
	name,
	chartPopovers,
	color,
	colorScheme,
	idKey,
}: BarSpecOptions): ProductionRule<ColorValueRef> => {
	const defaultProductionRule = getColorProductionRule(color, colorScheme);
	if (!hasPopover({ chartPopovers })) {
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

export const getDimensionSelectionRing = (options: BarSpecOptions): RectMark => {
	const { name, colorScheme, paddingRatio, orientation } = options;

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

export const getStrokeDash = ({ chartPopovers, idKey, lineType }: BarSpecOptions): ProductionRule<ArrayValueRef> => {
	const defaultProductionRule = getStrokeDashProductionRule(lineType);
	if (!hasPopover({ chartPopovers })) {
		return [defaultProductionRule];
	}

	return [
		{ test: `isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} === datum.${idKey}`, value: [] },
		defaultProductionRule,
	];
};

export const getStrokeWidth = ({
	chartPopovers,
	idKey,
	lineWidth,
	name,
}: BarSpecOptions): ProductionRule<NumericValueRef> => {
	const lineWidthValue = getLineWidthPixelsFromLineWidth(lineWidth);
	const defaultProductionRule = { value: lineWidthValue };
	const popovers = getPopovers(chartPopovers, name);
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
	return getBandPadding(paddingRatio, paddingOuter);
};

export const getScaleValues = (options: BarSpecOptions) => {
	return options.type === 'stacked' || isDodgedAndStacked(options) ? [`${options.metric}1`] : [options.metric];
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
