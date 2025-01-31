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
import { Data, FormulaTransform, Mark, PieTransform, Scale, Signal, Spec } from 'vega';

import { ColorScheme, DonutProps, DonutSpecProps, HighlightedItem } from '../../types';
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
	[DonutProps & { colorScheme?: ColorScheme; highlightedItem?: HighlightedItem; index?: number; idKey: string }]
>(
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
			isBoolean = false,
			...props
		}
	) => {
		// put props back together now that all defaults are set
		const donutProps: DonutSpecProps = {
			children: sanitizeMarkChildren(children),
			color,
			colorScheme,
			holeRatio,
			index,
			isBoolean,
			markType: 'donut',
			metric,
			name: toCamelCase(name ?? `donut${index}`),
			startAngle,
			...props,
		};

		spec.data = addData(spec.data ?? [], donutProps);
		spec.scales = addScales(spec.scales ?? [], donutProps);
		spec.marks = addMarks(spec.marks ?? [], donutProps);
		spec.signals = addSignals(spec.signals ?? [], donutProps);
	}
);

export const addData = produce<Data[], [DonutSpecProps]>((data, props) => {
	const { name, isBoolean } = props;
	const filteredTableIndex = data.findIndex((d) => d.name === FILTERED_TABLE);

	//set up transform
	data[filteredTableIndex].transform = data[filteredTableIndex].transform ?? [];
	data[filteredTableIndex].transform?.push(...getPieTransforms(props));

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
	data.push(...getDonutSummaryData(props));
});

const getPieTransforms = ({ startAngle, metric, name }: DonutSpecProps): (FormulaTransform | PieTransform)[] => [
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

export const addScales = produce<Scale[], [DonutSpecProps]>((scales, props) => {
	const { color } = props;
	addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
	scales.push(...getDonutSummaryScales(props));
});

export const addMarks = produce<Mark[], [DonutSpecProps]>((marks, props) => {
	marks.push(getArcMark(props));
	marks.push(...getDonutSummaryMarks(props));
	marks.push(...getSegmentLabelMarks(props));
});

export const addSignals = produce<Signal[], [DonutSpecProps]>((signals, props) => {
	const { children, idKey, name } = props;
	signals.push(...getDonutSummarySignals(props));
	if (!hasInteractiveChildren(children)) return;
	addHighlightedItemSignalEvents({
		signals,
		markName: name,
		idKey,
		datumOrder: 1,
		excludeDataKeys: getTooltipProps(children)?.excludeDataKeys,
	});
});
