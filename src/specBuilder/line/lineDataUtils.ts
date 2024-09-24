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
import { HIGHLIGHTED_GROUP, HIGHLIGHTED_ITEM, MARK_ID, SELECTED_ITEM } from '@constants';
import { SourceData } from 'vega';

/**
 * gets the data used for highlighting hovered data points
 * @param name
 * @param source
 * @returns
 */
export const getLineHighlightedData = (
	name: string,
	source: string,
	hasPopover: boolean,
	hasGroupId: boolean
): SourceData => {
	const highlightedExpr = hasGroupId
		? `${HIGHLIGHTED_GROUP} === datum.${name}_highlightGroupId`
		: `${HIGHLIGHTED_ITEM} === datum.${MARK_ID}`;
	const expr = hasPopover
		? `${SELECTED_ITEM} && ${SELECTED_ITEM} === datum.${MARK_ID} || !${SELECTED_ITEM} && ${highlightedExpr}`
		: highlightedExpr;
	return {
		name: `${name}_highlightedData`,
		source,
		transform: [
			{
				type: 'filter',
				expr,
			},
		],
	};
};

/**
 * gets the data used for displaying points
 * @param name
 * @param source
 * @returns
 */
export const getLineStaticPointData = (name: string, staticPoint: string, source: string): SourceData => {
	return {
		name: `${name}_staticPointData`,
		source,
		transform: [
			{
				type: 'filter',
				expr: `datum.${staticPoint} === true`,
			},
		],
	};
};
