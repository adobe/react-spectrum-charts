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
import { TrendlineAnnotation } from '@components/TrendlineAnnotation';
import { TRENDLINE_VALUE } from '@constants';
import { getColorProductionRule, getColorProductionRuleSignalString } from '@specBuilder/marks/markUtils';
import { getScaleName } from '@specBuilder/scale/scaleSpecBuilder';
import { getColorValue, getLineWidthPixelsFromLineWidth } from '@specBuilder/specUtils';
import {
	getEndDimensionExtentProductionRule,
	getStartDimensionExtentProductionRule,
} from '@specBuilder/trendline/trendlineMarkUtils';
import {
	ColorFacet,
	TrendlineAnnotationElement,
	TrendlineAnnotationProps,
	TrendlineAnnotationSpecProps,
	TrendlineSpecProps,
} from 'types';
import { ColorValueRef, GroupMark, NumericValueRef, ProductionRule, RectMark, SymbolMark, TextMark } from 'vega';

/**
 * Applies all trendline annotation defaults
 * @param trenlineAnnotationProps
 * @param index
 * @param trendlineProps
 * @param markName
 * @returns TrendlineAnnotationSpecProps
 */
export const applyTrendlineAnnotationDefaults = (
	{ badge = false, dimensionValue = 'end', numberFormat = '', prefix = '' }: TrendlineAnnotationProps,
	index: number,
	{
		colorScheme,
		dimensionExtent,
		dimensionScaleType,
		displayOnHover,
		lineWidth,
		orientation,
		trendlineColor,
		trendlineDimension,
		name: trendlineName,
	}: TrendlineSpecProps,
	markName: string
): TrendlineAnnotationSpecProps => ({
	badge,
	colorScheme,
	dimensionValue,
	displayOnHover,
	markName,
	name: `${trendlineName}Annotation${index}`,
	numberFormat,
	prefix,
	trendlineColor,
	trendlineDimension,
	trendlineDimensionExtent: dimensionExtent,
	trendlineDimensionScaleType: dimensionScaleType,
	trendlineName: trendlineName,
	trendlineOrientation: orientation,
	trendlineWidth: getLineWidthPixelsFromLineWidth(lineWidth),
});

/**
 * Gets all the annotations on a trendline
 * @param trendlineProps
 * @param markName
 * @returns TrendlineAnnotationSpecProps[]
 */
export const getTrendlineAnnotations = (
	trendlineProps: TrendlineSpecProps,
	markName: string
): TrendlineAnnotationSpecProps[] => {
	const annotationElements = trendlineProps.children.filter(
		(child) => child.type === TrendlineAnnotation
	) as TrendlineAnnotationElement[];
	return annotationElements.map((annotation, index) =>
		applyTrendlineAnnotationDefaults(annotation.props, index, trendlineProps, markName)
	);
};

/**
 * Gets all the trendline annotation marks
 * @param trendlineProps
 * @param markName
 * @returns GroupMark[]
 */
export const getTrendlineAnnotationMarks = (trendlineProps: TrendlineSpecProps, markName: string): GroupMark[] => {
	const marks: GroupMark[] = [];
	const annotations = getTrendlineAnnotations(trendlineProps, markName);

	annotations.forEach((annotation) => {
		marks.push({
			name: `${annotation.name}_group`,
			type: 'group',
			interactive: false,
			marks: [
				getTrendlineAnnotationPoints(annotation),
				getTrendlineAnnotationTextMark(annotation),
				...getTrendlineAnnotationBadgeMark(annotation),
			],
		});
	});
	return marks;
};

/**
 * Gets the annotation points
 * @param annotationProps
 * @returns SymbolMark
 */
const getTrendlineAnnotationPoints = (annotationProps: TrendlineAnnotationSpecProps): SymbolMark => {
	const { name, trendlineName, trendlineWidth, displayOnHover } = annotationProps;
	const data = displayOnHover ? `${trendlineName}_highlightedData` : `${trendlineName}_highResolutionData`;
	return {
		name: `${name}_points`,
		type: 'symbol',
		from: { data },
		encode: {
			enter: {
				opacity: { value: 0 },
				size: { value: Math.pow(trendlineWidth, 2) },
				x: getTrendlineAnnotationPointX(annotationProps),
				y: getTrendlineAnnotationPointY(annotationProps),
			},
		},
	};
};

/**
 * Gets the correct x rule for the annotation point
 * @param annotationProps
 * @returns NumericValueRef
 */
export const getTrendlineAnnotationPointX = ({
	dimensionValue,
	trendlineDimension,
	trendlineDimensionExtent,
	trendlineDimensionScaleType,
	trendlineOrientation,
}: TrendlineAnnotationSpecProps): NumericValueRef => {
	const scale = getScaleName('x', trendlineDimensionScaleType);
	if (trendlineOrientation === 'vertical') {
		return { scale, field: TRENDLINE_VALUE };
	}
	switch (dimensionValue) {
		case 'start':
			return getStartDimensionExtentProductionRule(trendlineDimensionExtent[0], trendlineDimension, scale, 'x');
		case 'end':
			return getEndDimensionExtentProductionRule(trendlineDimensionExtent[1], trendlineDimension, scale, 'x');
		default:
			return { scale, value: dimensionValue };
	}
};

/**
 * Gets the correct y rule for the annotation point
 * @param param0
 * @returns NumericValueRef
 */
export const getTrendlineAnnotationPointY = ({
	dimensionValue,
	trendlineDimension,
	trendlineDimensionExtent,
	trendlineOrientation,
}: TrendlineAnnotationSpecProps): NumericValueRef => {
	const scale = 'yLinear';
	if (trendlineOrientation === 'horizontal') {
		return { scale, field: TRENDLINE_VALUE };
	}
	switch (dimensionValue) {
		case 'start':
			return getStartDimensionExtentProductionRule(trendlineDimensionExtent[0], trendlineDimension, scale, 'y');
		case 'end':
			return getEndDimensionExtentProductionRule(trendlineDimensionExtent[1], trendlineDimension, scale, 'y');
		default:
			return { scale, value: dimensionValue };
	}
};

/**
 * Gets the annotation text mark
 * @param annotationProps
 * @returns TextMark
 */
export const getTrendlineAnnotationTextMark = (annotation: TrendlineAnnotationSpecProps): TextMark => {
	const { badge, name, numberFormat, prefix, trendlineName, markName } = annotation;
	const textPrefix = prefix ? `'${prefix} ' + ` : '';
	// need more offset if there is a badge to make room for said badge
	const offset = badge ? [4, 4, 4, 4, 5.65, 5.65, 5.65, 5.65] : [2, 2, 2, 2, 2.83, 2.83, 2.83, 2.83];
	const fill = getTextFill({ ...annotation });
	return {
		name,
		type: 'text',
		from: { data: `${name}_points` },
		zindex: 1, // this will draw the text in front of the badge
		encode: {
			enter: {
				text: { signal: `${textPrefix}format(datum.datum.${TRENDLINE_VALUE}, '${numberFormat}')` },
				fill,
			},
		},
		transform: [
			{
				type: 'label',
				size: { signal: '[width, height]' },
				avoidMarks: [trendlineName, `${markName}_group`],
				offset,
				anchor: ['top', 'bottom', 'right', 'left', 'top-right', 'top-left', 'bottom-right', 'bottom-left'],
			},
		],
	};
};

/**
 * Get's the encoding for the annotation text fill.
 * Includes a color contrast check to ensure the text is visually a11y.
 * @param annotationProps
 * @returns fill ProductionRule
 */
export const getTextFill = ({
	badge,
	colorScheme,
	trendlineColor,
}: TrendlineAnnotationSpecProps): ProductionRule<ColorValueRef> | undefined => {
	if (!badge) {
		// by returning undefined, the rsc config will be used
		return undefined;
	}
	const color = getColorKey(trendlineColor);
	const colorString = getColorProductionRuleSignalString(color, colorScheme);
	const textColors = [getColorValue('gray-50', colorScheme), getColorValue('gray-900', colorScheme)];
	return [
		{ test: `contrast(${colorString}, '${textColors[0]}') > 3.5`, value: textColors[0] },
		{ value: textColors[1] },
	];
};

export const getTrendlineAnnotationBadgeMark = ({
	badge,
	colorScheme,
	name,
	trendlineColor,
}: TrendlineAnnotationSpecProps): RectMark[] => {
	if (!badge) {
		return [];
	}
	const color = getColorKey(trendlineColor, 2);
	return [
		{
			name: `${name}_badge`,
			type: 'rect',
			from: { data: `${name}` },
			encode: {
				enter: {
					cornerRadius: { value: 2 },
					fill: getColorProductionRule(color, colorScheme),
					opacity: { field: 'opacity' },
					x: { signal: 'datum.bounds.x1 - 3' },
					x2: { signal: 'datum.bounds.x2 + 3' },
					y: { signal: 'datum.bounds.y1 - 3' },
					y2: { signal: 'datum.bounds.y2 + 3' },
				},
			},
		},
	];
};

const getColorKey = (trendlineColor: ColorFacet, datumOrder: number = 1): ColorFacet => {
	if (typeof trendlineColor === 'string') {
		return `${new Array(datumOrder).fill('datum.').join('')}${trendlineColor}`;
	}
	return trendlineColor;
};
