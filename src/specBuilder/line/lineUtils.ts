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
import { DEFAULT_SYMBOL_SIZE, DEFAULT_SYMBOL_STROKE_WIDTH, MARK_ID, SERIES_ID } from '@constants';
import {
	getColorProductionRule,
	getCursor,
	getLineWidthProductionRule,
	getOpacityProductionRule,
	getStrokeDashProductionRule,
	getTooltip,
} from '@specBuilder/marks/markUtils';
import {
	ColorFacet,
	ColorScheme,
	LineSpecProps,
	LineTypeFacet,
	LineWidthFacet,
	MarkChildElement,
	OpacityFacet,
} from 'types';
import {
	LineMark,
	Mark,
	NumericValueRef,
	PathMark,
	ProductionRule,
	RuleMark,
	ScaleType,
	SourceData,
	SymbolMark,
} from 'vega';

export interface LineMarkProps {
	name: string;
	color: ColorFacet;
	metric: string;
	dimension: string;
	scaleType: ScaleType;
	lineType: LineTypeFacet;
	lineWidth?: LineWidthFacet;
	opacity: OpacityFacet;
	colorScheme: ColorScheme;
	displayOnHover?: boolean;
	staticPoint?: string;
	parentName?: string;
}

/**
 * generates a line mark
 * @param lineProps
 * @param dataSource
 * @returns LineMark
 */
export const getLineMark = (
	{
		name,
		color,
		metric,
		dimension,
		scaleType,
		lineType,
		lineWidth,
		opacity,
		colorScheme,
		displayOnHover,
		parentName,
	}: LineMarkProps,
	dataSource: string
): LineMark => {
	// This allows us to only show the metric range when hovering over the parent line component.
	const baseOpacityRule = getOpacityProductionRule(displayOnHover ? { value: 0 } : opacity);
	const opacityRules = displayOnHover
		? [...getHoverRules(parentName ?? name, opacity), baseOpacityRule]
		: [baseOpacityRule];

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
				strokeWidth: lineWidth ? getLineWidthProductionRule(lineWidth) : undefined,
			},
			update: {
				// this has to be in update because when you resize the window that doesn't rebuild the spec
				// but it may change the x position if it causes the chart to resize
				x: getXProductionRule(scaleType, dimension),
				strokeOpacity: opacityRules,
			},
		},
	};
};

const getHoverRules = (name: string, opacity: OpacityFacet) => {
	const opacityRule = getOpacityProductionRule(opacity);
	const hoverRule = {
		test: `${name}_hoveredSeries && ${name}_hoveredSeries === datum.${SERIES_ID}`,
		...opacityRule,
	};
	const selectRule = {
		test: `${name}_selectedSeries && ${name}_selectedSeries === datum.${SERIES_ID}`,
		...opacityRule,
	};
	const legendRule = { test: `highlightedSeries && highlightedSeries === datum.${SERIES_ID}`, ...opacityRule };
	return [hoverRule, selectRule, legendRule];
};

/**
 * gets the correct x encoding for the line mark
 * @param scaleType
 * @param dimension
 * @returns x encoding
 */
export const getXProductionRule = (scaleType: ScaleType, dimension: string): ProductionRule<NumericValueRef> => {
	if (scaleType === 'time') {
		return { scale: 'xTime', field: 'datetime0' };
	} else if (scaleType === 'linear') {
		return { scale: 'xLinear', field: dimension };
	}
	return { scale: 'xPoint', field: dimension };
};

interface LineHoverMarkProps {
	children: MarkChildElement[];
	color: ColorFacet;
	colorScheme: ColorScheme;
	dimension: string;
	metric: string;
	name: string;
	scaleType: ScaleType;
	staticPoint?: string;
}

export const getLineHoverMarks = (
	{ children, color, colorScheme, dimension, metric, name, scaleType, staticPoint }: LineHoverMarkProps,
	dataSource: string,
	secondaryHighlightedMetric?: string
): Mark[] => {
	return [
		getHoverRule(dimension, name, scaleType),
		getBackgroundPoint(dimension, staticPoint, metric, name, scaleType),
		getPoint(color, colorScheme, dimension, staticPoint, metric, name, scaleType),
		...(secondaryHighlightedMetric
			? [getSecondaryPoint(color, colorScheme, dimension, name, scaleType, secondaryHighlightedMetric)]
			: []),
		getPointsForVoronoi(dataSource, dimension, metric, name, scaleType),
		getVoronoi(children, name),
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

/**
 * Add a background to points to prevent opacity from displaying elements behind the point.
 * This is usually used in conjunction with opacity rules on the point for styling purposes.
 *
 * @param dimension
 * @param displayPointMark
 * @param metric
 * @param name
 * @param scaleType
 * @returns SymbolMark
 */
const getBackgroundPoint = (
	dimension: string,
	displayPointMark: string | undefined,
	metric: string,
	name: string,
	scaleType: ScaleType
): SymbolMark => {
	return {
		name: `${name}_pointBackground`,
		type: 'symbol',
		from: { data: `${name}_highlightedData` },
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: metric },
				fill: { signal: 'backgroundColor' },
				stroke: { signal: 'backgroundColor' },
			},
			update: {
				x: getXProductionRule(scaleType, dimension),
				...getHighlightPointSize(displayPointMark),
			},
		},
	};
};

const getPoint = (
	color: ColorFacet,
	colorScheme: ColorScheme,
	dimension: string,
	displayPointMark: string | undefined,
	metric: string,
	name: string,
	scaleType: ScaleType
): SymbolMark => {
	const xProductionRule = getXProductionRule(scaleType, dimension);
	const update = displayPointMark
		? {
				x: xProductionRule,
				...getHighlightPointSize(displayPointMark),
				...getHighlightPointStyle(name, displayPointMark, color, colorScheme),
		  }
		: {
				x: xProductionRule,
		  };
	return {
		name: `${name}_point`,
		type: 'symbol',
		from: { data: `${name}_highlightedData` },
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: metric },
				fill: { signal: 'backgroundColor' },
				stroke: getColorProductionRule(color, colorScheme),
			},
			update,
		},
	};
};

const getSecondaryPoint = (
	color: ColorFacet,
	colorScheme: ColorScheme,
	dimension: string,
	name: string,
	scaleType: ScaleType,
	secondaryHighlightedMetric: string
): SymbolMark => {
	return {
		name: `${name}_secondaryPoint`,
		type: 'symbol',
		from: { data: `${name}_highlightedData` },
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: secondaryHighlightedMetric },
				fill: { signal: 'backgroundColor' },
				stroke: getColorProductionRule(color, colorScheme),
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

const getVoronoi = (children: MarkChildElement[], name: string): PathMark => {
	return {
		name: `${name}_voronoi`,
		type: 'path',
		from: { data: `${name}_pointsForVoronoi` },
		encode: {
			enter: {
				fill: { value: 'transparent' },
				stroke: { value: 'transparent' },
				isVoronoi: { value: true },
				// Don't add a tooltip if there are no interactive children. We only want the other hover marks for metric ranges.
				tooltip: getTooltip(children, name, true),
			},
			update: {
				cursor: getCursor(children),
			},
		},
		transform: [
			{
				type: 'voronoi',
				x: `datum.x`,
				y: `datum.y`,
				// on initial render, width/height could be 0 which causes problems
				size: [{ signal: 'max(width, 1)' }, { signal: 'max(height, 1)' }],
			},
		],
	};
};

const getHighlightPointSize = (displayPointMark: string | undefined) => {
	const displayPointmarkTest = `datum.${displayPointMark} && datum.${displayPointMark} === true`;
	const defaultSizeRule = {
		value: DEFAULT_SYMBOL_SIZE,
	};
	const defaultStrokeWidthRule = {
		value: DEFAULT_SYMBOL_STROKE_WIDTH,
	};
	const size = displayPointMark
		? [
				{
					test: displayPointmarkTest,
					value: 64, // reduce symbol size to compensate for increased strokeWidth
				},
				defaultSizeRule,
		  ]
		: [defaultSizeRule];

	const strokeWidth = displayPointMark
		? [
				{
					// Increase stroke width to account for stroke with opacity bleeding into the symbol fill.
					// Business logic dictates that the stroke should be one pixel larger than normal when highlighting display points.
					test: displayPointmarkTest,
					value: 6,
				},
				defaultStrokeWidthRule,
		  ]
		: [defaultStrokeWidthRule];

	return {
		size,
		strokeWidth,
	};
};

const getHighlightPointStyle = (
	name: string,
	displayPointMark: string | undefined,
	color: ColorFacet,
	colorScheme: ColorScheme
) => {
	const displayPointMarkTest = `datum.${displayPointMark} && datum.${displayPointMark} === true`;
	const hoveredTest = `${name}_voronoiHoveredId && ${name}_voronoiHoveredId === datum.${MARK_ID}`;
	const selectedTest = `${name}_selectedId && ${name}_selectedId === datum.${MARK_ID}`;
	const hoverStrokeRule = `(${hoveredTest} || ${selectedTest}) && datum.${displayPointMark}`;

	return {
		fill: [
			{
				test: displayPointMarkTest,
				...getColorProductionRule(color, colorScheme),
			},
			{ signal: 'backgroundColor' },
		],
		stroke: [
			{
				test: hoverStrokeRule,
				...getColorProductionRule(color, colorScheme),
			},
			{
				test: displayPointMarkTest,
				signal: 'backgroundColor',
			},
			{ ...getColorProductionRule(color, colorScheme) },
		],
		strokeOpacity: [
			{
				test: hoverStrokeRule,
				value: 0.2,
			},
		],
	};
};

export const getLinePointMark = ({
	name,
	metric,
	color,
	colorScheme,
	scaleType,
	dimension,
}: LineSpecProps): SymbolMark => {
	return {
		name: `${name}_points`,
		type: 'symbol',
		from: { data: `${name}_pointsData` },
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: metric },
				fill: getColorProductionRule(color, colorScheme),
				stroke: { signal: 'backgroundColor' },
			},
			update: {
				x: getXProductionRule(scaleType, dimension),
			},
		},
	};
};

/**
 * gets the data used for highlighting hovered data points
 * @param name
 * @param source
 * @returns
 */
export const getLineHighlightedData = (name: string, source: string, hasPopover: boolean): SourceData => {
	const selectSignal = `${name}_selectedId`;
	const hoverSignal = `${name}_voronoiHoveredId`;
	const expr = hasPopover
		? `${selectSignal} && ${selectSignal} === datum.${MARK_ID} || !${selectSignal} && ${hoverSignal} && ${hoverSignal} === datum.${MARK_ID}`
		: `${hoverSignal} && ${hoverSignal} === datum.${MARK_ID}`;
	return {
		name: `${name}_highlightedData`,
		source,
		transform: [
			{
				type: 'filter',
				expr,
			},
		],
	};
};

/**
 * gets the data used for displaying points
 * @param name
 * @param source
 * @returns
 */
export const getLinePointsData = (name: string, displayPointMark: string, source: string): SourceData => {
	return {
		name: `${name}_pointsData`,
		source,
		transform: [
			{
				type: 'filter',
				expr: `datum.${displayPointMark} === true`,
			},
		],
	};
};
