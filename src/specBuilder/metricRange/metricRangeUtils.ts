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
import { DEFAULT_METRIC, FILTERED_TABLE } from '@constants';
import { AreaMarkProps, getAreaMark } from '@specBuilder/area/areaUtils';
import { getLineMark } from '@specBuilder/line/lineMarkUtils';
import { LineMarkProps } from '@specBuilder/line/lineUtils';
import { getAnimationSignal, getSeriesHoveredSignal } from '@specBuilder/signal/signalSpecBuilder';
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
		rangeOpacity = 0.8,
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
	const { children, color, lineType, name } = lineMarkProps;
	const { facets } = getFacetsFromProps({ color, lineType });

	const marks: GroupMark[] = [];
	const metricRanges = getMetricRanges(children, name);

	for (const metricRangeProps of metricRanges) {
		marks.push({
			name: `${metricRangeProps.name}_group`,
			type: 'group',
			clip: true,
			from: {
				facet: {
					name: `${metricRangeProps.name}_facet`,
					data: FILTERED_TABLE,
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
		name: metricRangeProps.name,
		color: lineMarkProps.color,
		colorScheme: lineMarkProps.colorScheme,
		opacity: metricRangeProps.rangeOpacity,
		children: [],
		metricStart: metricRangeProps.metricStart,
		metricEnd: metricRangeProps.metricEnd,
		isStacked: false,
		scaleType: 'time',
		dimension: lineMarkProps.dimension,
		isMetricRange: true,
		parentName: lineMarkProps.name,
		displayOnHover: metricRangeProps.displayOnHover,
	};
	const lineProps: LineMarkProps = {
		...lineMarkProps,
		color: metricRangeProps.color ? { value: metricRangeProps.color } : lineMarkProps.color,
		metric: metricRangeProps.metric,
		lineType: { value: metricRangeProps.lineType },
		lineWidth: { value: metricRangeProps.lineWidth },
		displayOnHover: metricRangeProps.displayOnHover,
	};

	const lineMark = getLineMark(lineProps, `${metricRangeProps.name}_facet`);
	const areaMark = getAreaMark(areaProps);

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
		const { name } = metricRangeProps;
		data.push({
			name: `${name}_data`,
			source: FILTERED_TABLE,
		});
	}

	return data;
};

/**
 * gets the signals for the metricRange
 * @param markProps
 */
export const getMetricRangeSignals = (markProps: LineSpecProps): Signal[] => {
	const signals: Signal[] = [];
	const { children, name: markName, animate } = markProps;
	const metricRanges = getMetricRanges(children, markName);

	if (metricRanges.length) {
		signals.push(getSeriesHoveredSignal(markName, true, `${markName}_voronoi`));
	}

	if (animate) {
		signals.push(getAnimationSignal(animate));
	}

	return signals;
};
