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
import { DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, FILTERED_TABLE } from '@constants';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { DonutSpecProps } from 'types';
import { ColorScheme, DonutProps } from 'types';
import { Data, Mark, Scale, Spec } from 'vega';

export const addDonut = produce<Spec, [DonutProps & { colorScheme?: ColorScheme; index?: number }]>(
	(
		spec,
		{
			children,
			color = { value: 'categorical-100' },
			colorScheme = DEFAULT_COLOR_SCHEME,
			index = 0,
			lineType = { value: 'solid' },
			lineWidth = 0,
			metric = DEFAULT_METRIC,
			name,
			startAngle = 0,
			holeRatio = 0.85,
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
			name: toCamelCase(name || `bar${index}`),
			lineType,
			lineWidth,
			startAngle,
			holeRatio,
			...props,
		};

		spec.data = addData(spec.data ?? [], donutProps);
		spec.scales = addScales(spec.scales ?? [], donutProps);
		spec.marks = addMarks(spec.marks ?? [], donutProps);
		// spec.signals = addSignals(spec.signals ?? [], donutProps);
	}
);

export const addData = produce<Data[], [DonutSpecProps]>((data, props) => {
	const { metric, startAngle, index } = props;
	const filteredTableIndex = data.findIndex((d) => d.name === FILTERED_TABLE);

	//set up transform
	data[filteredTableIndex].transform = data[filteredTableIndex].transform ? data[filteredTableIndex].transform : [];
	data[filteredTableIndex].transform?.push({
		type: 'pie',
		field: metric,
		startAngle,
		endAngle: { signal: `${startAngle} + 2 * PI` },
	});

	//set up aggregate
	data.push({
		name: `donut${index}_aggregate`,
		source: FILTERED_TABLE,
		transform: [
			{
				type: 'aggregate',
				//groupby: ['id'], JADEN - maybe add this back in, to be seen
				fields: [metric],
				ops: ['sum'],
				as: ['sum'],
			},
		],
	});
});

export const addScales = produce<Scale[], [DonutSpecProps]>((scales, props) => {
	scales.push({
		name: 'color',
		type: 'ordinal',
		domain: { data: FILTERED_TABLE, field: 'id' },
		range: { scheme: 'category20' },
	});
});

export const addMarks = produce<Mark[], [DonutSpecProps]>((marks, props) => {
	marks.push({
		type: 'arc',
		from: { data: FILTERED_TABLE },
		encode: {
			enter: {
				fill: { scale: 'color', field: 'id' },
				x: { signal: 'width / 2' },
				y: { signal: 'height / 2' },
			},
			update: {
				startAngle: { field: 'startAngle' },
				endAngle: { field: 'endAngle' },
				padAngle: { value: 0.01 },
				innerRadius: { signal: '0.85* min(width, height) / 2' },
				outerRadius: { signal: 'min(width, height) / 2' },
			},
		},
	});

	marks.push({
		type: 'group',
		name: 'donut0_metricLabel',
		marks: [
			{
				type: 'text',
				from: { data: `donut${props.index}_aggregate` },
				encode: {
					enter: {
						x: { signal: 'width / 2' },
						y: { signal: 'height / 2' },
						text: { signal: "upper(replace(format(datum.sum, '.3~s'), 'G', 'B'))" },
						fontSize: { value: 72 },
						align: { value: 'center' },
					},
				},
			},
			{
				type: 'text',
				from: { data: `donut${props.index}_aggregate` },
				encode: {
					enter: {
						x: { signal: 'width / 2' },
						y: { signal: 'height / 2', offset: 24 },
						text: { value: 'Visitors' },
						fontSize: { value: 24 },
						align: { value: 'center' },
						baseline: { value: 'top' },
					},
				},
			},
		],
	});
});
