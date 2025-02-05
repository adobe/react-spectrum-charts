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
import { DEFAULT_METRIC, FILTERED_TABLE, HIGHLIGHTED_SERIES, SELECTED_SERIES, SERIES_ID } from '@constants';
import { AreaMarkOptions, getAreaMark } from '@specBuilder/area/areaUtils';
import { getLineMark } from '@specBuilder/line/lineMarkUtils';
import { LineMarkOptions } from '@specBuilder/line/lineUtils';
import { addHighlightedSeriesSignalEvents } from '@specBuilder/signal/signalSpecBuilder';
import { getFacetsFromOptions } from '@specBuilder/specUtils';
import { AreaMark, GroupMark, LineMark, Signal, SourceData } from 'vega';

import { LineSpecOptions, MetricRangeOptions, MetricRangeSpecOptions } from '../types';

export type MetricRangeParentOptions = LineSpecOptions;

export const getMetricRanges = (markOptions: MetricRangeParentOptions): MetricRangeSpecOptions[] => {
	return markOptions.metricRanges.map((metricRange, index) =>
		applyMetricRangeOptionDefaults(metricRange, markOptions.name, index)
	);
};

export const applyMetricRangeOptionDefaults = (
	{
		chartTooltips = [],
		lineType = 'dashed',
		lineWidth = 'S',
		rangeOpacity = 0.2,
		metric = DEFAULT_METRIC,
		displayOnHover = false,
		...options
	}: MetricRangeOptions,
	markName: string,
	index: number
): MetricRangeSpecOptions => ({
	chartTooltips,
	lineType,
	lineWidth,
	name: `${markName}MetricRange${index}`,
	rangeOpacity,
	metric,
	displayOnHover,
	...options,
});

/**
 * gets the metric range group mark including the metric range line and area marks.
 * @param lineMarkOptions
 */
export const getMetricRangeGroupMarks = (lineMarkOptions: LineSpecOptions): GroupMark[] => {
	const { color, lineType } = lineMarkOptions;
	const { facets } = getFacetsFromOptions({ color, lineType });

	const marks: GroupMark[] = [];
	const metricRanges = getMetricRanges(lineMarkOptions);

	for (const metricRangeOptions of metricRanges) {
		const { displayOnHover, name } = metricRangeOptions;
		// if displayOnHover is true, use the highlightedData source, otherwise use the filtered table
		const data = displayOnHover ? `${name}_highlightedData` : FILTERED_TABLE;
		marks.push({
			name: `${name}_group`,
			type: 'group',
			clip: true,
			from: {
				facet: {
					name: `${name}_facet`,
					data,
					groupby: facets,
				},
			},
			marks: getMetricRangeMark(lineMarkOptions, metricRangeOptions),
		});
	}

	return marks;
};

/**
 * gets the area and line marks for the metric range by combining line and metric range options.
 * @param lineMarkOptions
 * @param metricRangeOptions
 */
export const getMetricRangeMark = (
	lineMarkOptions: LineSpecOptions,
	metricRangeOptions: MetricRangeSpecOptions
): (LineMark | AreaMark)[] => {
	const areaOptions: AreaMarkOptions = {
		name: `${metricRangeOptions.name}_area`,
		color: lineMarkOptions.color,
		colorScheme: lineMarkOptions.colorScheme,
		opacity: metricRangeOptions.rangeOpacity,
		metricStart: metricRangeOptions.metricStart,
		metricEnd: metricRangeOptions.metricEnd,
		isStacked: false,
		scaleType: 'time',
		dimension: lineMarkOptions.dimension,
		isMetricRange: true,
		parentName: lineMarkOptions.name,
		displayOnHover: metricRangeOptions.displayOnHover,
	};
	const lineOptions: LineMarkOptions = {
		...lineMarkOptions,
		name: `${metricRangeOptions.name}_line`,
		color: metricRangeOptions.color ? { value: metricRangeOptions.color } : lineMarkOptions.color,
		metric: metricRangeOptions.metric,
		lineType: { value: metricRangeOptions.lineType },
		lineWidth: { value: metricRangeOptions.lineWidth },
		displayOnHover: metricRangeOptions.displayOnHover,
	};

	const dataSource = `${metricRangeOptions.name}_facet`;
	const lineMark = getLineMark(lineOptions, dataSource);
	const areaMark = getAreaMark(areaOptions, dataSource);

	return [lineMark, areaMark];
};

/**
 * gets the data source for the metricRange
 * @param markOptions
 */
export const getMetricRangeData = (markOptions: LineSpecOptions): SourceData[] => {
	const data: SourceData[] = [];
	const metricRanges = getMetricRanges(markOptions);

	for (const metricRangeOptions of metricRanges) {
		const { displayOnHover, name } = metricRangeOptions;
		// if displayOnHover is true, add a data source for the highlighted data
		if (displayOnHover) {
			data.push({
				name: `${name}_highlightedData`,
				source: FILTERED_TABLE,
				transform: [
					{
						type: 'filter',
						expr: `isValid(${HIGHLIGHTED_SERIES}) && ${HIGHLIGHTED_SERIES} === datum.${SERIES_ID} || isValid(${SELECTED_SERIES}) && ${SELECTED_SERIES} === datum.${SERIES_ID}`,
					},
				],
			});
		}
	}

	return data;
};

/**
 * gets the signals for the metricRange
 * @param markOptions
 */
export const getMetricRangeSignals = (markOptions: LineSpecOptions): Signal[] => {
	const signals: Signal[] = [];
	const { name: markName } = markOptions;
	const metricRanges = getMetricRanges(markOptions);

	if (metricRanges.length) {
		addHighlightedSeriesSignalEvents(signals, `${markName}_voronoi`, 2);
	}

	return signals;
};
