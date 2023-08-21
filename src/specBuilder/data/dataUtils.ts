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

import { TABLE } from '@constants';
import produce from 'immer';
import { Compare, Data, Transforms, ValuesData } from 'vega';

export const addTimeTransform = produce<Transforms[], [string]>((transforms, dimension) => {
	if (transforms.findIndex((transform) => transform.type === 'timeunit') === -1) {
		transforms.push({
			type: 'timeunit',
			field: dimension,
			units: ['year', 'month', 'date', 'hours', 'minutes'],
			as: ['datetime0', 'datetime1'],
		});
	}
});

export const getTransformSort = (order?: string): Compare | undefined => {
	if (order) {
		return { field: order };
	}
};

export const isValuesData = (data: Data | undefined): data is ValuesData => {
	return Boolean(data && 'values' in data);
};

/**
 * gets the table data from the data array
 * @param data
 * @returns
 */
export const getTableData = (data: Data[]): ValuesData => {
	// ok to cast this here because we know that the data array will always have table data of type ValuesData
	return data.find((d) => d.name === TABLE) as ValuesData;
};
