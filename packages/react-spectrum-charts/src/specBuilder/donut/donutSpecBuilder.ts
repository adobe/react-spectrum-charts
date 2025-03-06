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
import { produce } from 'immer';
import { Data, FormulaTransform, Mark, PieTransform, Scale, Signal, Spec } from 'vega';

import { COLOR_SCALE, DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, FILTERED_TABLE } from '../../constants';
import { toCamelCase } from '../../utils';
import { isInteractive } from '../marks/markUtils';
import { addFieldToFacetScaleDomain } from '../scale/scaleSpecBuilder';
import { addHighlightedItemSignalEvents } from '../signal/signalSpecBuilder';
import { ColorScheme, DonutOptions, DonutSpecOptions, HighlightedItem } from '../types';
import {
	getDonutSummaryData,
	getDonutSummaryMarks,
	getDonutSummaryScales,
	getDonutSummarySignals,
} from './donutSummaryUtils';
import { getArcMark } from './donutUtils';
import { getSegmentLabelMarks } from './segmentLabelUtils';

export const addDonut = produce<
	Spec,
	[DonutOptions & { colorScheme?: ColorScheme; highlightedItem?: HighlightedItem; index?: number; idKey: string }]
>(
	(
		spec,
		{
			chartPopovers = [],
			chartTooltips = [],
			color = DEFAULT_COLOR,
			colorScheme = DEFAULT_COLOR_SCHEME,
			donutSummaries = [],
			index = 0,
			metric = DEFAULT_METRIC,
			name,
			startAngle = 0,
			holeRatio = 0.85,
			isBoolean = false,
			segmentLabels = [],
			...options
		}
	) => {
		// put options back together now that all defaults are set
		const donutOptions: DonutSpecOptions = {
			chartPopovers,
			chartTooltips,
			color,
			colorScheme,
			donutSummaries,
			holeRatio,
			index,
			isBoolean,
			metric,
			name: toCamelCase(name ?? `donut${index}`),
			segmentLabels,
			startAngle,
			...options,
		};

		spec.data = addData(spec.data ?? [], donutOptions);
		spec.scales = addScales(spec.scales ?? [], donutOptions);
		spec.marks = addMarks(spec.marks ?? [], donutOptions);
		spec.signals = addSignals(spec.signals ?? [], donutOptions);
	}
);

export const addData = produce<Data[], [DonutSpecOptions]>((data, options) => {
	const { name, isBoolean } = options;
	const filteredTableIndex = data.findIndex((d) => d.name === FILTERED_TABLE);

	//set up transform
	data[filteredTableIndex].transform = data[filteredTableIndex].transform ?? [];
	data[filteredTableIndex].transform?.push(...getPieTransforms(options));

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
	}
	data.push(...getDonutSummaryData(options));
});

const getPieTransforms = ({ startAngle, metric, name }: DonutSpecOptions): (FormulaTransform | PieTransform)[] => [
	{
		type: 'pie',
		field: metric,
		startAngle,
		endAngle: { signal: `${startAngle} + 2 * PI` },
		as: [`${name}_startAngle`, `${name}_endAngle`],
	},
	{
		type: 'formula',
		as: `${name}_arcTheta`,
		expr: `(datum['${name}_startAngle'] + datum['${name}_endAngle']) / 2`,
	},
	{
		type: 'formula',
		as: `${name}_arcLength`,
		expr: `datum['${name}_endAngle'] - datum['${name}_startAngle']`,
	},
	{
		type: 'formula',
		as: `${name}_arcPercent`,
		expr: `datum['${name}_arcLength'] / (2 * PI)`,
	},
];

export const addScales = produce<Scale[], [DonutSpecOptions]>((scales, options) => {
	const { color } = options;
	addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
	scales.push(...getDonutSummaryScales(options));
});

export const addMarks = produce<Mark[], [DonutSpecOptions]>((marks, options) => {
	marks.push(getArcMark(options));
	marks.push(...getDonutSummaryMarks(options));
	marks.push(...getSegmentLabelMarks(options));
});

export const addSignals = produce<Signal[], [DonutSpecOptions]>((signals, options) => {
	const { chartTooltips, idKey, name } = options;
	signals.push(...getDonutSummarySignals(options));
	if (!isInteractive(options)) return;
	addHighlightedItemSignalEvents(signals, name, idKey, 1, chartTooltips[0]?.excludeDataKeys);
});
