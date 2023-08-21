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
	getColorProductionRule,
	getCursor,
	getLineWidthProductionRule,
	getOpacityProductionRule,
	getStrokeDashProductionRule,
} from '@specBuilder/marks/markUtils';
import { ColorFacet, ColorScheme, LineTypeFacet, LineWidthFacet, MarkChildElement, OpacityFacet } from 'types';
import { LineMark, Mark, NumericValueRef, ProductionRule, ScaleType, SourceData, SymbolMark } from 'vega';

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
}

/**
 * generates a line mark
 * @param lineProps
 * @param dataSource
 * @returns LineMark
 */
export const getLineMark = (
	{ name, color, metric, dimension, scaleType, lineType, lineWidth, opacity, colorScheme }: LineMarkProps,
	dataSource: string
): LineMark => {
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
				strokeOpacity: [getOpacityProductionRule(opacity)],
			},
		},
	};
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
}

export const getLineHoverMarks = (
	{ children, color, colorScheme, dimension, metric, name, scaleType }: LineHoverMarkProps,
	dataSource: string,
	secondaryHighlightedMetric?: string
): Mark[] => {
	return [
		{
			name: `${name}HoverRule`,
			type: 'rule',
			from: { data: `${name}HighlightedData` },
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
		},
		{
			name: `${name}Point`,
			type: 'symbol',
			from: { data: `${name}HighlightedData` },
			interactive: false,
			encode: {
				enter: {
					y: { scale: 'yLinear', field: metric },
					fill: { signal: 'backgroundColor' },
					stroke: getColorProductionRule(color, colorScheme),
				},
				update: {
					x: getXProductionRule(scaleType, dimension),
				},
			},
		},
		...(secondaryHighlightedMetric
			? ([
					{
						name: `${name}SecondaryPoint`,
						type: 'symbol',
						from: { data: `${name}HighlightedData` },
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
					},
			  ] as SymbolMark[])
			: []),
		{
			name: `${name}PointsForVoronoi`,
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
		},
		{
			name: `${name}Voronoi`,
			type: 'path',
			from: { data: `${name}PointsForVoronoi` },
			encode: {
				enter: {
					fill: { value: 'transparent' },
					stroke: { value: 'transparent' },
					isVoronoi: { value: true },
					tooltip: {
						signal: `datum.datum`,
					},
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
		},
	];
};

/**
 * gets the data used for highlighting hovered data points
 * @param name
 * @param source
 * @returns
 */
export const getLineHighlightedData = (name: string, source: string, hasPopover: boolean): SourceData => {
	const selectSignal = `${name}SelectedId`;
	const hoverSignal = `${name}VoronoiHoveredId`;
	const expr = hasPopover
		? `${selectSignal} && ${selectSignal} === datum.prismMarkId || !${selectSignal} && ${hoverSignal} && ${hoverSignal} === datum.prismMarkId`
		: `${hoverSignal} && ${hoverSignal} === datum.prismMarkId`;
	return {
		name: `${name}HighlightedData`,
		source,
		transform: [
			{
				type: 'filter',
				expr,
			},
		],
	};
};
