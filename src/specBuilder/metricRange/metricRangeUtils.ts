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
import { MetricRange } from '@components/MetricRange';
import { DEFAULT_METRIC, FILTERED_TABLE, HIGHLIGHTED_SERIES, SELECTED_SERIES, SERIES_ID } from '@constants';
import { AreaMarkProps, getAreaMark } from '@specBuilder/area/areaUtils';
import { getLineMark } from '@specBuilder/line/lineMarkUtils';
import { LineMarkProps } from '@specBuilder/line/lineUtils';
import { addHighlightedSeriesSignalEvents } from '@specBuilder/signal/signalSpecBuilder';
import { getFacetsFromProps } from '@specBuilder/specUtils';
import { LineSpecProps, MarkChildElement, MetricRangeElement, MetricRangeProps, MetricRangeSpecProps } from 'types';
import { AreaMark, GroupMark, LineMark, Signal, SourceData } from 'vega';

export const getMetricRanges = (children: MarkChildElement[], markName: string): MetricRangeSpecProps[] => {
	const metricRangeElements = children.filter((child) => child.type === MetricRange) as MetricRangeElement[];
	return metricRangeElements.map((metricRange, index) =>
		applyMetricRangePropDefaults(metricRange.props, markName, index)
	);
};

export const applyMetricRangePropDefaults = (
	{
		lineType = 'dashed',
		lineWidth = 'S',
		rangeOpacity = 0.2,
		metric = DEFAULT_METRIC,
		displayOnHover = false,
		...props
	}: MetricRangeProps,
	markName: string,
	index: number
): MetricRangeSpecProps => ({
	children: {},
	lineType,
	lineWidth,
	name: `${markName}MetricRange${index}`,
	rangeOpacity,
	metric,
	displayOnHover,
	...props,
});

/**
 * gets the metric range group mark including the metric range line and area marks.
 * @param lineMarkProps
 */
export const getMetricRangeGroupMarks = (lineMarkProps: LineSpecProps): GroupMark[] => {
	const { children, color, lineType, name: lineName } = lineMarkProps;
	const { facets } = getFacetsFromProps({ color, lineType });

	const marks: GroupMark[] = [];
	const metricRanges = getMetricRanges(children, lineName);

	for (const metricRangeProps of metricRanges) {
		const { displayOnHover, name } = metricRangeProps;
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
			marks: getMetricRangeMark(lineMarkProps, metricRangeProps),
		});
	}

	return marks;
};

/**
 * gets the area and line marks for the metric range by combining line and metric range props.
 * @param lineMarkProps
 * @param metricRangeProps
 */
export const getMetricRangeMark = (
	lineMarkProps: LineSpecProps,
	metricRangeProps: MetricRangeSpecProps
): (LineMark | AreaMark)[] => {
	const areaProps: AreaMarkProps = {
		animations: lineMarkProps.animations,
		animateFromZero: lineMarkProps.animateFromZero,
		children: [],
		color: lineMarkProps.color,
		colorScheme: lineMarkProps.colorScheme,
		dimension: lineMarkProps.dimension,
		displayOnHover: metricRangeProps.displayOnHover,
		isMetricRange: true,
		isStacked: false,
		metricStart: metricRangeProps.metricStart,
		metricEnd: metricRangeProps.metricEnd,
		name: `${metricRangeProps.name}_area`,
		opacity: metricRangeProps.rangeOpacity,
		parentName: lineMarkProps.name,
		scaleType: 'time',
	};
	const lineProps: LineMarkProps = {
		...lineMarkProps,
		color: metricRangeProps.color ? { value: metricRangeProps.color } : lineMarkProps.color,
		displayOnHover: metricRangeProps.displayOnHover,
		lineType: { value: metricRangeProps.lineType },
		lineWidth: { value: metricRangeProps.lineWidth },
		metric: metricRangeProps.metric,
		name: `${metricRangeProps.name}_line`,
	};

	const dataSource = `${metricRangeProps.name}_facet`;
	const lineMark = getLineMark(lineProps, dataSource);
	const areaMark = getAreaMark(areaProps, dataSource);

	return [lineMark, areaMark];
};

/**
 * gets the data source for the metricRange
 * @param markProps
 */
export const getMetricRangeData = (markProps: LineSpecProps): SourceData[] => {
	const data: SourceData[] = [];
	const { children, name: markName } = markProps;
	const metricRanges = getMetricRanges(children, markName);

	for (const metricRangeProps of metricRanges) {
		const { displayOnHover, name } = metricRangeProps;
		// if displayOnHover is true, add a data source for the highlighted data
		if (displayOnHover) {
			data.push({
				name: `${name}_highlightedData`,
				source: FILTERED_TABLE,
				transform: [
					{
						type: 'filter',
						expr: `${HIGHLIGHTED_SERIES} && ${HIGHLIGHTED_SERIES} === datum.${SERIES_ID} || ${SELECTED_SERIES} && ${SELECTED_SERIES} === datum.${SERIES_ID}`,
					},
				],
			});
		}
	}

	return data;
};

/**
 * gets the signals for the metricRange
 * @param markProps
 */
export const getMetricRangeSignals = (markProps: LineSpecProps): Signal[] => {
	const signals: Signal[] = [];
	const { children, name: markName } = markProps;
	const metricRanges = getMetricRanges(children, markName);

	if (metricRanges.length) {
		addHighlightedSeriesSignalEvents(signals, `${markName}_voronoi`, 2);
	}

	return signals;
};
