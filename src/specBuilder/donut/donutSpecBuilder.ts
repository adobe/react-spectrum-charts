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
import { COLOR_SCALE, DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, FILTERED_TABLE } from '@constants';
import { getTooltipProps, hasInteractiveChildren } from '@specBuilder/marks/markUtils';
import { addFieldToFacetScaleDomain } from '@specBuilder/scale/scaleSpecBuilder';
import { addHighlightedItemSignalEvents } from '@specBuilder/signal/signalSpecBuilder';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { ColorScheme, DonutProps, DonutSpecProps } from 'types';
import { Data, Mark, Scale, Signal, Spec } from 'vega';

import { getAggregateMetricMark, getArcMark, getDirectLabelMark, getPercentMetricMark } from './donutUtils';

export const addDonut = produce<Spec, [DonutProps & { colorScheme?: ColorScheme; index?: number }]>(
	(
		spec,
		{
			children,
			color = DEFAULT_COLOR,
			colorScheme = DEFAULT_COLOR_SCHEME,
			index = 0,
			metric = DEFAULT_METRIC,
			name,
			startAngle = 0,
			holeRatio = 0.85,
			hasDirectLabels = false,
			isBoolean = false,
			...props
		}
	) => {
		// put props back together now that all defaults are set
		const donutProps: DonutSpecProps = {
			children: sanitizeMarkChildren(children),
			colorScheme,
			index,
			color,
			metric,
			name: toCamelCase(name ?? `donut${index}`),
			startAngle,
			holeRatio,
			hasDirectLabels,
			isBoolean,
			...props,
		};

		spec.data = addData(spec.data ?? [], donutProps);
		spec.scales = addScales(spec.scales ?? [], donutProps);
		spec.marks = addMarks(spec.marks ?? [], donutProps);
		spec.signals = addSignals(spec.signals ?? [], donutProps);
	}
);

export const addData = produce<Data[], [DonutSpecProps]>((data, props) => {
	const { metric, startAngle, name, isBoolean } = props;
	const filteredTableIndex = data.findIndex((d) => d.name === FILTERED_TABLE);

	//set up transform
	data[filteredTableIndex].transform = data[filteredTableIndex].transform ?? [];
	data[filteredTableIndex].transform?.push({
		type: 'pie',
		field: metric,
		startAngle,
		endAngle: { signal: `${startAngle} + 2 * PI` },
	});

	if (isBoolean) {
		//select first data point for our boolean value
		data.push({
			name: `${name}_booleanData`,
			source: FILTERED_TABLE,
			transform: [
				{
					type: 'window',
					ops: ['row_number'],
					as: [`${name}_rscRowIndex`],
				},
				{
					type: 'filter',
					expr: `datum.${name}_rscRowIndex === 1`, // Keep only the first row
				},
			],
		});
	} else {
		//set up aggregate
		data.push({
			name: `${name}_aggregateData`,
			source: FILTERED_TABLE,
			transform: [
				{
					type: 'aggregate',
					fields: [metric],
					ops: ['sum'],
					as: ['sum'],
				},
			],
		});
	}
});

export const addScales = produce<Scale[], [DonutSpecProps]>((scales, props) => {
	const { color } = props;
	addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
});

export const addMarks = produce<Mark[], [DonutSpecProps]>((marks, props) => {
	const { holeRatio, name, metricLabel, metric, segment, hasDirectLabels, isBoolean, children } = props;
	const radius = 'min(width, height) / 2';

	marks.push(getArcMark(name, holeRatio, radius, children));
	if (isBoolean) {
		marks.push(getPercentMetricMark(name, metric, radius, holeRatio, metricLabel));
	} else {
		marks.push(getAggregateMetricMark(name, metric, radius, holeRatio, metricLabel));
		if (hasDirectLabels) {
			if (!segment) {
				throw new Error('If a Donut chart hasDirectLabels, a segment property name must be supplied.');
			}
			marks.push(getDirectLabelMark(name, radius, metric, segment));
		}
	}
});

export const addSignals = produce<Signal[], [DonutSpecProps]>((signals, props) => {
	const { name, children } = props;
	if (!hasInteractiveChildren(children)) return;
	addHighlightedItemSignalEvents(signals, name, 1, getTooltipProps(children)?.excludeDataKeys);
});
