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
import { addHighlightMarkOpacityRules } from '@specBuilder/chartTooltip/chartTooltipUtils';
import {
	DEFAULT_OPACITY_RULE,
	FILTERED_TABLE,
	HIGHLIGHT_CONTRAST_RATIO,
	SELECTED_ITEM
} from '@constants';
import {
	getColorProductionRule,
	getLineWidthProductionRule,
	getOpacityProductionRule,
	getPointsForVoronoi,
	getStrokeDashProductionRule,
	getSymbolSizeProductionRule,
	getVoronoiPath,
	getXProductionRule,
	hasInteractiveChildren,
	hasPopover
} from '@specBuilder/marks/markUtils';
import { getScatterPathMarks } from '@specBuilder/scatterPath/scatterPathUtils';
import { getTrendlineMarks } from '@specBuilder/trendline';
import { spectrumColors } from '@themes';
import { produce } from 'immer';

import { ScatterSpecProps, SymbolSizeFacet } from '../../types';
import { GroupMark, Mark, NumericValueRef, SymbolMark } from 'vega';

export const addScatterMarks = produce<Mark[], [ScatterSpecProps]>((marks, props) => {
	const { name } = props;

	const scatterGroup: GroupMark = {
		name: `${name}_group`,
		type: 'group',
		marks: [getScatterMark(props), ...getScatterHoverMarks(props), ...getScatterSelectMarks(props)],
	};

	marks.push(...getScatterPathMarks(props));
	marks.push(scatterGroup);
	marks.push(...getTrendlineMarks(props));
});

/**
 * Gets the primary scatter mark
 * @param scatterProps scatterSpecProps
 * @returns SymbolMark
 */
export const getScatterMark = (props: ScatterSpecProps): SymbolMark => {
	const {
		color,
		colorScaleType,
		colorScheme,
		dimension,
		dimensionScaleType,
		lineType,
		lineWidth,
		metric,
		name,
		opacity,
		size,
	} = props;
	return {
		name,
		description: name,
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
				fill: getColorProductionRule(color, colorScheme, colorScaleType),
				fillOpacity: getOpacityProductionRule(opacity),
				shape: { value: 'circle' },
				size: getSymbolSizeProductionRule(size),
				strokeDash: getStrokeDashProductionRule(lineType),
				strokeWidth: getLineWidthProductionRule(lineWidth),
				stroke: getColorProductionRule(color, colorScheme, colorScaleType),
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
export const getOpacity = (props: ScatterSpecProps): ({ test?: string } & NumericValueRef)[] => {
	const { children, highlightedItem, idKey, animations } = props;
	if (!hasInteractiveChildren(children) && highlightedItem === undefined) {
		return [DEFAULT_OPACITY_RULE];
	}

	// if a point is hovered or selected, all other points should be reduced opacity
	const fadedValue = 1 / HIGHLIGHT_CONTRAST_RATIO;
	const animationOpacitySignal = { signal: `max(1-rscColorAnimation, ${fadedValue})` }
	const opacityParameter = animations ? animationOpacitySignal : { value: fadedValue };

	const rules: ({ test?: string } & NumericValueRef)[] = [];
	addHighlightMarkOpacityRules(rules, props, opacityParameter);
	if (hasPopover(children)) {
		rules.push({
			test: `isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} !== datum.${idKey}`,
      ...opacityParameter
		});
	}

	return [...rules, DEFAULT_OPACITY_RULE];
};

/**
 * Gets the vornoi path mark if there are any interactive children
 * @param scatterProps ScatterSpecProps
 * @returns Mark[]
 */
export const getScatterHoverMarks = ({
	children,
	dimension,
	dimensionScaleType,
	highlightedItem,
	metric,
	name,
}: ScatterSpecProps): Mark[] => {
	if (!hasInteractiveChildren(children) && highlightedItem === undefined) {
		return [];
	}

	return [
		getPointsForVoronoi(`${FILTERED_TABLE}ForTooltip`, dimension, metric, name, dimensionScaleType),
		getVoronoiPath(children, `${name}_pointsForVoronoi`, name),
	];
};

const getScatterSelectMarks = ({
	children,
	dimension,
	dimensionScaleType,
	metric,
	name,
	size,
}: ScatterSpecProps): SymbolMark[] => {
	if (!hasPopover(children)) {
		return [];
	}
	return [
		{
			name: `${name}_selectRing`,
			type: 'symbol',
			from: {
				data: `${name}_selectedData`,
			},
			encode: {
				enter: {
					fill: { value: 'transparent' },
					shape: { value: 'circle' },
					size: getSelectRingSize(size),
					strokeWidth: { value: 2 },
					stroke: { value: spectrumColors.light['static-blue'] },
				},
				update: {
					x: getXProductionRule(dimensionScaleType, dimension),
					y: { scale: 'yLinear', field: metric },
				},
			},
		},
	];
};

/**
 * Gets the size of the select ring based on the size of the scatter points
 * @param size SymbolSizeFacet
 * @returns NumericValueRef
 */
export const getSelectRingSize = (size: SymbolSizeFacet): NumericValueRef => {
	const baseSize = getSymbolSizeProductionRule(size);
	if ('value' in baseSize && typeof baseSize.value === 'number') {
		// the select ring is 4px widr and taller
		// to calculate: (sqrt(baseSize) + 4)^2
		return { value: Math.pow(Math.sqrt(baseSize.value) + 4, 2) };
	}
	if ('scale' in baseSize && 'field' in baseSize) {
		return { signal: `pow(sqrt(scale('${baseSize.scale}', datum.${baseSize.field})) + 4, 2)` };
	}
	return baseSize;
};
