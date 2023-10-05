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

import { DEFAULT_COLOR_SCHEME, DEFAULT_CONTINUOUS_DIMENSION, DEFAULT_METRIC, FILTERED_TABLE } from '@constants';
import { hasInteractiveChildren, hasMetricRange, hasPopover } from '@specBuilder/marks/markUtils';
import { getFacetsFromProps } from '@specBuilder/specUtils';
import { getTrendlineData, getTrendlineMarks, getTrendlineSignals } from '@specBuilder/trendline/trendlineUtils';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import produce from 'immer';
import { ColorScheme, LineProps, LineSpecProps } from 'types';
import { Data, Mark, Scale, Signal, Spec } from 'vega';

import { getMetricRangeGroupMarks, getMetricRangeSignals } from '@specBuilder/metricRange/metricRangeUtils';
import { addTimeTransform, getTableData } from '../data/dataUtils';
import { addContinuousDimensionScale, addFieldToFacetScaleDomain, addMetricScale } from '../scale/scaleSpecBuilder';
import { getGenericSignal, getUncontrolledHoverSignal, hasSignalByName } from '../signal/signalSpecBuilder';
import {
	getLineHighlightedData,
	getLineHoverMarks,
	getLineMark,
	getLinePointMark,
	getLinePointsData,
} from './lineUtils';

export const addLine = produce<Spec, [LineProps & { colorScheme?: ColorScheme; index?: number }]>(
	(
		spec,
		{
			children,
			color = { value: 'categorical-100' },
			colorScheme = DEFAULT_COLOR_SCHEME,
			dimension = DEFAULT_CONTINUOUS_DIMENSION,
			index = 0,
			lineType = { value: 'solid' },
			metric = DEFAULT_METRIC,
			name,
			opacity = { value: 1 },
			scaleType = 'time',
			...props
		},
	) => {
		// put props back together now that all defaults are set
		const lineProps: LineSpecProps = {
			children: sanitizeMarkChildren(children),
			color,
			colorScheme,
			dimension,
			index,
			lineType,
			metric,
			name: toCamelCase(name || `line${index}`),
			opacity,
			scaleType,
			...props,
		};

		spec.data = addData(spec.data ?? [], lineProps);
		spec.signals = addSignals(spec.signals ?? [], lineProps);
		spec.scales = setScales(spec.scales ?? [], lineProps);
		spec.marks = addLineMarks(spec.marks ?? [], lineProps);

		return spec;
	},
);

export const addData = produce<Data[], [LineSpecProps]>((data, props) => {
	const { dimension, scaleType, children, name, staticPoint } = props;
	if (scaleType === 'time') {
		const tableData = getTableData(data);
		tableData.transform = addTimeTransform(tableData.transform ?? [], dimension);
	}
	if (hasInteractiveChildren(children) || hasMetricRange(children)) {
		data.push(getLineHighlightedData(name, FILTERED_TABLE, hasPopover(children)));
	}
	if (staticPoint) data.push(getLinePointsData(name, staticPoint, FILTERED_TABLE));
	data.push(...getTrendlineData(props));
});

export const addSignals = produce<Signal[], [LineSpecProps]>((signals, props) => {
	const { children, name } = props;
	signals.push(...getTrendlineSignals(props));
	signals.push(...getMetricRangeSignals(props));

	if (!hasInteractiveChildren(children) && !hasMetricRange(children)) return;
	if (!hasSignalByName(signals, `${name}_voronoiHoveredId`)) {
		signals.push(getUncontrolledHoverSignal(`${name}_voronoi`, true));
	}
	if (!hasSignalByName(signals, `${name}_selectedId`)) {
		signals.push(getGenericSignal(`${name}_selectedId`));
	}
	if (!hasSignalByName(signals, `${name}_selectedSeries`)) {
		signals.push(getGenericSignal(`${name}_selectedSeries`));
	}
});

export const setScales = produce<Scale[], [LineSpecProps]>(
	(scales, { metric, dimension, color, lineType, opacity, padding, scaleType }) => {
		// add dimension scale
		addContinuousDimensionScale(scales, { scaleType, dimension, padding });
		// add color to the color domain
		addFieldToFacetScaleDomain(scales, 'color', color);
		// add lineType to the lineType domain
		addFieldToFacetScaleDomain(scales, 'lineType', lineType);
		// add opacity to the opacity domain
		addFieldToFacetScaleDomain(scales, 'opacity', opacity);
		// find the linear scale and add our field to it
		addMetricScale(scales, [metric]);
		return scales;
	},
);

// The order that marks are added is important since it determines the draw order.
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
				groupby: facets,
			},
		},
		marks: [getLineMark(props, `${name}_facet`)],
	});
	if (staticPoint) marks.push(getLinePointMark(props));
	marks.push(...getMetricRangeGroupMarks(props));
	if (hasInteractiveChildren(children) || hasMetricRange(children)) {
		marks.push(...getLineHoverMarks(props, FILTERED_TABLE));
	}
	marks.push(...getTrendlineMarks(props));
});
