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
	BACKGROUND_COLOR,
	DEFAULT_SYMBOL_SIZE,
	DEFAULT_SYMBOL_STROKE_WIDTH,
	SELECTED_GROUP,
	SELECTED_ITEM,
} from '@constants';
import {
	getColorProductionRule,
	getHighlightOpacityValue,
	getOpacityProductionRule,
	getXProductionRule,
	getYProductionRule,
	hasPopover,
} from '@specBuilder/marks/markUtils';
import { getAnimationMarks, getColorValue } from '@specBuilder/specUtils';
import { LineSpecProps, ProductionRuleTests } from 'types';
import { ColorValueRef, NumericValueRef, SymbolMark } from 'vega';

import { LineSpecProps, ProductionRuleTests } from '../../types';
import { LineMarkProps } from './lineUtils';

const staticPointTest = (staticPoint: string) => `datum.${staticPoint} && datum.${staticPoint} === true`;
const getSelectedTest = (name: string, idKey: string) =>
	`(${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${idKey}) || (${SELECTED_GROUP} && ${SELECTED_GROUP} === datum.${name}_selectedGroupId)`;

/**
 * Gets the point mark for static points on a line chart.
 * @param lineMarkProps
 * @returns SymbolMark
 */
export const getLineStaticPoint = ({
	name,
	data,
	previousData,
	animations,
	metric,
	metricAxis,
	color,
	colorScheme,
	scaleType,
	dimension,
	isSparkline,
	pointSize = 125,
}: LineSpecProps): SymbolMark => {
	return {
		name: `${name}_staticPoints`,
		description: `${name}_staticPoints`,
		type: 'symbol',
		from: { data: `${name}_staticPointData` },
		interactive: false,
		encode: {
			enter: {
				size: { value: pointSize },
				fill: isSparkline ? { signal: BACKGROUND_COLOR } : getColorProductionRule(color, colorScheme),
				stroke: isSparkline ? getColorProductionRule(color, colorScheme) : { signal: BACKGROUND_COLOR },
				y: getYProductionRule(metricAxis, metric),
			},
			update: {
				x: getXProductionRule(scaleType, dimension),
				...(animations && { y: getAnimationMarks(dimension, metric, data, previousData) })
			},
		},
	};
};

/**
 * Gets a background to points to prevent opacity from displaying elements behind the point.
 * @param lineMarkProps
 * @returns SymbolMark
 */
export const getHighlightBackgroundPoint = (lineProps: LineMarkProps): SymbolMark => {
	const { dimension, metric, metricAxis, name, scaleType } = lineProps;
	return {
		name: `${name}_pointBackground`,
		description: `${name}_pointBackground`,
		type: 'symbol',
		from: { data: `${name}_highlightedData` },
		interactive: false,
		encode: {
			enter: {
				y: getYProductionRule(metricAxis, metric),
				fill: { signal: BACKGROUND_COLOR },
				stroke: { signal: BACKGROUND_COLOR },
			},
			update: {
				size: getHighlightPointSize(lineProps),
				strokeWidth: getHighlightPointStrokeWidth(lineProps),
				x: getXProductionRule(scaleType, dimension),
			},
		},
	};
};

const getHighlightOrSelectionPoint = (lineProps: LineMarkProps, useHighlightedData = true): SymbolMark => {
	const { color, colorScheme, dimension, metric, metricAxis, name, scaleType } = lineProps;
	return {
		name: `${name}_point_${useHighlightedData ? 'highlight' : 'select'}`,
		type: 'symbol',
		from: { data: `${name}${useHighlightedData ? '_highlightedData' : '_selectedData'}` },
		interactive: false,
		encode: {
			enter: {
				y: getYProductionRule(metricAxis, metric),
				stroke: getColorProductionRule(color, colorScheme),
			},
			update: {
				fill: getHighlightPointFill(lineProps),
				size: getHighlightPointSize(lineProps),
				stroke: getHighlightPointStroke(lineProps),
				strokeOpacity: getHighlightPointStrokeOpacity(lineProps),
				strokeWidth: getHighlightPointStrokeWidth(lineProps),
				x: getXProductionRule(scaleType, dimension),
			},
		},
	};
};

/**
 * Displays a point on hover on the line.
 * @param lineMarkProps
 * @returns SymbolMark
 */
export const getHighlightPoint = (lineProps: LineMarkProps): SymbolMark => {
	return getHighlightOrSelectionPoint(lineProps, true);
};

/**
 * Displays a point on select on the line.
 * @param lineMarkProps
 * @returns SymbolMark
 */
export const getSelectionPoint = (lineProps: LineMarkProps): SymbolMark => {
	return getHighlightOrSelectionPoint(lineProps, false);
};

/**
 * Displays a secondary highlight point on hover or select on the line.
 * @param lineMarkProps
 * @param secondaryHighlightedMetric
 * @returns SymbolMark
 */
export const getSecondaryHighlightPoint = (
	lineProps: LineMarkProps,
	secondaryHighlightedMetric: string
): SymbolMark => {
	const { color, colorScheme, dimension, metricAxis, name, scaleType } = lineProps;
	return {
		name: `${name}_secondaryPoint`,
		type: 'symbol',
		from: { data: `${name}_highlightedData` },
		interactive: false,
		encode: {
			enter: {
				y: getYProductionRule(metricAxis, secondaryHighlightedMetric),
				fill: { signal: BACKGROUND_COLOR },
				stroke: getColorProductionRule(color, colorScheme),
			},
			update: {
				x: getXProductionRule(scaleType, dimension),
			},
		},
	};
};

/**
 * gets the fill color for the highlighted point
 * @param lineMarkProps
 * @returns fill rule
 */
export const getHighlightPointFill = ({
	children,
	color,
	colorScheme,
	idKey,
	name,
	staticPoint,
}: LineMarkProps): ProductionRuleTests<ColorValueRef> => {
	const fillRules: ProductionRuleTests<ColorValueRef> = [];
	const selectedTest = getSelectedTest(name, idKey);

	if (staticPoint) {
		fillRules.push({ test: staticPointTest(staticPoint), ...getColorProductionRule(color, colorScheme) });
	}
	if (hasPopover(children)) {
		fillRules.push({ test: selectedTest, ...getColorProductionRule(color, colorScheme) });
	}
	return [...fillRules, { signal: BACKGROUND_COLOR }];
};

/**
 * gets the stroke color for the highlighted point
 * @param lineMarkProps
 * @returns stroke rule
 */
export const getHighlightPointStroke = ({
	children,
	color,
	colorScheme,
	idKey,
	name,
	staticPoint,
}: LineMarkProps): ProductionRuleTests<ColorValueRef> => {
	const strokeRules: ProductionRuleTests<ColorValueRef> = [];
	const selectedTest = getSelectedTest(name, idKey);

	if (staticPoint) {
		strokeRules.push({ test: staticPointTest(staticPoint), ...getColorProductionRule(color, colorScheme) });
	}
	if (hasPopover(children)) {
		strokeRules.push({ test: selectedTest, signal: BACKGROUND_COLOR });
	}

	return [...strokeRules, getColorProductionRule(color, colorScheme)];
};

/**
 * gets the stroke opacity for the highlighted point
 * @param lineMarkProps
 * @returns stroke opacity rule
 */
export const getHighlightPointStrokeOpacity = ({
	opacity,
	staticPoint,
}: LineMarkProps): ProductionRuleTests<NumericValueRef> => {
	const baseOpacityRule = getOpacityProductionRule(opacity);
	const strokeOpacityRules: ProductionRuleTests<NumericValueRef> = [];
	if (staticPoint) {
		strokeOpacityRules.push({
			test: staticPointTest(staticPoint),
			...getHighlightOpacityValue(baseOpacityRule),
		});
	}
	return [...strokeOpacityRules, baseOpacityRule];
};

/**
 * gets the size for the highlighted point
 * @param lineMarkProps
 * @returns size rule
 */
export const getHighlightPointSize = ({ staticPoint }: LineMarkProps): ProductionRuleTests<NumericValueRef> => {
	const sizeRules: ProductionRuleTests<NumericValueRef> = [];
	if (staticPoint) {
		sizeRules.push({
			// if this is a static point, reduce the size since we are increasing the stroke width
			test: staticPointTest(staticPoint),
			value: 64,
		});
	}
	return [...sizeRules, { value: DEFAULT_SYMBOL_SIZE }];
};

/**
 * gets the stroke width for the highlighted point
 * @param lineMarkProps
 * @returns stroke width rule
 */
export const getHighlightPointStrokeWidth = ({ staticPoint }: LineMarkProps): ProductionRuleTests<NumericValueRef> => {
	const strokeWidthRules: ProductionRuleTests<NumericValueRef> = [];
	if (staticPoint) {
		strokeWidthRules.push({
			// if the point is static, increase the stroke width
			test: staticPointTest(staticPoint),
			value: 6,
		});
	}
	return [...strokeWidthRules, { value: DEFAULT_SYMBOL_STROKE_WIDTH }];
};

/**
 * Gets point that is used for the selection ring.
 * @param lineMarkProps
 * @returns SymbolMark
 */
export const getSelectRingPoint = (lineProps: LineMarkProps): SymbolMark => {
	const { colorScheme, dimension, idKey, metric, metricAxis, name, scaleType } = lineProps;
	const selectedTest = getSelectedTest(name, idKey);

	return {
		name: `${name}_pointSelectRing`,
		type: 'symbol',
		from: { data: `${name}_selectedData` },
		interactive: false,
		encode: {
			enter: {
				y: getYProductionRule(metricAxis, metric),
				fill: { signal: BACKGROUND_COLOR },
				stroke: { value: getColorValue('static-blue', colorScheme) },
			},
			update: {
				size: [{ test: selectedTest, value: 196 }, { value: 0 }],
				strokeWidth: [{ test: selectedTest, value: DEFAULT_SYMBOL_STROKE_WIDTH }, { value: 0 }],
				x: getXProductionRule(scaleType, dimension),
			},
		},
	};
};
