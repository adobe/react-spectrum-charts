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
import { ANIMATION_SIGNAL, FILTERED_TABLE, MARK_ID, OLD_TABLE, SERIES_ID, TABLE } from '@constants';
import { produce } from 'immer';
import { Animation } from 'types';
import { Compare, Data, FormulaTransform, SourceData, Transforms, ValuesData } from 'vega';

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

/**
 * gets the table data from the data array
 * @param data
 * @returns
 */
export const getTableData = (data: Data[]): ValuesData => {
	// ok to cast this here because we know that the data array will always have table data of type ValuesData
	return data.find((d) => d.name === TABLE) as ValuesData;
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

export const getSeriesIdTransform = (facets: string[]): FormulaTransform => {
	const expr = facets.map((facet) => `datum.${facet}`).join(' + " | " + ');
	return {
		type: 'formula',
		as: SERIES_ID,
		expr,
	};
};

/**
 * Returns the transform that will be used to animate the metric scale.
 */
export const getMetricAnimationTransform = (metric: string): FormulaTransform => {
	// To animate from the old data to new data we need to do the following:
	// 1. Get the old data at the same index, or 0 if it doesn't exist
	// 2. Multiply that by 1 - animationSignal (for the inverse animation)
	// 3. Add that to the current data multiplied by animationSignal
	const oldDataTable = `data('${OLD_TABLE}')`;
	const indexOfOldData = `indexof(pluck(data('${OLD_TABLE}'), '${MARK_ID}'), datum.${MARK_ID})`;
	const oldDataValue = `(${indexOfOldData} > -1 ? ${oldDataTable}[${indexOfOldData}].${metric} : 0)`;
	const currentDataValue = `datum.${metric}`;
	return {
		type: 'formula',
		as: getEffectiveMetricName(metric, true),
		expr: `${oldDataValue}*(1-${ANIMATION_SIGNAL}) + ${currentDataValue}*${ANIMATION_SIGNAL}`,
	};
};

export const getEffectiveMetricName = (metric: string, animate?: Animation) => {
	return animate ? `${metric}Animated` : metric;
};
