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
import {
	DEFAULT_TIME_DIMENSION,
	DEFAULT_TRANSFORMED_TIME_DIMENSION,
	FILTERED_PREVIOUS_TABLE,
	FILTERED_TABLE,
	MARK_ID,
	PREVIOUS_TABLE,
	SERIES_ID,
	TABLE,
} from '@constants';
import { produce } from 'immer';
import { Compare, Data, FormulaTransform, IdentifierTransform, SourceData, Transforms, ValuesData } from 'vega';

export const addTimeTransform = produce<Transforms[], [string]>((transforms, dimension) => {
	if (transforms.findIndex((transform) => transform.type === 'timeunit') === -1) {
		transforms.push({
			type: 'timeunit',
			field: dimension,
			units: ['year', 'month', 'date', 'hours', 'minutes'],
			as: [DEFAULT_TRANSFORMED_TIME_DIMENSION, `${DEFAULT_TIME_DIMENSION}1`],
		});
	}
});

export const getTransformSort = (order?: string): Compare | undefined => {
	if (order) {
		return { field: order };
	}
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

export const getPreviousTableData = (data: Data[]): ValuesData => {
	// ok to cast this here because we know that the data array will always have table data of type ValuesData
	return data.find((d) => d.name === PREVIOUS_TABLE) as ValuesData;
};
/**
 * gets the filtered table data from the data array
 * @param data
 * @returns
 */
export const getFilteredTableData = (data: Data[]): SourceData => {
	// ok to cast this here because we know that the data array will always have table data of type SourceData
	return data.find((d) => d.name === FILTERED_TABLE) as SourceData;
};

export const getFilteredPreviousTableData = (data: Data[]): SourceData => {
	// ok to cast this here because we know that the data array will always have table data of type SourceData
	return data.find((d) => d.name === FILTERED_PREVIOUS_TABLE) as SourceData;
};

export const getSeriesIdTransform = (facets: string[]): FormulaTransform => {
	const expr = facets.map((facet) => `datum.${facet}`).join(' + " | " + ');
	return {
		type: 'formula',
		as: SERIES_ID,
		expr,
	};
};

export const getIdentifierTransform = (): IdentifierTransform => {
	return {
		type: 'identifier',
		as: MARK_ID,
	};
};
