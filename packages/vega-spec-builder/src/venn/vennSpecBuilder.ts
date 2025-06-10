/*
 * Copyright 2025 Adobe. All rights reserved.
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
import {
	Data,
	FilterTransform,
	FlattenTransform,
	FormulaTransform,
	JoinAggregateTransform,
	LookupTransform,
	Mark,
	Scale,
	Signal,
	WindowTransform,
} from 'vega';

import {
	COLOR_SCALE,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_VENN_COLOR,
	DEFAULT_VENN_LABEL,
	DEFAULT_VENN_METRIC,
	TABLE,
} from '@spectrum-charts/constants';
import { toCamelCase } from '@spectrum-charts/utils';

import { isInteractive } from '../marks/markUtils';
import { addFieldToFacetScaleDomain } from '../scale/scaleSpecBuilder';
import { addHighlightedItemSignalEvents } from '../signal/signalSpecBuilder';
import { ChartData, ColorScheme, HighlightedItem, ScSpec, VennOptions, VennSpecOptions } from '../types';
import {
	SET_ID_DELIMITER,
	getCircleMark,
	getIntersectionStrokeMark,
	getInterserctionMark,
	getCircleStrokeMark,
	getTextMark,
	getVennSolution,
} from './vennUtils';

export const addVenn = produce<
	ScSpec,
	[
		VennOptions & {
			colorScheme?: ColorScheme;
			highlightedItem?: HighlightedItem;
			idKey: string;
			index?: number;
			chartHeight?: number;
			chartWidth?: number;
			data?: ChartData[];
		}
	]
>(
	(
		spec,
		{
			chartPopovers = [],
			chartTooltips = [],
			color = DEFAULT_VENN_COLOR,
			colorScheme = DEFAULT_COLOR_SCHEME,
			index = 0,
			label = DEFAULT_VENN_LABEL,
			metric = DEFAULT_VENN_METRIC,
			name,
			orientation = '0deg',
			chartHeight = 100,
			chartWidth = 100,
			data = [],
			...props
		}
	) => {
		const vennProps: VennSpecOptions = {
			chartPopovers,
			chartTooltips,
			chartWidth,
			chartHeight,
			data,
			index,
			colorScheme,
			color,
			label,
			orientation,
			metric,
			name: toCamelCase(name ?? `venn${index}`),
			...props,
		};
		spec.data = addData(spec.data ?? [], vennProps);
		spec.signals = addSignals(spec.signals ?? [], vennProps);
		spec.scales = addScales(spec.scales ?? []);
		spec.marks = addMarks(spec.marks ?? [], vennProps);
	}
);

export const addData = produce<Data[], [VennSpecOptions]>((data, props) => {
	const { circles, intersections } = getVennSolution(props);

	data.push({
		name: 'circles',
		values: circles,
		transform: [
			...getTableJoinTransforms(),
			{ type: 'formula', as: 'strokeSize', expr: 'datum.size * 1' },
			{ type: 'filter', expr: 'indexof(hiddenSeries, datum.table_data.rscSeriesId) === -1' },
		],
	});

	data.push({
		name: 'intersections',
		values: intersections,
		transform: [...getTableJoinTransforms(), ...getHiddenIntersectionTransforms()],
	});

	const tableIndex = data.findIndex((d) => d.name === TABLE);
	data[tableIndex].transform = data[tableIndex].transform ?? [];
	data[tableIndex].transform?.push(...getTableTransforms(props));
});

export const addMarks = produce<Mark[], [VennSpecOptions]>((marks, props) => {
	marks.push(getCircleStrokeMark(props));
	marks.push(getCircleMark(props));
	marks.push(getIntersectionStrokeMark(props));
	marks.push(getInterserctionMark(props));
	marks.push(getTextMark(props, 'circles'), getTextMark(props, 'intersections'));
});

export const addScales = produce<Scale[]>((scales) => {
	addFieldToFacetScaleDomain(scales, COLOR_SCALE, 'set_legend');
	addFieldToFacetScaleDomain(scales, COLOR_SCALE, 'set_id');
});

export const getTableTransforms = (props: VennSpecOptions): (FormulaTransform | FilterTransform)[] => [
	{
		type: 'formula',
		as: 'set_id',
		expr: `join(datum.${props.color}, '${SET_ID_DELIMITER}')`,
	},
	{
		type: 'formula',
		as: 'set_legend',
		expr: `length(datum.${props.color}) > 1 ? datum.${props.color}[0]: join(datum.${props.color}, '${SET_ID_DELIMITER}')`,
	},
];

export const getTableJoinTransforms = (): (LookupTransform | FormulaTransform)[] => [
	{
		type: 'lookup',
		key: 'set_id',
		fields: ['set_id'],
		from: TABLE,
		as: ['table_data'],
	},
	{ type: 'formula', as: 'rscSeriesId', expr: 'datum.table_data.set_id' },
	{ type: 'formula', expr: 'datum.table_data.rscMarkId', as: 'rscMarkId' },
];

export const getHiddenIntersectionTransforms = (): (
	| FormulaTransform
	| FlattenTransform
	| JoinAggregateTransform
	| WindowTransform
	| FilterTransform
)[] => {
	return [
		{ type: 'formula', as: 'hidden', expr: 'hiddenSeries' },
		{ type: 'flatten', fields: ['sets'], as: ['intersect_set'] },
		// check if each set in the relation is in hidden series
		{
			type: 'formula',
			as: 'hide_intersection',
			expr: 'indexof(datum.hidden, datum.intersect_set) === -1 ? 0 : 1',
		},
		// sum up the values
		{ type: 'joinaggregate', groupby: ['set_id'], fields: ['hide_intersection'], ops: ['sum'] },
		{ type: 'filter', expr: 'datum.sum_hide_intersection === 0' },
		// clean up duplicates
		{ type: 'window', groupby: ['set_id'], ops: ['row_number'], as: ['row_num'] },
		{ type: 'filter', expr: 'datum.row_num === 1' },
	];
};

export const addSignals = produce<Signal[], [VennSpecOptions]>((signals, props) => {
	const { chartTooltips, name, idKey } = props;

	if (!isInteractive(props)) return;
	addHighlightedItemSignalEvents(signals, name, idKey, 1, chartTooltips[0]?.excludeDataKeys);
	addHighlightedItemSignalEvents(signals, `${name}_intersections`, idKey, 1, chartTooltips[0]?.excludeDataKeys);
});
