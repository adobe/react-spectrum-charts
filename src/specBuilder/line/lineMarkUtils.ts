import { SERIES_ID } from '@constants';
import {
	getColorProductionRule,
	getCursor,
	getHighlightOpacityValue,
	getLineWidthProductionRule,
	getOpacityProductionRule,
	getStrokeDashProductionRule,
	getTooltip,
} from '@specBuilder/marks/markUtils';
import { MarkChildElement, OpacityFacet } from 'types';
import { LineMark, Mark, NumericValueRef, PathMark, ProductionRule, RuleMark, ScaleType, SymbolMark } from 'vega';

import { getHighlightBackgroundPoint, getHighlightPoint, getSecondaryHighlightPoint } from './linePointUtils';
import { LineMarkProps, getXProductionRule } from './lineUtils';

/**
 * generates a line mark
 * @param lineProps
 * @param dataSource
 * @returns LineMark
 */
export const getLineMark = (lineMarkProps: LineMarkProps, dataSource: string): LineMark => {
	const { name, color, metric, dimension, scaleType, lineType, lineWidth, colorScheme } = lineMarkProps;

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
				strokeWidth: getLineWidthProductionRule(lineWidth),
			},
			update: {
				// this has to be in update because when you resize the window that doesn't rebuild the spec
				// but it may change the x position if it causes the chart to resize
				x: getXProductionRule(scaleType, dimension),
				strokeOpacity: getLineStrokeOpacity(lineMarkProps),
			},
		},
	};
};

export const getLineStrokeOpacity = ({
	displayOnHover,
	interactiveMarkName,
	opacity,
	popoverMarkName,
}: LineMarkProps): ProductionRule<NumericValueRef> => {
	const baseRule = getOpacityProductionRule(displayOnHover ? { value: 0 } : opacity);
	if (!interactiveMarkName) return [baseRule];
	const strokeOpacityRules: ProductionRule<NumericValueRef> = [];

	// add a rule that will lower the opacity of the line if there is a hovered series, but this line is not the one hovered
	const hoverSignal = `${interactiveMarkName}_hoveredSeries`;
	strokeOpacityRules.push({
		test: `${hoverSignal} && ${hoverSignal} !== datum.${SERIES_ID}`,
		...getHighlightOpacityValue(baseRule),
	});

	if (popoverMarkName) {
		const selectSignal = `${interactiveMarkName}_selectedSeries`;
		strokeOpacityRules.push({
			test: `${selectSignal} && ${selectSignal} !== datum.${SERIES_ID}`,
			...getHighlightOpacityValue(baseRule),
		});
	}

	if (displayOnHover) {
		strokeOpacityRules.push(...getDisplayOnHoverRules(interactiveMarkName, opacity));
	}
	// This allows us to only show the metric range when hovering over the parent line component.
	strokeOpacityRules.push(baseRule);

	return strokeOpacityRules;
};

const getDisplayOnHoverRules = (name: string, opacity: OpacityFacet) => {
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
	const { children, dimension, metric, name, scaleType } = lineProps;
	return [
		// vertical rule shown for the hovered or selected point
		getHoverRule(dimension, name, scaleType),
		// point behind the hovered or selected point used to prevent bacgorund elements from being visible through low opacity point
		getHighlightBackgroundPoint(lineProps),
		// hover or select point
		getHighlightPoint(lineProps),
		// additional point that gets highlighted like the trendline or raw line point
		...(secondaryHighlightedMetric ? [getSecondaryHighlightPoint(lineProps, secondaryHighlightedMetric)] : []),
		// points used for the voronoi transform
		getPointsForVoronoi(dataSource, dimension, metric, name, scaleType),
		// voronoi transform used to get nearest point paths
		getVoronoiPath(children, name),
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

const getVoronoiPath = (children: MarkChildElement[], name: string): PathMark => {
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
