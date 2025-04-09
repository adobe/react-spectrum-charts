/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Data, FormulaTransform, SourceData } from 'vega';

import { FILTERED_TABLE, SELECTED_GROUP, SERIES_ID } from '@spectrum-charts/constants';

import { getFilteredTableData } from '../data/dataUtils';
import {
	AreaSpecOptions,
	BarSpecOptions,
	ChartPopoverOptions,
	ChartPopoverSpecOptions,
	DonutSpecOptions,
	LineSpecOptions,
	ScatterSpecOptions,
} from '../types';

type PopoverParentOptions = AreaSpecOptions | BarSpecOptions | DonutSpecOptions | LineSpecOptions | ScatterSpecOptions;

/**
 * gets all the popovers
 * @param markOptions
 * @returns
 */
export const getPopovers = (chartPopovers: ChartPopoverOptions[], markName: string): ChartPopoverSpecOptions[] => {
	return chartPopovers.map((chartPopover) => applyPopoverPropDefaults(chartPopover, markName));
};

/**
 * Applies all defaults to ChartPopoverOptions
 * @param chartPopoverOptions
 * @returns ChartPopoverSpecOptions
 */
export const applyPopoverPropDefaults = (
	{ UNSAFE_highlightBy = 'item', ...options }: ChartPopoverOptions,
	markName: string
): ChartPopoverSpecOptions => {
	return {
		UNSAFE_highlightBy,
		markName,
		...options,
	};
};

/**
 * Sets all the data needed for popovers
 *
 * NOTE: this function mutates the data object so it should only be called from a produce function
 * @param data
 * @param markOptions
 */
export const addPopoverData = (data: Data[], markOptions: PopoverParentOptions, addHighlightedData = true) => {
	const popovers = getPopovers(markOptions.chartPopovers, markOptions.name);

	for (const { UNSAFE_highlightBy, markName } of popovers) {
		const filteredTable = getFilteredTableData(data);
		if (!filteredTable.transform) {
			filteredTable.transform = [];
		}
		if (UNSAFE_highlightBy === 'dimension' && markOptions.markType !== 'donut') {
			filteredTable.transform.push(getGroupIdTransform([markOptions.dimension], markName));
		} else if (UNSAFE_highlightBy === 'series') {
			filteredTable.transform.push(getGroupIdTransform([SERIES_ID], markName));
		} else if (Array.isArray(UNSAFE_highlightBy)) {
			filteredTable.transform.push(getGroupIdTransform(UNSAFE_highlightBy, markName));
		} else {
			filteredTable.transform.push(getGroupIdTransform([markOptions.idKey], markName));
		}

		if (addHighlightedData) {
			data.push(getMarkSelectedData(markName));
		}
	}
};

/**
 * Gets the group id transform
 * @param highlightBy
 * @param markName
 * @returns FormulaTransform
 */
export const getGroupIdTransform = (highlightBy: string[], markName: string): FormulaTransform => {
	return {
		type: 'formula',
		as: `${markName}_selectedGroupId`,
		expr: highlightBy.map((facet) => `datum.${facet}`).join(' + " | " + '),
	};
};

/**
 * Gets the selected data for a mark
 * @param markName
 * @returns
 */
const getMarkSelectedData = (markName: string): SourceData => ({
	name: `${markName}_selectedData`,
	source: FILTERED_TABLE,
	transform: [
		{
			type: 'filter',
			expr: `${SELECTED_GROUP} === datum.${markName}_selectedGroupId`,
		},
	],
});
