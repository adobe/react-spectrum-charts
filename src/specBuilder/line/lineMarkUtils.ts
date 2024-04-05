/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { DEFAULT_OPACITY_RULE, HIGHLIGHTED_SERIES, SELECTED_SERIES, SERIES_ID } from '@constants';
import {
	getColorProductionRule,
	getHighlightOpacityValue,
	getLineWidthProductionRule,
	getOpacityProductionRule,
	getStrokeDashProductionRule,
	getVoronoiPath,
	getXProductionRule,
	hasPopover,
} from '@specBuilder/marks/markUtils';
import { ScaleType } from 'types';
import { LineMark, Mark, NumericValueRef, ProductionRule, RuleMark, SymbolMark } from 'vega';

import {
	getHighlightBackgroundPoint,
	getHighlightPoint,
	getSecondaryHighlightPoint,
	getSelectRingPoint,
} from './linePointUtils';
import { LineMarkProps } from './lineUtils';
import { getAnimationMarks } from '@specBuilder/specUtils';

/**
 * generates a line mark
 * @param lineProps
 * @param dataSource
 * @returns LineMark
 */

export const getLineMark = (lineMarkProps: LineMarkProps, dataSource: string): LineMark => {
	const { name, color, opacity, metric, dimension, scaleType, lineType, lineWidth, colorScheme, data, previousData, animations, animateFromZero } = lineMarkProps;

	console.log('Animations', animations, ' animate from zero', animateFromZero);
	return {
		name,
		type: 'line',
		from: { data: dataSource },
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: metric },
				stroke: getColorProductionRule(color, colorScheme),
				strokeDash: getStrokeDashProductionRule(lineType),
				strokeOpacity: getOpacityProductionRule(opacity),
				strokeWidth: getLineWidthProductionRule(lineWidth),
			},
			update: {
				// this has to be in update because when you resize the window that doesn't rebuild the spec
				// but it may change the x position if it causes the chart to resize
				x: getXProductionRule(scaleType, dimension),
				opacity: getLineOpacity(lineMarkProps),
				...(animations !== false && animateFromZero && { y: getAnimationMarks(dimension, metric, false, data, previousData) })
			},
		},
	};
};

export const getLineOpacity = ({
	displayOnHover,
	interactiveMarkName,
	popoverMarkName,
}: LineMarkProps): ProductionRule<NumericValueRef> => {
	if (!interactiveMarkName || displayOnHover) return [DEFAULT_OPACITY_RULE];
	const strokeOpacityRules: ProductionRule<NumericValueRef> = [];

	// add a rule that will lower the opacity of the line if there is a hovered series, but this line is not the one hovered
	strokeOpacityRules.push({
		test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`,
		...getHighlightOpacityValue(DEFAULT_OPACITY_RULE),
	});

	if (popoverMarkName) {
		strokeOpacityRules.push({
			test: `${SELECTED_SERIES} && ${SELECTED_SERIES} !== datum.${SERIES_ID}`,
			...getHighlightOpacityValue(DEFAULT_OPACITY_RULE),
		});
	}
	// This allows us to only show the metric range when hovering over the parent line component.
	strokeOpacityRules.push(DEFAULT_OPACITY_RULE);

	return strokeOpacityRules;
};

/**
 * All the marks that get displayed when hovering or selecting a point on a line
 * @param lineMarkProps
 * @param dataSource
 * @param secondaryHighlightedMetric
 * @returns
 */
export const getLineHoverMarks = (
	lineProps: LineMarkProps,
	dataSource: string,
	secondaryHighlightedMetric?: string
): Mark[] => {
	const { children, dimension, metric, name, scaleType, animations, animateFromZero } = lineProps;
	return [
		// vertical rule shown for the hovered or selected point
		getHoverRule(dimension, name, scaleType),
		// point behind the hovered or selected point used to prevent bacgorund elements from being visible through low opacity point
		getHighlightBackgroundPoint(lineProps),
		// if has popover, add selection ring,
		...(hasPopover(children) ? [getSelectRingPoint(lineProps)] : []),
		// hover or select point
		getHighlightPoint(lineProps),
		// additional point that gets highlighted like the trendline or raw line point
		...(secondaryHighlightedMetric ? [getSecondaryHighlightPoint(lineProps, secondaryHighlightedMetric)] : []),
		// points used for the voronoi transform
		getPointsForVoronoi(dataSource, dimension, metric, name, scaleType),
		// voronoi transform used to get nearest point paths
		getVoronoiPath(children, `${name}_pointsForVoronoi`, name, animations, animateFromZero),
	];
};

const getHoverRule = (dimension: string, name: string, scaleType: ScaleType): RuleMark => {
	return {
		name: `${name}_hoverRule`,
		type: 'rule',
		from: { data: `${name}_highlightedData` },
		interactive: false,
		encode: {
			enter: {
				y: { value: 0 },
				y2: { signal: 'height' },
				strokeWidth: { value: 1 },
			},
			update: {
				x: getXProductionRule(scaleType, dimension),
			},
		},
	};
};

const getPointsForVoronoi = (
	dataSource: string,
	dimension: string,
	metric: string,
	name: string,
	scaleType: ScaleType
): SymbolMark => {
	return {
		name: `${name}_pointsForVoronoi`,
		type: 'symbol',
		from: { data: dataSource },
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: metric },
				fill: { value: 'transparent' },
				stroke: { value: 'transparent' },
			},
			update: {
				x: getXProductionRule(scaleType, dimension),
			},
		},
	};
};
