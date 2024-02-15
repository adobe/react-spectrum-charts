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
import { FILTERED_TABLE, MARK_ID, DEFAULT_OPACITY_RULE } from '@constants';
import {
	getColorProductionRule,
	getHighlightOpacityValue,
	getLineWidthProductionRule,
	getOpacityProductionRule,
	getStrokeDashProductionRule,
	getSymbolSizeProductionRule,
	getVoronoiPath,
	getXProductionRule,
	hasInteractiveChildren,
} from '@specBuilder/marks/markUtils';
import { getTrendlineMarks } from '@specBuilder/trendline';
import { produce } from 'immer';
import { ScatterSpecProps } from 'types';
import { GroupMark, Mark, NumericValueRef, PathMark, SymbolMark } from 'vega';

export const addScatterMarks = produce<Mark[], [ScatterSpecProps]>((marks, props) => {
	const { name } = props;

	const scatterGroup: GroupMark = {
		name: `${name}_group`,
		type: 'group',
		marks: [getScatterMark(props), ...getScatterHoverMarks(props)],
	};

	marks.push(scatterGroup);
	marks.push(...getTrendlineMarks(props));
});

/**
 * Gets the primary scatter mark
 * @param scatterProps scatterSpecProps
 * @returns SymbolMark
 */
export const getScatterMark = (props: ScatterSpecProps): SymbolMark => {
	const { color, colorScheme, dimension, dimensionScaleType, lineType, lineWidth, metric, name, opacity, size } =
		props;
	return {
		name,
		type: 'symbol',
		from: {
			data: FILTERED_TABLE,
		},
		encode: {
			enter: {
				/**
				 * the blend mode makes it possible to tell when there are overlapping points
				 * in light mode, the points are darker when they overlap (multiply)
				 * in dark mode, the points are lighter when they overlap (screen)
				 */
				blend: { value: colorScheme === 'light' ? 'multiply' : 'screen' },
				fill: getColorProductionRule(color, colorScheme),
				fillOpacity: getOpacityProductionRule(opacity),
				shape: { value: 'circle' },
				size: getSymbolSizeProductionRule(size),
				strokeDash: getStrokeDashProductionRule(lineType),
				strokeWidth: getLineWidthProductionRule(lineWidth),
				stroke: getColorProductionRule(color, colorScheme),
			},
			update: {
				opacity: getOpacity(props),
				x: getXProductionRule(dimensionScaleType, dimension),
				y: { scale: 'yLinear', field: metric },
			},
		},
	};
};

/**
 * Gets the opacity production rule for the scatter mark.
 * This is used for highlighting points on hover and selection.
 * @param scatterProps ScatterSpecProps
 * @returns opacity production rule
 */
export const getOpacity = ({ children, name }: ScatterSpecProps): ({ test?: string } & NumericValueRef)[] => {
	if (!hasInteractiveChildren(children)) {
		return [DEFAULT_OPACITY_RULE];
	}
	// if a symbol is hovered, all other symbols should be 1/5th opacity
	const hoverSignal = `${name}_hoveredId`;
	return [
		{
			test: `${hoverSignal} && ${hoverSignal} !== datum.${MARK_ID}`,
			...getHighlightOpacityValue(),
		},
		DEFAULT_OPACITY_RULE,
	];
};

/**
 * Gets the vornoi path mark if there are any interactive children
 * @param scatterProps ScatterSpecProps
 * @returns PathMark[]
 */
export const getScatterHoverMarks = ({ children, name }: ScatterSpecProps): PathMark[] => {
	if (!hasInteractiveChildren(children)) {
		return [];
	}
	return [getVoronoiPath(children, name, name)];
};
