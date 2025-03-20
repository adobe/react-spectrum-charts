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
import { BulletSpecProps } from 'types';
import { Data, FormulaTransform, ValuesData } from 'vega';

/**
 * Retrieves the bullet table data from the data array. If it doesn't exist, it creates a new one.
 * @param data The data array to search for the bullet table data.
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
 * Retrieves the bullet transforms for the given bullet spec properties.
 * This function creates a formula transform that calculates the xPaddingForTarget value based on the target value.
 * @param props The bullet spec properties.
 * @returns An array of formula transforms for the bullet spec.
 */
export const getBulletTransforms = (props: BulletSpecProps): FormulaTransform[] => {
	//We are multiplying the target by 1.05 to make sure that the target line is never at the very end of the graph
	return [
		{
			type: 'formula',
			expr: `isValid(datum.${props.target}) ? round(datum.${props.target} * 1.05) : 0`,
			as: 'xPaddingForTarget',
		},
	];
};
