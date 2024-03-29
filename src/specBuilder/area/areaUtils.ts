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
import { ChartPopover } from '@components/ChartPopover';
import {
	DEFAULT_TRANSFORMED_TIME_DIMENSION,
	HIGHLIGHTED_SERIES,
	HIGHLIGHT_CONTRAST_RATIO,
	SELECTED_SERIES,
	SERIES_ID,
} from '@constants';
import {
	getBorderStrokeEncodings,
	getColorProductionRule,
	getCursor,
	getInteractive,
	getTooltip,
} from '@specBuilder/marks/markUtils';
import { ColorFacet, ColorScheme, MarkChildElement, ScaleType } from 'types';
import { AreaMark, NumericValueRef, ProductionRule } from 'vega';

export interface AreaMarkProps {
	name: string;
	color: ColorFacet;
	colorScheme: ColorScheme;
	children: MarkChildElement[];
	metricStart: string;
	metricEnd: string;
	isStacked: boolean;
	dimension: string;
	scaleType: ScaleType;
	opacity: number;
	isMetricRange?: boolean;
	parentName?: string; // Optional name of mark that this area is a child of. Used for metric ranges.
	displayOnHover?: boolean;
}

export const getAreaMark = (
	{
		name,
		color,
		colorScheme,
		children,
		metricStart,
		metricEnd,
		isStacked,
		scaleType,
		dimension,
		opacity,
		isMetricRange,
		parentName,
		displayOnHover,
	}: AreaMarkProps,
	dataSource: string = `${name}_facet`
): AreaMark => ({
	name,
	type: 'area',
	from: { data: dataSource },
	interactive: getInteractive(children),
	encode: {
		enter: {
			y: { scale: 'yLinear', field: metricStart },
			y2: { scale: 'yLinear', field: metricEnd },
			fill: getColorProductionRule(color, colorScheme),
			tooltip: getTooltip(children, name),
			...getBorderStrokeEncodings(isStacked, true),
		},
		update: {
			// this has to be in update because when you resize the window that doesn't rebuild the spec
			// but it may change the x position if it causes the chart to resize
			x: getX(scaleType, dimension),
			cursor: getCursor(children),
			fillOpacity: getFillOpacity(name, color, opacity, children, isMetricRange, parentName, displayOnHover),
		},
	},
});

export function getFillOpacity(
	name: string,
	color: ColorFacet,
	opacity: number,
	children: MarkChildElement[],
	isMetricRange?: boolean,
	parentName?: string,
	displayOnHover?: boolean
): ProductionRule<NumericValueRef> | undefined {
	// if metric ranges only display when hovering, we don't need to include other hover rules for this specific area
	if (isMetricRange && displayOnHover) {
		return [
			{ test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} === datum.${color}`, value: opacity },
			{ test: `${SELECTED_SERIES} && ${SELECTED_SERIES} === datum.${color}`, value: opacity },
			{ test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} === datum.${SERIES_ID}`, value: opacity },
			{ value: 0 },
		];
	}

	// no children means no interactive elements
	if (!children.length) {
		return [{ value: opacity }];
	}

	// if an area is hovered or selected, all other areas should have half opacity
	if (children.some((child) => child.type === ChartPopover && !isMetricRange)) {
		return [
			{
				test: `!${SELECTED_SERIES} && ${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${color}`,
				value: opacity / HIGHLIGHT_CONTRAST_RATIO,
			},
			{
				test: `${SELECTED_SERIES} && ${SELECTED_SERIES} !== datum.${color}`,
				value: opacity / HIGHLIGHT_CONTRAST_RATIO,
			},
			{ test: `${SELECTED_SERIES} && ${SELECTED_SERIES} === datum.${color}`, value: opacity },
			{ value: opacity },
		];
	}

	return [
		{
			test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${color}`,
			value: opacity / HIGHLIGHT_CONTRAST_RATIO,
		},
		{ value: opacity },
	];
}

export const getX = (scaleType: ScaleType, dimension: string): ProductionRule<NumericValueRef> => {
	if (scaleType === 'time') {
		return { scale: 'xTime', field: DEFAULT_TRANSFORMED_TIME_DIMENSION };
	} else if (scaleType === 'linear') {
		return { scale: 'xLinear', field: dimension };
	}
	return { scale: 'xPoint', field: dimension };
};
