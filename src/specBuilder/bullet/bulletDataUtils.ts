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
import { produce } from 'immer';
import { Data, FormulaTransform, ValuesData } from 'vega';

import { BulletSpecProps, ThresholdBackground } from '../../types';

export const addData = produce<Data[], [BulletSpecProps]>((data, props) => {
	const tableData = getBulletTableData(data);
	tableData.values = props.children?.length ? props.children : [];
	tableData.transform = getBulletTransforms(props);
});

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
 * It also generates a color expression for the threshold bars if applicable.
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
			expr: generateThresholdColorExpr(props.thresholds ?? [], props.metric, props.color),
			as: 'barColor',
		});
	}

	return transforms;
};

/**
 * Generates a Vega expression for the color of the bullet chart based on the provided thresholds.
 * The expression checks the value of the metric field against the thresholds and assigns the appropriate color.
 * @param thresholds An array of threshold objects.
 * @param metricField The name of the metric field in the data.
 * @param defaultColor The default color to use if no thresholds are met.
 * @returns A string representing the Vega expression for the color.
 */
export function generateThresholdColorExpr(
	thresholds: ThresholdBackground[],
	metricField: string,
	defaultColor: string
): string {
	if (!thresholds || thresholds.length === 0) return `'${defaultColor}'`;

	const sorted: ThresholdBackground[] = thresholds.slice().sort((a, b) => {
		const aMin = a.thresholdMin !== undefined ? a.thresholdMin : -1e12;
		const bMin = b.thresholdMin !== undefined ? b.thresholdMin : -1e12;
		return aMin - bMin;
	});

	const exprParts: string[] = [];

	// For values below the first threshold's lower bound, use the default color.
	exprParts.push(
		`(datum.${metricField} < ${
			sorted[0].thresholdMin !== undefined ? sorted[0].thresholdMin : -1e12
		}) ? '${defaultColor}' : `
	);

	// For each threshold, check if the metric field is within the range defined by the thresholdMin and thresholdMax values.
	// If it is, use the corresponding fill color.
	for (let i = 0; i < sorted.length - 1; i++) {
		const nextLower = sorted[i + 1].thresholdMin !== undefined ? sorted[i + 1].thresholdMin : -1e12;
		exprParts.push(`(datum.${metricField} < ${nextLower}) ? '${sorted[i].fill}' : `);
	}

	// For values above the last threshold's upper bound, use the last threshold's fill color.
	exprParts.push(`'${sorted[sorted.length - 1].fill}'`);

	const expr = exprParts.join('');
	return expr;
}
