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
import { getColorProductionRule, getColorProductionRuleSignalString } from '@specBuilder/marks/markUtils';
import { getScaleName } from '@specBuilder/scale/scaleSpecBuilder';
import { getColorValue, getLineWidthPixelsFromLineWidth } from '@specBuilder/specUtils';
import {
	getEndDimensionExtentProductionRule,
	getStartDimensionExtentProductionRule,
} from '@specBuilder/trendline/trendlineMarkUtils';
import { ColorValueRef, GroupMark, NumericValueRef, ProductionRule, RectMark, SymbolMark, TextMark } from 'vega';

import {
	ColorFacet,
	TrendlineAnnotationOptions,
	TrendlineAnnotationSpecOptions,
	TrendlineSpecOptions,
} from '../../types';

/**
 * Applies all trendline annotation defaults
 * @param trenlineAnnotationOptions
 * @param index
 * @param trendlineOptions
 * @param markName
 * @returns TrendlineAnnotationSpecOptions
 */
export const getTrendlineAnnotationSpecOptions = (
	{ badge = false, dimensionValue = 'end', numberFormat = '', prefix = '' }: TrendlineAnnotationOptions,
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
	}: TrendlineSpecOptions,
	markName: string
): TrendlineAnnotationSpecOptions => ({
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
 * @param trendlineOptions
 * @param markName
 * @returns TrendlineAnnotationSpecOptions[]
 */
export const getTrendlineAnnotations = (
	trendlineOptions: TrendlineSpecOptions,
	markName: string
): TrendlineAnnotationSpecOptions[] => {
	return trendlineOptions.trendlineAnnotations.map((annotationOptions, index) =>
		getTrendlineAnnotationSpecOptions(annotationOptions, index, trendlineOptions, markName)
	);
};

/**
 * Gets all the trendline annotation marks
 * @param trendlineOptions
 * @param markName
 * @returns GroupMark[]
 */
export const getTrendlineAnnotationMarks = (trendlineOptions: TrendlineSpecOptions, markName: string): GroupMark[] => {
	const marks: GroupMark[] = [];
	const annotations = getTrendlineAnnotations(trendlineOptions, markName);

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
 * @param trendlineAnnotationOptions
 * @returns SymbolMark
 */
const getTrendlineAnnotationPoints = (annotationOptions: TrendlineAnnotationSpecOptions): SymbolMark => {
	const { name, trendlineName, trendlineWidth, displayOnHover } = annotationOptions;
	const data = displayOnHover ? `${trendlineName}_highlightedData` : `${trendlineName}_highResolutionData`;
	return {
		name: `${name}_points`,
		type: 'symbol',
		from: { data },
		interactive: false,
		encode: {
			enter: {
				opacity: { value: 0 },
				size: { value: Math.pow(trendlineWidth, 2) },
				x: getTrendlineAnnotationPointX(annotationOptions),
				y: getTrendlineAnnotationPointY(annotationOptions),
			},
		},
	};
};

/**
 * Gets the correct x rule for the annotation point
 * @param trendlineAnnotationOptions
 * @returns NumericValueRef
 */
export const getTrendlineAnnotationPointX = ({
	dimensionValue,
	trendlineDimension,
	trendlineDimensionExtent,
	trendlineDimensionScaleType,
	trendlineOrientation,
}: TrendlineAnnotationSpecOptions): NumericValueRef => {
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
 * @param trendlineAnnotationOptions
 * @returns NumericValueRef
 */
export const getTrendlineAnnotationPointY = ({
	dimensionValue,
	trendlineDimension,
	trendlineDimensionExtent,
	trendlineOrientation,
}: TrendlineAnnotationSpecOptions): NumericValueRef => {
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
 * @param trendlineAnnotationOptions
 * @returns TextMark
 */
export const getTrendlineAnnotationTextMark = (annotation: TrendlineAnnotationSpecOptions): TextMark => {
	const { name, numberFormat, prefix, trendlineName, markName } = annotation;
	const textPrefix = prefix ? `'${prefix} ' + ` : '';
	const fill = getTextFill({ ...annotation });
	return {
		name,
		type: 'text',
		from: { data: `${name}_points` },
		zindex: 1, // this will draw the text in front of the badge
		interactive: false,
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
				offset: [6, 6, 6, 6, 8.49, 8.49, 8.49, 8.49],
				anchor: ['top', 'bottom', 'right', 'left', 'top-right', 'top-left', 'bottom-right', 'bottom-left'],
			},
		],
	};
};

/**
 * Get's the encoding for the annotation text fill.
 * Includes a color contrast check to ensure the text is visually a11y.
 * @param trendlineAnnotationOptions
 * @returns fill ProductionRule
 */
export const getTextFill = ({
	badge,
	colorScheme,
	trendlineColor,
}: TrendlineAnnotationSpecOptions): ProductionRule<ColorValueRef> | undefined => {
	if (!badge) {
		// by returning undefined, the rsc config will be used
		return undefined;
	}
	const color = getColorKey(trendlineColor);
	const colorString = getColorProductionRuleSignalString(color, colorScheme);
	const textColors = [getColorValue('gray-50', colorScheme), getColorValue('gray-900', colorScheme)];
	return [
		{ test: `contrast(${colorString}, '${textColors[0]}') >= 4.5`, value: textColors[0] },
		{ value: textColors[1] },
	];
};

export const getTrendlineAnnotationBadgeMark = ({
	badge,
	colorScheme,
	name,
	trendlineColor,
}: TrendlineAnnotationSpecOptions): RectMark[] => {
	if (!badge) {
		return [];
	}
	const color = getColorKey(trendlineColor, 2);
	return [
		{
			name: `${name}_badge`,
			description: `${name}_badge`,
			type: 'rect',
			from: { data: `${name}` },
			interactive: false,
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

/**
 * Gets the key used for color.
 * Since some of the marks base their data off of previous marks, the datum might be nested.
 * @param trendlineColor
 * @param datumOrder how many levels deep the datum is (ex. 1 becomes datum.color, 2 becomes datum.datum.color, etc.)
 * @returns
 */
export const getColorKey = (trendlineColor: ColorFacet, datumOrder: number = 1): ColorFacet => {
	if (typeof trendlineColor === 'string') {
		return `${new Array(datumOrder).fill('datum.').join('')}${trendlineColor}`;
	}
	return trendlineColor;
};
