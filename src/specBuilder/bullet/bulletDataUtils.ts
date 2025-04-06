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

	if (props.thresholdBarColor && (props.thresholds?.length ?? 0) > 0) {
		transforms.push({
			type: 'formula',
			expr: thresholdColorField(props.thresholds ?? [], props.metric, props.color),
			as: 'barColor',
		});
	}

	return transforms;
};

export function thresholdColorField(
	thresholds: ThresholdBackground[],
	metricField: string,
	defaultColor: string
): string {
	if (!thresholds || thresholds.length === 0) return `'${defaultColor}'`;

	// Sort thresholds by their lower bound.
	// For thresholds with no thresholdMin, we treat them as having -1e12.
	const sorted: ThresholdBackground[] = thresholds.slice().sort((a, b) => {
		const aMin = a.thresholdMin !== undefined ? a.thresholdMin : -1e12;
		const bMin = b.thresholdMin !== undefined ? b.thresholdMin : -1e12;
		return aMin - bMin;
	});

	let exprParts: string[] = [];

	// For values below the first threshold's lower bound, use the default color.
	exprParts.push(
		`(datum.${metricField} < ${
			sorted[0].thresholdMin !== undefined ? sorted[0].thresholdMin : -1e12
		}) ? '${defaultColor}' : `
	);

	// Loop over all thresholds except the last one.
	// For each, if the metric is less than the next threshold's lower bound,
	// then use the current threshold's color.
	for (let i = 0; i < sorted.length - 1; i++) {
		const nextLower = sorted[i + 1].thresholdMin !== undefined ? sorted[i + 1].thresholdMin : -1e12;
		exprParts.push(`(datum.${metricField} < ${nextLower}) ? '${sorted[i].fill}' : `);
	}

	// For values greater than or equal to the last threshold's lower bound,
	// use the last threshold's color.
	exprParts.push(`'${sorted[sorted.length - 1].fill}'`);

	const expr = exprParts.join('');
	console.log('carry forward expr:', expr);
	return expr;
}
