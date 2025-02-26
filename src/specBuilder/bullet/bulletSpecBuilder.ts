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
import { DEFAULT_COLOR_SCHEME } from '@constants';
import { spectrumColors } from '@themes';
import { toCamelCase } from '@utils';
import { Data, Mark, Scale, Spec } from 'vega';

import { BulletProps, BulletSpecProps, ColorScheme } from '../../types';
import { sanitizeMarkChildren } from '../../utils';
import { getColorValue } from '../specUtils';

const DEFAULT_COLOR = spectrumColors.light['static-blue'];

export const addBullet = (
	spec: Spec,
	{
		children,
		colorScheme = DEFAULT_COLOR_SCHEME,
		index = 0,
		name,
		metric,
		dimension,
		target,
		color = DEFAULT_COLOR,
		...props
	}: BulletProps & { colorScheme?: ColorScheme; index?: number; idKey: string }
): Spec => {
	const bulletProps: BulletSpecProps = {
		children: sanitizeMarkChildren(children),
		colorScheme: colorScheme,
		index,
		color: getColorValue(color, colorScheme),
		metric: metric ?? 'currentAmount',
		dimension: dimension ?? 'graphLabel',
		target: target ?? 'target',
		name: toCamelCase(name ?? `bullet${index}`),
		...props,
	};
	return {
		...spec,
		data: getBulletData(bulletProps),
		marks: getBulletMarks(bulletProps),
		scales: getBulletScales(),
	};
};

export function getBulletMarks(props: BulletSpecProps): Mark[] {
	const solidColor = getColorValue('gray-900', props.colorScheme);
	const barLabelColor = getColorValue('gray-600', props.colorScheme);

	const marks: Mark[] = [
		{
			type: 'rect',
			name: `${props.name}rect`,
			from: { data: 'table' },
			description: `${props.name}`,
			encode: {
				enter: {
					x: { value: 0 },
					y: { field: 'index', mult: 60, offset: -44 },
					width: { scale: 'xscale', field: `${props.metric}` },
					height: { value: 6 },
					fill: { value: `${props.color}` },
					cornerRadiusTopRight: { value: 2 },
					cornerRadiusBottomRight: { value: 2 },
				},
			},
		},
		{
			type: 'text',
			name: `${props.name}barlabel`,
			from: { data: 'table' },
			description: 'graphLabel',
			encode: {
				enter: {
					x: { value: 0 },
					y: { field: 'index', mult: 60, offset: -60 },
					text: { field: `${props.dimension}` },
					align: { value: 'left' },
					baseline: { value: 'bottom' },
					fontSize: { value: 11.5 },
					fill: { value: `${barLabelColor}` },
				},
			},
		},
		{
			type: 'text',
			from: { data: 'table' },
			name: `${props.name}amountlabel`,
			description: 'currentAmount',
			encode: {
				enter: {
					x: { signal: 'width' },
					y: { field: 'index', mult: 60, offset: -60 },
					text: {
						signal: `
							datum.${props.metric} != null
								? '${props.metricPrefix || ''}' + format(datum.${props.metric}, '${props.numberFormat || ''}') + '${
							props.metricSuffix || ''
						}'
								: ''
						`,
					},
					align: { value: 'right' },
					baseline: { value: 'bottom' },
					fontSize: { value: 11.5 },
					fill: { value: `${solidColor}` },
				},
			},
		},
		{
			type: 'rule',
			from: { data: 'table' },
			name: `${props.name}rule`,
			description: `${props.name}`,
			encode: {
				enter: {
					x: { scale: 'xscale', field: `${props.target}` },
					y: { field: 'index', mult: 60, offset: -53 },
					y2: { field: 'index', mult: 60, offset: -29 },
					stroke: { value: `${solidColor}` },
					strokeWidth: { value: 2 },
				},
			},
		},
	];

	if (props.targetPrefix || props.targetSuffix) {
		marks.push({
			type: 'text',
			name: `${props.name}targetlabel`,
			from: { data: 'table' },
			description: 'targetValue',
			encode: {
				enter: {
					// Position it near the target rule. Adjust offsets as needed.
					x: { scale: 'xscale', field: `${props.target}`, offset: 5 },
					y: { field: 'index', mult: 60, offset: -41 },
					// Here we use a signal to build the string: if the target value is available, add the prefix/suffix.
					text: {
						signal: `datum.${props.target} != null 
              ? '${props.targetPrefix || ''}' + datum.${props.target} + '${props.targetSuffix || ''}' 
              : ''`,
					},
					align: { value: 'left' },
					baseline: { value: 'middle' },
					fontSize: { value: 11.5 },
					fill: { value: `${solidColor}` },
				},
			},
		});
	}

	return marks;
}

export function getBulletData(props: BulletSpecProps): Data[] {
	//We are multiplying the target by 1.1 to make sure that the target line is never at the very end of the graph
	const maxValue = `max(datum.${props.metric}, datum.${props.target} * 1.1)`;
	const filter = `isValid(datum.${props.dimension}) && datum.${props.dimension} !== null && datum.${props.dimension} !== ''`;

	const bulletData: Data[] = [
		{
			name: 'table',
			values: [],
			transform: [
				{
					type: 'filter',
					expr: filter,
				},
				{
					type: 'formula',
					as: 'maxValue',
					expr: maxValue,
				},
				{
					type: 'window',
					ops: ['row_number'],
					as: ['index'],
				},
			],
		},
		{
			name: 'max_values',
			source: 'table',
			transform: [
				{
					type: 'aggregate',
					ops: ['max'],
					fields: ['maxValue'],
					as: ['maxOverall'],
				},
			],
		},
	];

	return bulletData;
}

export function getBulletScales(): Scale[] {
	const bulletScale: Scale[] = [
		{
			name: 'xscale',
			type: 'linear',
			domain: [
				0,
				{
					signal: "data('max_values')[0].maxOverall",
				},
			],
			range: [0, { signal: 'width' }],
		},
	];

	return bulletScale;
}
