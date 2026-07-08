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

import { LINE_POINT_ANNOTATION_OFFSET } from '@spectrum-charts/constants';

import { LinePointAnnotationOptions, LinePointAnnotationSpecOptions, LineSpecOptions } from '../../types';
import { getLabelTransformTextMarks } from '../directLabelUtils';

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
		const foregroundFill = matchLineColor ? { field: 'datum.fill' } : undefined;

		return getLabelTransformTextMarks(
			`${linePointAnnotationName}_bg`,
			linePointAnnotationName,
			`${lineOptions.name}_staticPoints`,
			`datum.datum.${textKey}`,
			lineOptions.colorScheme,
			{
				type: 'label',
				size: { signal: '[width, height]' },
				anchor: Array.isArray(anchor) ? anchor : [anchor],
				offset: [LINE_POINT_ANNOTATION_OFFSET],
			},
			foregroundFill
		);
	});
};
