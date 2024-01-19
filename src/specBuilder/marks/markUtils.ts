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
import { BACKGROUND_COLOR, HIGHLIGHT_CONTRAST_RATIO } from '@constants';
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

export const getColorProductionRule = (color: ColorFacet | DualFacet, colorScheme: ColorScheme): ColorValueRef => {
	if (Array.isArray(color)) {
		return {
			signal: `scale('colors', datum.${color[0]})[indexof(domain('secondaryColor'), datum.${color[1]})% length(scale('colors', datum.${color[0]}))]`,
		};
	}
	if (typeof color === 'string') {
		return { scale: 'color', field: color };
	}
	return { value: getColorValue(color.value, colorScheme) };
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
		return { scale: 'lineWidth', field: lineWidth };
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
		return { signal: `scale('opacity', datum.${opacity})` };
	}
	return { value: opacity.value };
};

export const getSymbolSizeProductionRule = (symbolSize: SymbolSizeFacet): NumericValueRef | undefined => {
	// key reference for setting symbol size
	if (typeof symbolSize === 'string') {
		return { scale: 'symbolSize', field: symbolSize };
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
		return { scale: 'lineType', field: lineType };
	}
	return { value: getStrokeDashFromLineType(lineType.value) };
};

export const getHighlightOpacityValue = (opacityValue: { signal: string } | { value: number }): NumericValueRef => {
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
export const getXProductionRule = (scaleType: ScaleType, dimension: string): ProductionRule<NumericValueRef> => {
	if (scaleType === 'time') {
		return { scale: 'xTime', field: 'datetime0' };
	} else if (scaleType === 'linear') {
		return { scale: 'xLinear', field: dimension };
	}
	return { scale: 'xPoint', field: dimension };
};
