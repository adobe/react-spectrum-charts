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
	INTERACTION_MODE,
	LINE_TYPE_SCALE,
	OPACITY_SCALE,
} from '@constants';
import { addPopoverData } from '@specBuilder/chartPopover/chartPopoverUtils';
import { addTooltipData, addTooltipSignals, isHighlightedByGroup } from '@specBuilder/chartTooltip/chartTooltipUtils';
import { getHoverMarkNames, hasPopover, isInteractive } from '@specBuilder/marks/markUtils';
import {
	getMetricRangeData,
	getMetricRangeGroupMarks,
	getMetricRangeSignals,
	getMetricRanges,
} from '@specBuilder/metricRange/metricRangeUtils';
import { getFacetsFromProps } from '@specBuilder/specUtils';
import {
	addTrendlineData,
	checkTrendlineAnimationScales,
	getTrendlineMarks,
	getTrendlineScales,
	setTrendlineSignals,
} from '@specBuilder/trendline';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { Data, Mark, Scale, Signal, Spec } from 'vega';

import { ChartData, ColorScheme, HighlightedItem, LineProps, LineSpecProps, MarkChildElement } from '../../types';
import { addTimeTransform, getFilteredTooltipData, getTableData } from '../data/dataUtils';
import {
	addContinuousDimensionScale,
	addFieldToFacetScaleDomain,
	addMetricScale,
	addRscAnimationScales,
} from '../scale/scaleSpecBuilder';
import {
	addHighlightedItemSignalEvents,
	addHighlightedSeriesSignalEvents,
	getRscAnimationSignals,
} from '../signal/signalSpecBuilder';
import { getLineHighlightedData, getLineStaticPointData } from './lineDataUtils';
import { getLineHoverMarks, getLineMark } from './lineMarkUtils';
import { getLineStaticPoint } from './linePointUtils';
import { getInteractiveMarkName, getPopoverMarkName } from './lineUtils';

export const addLine = produce<
	Spec,
	[
		LineProps & {
			colorScheme?: ColorScheme;
			data?: ChartData[];
			animations?: boolean;
			animateFromZero?: boolean;
			highlightedItem?: HighlightedItem;
			index?: number;
			idKey: string;
			previousData?: ChartData[];
		}
	]
>(
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
			metricAxis,
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
			interactiveMarkName: getInteractiveMarkName(sanitizedChildren, lineName, props.highlightedItem, props),
			lineType,
			markType: 'line',
			metric,
			metricAxis,
			name: lineName,
			opacity,
			popoverMarkName: getPopoverMarkName(sanitizedChildren, lineName),
			scaleType,
			...props,
		};
		lineProps.isHighlightedByGroup = isHighlightedByGroup(lineProps);

		spec.data = addData(spec.data ?? [], lineProps);
		spec.signals = addSignals(spec.signals ?? [], lineProps);
		spec.scales = setScales(spec.scales ?? [], lineProps);
		spec.marks = addLineMarks(spec.marks ?? [], lineProps);

		return spec;
	}
);

export const addData = produce<Data[], [LineSpecProps]>((data, props) => {
	const { children, dimension, highlightedItem, isSparkline, isMethodLast, name, scaleType, staticPoint } = props;
	if (scaleType === 'time') {
		const tableData = getTableData(data);
		tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
	}
	if (isInteractive(children, props) || highlightedItem !== undefined) {
		data.push(
			getLineHighlightedData(name, props.idKey, FILTERED_TABLE, hasPopover(children), isHighlightedByGroup(props))
		);
		data.push(getFilteredTooltipData(children));
	}
	if (staticPoint || isSparkline)
		data.push(getLineStaticPointData(name, staticPoint, FILTERED_TABLE, isSparkline, isMethodLast));
	addTrendlineData(data, props);
	addTooltipData(data, props, false);
	addPopoverData(data, props);
	data.push(...getMetricRangeData(props));
});

export const addSignals = produce<Signal[], [LineSpecProps]>((signals, props) => {
	const { children, name, animations, idKey, animateFromZero } = props;
	setTrendlineSignals(signals, props);
	signals.push(...getMetricRangeSignals(props));

	if (!isInteractive(children, props)) return;
	// if animations are enabled, push all necessary animation signals. Line charts have voronoi points and have nested datum
	if (animations) {
		signals.push(...getRscAnimationSignals(name, true));
	}

	addHighlightedItemSignalEvents({
		signals,
		markName: `${name}_voronoi`,
		idKey,
		datumOrder: 2,
		animations,
		animateFromZero,
	});
	addHighlightedSeriesSignalEvents(signals, `${name}_voronoi`, 2);
	addHoverSignals(signals, props);
	addTooltipSignals(signals, props);
});

export const setScales = produce<Scale[], [LineSpecProps]>((scales, props) => {
	const { metric, metricAxis, dimension, color, lineType, opacity, padding, scaleType, children, name, animations } =
		props;

	// if animations are enabled, add all necessary animation scales.
	if (animations && isInteractive(children, props)) {
		addRscAnimationScales(scales);
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
	// add linear scale with custom name
	if (metricAxis) {
		addMetricScale(scales, getMetricKeys(metric, children, name), 'y', metricAxis);
	}
	// check to see if trend lines have interactive children and if animation scales are already added.
	checkTrendlineAnimationScales(name, scales, props);

	// add trendline scales
	scales.push(...getTrendlineScales(props));
	return scales;
});

// The order that marks are added is important since it determines the draw order.
export const addLineMarks = produce<Mark[], [LineSpecProps]>((marks, props) => {
	const { children, color, highlightedItem, isSparkline, lineType, name, opacity, staticPoint } = props;

	const { facets } = getFacetsFromProps({ color, lineType, opacity });

	marks.push({
		name: `${name}_group`,
		type: 'group',
		from: {
			facet: {
				name: `${name}_facet`,
				data: FILTERED_TABLE,
				groupby: facets,
			},
		},
		marks: [getLineMark(props, `${name}_facet`)],
	});
	if (staticPoint || isSparkline) marks.push(getLineStaticPoint(props));
	marks.push(...getMetricRangeGroupMarks(props));
	if (isInteractive(children, props) || highlightedItem !== undefined) {
		marks.push(...getLineHoverMarks(props, `${FILTERED_TABLE}ForTooltip`));
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

const addHoverSignals = (signals: Signal[], props: LineSpecProps) => {
	const { idKey, interactionMode, name } = props;
	if (interactionMode !== INTERACTION_MODE.ITEM) return;
	getHoverMarkNames(name).forEach((hoverMarkName) => {
		addHighlightedItemSignalEvents({ signals, markName: hoverMarkName, idKey, datumOrder: 1 });
		addHighlightedSeriesSignalEvents(signals, hoverMarkName, 1);
	});
};
