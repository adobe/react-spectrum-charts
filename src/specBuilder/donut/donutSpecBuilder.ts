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
import { DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, FILTERED_TABLE } from '@constants';
import { addFieldToFacetScaleDomain } from '@specBuilder/scale/scaleSpecBuilder';
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
			color = DEFAULT_COLOR,
			colorScheme = DEFAULT_COLOR_SCHEME,
			index = 0,
			metric = DEFAULT_METRIC,
			name,
			startAngle = 0,
			holeRatio = 0.85,
			segment,
			hasDirectLabels = false,
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
			startAngle,
			holeRatio,
			segment,
			hasDirectLabels,
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
	data[filteredTableIndex].transform = data[filteredTableIndex].transform ?? [];
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
				fields: [metric],
				ops: ['sum'],
				as: ['sum'],
			},
		],
	});
});

export const addScales = produce<Scale[], [DonutSpecProps]>((scales, props) => {
	const { color } = props;
	addFieldToFacetScaleDomain(scales, 'color', color);
});

export const addMarks = produce<Mark[], [DonutSpecProps]>((marks, props) => {
	const { holeRatio, index, metricLabel, metric, segment, hasDirectLabels } = props;
	const radius = 'min(width, height) / 2';

	//first mark: the arc
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
				innerRadius: { signal: `${holeRatio} * ${radius}` },
				outerRadius: { signal: radius },
			},
		},
	});

	//seocnd mark: the inner aggregate metric
	const groupMark: Mark = {
		type: 'group',
		name: `donut${index}_aggregateText`,
		marks: [
			{
				type: 'text',
				from: { data: `donut${index}_aggregate` },
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
		],
	};
	if (metricLabel) {
		groupMark.marks!.push({
			type: 'text',
			from: { data: `donut${index}_aggregate` },
			encode: {
				enter: {
					x: { signal: 'width / 2' },
					y: { signal: 'height / 2', offset: 24 },
					text: { value: metricLabel },
					fontSize: { value: 24 },
					align: { value: 'center' },
					baseline: { value: 'top' },
				},
			},
		});
	}
	marks.push(groupMark);

	//third mark: the segment labels
	if (hasDirectLabels) {
		marks.push({
			name: `donut${index}_segmentLabels`,
			type: 'group',
			marks: [
				{
					type: 'text',
					from: { data: FILTERED_TABLE },
					encode: {
						enter: {
							text: {
								signal: `if(datum['endAngle'] - datum['startAngle'] < 0.3, '', datum['${metric}'])`,
							},
							x: { signal: 'width / 2' },
							y: { signal: 'height / 2' },
							radius: { signal: `${radius} + 15` },
							theta: { signal: "(datum['startAngle'] + datum['endAngle']) / 2" },
							fontSize: { value: 14 },
							width: { signal: `getLabelWidth(datum['${metric}'], 'bold', '14') + 10` },
							align: {
								signal: "(datum['startAngle'] + datum['endAngle']) / 2 <= PI ? 'left' : 'right'",
							},
							baseline: { value: 'top' },
						},
					},
				},
				{
					type: 'text',
					from: { data: FILTERED_TABLE },
					encode: {
						enter: {
							text: {
								signal: `if(datum['endAngle'] - datum['startAngle'] < 0.3, '', datum['${segment}'])`,
							},
							x: { signal: 'width / 2' },
							y: { signal: 'height / 2' },
							radius: { signal: `${radius} + 15` },
							theta: { signal: "(datum['startAngle'] + datum['endAngle']) / 2" },
							fontSize: { value: 14 },
							width: { signal: `getLabelWidth(datum['${segment}'], 'bold', '14') + 10` },
							align: {
								signal: "(datum['startAngle'] + datum['endAngle']) / 2 <= PI ? 'left' : 'right'",
							},
							baseline: { value: 'bottom' },
						},
					},
				},
			],
		});
	}
});
