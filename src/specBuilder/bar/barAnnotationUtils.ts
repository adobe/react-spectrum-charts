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
import { Annotation } from '@components/Annotation';
import { ANNOTATION_ANIMATION_OPACITY, ANNOTATION_FONT_SIZE, ANNOTATION_FONT_WEIGHT, ANNOTATION_PADDING, BACKGROUND_COLOR } from '@constants';
import { GroupMark, NumericValueRef, ProductionRule, RectEncodeEntry, RectMark, TextMark } from 'vega';

import {
	AnnotationElement,
	AnnotationProps,
	AnnotationSpecProps,
	AnnotationStyleProps,
	BarSpecProps,
	Orientation,
} from '../../types';
import { getOrientationProperties, isDodgedAndStacked } from './barUtils';

type AnnotationWidth = { value: number } | { signal: string };

/**
 * Gets the Annotation component from the children if one exists and applies default props, returning the AnnotationSpecProps
 * @param barProps
 * @returns AnnotationSpecProps | undefined
 */
const getAnnotation = (
	props: BarSpecProps,
	dataName: string,
	dimensionScaleName: string,
	dimensionField: string
): AnnotationSpecProps | undefined => {
	const annotation = props.children.find((child) => child.type === Annotation) as AnnotationElement;

	if (!annotation) {
		return;
	}
	return applyAnnotationPropDefaults(annotation.props, props, dataName, dimensionScaleName, dimensionField);
};

/**
 * Applies all default props, converting AnnotationProps into AnnotationSpecProps
 * @param annotationProps
 * @param barProps
 * @returns AnnotationSpecProps
 */
const applyAnnotationPropDefaults = (
	{ textKey, ...props }: AnnotationProps,
	barProps: BarSpecProps,
	dataName: string,
	dimensionScaleName: string,
	dimensionField: string
): AnnotationSpecProps => ({
	barProps,
	textKey: textKey || barProps.metric,
	dataName,
	dimensionScaleName,
	dimensionField,
	...props,
});

/**
 * Gets the annotation marks for the bar chart. Returns an empty array if no annotation is provided on the bar children.
 * @param barProps
 * @param dataName
 * @param dimensionScaleName
 * @param dimensionName
 * @returns GroupMark[]
 */
export const getAnnotationMarks = (
	barProps: BarSpecProps,

	// These have to be local fields because it could be used in a group,
	// in which case we don't want to use the "global" (full table) values.
	dataName: string,
	dimensionScaleName: string,
	dimensionName: string
): GroupMark[] => {
	const annotationProps = getAnnotation(barProps, dataName, dimensionScaleName, dimensionName);
	if (!annotationProps) {
		return [];
	}

	return [
		{
			type: 'group',
			name: `${barProps.name}_annotationGroup`,
			marks: [getAnnotationTextMark(annotationProps), getAnnotationBackgroundMark(annotationProps)],
		},
	];
};

/**
 * Gets the annotation text mark for the bar chart
 * @param annotationProps
 * @returns TextMark
 */
const getAnnotationTextMark = ({
	barProps,
	dataName,
	dimensionField,
	dimensionScaleName,
	textKey,
	style,
}: AnnotationSpecProps): TextMark => {
	const { metricAxis, dimensionAxis } = getOrientationProperties(barProps.orientation);
	const annotationWidth = getAnnotationWidth(textKey, style);
	const annotationPosition = getAnnotationMetricAxisPosition(barProps, annotationWidth);

	return {
		name: `${barProps.name}_annotationText`,
		type: 'text',
		from: { data: dataName },
		interactive: false,
		zindex: 1,
		encode: {
			enter: {
				[dimensionAxis]: {
					scale: dimensionScaleName,
					field: dimensionField,
					band: 0.5,
				},
				[metricAxis]: annotationPosition,
				text: [
					{
						test: `bandwidth('${dimensionScaleName}') > ${getMinBandwidth(barProps.orientation)}`,
						field: textKey,
					},
				],
				fontSize: { value: ANNOTATION_FONT_SIZE },
				fontWeight: { value: ANNOTATION_FONT_WEIGHT },
				baseline: { value: 'middle' },
				align: { value: 'center' },
			},
      ...(barProps.animations && {
        update: {
          fillOpacity: { signal: ANNOTATION_ANIMATION_OPACITY },
        }
      })

		},
	};
};

/**
 * Gets the annotation background mark
 * @param annotationProps
 * @returns RectMark
 */
const getAnnotationBackgroundMark = ({
	barProps,
	dimensionScaleName,
	textKey,
	style,
}: AnnotationSpecProps): RectMark => ({
	name: `${barProps.name}_annotationBackground`,
	description: `${barProps.name}_annotationBackground`,
	type: 'rect',
	from: { data: `${barProps.name}_annotationText` },
	interactive: false,
	encode: {
		enter: {
			...getAnnotationXEncode(style?.width),
			y: { signal: `datum.bounds.y1  - ${ANNOTATION_PADDING}` },
			y2: { signal: `datum.bounds.y2  + ${ANNOTATION_PADDING}` },
			cornerRadius: { value: 4 },
			fill: [
				{
					test: `datum.datum.${textKey} && bandwidth('${dimensionScaleName}') > ${getMinBandwidth(
						barProps.orientation
					)}`,
					signal: BACKGROUND_COLOR,
				},
			],
		},
		...(barProps.animations && {
        update: {
          fillOpacity: { signal: ANNOTATION_ANIMATION_OPACITY },
        }
      })
	},
});

/**
 * Gets the minimum band width needed to display the annotations based on the bar orientation
 * @param orientation
 * @returns number
 */
export const getMinBandwidth = (orientation: Orientation): number =>
	orientation === 'vertical' ? 48 : ANNOTATION_FONT_SIZE + 2 * ANNOTATION_PADDING;

/**
 * Gets the x position encoding for the annotation background
 * @param width
 * @returns RectEncodeEntry
 */
export const getAnnotationXEncode = (width?: number): RectEncodeEntry => {
	if (width) {
		return {
			xc: { signal: '(datum.bounds.x1 + datum.bounds.x2) / 2' },
			width: { value: width },
		};
	}
	return {
		x: { signal: `datum.bounds.x1 - ${ANNOTATION_PADDING}` },
		x2: { signal: `datum.bounds.x2 + ${ANNOTATION_PADDING}` },
	};
};

export const getAnnotationWidth = (textKey: string, style?: AnnotationStyleProps): AnnotationWidth => {
	if (style?.width) return { value: style.width };
	return {
		signal: `getLabelWidth(datum.${textKey}, '${ANNOTATION_FONT_WEIGHT}', ${ANNOTATION_FONT_SIZE}) + ${
			2 * ANNOTATION_PADDING
		}`,
	};
};

/**
 * Offset calculation to make sure the annotation does not overlap the baseline
 * @param barProps
 * @param annotationWidth
 * @returns string
 */
export const getAnnotationPositionOffset = (
	{ orientation }: BarSpecProps,
	annotationWidth: AnnotationWidth
): string => {
	const pixelGapFromBaseline = 2.5;

	if (orientation === 'vertical') {
		return `${(2 * ANNOTATION_PADDING + ANNOTATION_FONT_SIZE) / 2 + pixelGapFromBaseline}`;
	}

	if ('value' in annotationWidth) {
		return `${annotationWidth.value / 2 + pixelGapFromBaseline}`;
	}

	// Need parens for order of operations
	// Evaluate signal expression first, then divide by 2, then add extra offset
	return `((${annotationWidth.signal}) / 2 + ${pixelGapFromBaseline})`;
};

/**
 * Gets the metric position for the annotation text.
 * This ensures that the annotation does not overlap the baseline.
 * @param barProps
 * @param annotationWidth
 * @returns NumericValueref
 */
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
