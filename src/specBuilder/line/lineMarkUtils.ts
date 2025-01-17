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
import {
	DEFAULT_INTERACTION_MODE,
	DEFAULT_OPACITY_RULE,
	HIGHLIGHTED_SERIES,
	HIGHLIGHT_CONTRAST_RATIO,
	SELECTED_SERIES,
	SERIES_ID,
} from '@constants';
import { getPopovers } from '@specBuilder/chartPopover/chartPopoverUtils';
import {
	getColorProductionRule,
	getItemHoverArea,
	getLineWidthProductionRule,
	getOpacityProductionRule,
	getPointsForVoronoi,
	getStrokeDashProductionRule,
	getSeriesAnimationOpacityRules,
	getVoronoiPath,
	getXProductionRule,
	getYProductionRule,
	hasPopover,
} from '@specBuilder/marks/markUtils';
import { LineMark, Mark, NumericValueRef, ProductionRule, RuleMark } from 'vega';

import { ScaleType } from '../../types';
import {
	getHighlightBackgroundPoint,
	getHighlightPoint,
	getSecondaryHighlightPoint,
	getSelectRingPoint,
	getSelectionPoint,
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
	const { animations, animateFromatZero, color, colorScheme, data, dimension, lineType, lineWidth, metric, metricAxis, name, opacity, previousData, scaleType } =
		lineMarkProps;
	const popovers = getPopovers(lineMarkProps);
	const popoverWithDimensionHighlightExists = popovers.some(
		({ UNSAFE_highlightBy }) => UNSAFE_highlightBy === 'dimension'
	);

	return {
		name,
		description: name,
		type: 'line',
		from: { data: dataSource },
		interactive: false,
		encode: {
			enter: {
				y: getYProductionRule(metricAxis, metric),
				stroke: getColorProductionRule(color, colorScheme),
				strokeDash: getStrokeDashProductionRule(lineType),
				strokeOpacity: getOpacityProductionRule(opacity),
				strokeWidth: getLineWidthProductionRule(lineWidth),
			},
			update: {
				// this has to be in update because when you resize the window that doesn't rebuild the spec
				// but it may change the x position if it causes the chart to resize
				x: getXProductionRule(scaleType, dimension),
        y: animations !== false ? getAnimationMarks(dimension, metric, data, previousData) : undefined,
				...(popoverWithDimensionHighlightExists ? {} : { opacity: getLineOpacity(lineMarkProps) }),
				strokeOpacity: getLineStrokeOpacity(lineMarkProps),
				opacity: getLineOpacity(lineMarkProps),
				...(animations !== false && animateFromZero && { y: getAnimationMarks(dimension, metric, data, previousData) })
			},
		},
	};
};

export const getLineOpacity = ({
	displayOnHover,
	interactiveMarkName,
	popoverMarkName,
	isHighlightedByGroup,
	highlightedItem,
	animations,
}: LineMarkProps): ProductionRule<NumericValueRef> => {
	if ((!interactiveMarkName || displayOnHover) && highlightedItem === undefined) return [DEFAULT_OPACITY_RULE];
	const strokeOpacityRules: ProductionRule<NumericValueRef> = [];

	if (isHighlightedByGroup) {
		strokeOpacityRules.push({
			test: `indexof(pluck(data('${interactiveMarkName}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) !== -1`,
			value: 1,
		});
	}

	//if animations are enabled, set opacity rules for line mark.
	//TODO: add tests
	if (animations !== false) {
		return getSeriesAnimationOpacityRules();
	}
	// add a rule that will lower the opacity of the line if there is a hovered series, but this line is not the one hovered
	strokeOpacityRules.push(
		{
			test: `isValid(${HIGHLIGHTED_SERIES}) && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`,
			value: 1 / HIGHLIGHT_CONTRAST_RATIO,
		},
		{
			test: `length(data('${interactiveMarkName}_highlightedData')) > 0 && indexof(pluck(data('${interactiveMarkName}_highlightedData'), '${SERIES_ID}'), datum.${SERIES_ID}) === -1`,
			value: 1 / HIGHLIGHT_CONTRAST_RATIO,
		}
	);

	if (popoverMarkName) {
		strokeOpacityRules.push({
			test: `isValid(${SELECTED_SERIES}) && ${SELECTED_SERIES} !== datum.${SERIES_ID}`,
			value: 1 / HIGHLIGHT_CONTRAST_RATIO,
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
		// if has popover, add selection ring and selection point
		...(hasPopover(children) ? [getSelectRingPoint(lineProps), getSelectionPoint(lineProps)] : []),
		// hover or select point
		getHighlightPoint(lineProps),
		// additional point that gets highlighted like the trendline or raw line point
		...(secondaryHighlightedMetric ? [getSecondaryHighlightPoint(lineProps, secondaryHighlightedMetric)] : []),
		// get interactive marks for the line
		...getInteractiveMarks(dataSource, lineProps),
	];
};

const getHoverRule = (dimension: string, name: string, scaleType: ScaleType): RuleMark => {
	return {
		name: `${name}_hoverRule`,
		description: `${name}_hoverRule`,
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
				opacity: { signal: `length(data('${name}_selectedData')) > 0 ? 0 : 1` },
			},
		},
	};
};

const getInteractiveMarks = (dataSource: string, lineProps: LineMarkProps): Mark[] => {
	const { interactionMode = DEFAULT_INTERACTION_MODE } = lineProps;

	const tooltipMarks = {
		nearest: getVoronoiMarks,
		item: getItemHoverMarks,
	};

	return tooltipMarks[interactionMode](dataSource, lineProps);
};

const getVoronoiMarks = (dataSource: string, lineProps: LineMarkProps): Mark[] => {
	const { children, dimension, metric, metricAxis, name, scaleType } = lineProps;

	return [
		// points used for the voronoi transform
		getPointsForVoronoi(dataSource, dimension, metric, name, scaleType, metricAxis),
		// voronoi transform used to get nearest point paths
		getVoronoiPath(children, `${name}_pointsForVoronoi`, name, lineProps),
	];
};

const getItemHoverMarks = (dataSource: string, lineProps: LineMarkProps): Mark[] => {
	const { children, dimension, metric, metricAxis, name, scaleType } = lineProps;

	return [
		// area around item that triggers hover
		getItemHoverArea(children, dataSource, dimension, metric, name, scaleType, metricAxis),
	];
};
