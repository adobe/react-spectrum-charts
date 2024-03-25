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
	COLOR_SCALE,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_METRIC,
	DEFAULT_TIME_DIMENSION,
	FILTERED_TABLE,
	LINE_TYPE_SCALE,
	OPACITY_SCALE, RSC_ANIMATION
} from '@constants';
import { hasInteractiveChildren, hasPopover } from '@specBuilder/marks/markUtils';
import {
	getMetricRangeData,
	getMetricRangeGroupMarks,
	getMetricRangeSignals,
	getMetricRanges
} from '@specBuilder/metricRange/metricRangeUtils';
import { getFacetsFromProps } from '@specBuilder/specUtils';
import {
	checkTrendlineAnimationScales,
	addTrendlineData,
	getTrendlineMarks,
	getTrendlineScales,
	setTrendlineSignals
} from '@specBuilder/trendline';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { ChartData, ColorScheme, LineProps, LineSpecProps, MarkChildElement } from 'types';
import { Data, Mark, Scale, Signal, Spec } from 'vega';

import { addTimeTransform, getTableData } from '../data/dataUtils';
import {
	addContinuousDimensionScale,
	addFieldToFacetScaleDomain,
	addMetricScale,
	addRSCAnimationScales
} from '../scale/scaleSpecBuilder';
import {
	addHighlightedItemSignalEvents,
	addHighlightedSeriesSignalEvents,
	getRSCAnimationSignals,
	hasSignalByName
} from '../signal/signalSpecBuilder';
import { getLineHighlightedData, getLineStaticPointData } from './lineDataUtils';
import { getLineHoverMarks, getLineMark } from './lineMarkUtils';
import { getLineStaticPoint } from './linePointUtils';
import { getInteractiveMarkName, getPopoverMarkName } from './lineUtils';

export const addLine = produce<Spec, [LineProps & {
	colorScheme?: ColorScheme;
	index?: number,
	data?: ChartData[],
	previousData?: ChartData[],
	animations?: boolean
}]>(
	(
		spec,
		{
			children,
			color = { value: 'categorical-100' },
			colorScheme = DEFAULT_COLOR_SCHEME,
			dimension = DEFAULT_TIME_DIMENSION,
			index = 0,
			lineType = { value: 'solid' },
			metric = DEFAULT_METRIC,
			name,
			opacity = { value: 1 },
			scaleType = 'time',
			...props
		}
	) => {
		const sanitizedChildren = sanitizeMarkChildren(children);
		const lineName = toCamelCase(name || `line${index}`);
		// put props back together now that all defaults are set
		const lineProps: LineSpecProps = {
			children: sanitizedChildren,
			color,
			colorScheme,
			dimension,
			index,
			interactiveMarkName: getInteractiveMarkName(sanitizedChildren, lineName),
			lineType,
			metric,
			name: lineName,
			opacity,
			popoverMarkName: getPopoverMarkName(sanitizedChildren, lineName),
			scaleType,
			...props
		};

		spec.data = addData(spec.data ?? [], lineProps);
		spec.signals = addSignals(spec.signals ?? [], lineProps);
		spec.scales = setScales(spec.scales ?? [], lineProps);
		spec.marks = addLineMarks(spec.marks ?? [], lineProps);

		return spec;
	}
);

export const addData = produce<Data[], [LineSpecProps]>((data, props) => {
	const { dimension, scaleType, children, name, staticPoint } = props;
	if (scaleType === 'time') {
		const tableData = getTableData(data);
		tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
	}
	if (hasInteractiveChildren(children)) {
		data.push(getLineHighlightedData(name, FILTERED_TABLE, hasPopover(children)));
	}
	if (staticPoint) data.push(getLineStaticPointData(name, staticPoint, FILTERED_TABLE));
	addTrendlineData(data, props);
	data.push(...getMetricRangeData(props));
});

export const addSignals = produce<Signal[], [LineSpecProps]>((signals, props) => {
	const { children, name, animations } = props;
	setTrendlineSignals(signals, props);
	signals.push(...getMetricRangeSignals(props));

	if (!hasInteractiveChildren(children)) return;
	//TODO: Add comments/documentation/tests
	if (animations !== false && !hasSignalByName(signals, RSC_ANIMATION)) {
		signals.push(...getRSCAnimationSignals(name, true));
	}
	addHighlightedItemSignalEvents(signals, `${name}_voronoi`, 2);
	addHighlightedSeriesSignalEvents(signals, `${name}_voronoi`, 2);
});

export const setScales = produce<Scale[], [LineSpecProps]>((scales, props) => {
	const { metric, dimension, color, lineType, opacity, padding, scaleType, children, name, animations } = props;
	//TODO: Add comments/documentation/tests
	if (animations !== false && hasInteractiveChildren(children)) {
		addRSCAnimationScales(scales);
	}
	// add dimension scale
	addContinuousDimensionScale(scales, { scaleType, dimension, padding });
	// add color to the color domain
	addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
	// add lineType to the lineType domain
	addFieldToFacetScaleDomain(scales, LINE_TYPE_SCALE, lineType);
	// add opacity to the opacity domain
	addFieldToFacetScaleDomain(scales, OPACITY_SCALE, opacity);
	// find the linear scale and add our fields to it
	addMetricScale(scales, getMetricKeys(metric, children, name));
	//TODO: Add comments/docs/tests/etc
	checkTrendlineAnimationScales(name, scales, props);

	// add trendline scales
	scales.push(...getTrendlineScales(props));
	return scales;
});

// The order that marks are added is important since it determines the draw order.
// TODO: LineProps & { colorScheme?: ColorScheme; index?: number }. Do we need this? If we move the useRef previousData check up is this still important?

export const addLineMarks = produce<Mark[], [LineSpecProps]>((marks, props) => {
	const { name, children, color, lineType, opacity, staticPoint } = props;

	const { facets } = getFacetsFromProps({ color, lineType, opacity });

	marks.push({
		name: `${name}_group`,
		type: 'group',
		from: {
			facet: {
				name: `${name}_facet`,
				data: FILTERED_TABLE,
				groupby: facets
			}
		},
		marks: [getLineMark(props, `${name}_facet`)]
	});
	if (staticPoint) marks.push(getLineStaticPoint(props));
	marks.push(...getMetricRangeGroupMarks(props));
	if (hasInteractiveChildren(children)) {
		marks.push(...getLineHoverMarks(props, FILTERED_TABLE));
	}
	marks.push(...getTrendlineMarks(props));
});

const getMetricKeys = (lineMetric: string, lineChildren: MarkChildElement[], lineName: string) => {
	const metricKeys = [lineMetric];

	// metric range fields should be added if metric-axis will be scaled to fit
	const metricRanges = getMetricRanges(lineChildren, lineName);
	metricRanges.forEach((metricRange) => {
		if (metricRange.scaleAxisToFit) metricKeys.push(metricRange.metricStart, metricRange.metricEnd);
	});

	return metricKeys;
};
