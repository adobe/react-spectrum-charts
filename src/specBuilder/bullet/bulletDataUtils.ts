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
import { TABLE } from '@constants';
import { getTableData } from '@specBuilder/data/dataUtils';
import { Data, FormulaTransform, ValuesData } from 'vega';

import { BulletSpecProps, ThresholdBackground } from '../../types';

/**
 * Retrieves the bullet table data from the provided data array.
 * If it doesn't exist, creates and pushes a new one.
 * @param data The data array.
 * @returns The bullet table data.
 */
export const getBulletTableData = (data: Data[]): ValuesData => {
	let tableData = getTableData(data);
	if (!tableData) {
		tableData = {
			name: TABLE,
			values: [],
			transform: [],
		};
		data.push(tableData);
	}
	return tableData;
};

/**
 * Generates the necessary formula transforms for the bullet chart.
 * It calculates the xPaddingForTarget and, if in flexible scale mode, adds the flexibleScaleValue.
 * @param props The bullet spec properties.
 * @returns An array of formula transforms.
 */
export const getBulletTransforms = (props: BulletSpecProps): FormulaTransform[] => {
	const transforms: FormulaTransform[] = [
		{
			type: 'formula',
			expr: `isValid(datum.${props.target}) ? round(datum.${props.target} * 1.05) : 0`,
			as: 'xPaddingForTarget',
		},
	];

	if (props.scaleType === 'flexible') {
		transforms.push({
			type: 'formula',
			expr: `${props.maxScaleValue}`,
			as: 'flexibleScaleValue',
		});
	}

	const thresholds = props.thresholds ?? [];
	if (props.thresholdBarColor && hasAllThresholds(thresholds ?? [], thresholds.length - 1)) {
		transforms.push({
			type: 'formula',
			expr: thresholdColorField(props.thresholds ?? [], props.metric),
			as: 'barColor',
		});
	}

	return transforms;
};

export function thresholdColorField(thresholds: ThresholdBackground[], metricField: string): string {
	const sortedThresholds = [...thresholds].sort(
		(a, b) => (a.thresholdMax ?? Infinity) - (b.thresholdMax ?? Infinity)
	);

	let expr = sortedThresholds
		.map((threshold) => {
			if (threshold.thresholdMax !== undefined) {
				return `datum.${metricField} <= ${threshold.thresholdMax} ? '${threshold.fill}'`;
			}
			return `'${threshold.fill}'`;
		})
		.join(' : ');

	return expr;
}

function hasAllThresholds(thresholds: ThresholdBackground[], requiredCount: number): boolean {
	return Array.isArray(thresholds) && thresholds.length >= requiredCount;
}
