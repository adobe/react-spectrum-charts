import { BACKGROUND_COLOR, DEFAULT_SYMBOL_SIZE, DEFAULT_SYMBOL_STROKE_WIDTH } from '@constants';
import {
	getColorProductionRule,
	getHighlightOpacityValue,
	getOpacityProductionRule,
} from '@specBuilder/marks/markUtils';
import { LineSpecProps, ProductionRuleTests } from 'types';
import { ColorValueRef, NumericValueRef, SymbolMark } from 'vega';

import { LineMarkProps, getXProductionRule } from './lineUtils';

const staticPointTest = (staticPoint: string) => `datum.${staticPoint} && datum.${staticPoint} === true`;

/**
 * Gets the point mark for static points on a line chart.
 * @param lineMarkProps
 * @returns SymbolMark
 */
export const getLineStaticPoint = ({
	name,
	metric,
	color,
	colorScheme,
	scaleType,
	dimension,
}: LineSpecProps): SymbolMark => {
	return {
		name: `${name}_staticPoints`,
		type: 'symbol',
		from: { data: `${name}_staticPointData` },
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: metric },
				fill: getColorProductionRule(color, colorScheme),
				stroke: { signal: BACKGROUND_COLOR },
			},
			update: {
				x: getXProductionRule(scaleType, dimension),
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
	const { dimension, metric, name, scaleType } = lineProps;
	return {
		name: `${name}_pointBackground`,
		type: 'symbol',
		from: { data: `${name}_highlightedData` },
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: metric },
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

/**
 * Displays a point on hover or select on the line.
 * @param lineMarkProps
 * @returns SymbolMark
 */
export const getHighlightPoint = (lineProps: LineMarkProps): SymbolMark => {
	const { color, colorScheme, dimension, metric, name, scaleType } = lineProps;
	return {
		name: `${name}_point`,
		type: 'symbol',
		from: { data: `${name}_highlightedData` },
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: metric },
				stroke: getColorProductionRule(color, colorScheme),
			},
			update: {
				fill: getHighlightPointFill(lineProps),
				size: getHighlightPointSize(lineProps),
				strokeOpacity: getHighlightPointStrokeOpacity(lineProps),
				strokeWidth: getHighlightPointStrokeWidth(lineProps),
				x: getXProductionRule(scaleType, dimension),
			},
		},
	};
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
	const { color, colorScheme, dimension, name, scaleType } = lineProps;
	return {
		name: `${name}_secondaryPoint`,
		type: 'symbol',
		from: { data: `${name}_highlightedData` },
		interactive: false,
		encode: {
			enter: {
				y: { scale: 'yLinear', field: secondaryHighlightedMetric },
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
const getHighlightPointFill = ({
	color,
	colorScheme,
	staticPoint,
}: LineMarkProps): ProductionRuleTests<ColorValueRef> => {
	const fillRules: ProductionRuleTests<ColorValueRef> = [{ signal: BACKGROUND_COLOR }];
	if (staticPoint) {
		fillRules.unshift({ test: staticPointTest(staticPoint), ...getColorProductionRule(color, colorScheme) });
	}
	return fillRules;
};

/**
 * gets the stroke opacity for the highlighted point
 * @param lineMarkProps
 * @returns stroke opacity rule
 */
const getHighlightPointStrokeOpacity = ({
	opacity,
	staticPoint,
}: LineMarkProps): ProductionRuleTests<NumericValueRef> => {
	const baseOpacityRule = getOpacityProductionRule(opacity);
	const strokeOpacityRules: ProductionRuleTests<NumericValueRef> = [baseOpacityRule];
	if (staticPoint) {
		strokeOpacityRules.unshift({
			test: staticPointTest(staticPoint),
			...getHighlightOpacityValue(baseOpacityRule),
		});
	}
	return strokeOpacityRules;
};

/**
 * gets the size for the highlighted point
 * @param lineMarkProps
 * @returns size rule
 */
const getHighlightPointSize = ({ staticPoint }: LineMarkProps): ProductionRuleTests<NumericValueRef> => {
	const sizeRules: ProductionRuleTests<NumericValueRef> = [{ value: DEFAULT_SYMBOL_SIZE }];
	if (staticPoint) {
		sizeRules.unshift({
			// if this is a static point, reduce the size since we are increasing the stroke width
			test: staticPointTest(staticPoint),
			value: 64,
		});
	}
	return sizeRules;
};

/**
 * gets the stroke width for the highlighted point
 * @param lineMarkProps
 * @returns stroke width rule
 */
const getHighlightPointStrokeWidth = ({ staticPoint }: LineMarkProps): ProductionRuleTests<NumericValueRef> => {
	const strokeWidthRules: ProductionRuleTests<NumericValueRef> = [{ value: DEFAULT_SYMBOL_STROKE_WIDTH }];
	if (staticPoint) {
		strokeWidthRules.unshift({
			// if the point is static, increase the stroke width
			test: staticPointTest(staticPoint),
			value: 6,
		});
	}
	return strokeWidthRules;
};
