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
import { NumericValueRef, ProductionRule, TextMark } from 'vega';

import {
	CONTROLLED_HIGHLIGHTED_SERIES,
	CONTROLLED_HIGHLIGHTED_TABLE,
	FADE_FACTOR,
	HOVERED_ITEM,
	LINE_POINT_ANNOTATION_OFFSET,
	SELECTED_SERIES,
	SERIES_ID,
} from '@spectrum-charts/constants';

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

/**
 * Fades non-hovered/non-highlighted series by multiplying against the collision-computed `datum.opacity`.
 * @param lineOptions
 * @returns ProductionRule<NumericValueRef>
 */
export const getLinePointAnnotationOpacity = ({
	interactiveMarkName,
	isHighlightedByGroup,
	legendHighlightSignals,
	popoverMarkName,
}: Pick<
	LineSpecOptions,
	'interactiveMarkName' | 'isHighlightedByGroup' | 'legendHighlightSignals' | 'popoverMarkName'
>): ProductionRule<NumericValueRef> => {
	// extra datum hop vs. usual mark chains: background reads from the staticPoints *mark* (not a data source), so foreground->background->staticPoint->row is 3 levels deep, not 2
	const seriesRef = `datum.datum.datum.${SERIES_ID}`;
	const fadeRule = (matchExpr: string): string => `${matchExpr} ? datum.opacity : datum.opacity * ${FADE_FACTOR}`;
	const rules: ProductionRule<NumericValueRef> = [];

	if (interactiveMarkName) {
		rules.push(
			isHighlightedByGroup
				? {
						test: `length(data('${interactiveMarkName}_highlightedData'))`,
						signal: fadeRule(
							`indexof(pluck(data('${interactiveMarkName}_highlightedData'), '${SERIES_ID}'), ${seriesRef}) !== -1`
						),
					}
				: {
						test: `isValid(${interactiveMarkName}_${HOVERED_ITEM})`,
						signal: fadeRule(`${interactiveMarkName}_${HOVERED_ITEM}.${SERIES_ID} === ${seriesRef}`),
					}
		);
	}

	rules.push(
		{
			test: `length(data('${CONTROLLED_HIGHLIGHTED_TABLE}'))`,
			signal: fadeRule(`indexof(pluck(data('${CONTROLLED_HIGHLIGHTED_TABLE}'), '${SERIES_ID}'), ${seriesRef}) > -1`),
		},
		{
			test: `isValid(${CONTROLLED_HIGHLIGHTED_SERIES})`,
			signal: fadeRule(`${CONTROLLED_HIGHLIGHTED_SERIES} === ${seriesRef}`),
		}
	);

	if (popoverMarkName) {
		rules.push({
			test: `isValid(${SELECTED_SERIES})`,
			signal: fadeRule(`${SELECTED_SERIES} === ${seriesRef}`),
		});
	}

	for (const signal of legendHighlightSignals ?? []) {
		rules.push({
			test: `isValid(${signal})`,
			signal: fadeRule(`${signal} === ${seriesRef}`),
		});
	}

	rules.push({ field: 'opacity' });

	return rules;
};

export const getLinePointAnnotationMarks = (lineOptions: LineSpecOptions): TextMark[] => {
	const opacity = getLinePointAnnotationOpacity(lineOptions);

	return getLinePointAnnotations(lineOptions).flatMap((annotation) => {
		const { anchor, matchLineColor, name: linePointAnnotationName, textKey } = annotation;
		const foregroundFill = matchLineColor ? { field: 'datum.fill' } : undefined;

		const [backgroundMark, foregroundMark] = getLabelTransformTextMarks(
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

		return [
			backgroundMark,
			{
				...foregroundMark,
				encode: {
					...foregroundMark.encode,
					update: { ...foregroundMark.encode?.update, opacity },
				},
			},
		];
	});
};
