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
import { ReactElement } from 'react';

import { ChartPopover } from '@components/ChartPopover';
import { ChartTooltip } from '@components/ChartTooltip';
import { MetricRange } from '@components/MetricRange';
import { Trendline } from '@components/Trendline';
import {
	BACKGROUND_COLOR,
	COLOR_SCALE,
	DEFAULT_OPACITY_RULE,
	DEFAULT_TRANSFORMED_TIME_DIMENSION,
	HIGHLIGHT_CONTRAST_RATIO,
	LINEAR_COLOR_SCALE,
	LINE_TYPE_SCALE,
	LINE_WIDTH_SCALE,
	OPACITY_SCALE,
	SYMBOL_SIZE_SCALE,
	SERIES_ID, HIGHLIGHTED_SERIES
} from '@constants';
import { getScaleName } from '@specBuilder/scale/scaleSpecBuilder';
import {
	getColorValue,
	getLineWidthPixelsFromLineWidth,
	getStrokeDashFromLineType,
	getVegaSymbolSizeFromRscSymbolSize,
} from '@specBuilder/specUtils';
import {
	ColorFacet,
	ColorScheme,
	DualFacet,
	LineTypeFacet,
	LineWidthFacet,
	MarkChildElement,
	OpacityFacet,
	ScaleType,
	SymbolSizeFacet,
} from 'types';
import {
	AreaEncodeEntry,
	ArrayValueRef,
	ColorValueRef,
	Cursor,
	NumericValueRef,
	PathMark,
	ProductionRule,
	ScaledValueRef,
	SignalRef,
} from 'vega';

/**
 * If a popover exists on the mark, then set the cursor to a pointer.
 */
export function getCursor(children: MarkChildElement[]): ScaledValueRef<Cursor> | undefined {
	if (hasPopover(children)) {
		return { value: 'pointer' };
	}
}

/**
 * If there aren't any tooltips or popovers on the mark, then set interactive to false.
 * This prevents the mark from interfering with other interactive marks.
 */
export function getInteractive(children: MarkChildElement[]): boolean {
	// skip annotations
	return hasInteractiveChildren(children);
}

/**
 * If a tooltip or popover exists on the mark, then set tooltip to true.
 */
export function getTooltip(children: MarkChildElement[], name: string, nestedDatum?: boolean): SignalRef | undefined {
	// skip annotations
	if (hasTooltip(children)) {
		return { signal: `merge(datum${nestedDatum ? '.datum' : ''}, {'rscComponentName': '${name}'})` };
	}
}

/**
 * returns the border stroke encodings for stacked bar/area
 */
export const getBorderStrokeEncodings = (isStacked: boolean, isArea = false): AreaEncodeEntry => {
	if (isStacked)
		return {
			stroke: { signal: BACKGROUND_COLOR },
			strokeWidth: { value: isArea ? 1.5 : 1 },
			strokeJoin: { value: 'round' },
		};
	return {};
};

/**
 * Checks if there are any tooltips or popovers on the mark
 * @param children
 * @returns
 */
export const hasInteractiveChildren = (children: ReactElement[]): boolean => {
	return children.some(
		(child) =>
			child.type === ChartTooltip ||
			child.type === ChartPopover ||
			(child.type === Trendline && child.props.displayOnHover) ||
			(child.type === MetricRange && child.props.displayOnHover)
	);
};
export const hasMetricRange = (children: ReactElement[]): boolean =>
	children.some((child) => child.type === MetricRange);
export const hasPopover = (children: ReactElement[]): boolean => children.some((child) => child.type === ChartPopover);
export const hasTooltip = (children: ReactElement[]): boolean => children.some((child) => child.type === ChartTooltip);
export const childHasTooltip = (children: ReactElement[]): boolean =>
	children.some((child) => hasTooltip(child.props.children));

/**
 * Gets the color encoding
 * @param color
 * @param colorScheme
 * @param colorScaleType
 * @returns ColorValueRef
 */
export const getColorProductionRule = (
	color: ColorFacet | DualFacet,
	colorScheme: ColorScheme,
	colorScaleType: 'linear' | 'ordinal' = 'ordinal'
): ColorValueRef => {
	const colorScaleName = colorScaleType === 'linear' ? LINEAR_COLOR_SCALE : COLOR_SCALE;
	if (Array.isArray(color)) {
		return {
			signal: `scale('colors', datum.${color[0]})[indexof(domain('secondaryColor'), datum.${color[1]})% length(scale('colors', datum.${color[0]}))]`,
		};
	}
	if (typeof color === 'string') {
		return { scale: colorScaleName, field: color };
	}
	return { value: getColorValue(color.value, colorScheme) };
};

/**
 * gets the color encoding in a signal string format
 * @param color
 * @param colorScheme
 * @param colorScaleType
 * @returns string
 */
export const getColorProductionRuleSignalString = (
	color: ColorFacet | DualFacet,
	colorScheme: ColorScheme,
	colorScaleType: 'linear' | 'ordinal' = 'ordinal'
): string => {
	const colorRule = getColorProductionRule(color, colorScheme, colorScaleType);
	if ('signal' in colorRule) {
		return colorRule.signal;
	}
	if ('scale' in colorRule && 'field' in colorRule) {
		return `scale('${colorRule.scale}', datum.${colorRule.field})`;
	}
	if ('value' in colorRule && colorRule.value) {
		return `'${colorRule.value}'`;
	}
	return '';
};

export const getLineWidthProductionRule = (
	lineWidth: LineWidthFacet | DualFacet | undefined
): NumericValueRef | undefined => {
	if (!lineWidth) return;
	if (Array.isArray(lineWidth)) {
		// 2d key reference for setting line width
		return {
			signal: `scale('lineWidths', datum.${lineWidth[0]})[indexof(domain('secondaryLineWidth'), datum.${lineWidth[1]})% length(scale('lineWidths', datum.${lineWidth[0]}))]`,
		};
	}
	// key reference for setting line width
	if (typeof lineWidth === 'string') {
		return { scale: LINE_WIDTH_SCALE, field: lineWidth };
	}
	// static value for setting line width
	return { value: getLineWidthPixelsFromLineWidth(lineWidth.value) };
};

export const getOpacityProductionRule = (opacity: OpacityFacet | DualFacet): { signal: string } | { value: number } => {
	if (Array.isArray(opacity)) {
		return {
			signal: `scale('opacities', datum.${opacity[0]})[indexof(domain('secondaryOpacity'), datum.${opacity[1]})% length(scale('opacities', datum.${opacity[0]}))]`,
		};
	}
	if (typeof opacity === 'string') {
		return { signal: `scale('${OPACITY_SCALE}', datum.${opacity})` };
	}
	return { value: opacity.value };
};

export const getSymbolSizeProductionRule = (symbolSize: SymbolSizeFacet): NumericValueRef => {
	// key reference for setting symbol size
	if (typeof symbolSize === 'string') {
		return { scale: SYMBOL_SIZE_SCALE, field: symbolSize };
	}
	// static value for setting symbol size
	return { value: getVegaSymbolSizeFromRscSymbolSize(symbolSize.value) };
};

export const getStrokeDashProductionRule = (lineType: LineTypeFacet | DualFacet): ArrayValueRef => {
	if (Array.isArray(lineType)) {
		return {
			signal: `scale('lineTypes', datum.${lineType[0]})[indexof(domain('secondaryLineType'), datum.${lineType[1]})% length(scale('lineTypes', datum.${lineType[0]}))]`,
		};
	}
	if (typeof lineType === 'string') {
		return { scale: LINE_TYPE_SCALE, field: lineType };
	}
	return { value: getStrokeDashFromLineType(lineType.value) };
};

export const getHighlightOpacityValue = (
	opacityValue: { signal: string } | { value: number } = DEFAULT_OPACITY_RULE
): NumericValueRef => {
	if ('signal' in opacityValue) {
		return { signal: `${opacityValue.signal} / ${HIGHLIGHT_CONTRAST_RATIO}` };
	}
	return { value: opacityValue.value / HIGHLIGHT_CONTRAST_RATIO };
};

/**
 * gets the correct x encoding for marks that support scaleType
 * @param scaleType
 * @param dimension
 * @returns x encoding
 */
export const getXProductionRule = (scaleType: ScaleType, dimension: string): NumericValueRef => {
	const scale = getScaleName('x', scaleType);
	if (scaleType === 'time') {
		return { scale, field: DEFAULT_TRANSFORMED_TIME_DIMENSION };
	}
	return { scale, field: dimension };
};

/**
 * Gets the voronoi path used for tooltips and popovers
 * @param children
 * @param dataSource name of the point data source the voronoi is based on
 * @param markName
 * @returns PathMark
 */
export const getVoronoiPath = (children: MarkChildElement[], dataSource: string, markName: string): PathMark => ({
	name: `${markName}_voronoi`,
	type: 'path',
	from: { data: dataSource },
	encode: {
		enter: {
			fill: { value: 'transparent' },
			stroke: { value: 'transparent' },
			isVoronoi: { value: true },
			tooltip: getTooltip(children, markName, true),
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
});

//TODO: Add documentation
export const getHighlightOpacityAnimationValue = (opacityValue: { signal: string } | { value: number }): { signal: string }  => {
	if ('signal' in opacityValue) {
		return { signal: `max(1-rscColorAnimation, ${opacityValue.signal} / ${HIGHLIGHT_CONTRAST_RATIO})` }
	}
	return { signal: `max(1-rscColorAnimation, ${opacityValue.value} / ${HIGHLIGHT_CONTRAST_RATIO})`}
};

//TODO: Add documentation/tests/etc
export const getOpacityAnimationRules = (
	opacityValue?: { signal: string } | { value: number },
): ProductionRule<NumericValueRef> => {
	if (!opacityValue) {
		opacityValue = DEFAULT_OPACITY_RULE;
	}
	return [
		{
			test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.${SERIES_ID}`,
			...getHighlightOpacityAnimationValue(opacityValue)
		},
		{
			test: `!${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES}_prev !== datum.${SERIES_ID}`,
			...getHighlightOpacityAnimationValue(opacityValue)
		},
		DEFAULT_OPACITY_RULE
	]
}

//TODO: add comments/tests/etc
export const getLegendOpacityRules = (): ProductionRule<NumericValueRef> => {
	return [
		{
			test: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} !== datum.value`,
			...getHighlightOpacityAnimationValue(DEFAULT_OPACITY_RULE)
		},
		{
			test: `!${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES}_prev !== datum.value`,
			...getHighlightOpacityAnimationValue(DEFAULT_OPACITY_RULE)
		},
		DEFAULT_OPACITY_RULE
	]
}
