/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { TextMark } from 'vega';

import { BACKGROUND_COLOR, DIRECT_LABEL_BACKGROUND_STROKE_WIDTH, DIRECT_LABEL_FONT_WEIGHT } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { LinePointAnnotationOptions, LinePointAnnotationSpecOptions, LineSpecOptions } from '../../types';

export const getLinePointAnnotationSpecOptions = (
	{ anchor = ['right', 'top', 'bottom', 'left'], matchLineColor = false, textKey }: LinePointAnnotationOptions,
	index: number,
	lineOptions: LineSpecOptions
): LinePointAnnotationSpecOptions => {
	return {
		anchor,
		matchLineColor,
		textKey: textKey ?? lineOptions.metric,
		index,
		name: `${lineOptions.name}Annotation${index}`,
		lineOptions,
	};
};

export const getLinePointAnnotations = (lineOptions: LineSpecOptions): LinePointAnnotationSpecOptions[] => {
	return lineOptions.linePointAnnotations.map((annotation, index) =>
		getLinePointAnnotationSpecOptions(annotation, index, lineOptions)
	);
};

export const getLinePointAnnotationMarks = (lineOptions: LineSpecOptions): TextMark[] => {
	return getLinePointAnnotations(lineOptions).flatMap((annotation) => {
		const { anchor, matchLineColor, name: linePointAnnotationName, textKey } = annotation;
		const bgMarkName = `${linePointAnnotationName}_bg`;

		// Background mark: runs the label transform for collision-avoiding placement.
		// Uses transparent fill + background-color stroke for the halo.
		// Vega's canvas renderer draws fill then stroke, so using a single mark with both
		// would have the stroke cover the fill. Two marks avoids this.
		const backgroundMark: TextMark = {
			name: bgMarkName,
			type: 'text',
			interactive: false,
			from: { data: `${lineOptions.name}_staticPoints` },
			encode: {
				enter: {
					text: { signal: `datum.datum.${textKey}` },
					fill: { value: 'transparent' },
					stroke: { signal: BACKGROUND_COLOR },
					strokeWidth: { value: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH },
				},
				update: {
					fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
				},
			},
			transform: [
				{
					type: 'label',
					size: { signal: '[width, height]' },
					anchor: Array.isArray(anchor) ? anchor : [anchor],
				},
			],
		};

		// Foreground mark: reads from the background mark to inherit its label-transform-computed
		// positions (x, y, align, baseline, opacity). 
		// When matchLineColor is true, the fill uses the series color from the static point stroke (datum.stroke); otherwise defaults to black.
		const labelFill = matchLineColor
			? { field: 'datum.stroke' }
			: { value: getS2ColorValue('gray-900', lineOptions.colorScheme) };
		const foregroundMark: TextMark = {
			name: linePointAnnotationName,
			type: 'text',
			interactive: false,
			from: { data: bgMarkName },
			encode: {
				enter: {
					fill: labelFill,
				},
				update: {
					text: { field: 'text' },
					x: { field: 'x' },
					y: { field: 'y' },
					align: { field: 'align' },
					baseline: { field: 'baseline' },
					opacity: { field: 'opacity' },
					fontWeight: { value: DIRECT_LABEL_FONT_WEIGHT },
				},
			},
		};

		return [backgroundMark, foregroundMark];
	});
};
