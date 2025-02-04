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
	COMPONENT_NAME,
	DEFAULT_OPACITY_RULE,
	DEFAULT_TRANSFORMED_TIME_DIMENSION,
	HIGHLIGHT_CONTRAST_RATIO,
	HOVER_SHAPE,
	HOVER_SHAPE_COUNT,
	HOVER_SIZE,
	LINEAR_COLOR_SCALE,
	LINE_TYPE_SCALE,
	LINE_WIDTH_SCALE,
	OPACITY_SCALE,
	SELECTED_GROUP,
	SELECTED_ITEM,
	SYMBOL_SIZE_SCALE,
} from '@constants';
import { AreaMarkOptions } from '@specBuilder/area/areaUtils';
import { addHighlightMarkOpacityRules } from '@specBuilder/chartTooltip/chartTooltipUtils';
import { LineMarkOptions } from '@specBuilder/line/lineUtils';
import { getScaleName } from '@specBuilder/scale/scaleSpecBuilder';
import {
	getColorValue,
	getLineWidthPixelsFromLineWidth,
	getStrokeDashFromLineType,
	getVegaSymbolSizeFromRscSymbolSize,
} from '@specBuilder/specUtils';
import {
	AreaEncodeEntry,
	ArrayValueRef,
	ColorValueRef,
	Cursor,
	EncodeEntry,
	GroupMark,
	NumericValueRef,
	PathMark,
	ScaledValueRef,
	SignalRef,
	SymbolMark,
} from 'vega';

import {
	AreaSpecOptions,
	BarSpecOptions,
	ChartPopoverOptions,
	ChartTooltipOptions,
	ChartTooltipProps,
	ClickableChartProps,
	ColorFacet,
	ColorScheme,
	DonutSpecOptions,
	DualFacet,
	LineSpecOptions,
	LineTypeFacet,
	LineWidthFacet,
	MarkChildElement,
	OpacityFacet,
	ProductionRuleTests,
	ScaleType,
	ScatterSpecOptions,
	SymbolSizeFacet,
	TrendlineOptions,
	TrendlineSpecOptions,
} from '../../types';

/**
 * If a popover or onClick prop exists on the mark, then set the cursor to a pointer.
 */
export function getCursor_DEPRECATED(
	children: MarkChildElement[],
	props?: ClickableChartProps
): ScaledValueRef<Cursor> | undefined {
	if (props?.onClick !== undefined || hasPopover_DEPRECATED(children)) {
		return { value: 'pointer' };
	}
}

/**
 * If a popover or onClick prop exists on the mark, then set the cursor to a pointer.
 * @param chartPopovers
 * @param hasOnClick
 * @returns cursor encoding
 */
export const getCursor = (chartPopovers: ChartPopoverOptions[], hasOnClick?: boolean): EncodeEntry['cursor'] => {
	if (hasOnClick || chartPopovers.length) {
		return { value: 'pointer' };
	}
};

/**
 * Returns true if there are any popovers or tooltips in the children, or if props.onClick is defined.
 */
export function isInteractive_DEPRECATED(children: MarkChildElement[], props?: ClickableChartProps): boolean {
	return props?.onClick !== undefined || hasInteractiveChildren_DEPRECATED(children);
}

/**
 * If a tooltip or popover exists on the mark, then set tooltip to true.
 */
export function getTooltip_DEPRECATED(
	children: MarkChildElement[],
	name: string,
	nestedDatum?: boolean
): ProductionRuleTests<SignalRef> | SignalRef | undefined {
	// skip annotations
	if (hasTooltip_DEPRECATED(children)) {
		const defaultTooltip = {
			signal: `merge(datum${nestedDatum ? '.datum' : ''}, {'${COMPONENT_NAME}': '${name}'})`,
		};
		// if the tooltip has an excludeDataKey prop, then disable the tooltip where that key is present
		const excludeDataKeys = getTooltipProps_DEPRECATED(children)?.excludeDataKeys;
		if (excludeDataKeys?.length) {
			return [
				...excludeDataKeys.map((excludeDataKey) => ({ test: `datum.${excludeDataKey}`, signal: 'false' })),
				defaultTooltip,
			];
		}

		return defaultTooltip;
	}
}

/**
 * If a tooltip exists on the mark, then set tooltip to true.
 */
export function getTooltip(
	chartTooltips: ChartTooltipOptions[],
	name: string,
	nestedDatum?: boolean
): ProductionRuleTests<SignalRef> | SignalRef | undefined {
	// skip annotations
	if (chartTooltips.length) {
		const defaultTooltip = {
			signal: `merge(datum${nestedDatum ? '.datum' : ''}, {'${COMPONENT_NAME}': '${name}'})`,
		};
		// if the tooltip has an excludeDataKey prop, then disable the tooltip where that key is present
		const excludeDataKeys = chartTooltips[0].excludeDataKeys;
		if (excludeDataKeys?.length) {
			return [
				...excludeDataKeys.map((excludeDataKey) => ({ test: `datum.${excludeDataKey}`, signal: 'false' })),
				defaultTooltip,
			];
		}

		return defaultTooltip;
	}
}

export function getTooltipProps_DEPRECATED(children: MarkChildElement[]): ChartTooltipProps | undefined {
	return children.find((child) => child.type === ChartTooltip)?.props as ChartTooltipProps | undefined;
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
export const hasInteractiveChildren_DEPRECATED = (children: ReactElement[]): boolean => {
	return children.some(
		(child) =>
			child.type === ChartTooltip ||
			child.type === ChartPopover ||
			(child.type === Trendline && child.props.displayOnHover) ||
			(child.type === MetricRange && child.props.displayOnHover)
	);
};

/**
 * Checks if there are any tooltips or popovers on the mark
 * @param children
 * @returns
 */
export const isInteractive = (
	options:
		| AreaMarkOptions
		| AreaSpecOptions
		| BarSpecOptions
		| DonutSpecOptions
		| LineMarkOptions
		| LineSpecOptions
		| ScatterSpecOptions
		| TrendlineOptions
		| TrendlineSpecOptions
): boolean => {
	const hasOnClick = 'hasOnClick' in options && options.hasOnClick;
	const metricRanges = ('metricRanges' in options && options.metricRanges) || [];
	const trendlines = ('trendlines' in options && options.trendlines) || [];

	return (
		hasOnClick ||
		hasPopover(options) ||
		hasTooltip(options) ||
		trendlines.some((trendline) => trendline.displayOnHover) ||
		metricRanges.some((metricRange) => metricRange.displayOnHover)
	);

	// return children.some(
	// 	(child) =>
	// 		child.type === ChartTooltip ||
	// 		child.type === ChartPopover ||
	// 		(child.type === Trendline && child.props.displayOnHover) ||
	// 		(child.type === MetricRange && child.props.displayOnHover)
	// );
};

export const hasMetricRange = (children: ReactElement[]): boolean =>
	children.some((child) => child.type === MetricRange);
export const hasPopover_DEPRECATED = (children: ReactElement[]): boolean =>
	children.some((child) => child.type === ChartPopover);
export const hasTooltip_DEPRECATED = (children: ReactElement[]): boolean =>
	children.some((child) => child.type === ChartTooltip);

export const hasPopover = (
	options:
		| AreaMarkOptions
		| AreaSpecOptions
		| BarSpecOptions
		| DonutSpecOptions
		| LineSpecOptions
		| LineMarkOptions
		| ScatterSpecOptions
		| TrendlineOptions
		| TrendlineSpecOptions
): boolean => Boolean('chartPopovers' in options && options.chartPopovers && options.chartPopovers.length);

export const hasTooltip = (
	options:
		| AreaMarkOptions
		| AreaSpecOptions
		| BarSpecOptions
		| DonutSpecOptions
		| LineMarkOptions
		| LineSpecOptions
		| ScatterSpecOptions
		| TrendlineOptions
		| TrendlineSpecOptions
): boolean => Boolean('chartTooltips' in options && options.chartTooltips && options.chartTooltips.length);

export const childHasTooltip = (children: ReactElement[]): boolean =>
	children.some((child) => hasTooltip_DEPRECATED(child.props.children));

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
 * Gets the y encoding for marks
 * @param metricAxis
 * @param metric
 * @returns y encoding
 */
export const getYProductionRule = (metricAxis: string | undefined, metric: string): NumericValueRef => {
	return { scale: metricAxis || 'yLinear', field: metric };
};

/**
 * Gets the points used for the voronoi calculation
 * @param dataSource the name of the data source that will be used in the voronoi calculation
 * @param dimension the dimension for the x encoding
 * @param metric the metric for the y encoding
 * @param name the name of the component the voronoi is associated with, i.e. `scatter0`
 * @param scaleType the scale type for the x encoding
 * @returns SymbolMark
 */
export const getPointsForVoronoi = (
	dataSource: string,
	dimension: string,
	metric: string,
	name: string,
	scaleType: ScaleType,
	metricAxis?: string
): SymbolMark => {
	return {
		name: `${name}_pointsForVoronoi`,
		description: `${name}_pointsForVoronoi`,
		type: 'symbol',
		from: { data: dataSource },
		interactive: false,
		encode: {
			enter: {
				y: getYProductionRule(metricAxis, metric),
				fill: { value: 'transparent' },
				stroke: { value: 'transparent' },
			},
			update: {
				x: getXProductionRule(scaleType, dimension),
			},
		},
	};
};

/**
 * Gets the voronoi path used for tooltips and popovers
 * @param markOptions
 * @param dataSource name of the point data source the voronoi is based on
 * @returns PathMark
 */
export const getVoronoiPath = (markOptions: LineMarkOptions | ScatterSpecOptions, dataSource: string): PathMark => {
	const { chartPopovers, chartTooltips, name: markName } = markOptions;
	const hasOnClick = 'hasOnClick' in markOptions && markOptions.hasOnClick;
	return {
		name: `${markName}_voronoi`,
		description: `${markName}_voronoi`,
		type: 'path',
		from: { data: dataSource },
		encode: {
			enter: {
				fill: { value: 'transparent' },
				stroke: { value: 'transparent' },
				isVoronoi: { value: true },
				tooltip: getTooltip(chartTooltips ?? [], markName, true),
			},
			update: {
				cursor: getCursor(chartPopovers ?? [], hasOnClick),
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

/**
 * Gets the hover area for the mark
 * @param children
 * @param dataSource the name of the data source that will be used in the hover area calculation
 * @param dimension the dimension for the x encoding
 * @param metric the metric for the y encoding
 * @param name the name of the component the hover area is associated with, i.e. `scatter0`
 * @param scaleType the scale type for the x encoding
 * @returns GroupMark
 */
export const getItemHoverArea = (
	children: MarkChildElement[],
	dataSource: string,
	dimension: string,
	metric: string,
	name: string,
	scaleType: ScaleType,
	metricAxis?: string
): GroupMark => {
	return {
		name: `${name}_hoverGroup`,
		type: 'group',
		marks: getHoverSizes().map((size, i) => ({
			name: getHoverMarkName(name, i),
			type: 'symbol',
			from: { data: dataSource },
			encode: {
				enter: {
					shape: { value: HOVER_SHAPE },
					y: getYProductionRule(metricAxis, metric),
					fill: { value: 'transparent' },
					stroke: { value: 'transparent' },
					tooltip: getTooltip_DEPRECATED(children, name, false),
					size: getHoverSizeSignal(size),
				},
				update: {
					x: getXProductionRule(scaleType, dimension),
				},
			},
		})),
	};
};

export const getHoverMarkName = (name: string, index: number): string => `${name}_hover${index}`;

export const getHoverSizes = (): number[] => [...new Array(HOVER_SHAPE_COUNT)].map((_, i) => HOVER_SIZE / 2 ** i);

export const getHoverMarkNames = (markName: string): string[] =>
	[...new Array(HOVER_SHAPE_COUNT)].map((_, i) => getHoverMarkName(markName, i));

const getHoverSizeSignal = (size: number): SignalRef => ({
	signal: `${size} * max(width, 1) / 1000`,
});

/**
 * Gets the opacity for the mark (used to highlight marks).
 * This will take into account if there are any tooltips or popovers on the mark.
 * @param options
 * @returns
 */
export const getMarkOpacity = (options: BarSpecOptions | DonutSpecOptions): ({ test?: string } & NumericValueRef)[] => {
	const { highlightedItem, idKey, name: markName } = options;
	const rules: ({ test?: string } & NumericValueRef)[] = [DEFAULT_OPACITY_RULE];
	// if there aren't any interactive components, then we don't need to add special opacity rules
	if (!isInteractive(options) && highlightedItem === undefined) {
		return rules;
	}

	// if a bar is hovered/selected, all other bars should have reduced opacity
	addHighlightMarkOpacityRules(rules, options);
	if (hasPopover(options)) {
		return [
			{
				test: `!isValid(${SELECTED_GROUP}) && ${SELECTED_ITEM} && ${SELECTED_ITEM} !== datum.${idKey}`,
				value: 1 / HIGHLIGHT_CONTRAST_RATIO,
			},
			{ test: `isValid(${SELECTED_ITEM}) && ${SELECTED_ITEM} === datum.${idKey}`, ...DEFAULT_OPACITY_RULE },
			{
				test: `isValid(${SELECTED_GROUP}) && ${SELECTED_GROUP} === datum.${markName}_selectedGroupId`,
				value: 1,
			},
			{
				test: `isValid(${SELECTED_GROUP}) && ${SELECTED_GROUP} !== datum.${markName}_selectedGroupId`,
				value: 1 / HIGHLIGHT_CONTRAST_RATIO,
			},
			...rules,
		];
	}
	return rules;
};
