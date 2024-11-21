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
import { ChartPopover } from '@components/ChartPopover';
import { FILTERED_TABLE, SELECTED_GROUP, SERIES_ID } from '@constants';
import { getFilteredTableData } from '@specBuilder/data/dataUtils';
import { Data, FormulaTransform, SourceData } from 'vega';

import { ChartPopoverElement, ChartPopoverProps, ChartPopoverSpecProps, MarkChildElement } from '../../types';

type PopoverParentProps = {
	children: MarkChildElement[];
	markType?: string;
	name: string;
	dimension: string;
	idKey: string;
};

/**
 * gets all the popovers
 * @param markProps
 * @returns
 */
export const getPopovers = (markProps: PopoverParentProps): ChartPopoverSpecProps[] => {
	const chartPopoverElements = markProps.children.filter(
		(child) => child.type === ChartPopover
	) as ChartPopoverElement[];
	return chartPopoverElements.map((chartPopover) => applyPopoverPropDefaults(chartPopover.props, markProps.name));
};

/**
 * Applies all defaults to ChartPopoverProps
 * @param chartPopoverProps
 * @returns ChartPopoverSpecProps
 */
export const applyPopoverPropDefaults = (
	{ UNSAFE_highlightBy = 'item', ...props }: ChartPopoverProps,
	markName: string
): ChartPopoverSpecProps => {
	return {
		UNSAFE_highlightBy,
		markName,
		...props,
	};
};

/**
 * Sets all the data needed for popovers
 *
 * NOTE: this function mutates the data object so it should only be called from a produce function
 * @param data
 * @param markProps
 */
export const addPopoverData = (data: Data[], markProps: PopoverParentProps, addHighlightedData = true) => {
	const popovers = getPopovers(markProps);

	for (const { UNSAFE_highlightBy, markName } of popovers) {
		const filteredTable = getFilteredTableData(data);
		if (!filteredTable.transform) {
			filteredTable.transform = [];
		}
		if (UNSAFE_highlightBy === 'dimension' && markProps.markType !== 'donut') {
			filteredTable.transform.push(getGroupIdTransform([markProps.dimension], markName));
		} else if (UNSAFE_highlightBy === 'series') {
			filteredTable.transform.push(getGroupIdTransform([SERIES_ID], markName));
		} else if (Array.isArray(UNSAFE_highlightBy)) {
			filteredTable.transform.push(getGroupIdTransform(UNSAFE_highlightBy, markName));
		} else {
			filteredTable.transform.push(getGroupIdTransform([markProps.idKey], markName));
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
