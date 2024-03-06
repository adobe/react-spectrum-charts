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
import { getScaleName } from '@specBuilder/scale/scaleSpecBuilder';
import { getLineWidthPixelsFromLineWidth } from '@specBuilder/specUtils';
import {
	getEndDimensionExtentProductionRule,
	getStartDimensionExtentProductionRule,
} from '@specBuilder/trendline/trendlineMarkUtils';
import {
	TrendlineAnnotationElement,
	TrendlineAnnotationProps,
	TrendlineAnnotationSpecProps,
	TrendlineSpecProps,
} from 'types';
import { GroupMark, NumericValueRef, SymbolMark, TextMark } from 'vega';

/**
 * Applies all trendline annotation defaults
 * @param trenlineAnnotationProps
 * @param index
 * @param trendlineProps
 * @param markName
 * @returns TrendlineAnnotationSpecProps
 */
export const applyTrendlineAnnotationDefaults = (
	{ dimensionValue = 'end', numberFormat = '', prefix = '' }: TrendlineAnnotationProps,
	index: number,
	{
		dimensionExtent,
		dimensionScaleType,
		lineWidth,
		orientation,
		trendlineDimension,
		name: trendlineName,
	}: TrendlineSpecProps,
	markName: string
): TrendlineAnnotationSpecProps => ({
	dimensionValue,
	markName,
	name: `${trendlineName}Annotation${index}`,
	numberFormat,
	prefix,
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
			marks: [getTrendlineAnnotationPoints(annotation), getTrendlineAnnotationTextMark(annotation)],
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
	const { name, trendlineName, trendlineWidth } = annotationProps;
	return {
		name: `${name}_points`,
		type: 'symbol',
		from: { data: `${trendlineName}_highResolutionData` },
		encode: {
			enter: {
				x: getTrendlineAnnotationPointX(annotationProps),
				y: getTrendlineAnnotationPointY(annotationProps),
				fill: { value: 'transparent' },
				size: { value: Math.pow(trendlineWidth, 2) },
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
export const getTrendlineAnnotationTextMark = ({
	markName,
	name,
	numberFormat,
	prefix,
	trendlineName,
}: TrendlineAnnotationSpecProps): TextMark => {
	const textPrefix = prefix ? `'${prefix} ' + ` : '';
	return {
		name,
		type: 'text',
		from: { data: `${name}_points` },
		encode: {
			enter: {
				text: { signal: `${textPrefix}format(datum.datum.${TRENDLINE_VALUE}, '${numberFormat}')` },
			},
		},
		transform: [
			{
				type: 'label',
				size: { signal: '[width, height]' },
				avoidMarks: [trendlineName, `${markName}_group`],
				offset: [2],
				anchor: ['top', 'bottom', 'right', 'left', 'top-right', 'top-left', 'bottom-right', 'bottom-left'],
			},
		],
	};
};
