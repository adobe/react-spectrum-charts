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

import { LinePointAnnotationOptions, LinePointAnnotationSpecOptions, LineSpecOptions } from '../../types';

export const getLinePointAnnotationSpecOptions = (
	{ anchor = ['right', 'top', 'bottom', 'left'], autoColor = false, textKey }: LinePointAnnotationOptions,
	index: number,
	lineOptions: LineSpecOptions
): LinePointAnnotationSpecOptions => {
	return {
		anchor,
		autoColor,
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
	const annotations = getLinePointAnnotations(lineOptions);
	const marks: TextMark[] = [];

	for (const annotation of annotations) {
		const { anchor, autoColor, name: linePointAnnotationName, textKey } = annotation;
		marks.push({
			name: linePointAnnotationName,
			type: 'text',
			from: {
				data: `${lineOptions.name}_staticPoints`,
			},
			encode: {
				enter: {
					text: { signal: `datum.datum.${textKey}` },
					...(autoColor && { fill: { signal: 'datum.fill' } }),
				},
			},
			transform: [
				{
					type: 'label',
					size: { signal: '[width, height]' },
					anchor: Array.isArray(anchor) ? anchor : [anchor],
				},
			],
		});
	}

	return marks;
};
