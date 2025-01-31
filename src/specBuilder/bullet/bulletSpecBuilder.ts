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
import { Data, Mark, Scale, Spec } from 'vega';

import { BulletProps } from '../../types';

// Helper function to extract color value from ColorFacet
const getColorValue = (color: any): string => {
	return typeof color === 'object' && 'value' in color ? color.value : (color as string);
};

export const addBullet = produce<Spec, [BulletProps & { index?: number; idKey: string }]>(
	(
		spec,
		{
			label,
			ranges,
			measures,
			target,
			measureColor = 'steelblue',
			rangeColor = 'lightgray',
			targetColor = 'black',
			orientation = 'horizontal',
			index = 0,
		}
	) => {
		const bulletName = `bullet${index}`;

		// Data Source for Vega
		const bulletData: Data = {
			name: bulletName,
			values: [
				{
					label,
					ranges,
					measures,
					target,
				},
			],
		};

		// X Scale: Linear scale for progress bar & target
		const xScale: Scale = {
			name: 'xscale',
			type: 'linear',
			domain: { data: bulletName, field: 'ranges[0]' }, // Use the max range
			range: 'width',
		};

		// Extract colors safely
		const extractedMeasureColor = getColorValue(measureColor);
		const extractedRangeColor = getColorValue(rangeColor);
		const extractedTargetColor = getColorValue(targetColor);

		// Marks: Background Ranges
		const rangeMarks: Mark = {
			type: 'rect',
			from: { data: bulletName },
			encode: {
				enter: {
					x: { scale: 'xscale', value: 0 },
					x2: { scale: 'xscale', field: 'ranges' },
					y: { value: 40 },
					height: { value: 10 },
					fill: { value: extractedRangeColor },
				},
			},
		};

		// Marks: Progress Bar
		const measureMarks: Mark = {
			type: 'rect',
			from: { data: bulletName },
			encode: {
				enter: {
					x: { scale: 'xscale', value: 0 },
					x2: { scale: 'xscale', field: 'measures' },
					y: { value: 40 },
					height: { value: 10 },
					fill: { value: extractedMeasureColor },
					cornerRadiusTopRight: { value: 5 },
					cornerRadiusBottomRight: { value: 5 },
				},
			},
		};

		// Marks: Target Line
		const targetMark: Mark = {
			type: 'rule',
			from: { data: bulletName },
			encode: {
				enter: {
					x: { scale: 'xscale', field: 'target' },
					y: { value: 35 },
					y2: { value: 55 },
					stroke: { value: extractedTargetColor },
					strokeWidth: { value: 2 },
				},
			},
		};

		// Add Components to the Vega Spec
		spec.data = [...(spec.data ?? []), bulletData];
		spec.scales = [...(spec.scales ?? []), xScale];
		spec.marks = [...(spec.marks ?? []), rangeMarks, measureMarks, targetMark];
	}
);
