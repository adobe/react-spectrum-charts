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

import { Trendline } from '@components/Trendline';
import { TABLE } from '@constants';
import { getLineHoverMarks, getLineMark } from '@specBuilder/line/lineUtils';
import { hasInteractiveChildren, hasPopover, hasTooltip } from '@specBuilder/marks/markUtils';
import { getGenericSignal, getUncontrolledHoverSignal } from '@specBuilder/signal/signalSpecBuilder';
import { getFacetsFromProps } from '@specBuilder/specUtils';
import { sanitizeTrendlineChildren } from '@utils';
import {
	BarSpecProps,
	LineSpecProps,
	MarkChildElement,
	TrendlineElement,
	TrendlineProps,
	TrendlineSpecProps,
} from 'types';
import { FilterTransform, GroupMark, LineMark, Signal, SourceData, Transforms } from 'vega';

export const getTrendlines = (children: MarkChildElement[], markName: string): TrendlineSpecProps[] => {
	const trendlineElements = children.filter((child) => child.type === Trendline) as TrendlineElement[];
	return trendlineElements.map((trendline, index) => applyTrendlinePropDefaults(trendline.props, markName, index));
};

export const applyTrendlinePropDefaults = (
	{
		children,
		dimensionRange = [null, null],
		highlightRawPoint = false,
		lineType = 'dashed',
		lineWidth = 'M',
		method = 'linear',
		opacity = 1,
		rollingWindow = 7,
		...props
	}: TrendlineProps,
	markName: string,
	index: number,
): TrendlineSpecProps => ({
	children: sanitizeTrendlineChildren(children),
	dimensionRange,
	highlightRawPoint,
	lineType,
	lineWidth,
	method,
	metric: 'prismTrendlineValue',
	name: `${markName}Trendline${index}`,
	opacity,
	rollingWindow,
	...props,
});

export const getTrendlineMarks = (markProps: LineSpecProps): GroupMark[] => {
	const { children, color, lineType, name } = markProps;
	const { facets } = getFacetsFromProps({ color, lineType });

	const marks: GroupMark[] = [];
	const trendlines = getTrendlines(children, name);
	for (const trendlineProps of trendlines) {
		marks.push({
			name: `${trendlineProps.name}Group`,
			type: 'group',
			from: {
				facet: {
					name: `${trendlineProps.name}Facet`,
					data: `${trendlineProps.name}Data`,
					groupby: facets,
				},
			},
			marks: [getTrendlineLineMark(markProps, trendlineProps)],
		});
	}

	if (trendlines.some((trendline) => hasTooltip(trendline.children))) {
		marks.push(
			getTrendlineHoverMarks(
				markProps,
				trendlines.some((trendlineProps) => trendlineProps.highlightRawPoint),
			),
		);
	}

	return marks;
};

const getTrendlineLineMark = (markProps: LineSpecProps, trendlineProps: TrendlineSpecProps): LineMark => {
	const mergedTrendlineProps = {
		name: trendlineProps.name,
		color: trendlineProps.color ? { value: trendlineProps.color } : markProps.color,
		metric: trendlineProps.metric,
		dimension: markProps.dimension,
		scaleType: markProps.scaleType,
		lineType: { value: trendlineProps.lineType },
		lineWidth: { value: trendlineProps.lineWidth },
		opacity: { value: trendlineProps.opacity },
		colorScheme: markProps.colorScheme,
	};
	return getLineMark(mergedTrendlineProps, `${trendlineProps.name}Facet`);
};

const getTrendlineHoverMarks = (
	{ children, color, colorScheme, dimension, metric, name, scaleType }: LineSpecProps,
	highlightRawPoint: boolean,
): GroupMark => {
	const trendlines = getTrendlines(children, name);
	const trendlineHoverProps = {
		name: `${name}Trendline`,
		color,
		children: trendlines.map((trendline) => trendline.children).flat(),
		metric: 'prismTrendlineValue',
		dimension,
		scaleType,
		colorScheme,
	};
	return {
		name: `${name}TrendlineHoverGroup`,
		type: 'group',
		marks: getLineHoverMarks(
			trendlineHoverProps,
			`${name}AllTrendlineData`,
			highlightRawPoint ? metric : undefined,
		),
	};
};

/**
 * gets the data source for the trendline
 * @param markProps
 * @param trendlineProps
 */
export const getTrendlineData = (markProps: BarSpecProps | LineSpecProps): SourceData[] => {
	const data: SourceData[] = [];
	const { children, dimension, name: markName } = markProps;
	const trendlines = getTrendlines(children, markName);

	const concatenatedTrendlineData: { name: string; source: string[] } = {
		name: `${markName}AllTrendlineData`,
		source: [],
	};

	for (const trendlineProps of trendlines) {
		const { children: trendlineChildren, name, dimensionRange } = trendlineProps;
		data.push({
			name: `${name}Data`,
			source: TABLE,
			transform: [
				...getTrendlineDimensionRangeTransforms(dimension, dimensionRange),
				...getTrendlineStatisticalTransforms(markProps, trendlineProps),
			],
		});
		if (hasInteractiveChildren(trendlineChildren)) {
			concatenatedTrendlineData.source.push(`${name}Data`);
		}
	}

	if (trendlines.some((trendline) => hasInteractiveChildren(trendline.children))) {
		data.push(concatenatedTrendlineData);

		const selectSignal = `${markName}TrendlineSelectedId`;
		const hoverSignal = `${markName}TrendlineVoronoiHoveredId`;
		const trendlineHasPopover = trendlines.some((trendline) => hasPopover(trendline.children));
		const expr = trendlineHasPopover
			? `${selectSignal} === datum.prismMarkId || !${selectSignal} && ${hoverSignal} === datum.prismMarkId`
			: `${hoverSignal} === datum.prismMarkId`;

		data.push({
			name: `${markName}TrendlineHighlightedData`,
			source: `${markName}AllTrendlineData`,
			transform: [
				{
					type: 'filter',
					expr,
				},
			],
		});
	}

	return data;
};

/**
 * gets the filter transforms that will restrict the data to the dimension range
 * @param dimension
 * @param dimensionRange
 * @returns filterTansforms
 */
export const getTrendlineDimensionRangeTransforms = (
	dimension: string,
	dimensionRange: [number | null, number | null],
): FilterTransform[] => {
	const filters: FilterTransform[] = [];
	if (dimensionRange[0] !== null) {
		filters.push({
			type: 'filter',
			expr: `datum.${dimension} >= ${dimensionRange[0]}`,
		});
	}
	if (dimensionRange[1] !== null) {
		filters.push({
			type: 'filter',
			expr: `datum.${dimension} <= ${dimensionRange[1]}`,
		});
	}
	return filters;
};

/**
 * gets the statistical transforms that will calculate the trendline values
 * @param markProps
 * @param trendlineProps
 * @returns dataTransforms
 */
export const getTrendlineStatisticalTransforms = (
	{ color, lineType, metric }: BarSpecProps | LineSpecProps,
	{ method }: TrendlineSpecProps,
): Transforms[] => {
	const transforms: Transforms[] = [];
	if (method === 'average') {
		const { facets } = getFacetsFromProps({ color, lineType });
		transforms.push({
			type: 'joinaggregate',
			groupby: facets,
			ops: ['mean'],
			fields: [metric],
			as: ['prismTrendlineValue'],
		});
	}
	return transforms;
};

export const getTrendlineSignals = (markProps: BarSpecProps | LineSpecProps): Signal[] => {
	const signals: Signal[] = [];
	const { children, name: markName } = markProps;
	const trendlines = getTrendlines(children, markName);

	if (trendlines.some((trendline) => hasTooltip(trendline.children))) {
		signals.push(getUncontrolledHoverSignal(`${markName}TrendlineVoronoi`, true));
	}

	if (trendlines.some((trendline) => hasPopover(trendline.children))) {
		signals.push(getGenericSignal(`${markName}TrendlineSelectedId`));
	}

	return signals;
};
