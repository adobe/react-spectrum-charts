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
import { Annotation } from '@components/Annotation';
import {
	ANNOTATION_FONT_SIZE,
	ANNOTATION_FONT_WEIGHT,
	BACKGROUND_COLOR,
	CORNER_RADIUS,
	DEFAULT_OPACITY_RULE,
	DISCRETE_PADDING,
	FILTERED_TABLE,
	HIGHLIGHTED_ITEM,
	MARK_ID,
	SELECTED_ITEM,
	STACK_ID,
} from '@constants';
import {
	getColorProductionRule,
	getCursor, getHighlightOpacityAnimationValue,
	getHighlightOpacityValue,
	getOpacityProductionRule,
	getStrokeDashProductionRule,
	getTooltip,
	hasInteractiveChildren,
	hasPopover
} from '@specBuilder/marks/markUtils';
import { getAnimationMarks, getColorValue, getLineWidthPixelsFromLineWidth } from '@specBuilder/specUtils';
import { sanitizeMarkChildren } from '@utils';
import { AnnotationElement, AnnotationStyleProps, BarSpecProps, Orientation } from 'types';
import {
	ArrayValueRef,
	ColorValueRef,
	EncodeEntry,
	GroupMark,
	Mark,
	NumericValueRef,
	ProductionRule,
	RectEncodeEntry,
} from 'vega';

import { getTrellisProperties, isTrellised } from './trellisedBarUtils';

const LABEL_HEIGHT = 22;

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
		: { scale: scaleKey, signal: "0" }

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
	const { metricAxis: startKey, metricScaleKey: scaleKey } = getOrientationProperties(props.orientation);
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
	const { metricAxis: startKey, metricScaleKey: scaleKey } = getOrientationProperties(props.orientation);
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
	const { type, lineWidth, metric } = props;
	const value = Math.max(1, CORNER_RADIUS - getLineWidthPixelsFromLineWidth(lineWidth) / 2);

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

export const getStackedCornerRadiusEncodings = ({ name, metric, lineWidth }: BarSpecProps): RectEncodeEntry => {
	const topTestString = `datum.${metric}1 > 0 && data('${name}_stacks')[indexof(pluck(data('${name}_stacks'), '${STACK_ID}'), datum.${STACK_ID})].max_${metric}1 === datum.${metric}1`;
	const bottomTestString = `datum.${metric}1 < 0 && data('${name}_stacks')[indexof(pluck(data('${name}_stacks'), '${STACK_ID}'), datum.${STACK_ID})].min_${metric}1 === datum.${metric}1`;
	const value = Math.max(1, CORNER_RADIUS - getLineWidthPixelsFromLineWidth(lineWidth) / 2);

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

export const getAnnotationMetricAxisPosition = (
	props: BarSpecProps,
	annotationWidth: AnnotationWidth
): ProductionRule<NumericValueRef> => {
	const { type, metric, orientation } = props;
	const field = type === 'stacked' || isDodgedAndStacked(props) ? `${metric}1` : metric;
	const { metricScaleKey: scaleKey } = getOrientationProperties(orientation);
	const positionOffset = getAnnotationPositionOffset(props, annotationWidth);

	if (orientation === 'vertical') {
		return [
			{
				test: `datum.${field} < 0`,
				signal: `max(scale('${scaleKey}', datum.${field}), scale('${scaleKey}', 0) + ${positionOffset})`,
			},
			{
				signal: `min(scale('${scaleKey}', datum.${field}), scale('${scaleKey}', 0) - ${positionOffset})`,
			},
		];
	}

	return [
		{
			test: `datum.${field} < 0`,
			signal: `min(scale('${scaleKey}', datum.${field}), scale('${scaleKey}', 0) - ${positionOffset})`,
		},
		{
			signal: `max(scale('${scaleKey}', datum.${field}), scale('${scaleKey}', 0) + ${positionOffset})`,
		},
	];
};

export const getAnnotationPositionOffset = (
	{ orientation }: BarSpecProps,
	annotationWidth: AnnotationWidth
): string => {
	const pixelGapFromBaseline = 2.5;

	if (orientation === 'vertical') {
		return `${LABEL_HEIGHT / 2 + pixelGapFromBaseline}`;
	}

	if ('value' in annotationWidth) {
		return `${annotationWidth.value / 2 + pixelGapFromBaseline}`;
	}

	// Need parens for order of operations
	// Evaluate signal expression first, then divide by 2, then add extra offset
	return `((${annotationWidth.signal}) / 2 + ${pixelGapFromBaseline})`;
};

type AnnotationWidth = { value: number } | { signal: string };
const getAnnotationWidth = (textKey: string, style?: AnnotationStyleProps): AnnotationWidth => {
	if (style?.width) return { value: style.width };
	return { signal: `getLabelWidth(datum.${textKey}, '${ANNOTATION_FONT_WEIGHT}', ${ANNOTATION_FONT_SIZE}) + 10` };
};

export const getAnnotationMarks = (
	barProps: BarSpecProps,

	// These have to be local fields because it could be used in a group,
	// in which case we don't want to use the "global" (full table) values.
	localDataTableName: string,
	localDimensionScaleKey: string,
	localDimensionField: string
) => {
	const marks: Mark[] = [];
	const children = sanitizeMarkChildren(barProps.children);
	// bar only supports one annotation
	const annotation = children.find((el) => el.type === Annotation) as AnnotationElement;
	if (annotation?.props.textKey) {
		const { orientation, name, animations } = barProps;
		const { textKey, style } = annotation.props;
		const { metricAxis, dimensionAxis } = getOrientationProperties(orientation);
		const annotationWidth = getAnnotationWidth(textKey, style);
		const annotationPosition = getAnnotationMetricAxisPosition(barProps, annotationWidth);

		marks.push({
			name: `${name}_annotationBackground`,
			type: 'rect',
			from: { data: localDataTableName },
			interactive: false,
			encode: {
				enter: {
					align: { value: 'center' },
					baseline: { value: 'middle' },
					[`${dimensionAxis}c`]: { scale: localDimensionScaleKey, field: localDimensionField, band: 0.5 },
					[`${metricAxis}c`]: annotationPosition,
					cornerRadius: { value: 4 },
					height: { value: LABEL_HEIGHT },
					fill: [
						{
							test: `datum.${textKey} && bandwidth('${localDimensionScaleKey}') >= 48`,
							signal: BACKGROUND_COLOR,
						},
					],
					width: annotationWidth,
				},
				...(animations !== false && {
					update: {
						fillOpacity: {
							signal: 'timerValue === 1 ? 1 : 0'
						}
					}
				})
			},
		});
		marks.push({
			name: `${name}_annotationText`,
			type: 'text',
			from: { data: localDataTableName },
			interactive: false,
			encode: {
				enter: {
					[dimensionAxis]: {
						scale: localDimensionScaleKey,
						field: localDimensionField,
						band: 0.5,
					},
					[metricAxis]: annotationPosition,
					text: [{ test: `bandwidth('${localDimensionScaleKey}') >= 48`, field: textKey }],
					fontSize: { value: ANNOTATION_FONT_SIZE },
					fontWeight: { value: ANNOTATION_FONT_WEIGHT },
					baseline: { value: 'middle' },
					align: { value: 'center' },
				},
				...(animations !== false && {
					update: {
						fillOpacity: {
							signal: 'timerValue === 1 ? 1 : 0'
						}
					}
				})
			},
		});
	}
	return marks;
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
	cursor: getCursor(props.children),
	opacity: getBarOpacity(props),
	stroke: getStroke(props),
	strokeDash: getStrokeDash(props),
	strokeWidth: getStrokeWidth(props),
});

export const getBarOpacity = ({ children, animations }: BarSpecProps): ProductionRule<NumericValueRef> => {
	// if there aren't any interactive components, then we don't need to add special opacity rules
	if (!hasInteractiveChildren(children)) {
		return [DEFAULT_OPACITY_RULE];
	}

	//TODO: Add documentation
	if (animations == true) {
		return getAnimationsFillOpacity();
	}

	// if a bar is hovered/selected, all other bars should have reduced opacity
	if (hasPopover(children)) {
		return [
			{
				test: `!${SELECTED_ITEM} && ${HIGHLIGHTED_ITEM} && ${HIGHLIGHTED_ITEM} !== datum.${MARK_ID}`,
				...getHighlightOpacityValue(DEFAULT_OPACITY_RULE),
			},
			{
				test: `${SELECTED_ITEM} && ${SELECTED_ITEM} !== datum.${MARK_ID}`,
				...getHighlightOpacityValue(DEFAULT_OPACITY_RULE),
			},
			{ test: `${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}`, ...DEFAULT_OPACITY_RULE },
			DEFAULT_OPACITY_RULE,
		];
	}
	return [
		{
			test: `${HIGHLIGHTED_ITEM} && ${HIGHLIGHTED_ITEM} !== datum.${MARK_ID}`,
			...getHighlightOpacityValue(),
		},
		DEFAULT_OPACITY_RULE,
	];
};

//TODO: Add documentation
const getAnimationsFillOpacity = (): ProductionRule<NumericValueRef> => {
	return [
		{
			test: `!${SELECTED_ITEM} && ${HIGHLIGHTED_ITEM} && ${HIGHLIGHTED_ITEM} !== datum.${MARK_ID}`,
			...getHighlightOpacityAnimationValue(DEFAULT_OPACITY_RULE)
		},
		{
			test: `${SELECTED_ITEM} && ${SELECTED_ITEM} !== datum.${MARK_ID}`,
			...getHighlightOpacityAnimationValue(DEFAULT_OPACITY_RULE)
		},
		...getAnimationProductionRule(),
		{ value: 1 }
	];
};

//TODO: Add documentation
const getAnimationProductionRule = (): [
	{ test: string, signal: string } | { test: string, value: number }] => {
	return [
		{
			test: `${HIGHLIGHTED_ITEM}_prev !== datum.${MARK_ID} && rscColorAnimationDirection === -1`,
			...getHighlightOpacityAnimationValue(DEFAULT_OPACITY_RULE)
		}];
}
export const getStroke = ({ children, color, colorScheme }: BarSpecProps): ProductionRule<ColorValueRef> => {
	const defaultProductionRule = getColorProductionRule(color, colorScheme);
	if (!hasPopover(children)) {
		return [defaultProductionRule];
	}

	return [
		{
			test: `${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}`,
			value: getColorValue('static-blue', colorScheme),
		},
		defaultProductionRule,
	];
};

export const getStrokeDash = ({ children, lineType }: BarSpecProps): ProductionRule<ArrayValueRef> => {
	const defaultProductionRule = getStrokeDashProductionRule(lineType);
	if (!hasPopover(children)) {
		return [defaultProductionRule];
	}

	return [{ test: `${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}`, value: [] }, defaultProductionRule];
};

export const getStrokeWidth = ({ children, lineWidth }: BarSpecProps): ProductionRule<NumericValueRef> => {
	const lineWidthValue = getLineWidthPixelsFromLineWidth(lineWidth);
	const defaultProductionRule = { value: lineWidthValue };
	if (!hasPopover(children)) {
		return [defaultProductionRule];
	}

	return [
		{ test: `${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID}`, value: Math.max(lineWidthValue, 2) },
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
	metricScaleKey: 'yLinear' | 'xLinear';
	dimensionScaleKey: 'xBand' | 'yBand';
	rangeScale: 'width' | 'height';
}

export const getOrientationProperties = (orientation: Orientation): BarOrientationProperties =>
	orientation === 'vertical'
		? {
				metricAxis: 'y',
				dimensionAxis: 'x',
				metricScaleKey: 'yLinear',
				dimensionScaleKey: 'xBand',
				rangeScale: 'width',
		  }
		: {
				metricAxis: 'x',
				dimensionAxis: 'y',
				metricScaleKey: 'xLinear',
				dimensionScaleKey: 'yBand',
				rangeScale: 'height',
		  };
