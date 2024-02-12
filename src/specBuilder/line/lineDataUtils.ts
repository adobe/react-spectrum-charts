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
import { MARK_ID } from '@constants';
import { SourceData } from 'vega';

/**
 * gets the data used for highlighting hovered data points
 * @param name
 * @param source
 * @returns
 */
export const getLineHighlightedData = (name: string, source: string, hasPopover: boolean): SourceData => {
	const selectSignal = `${name}_selectedId`;
	const hoverSignal = `${name}_hoveredId`;
	const expr = hasPopover
		? `${selectSignal} && ${selectSignal} === datum.${MARK_ID} || !${selectSignal} && ${hoverSignal} && ${hoverSignal} === datum.${MARK_ID}`
		: `${hoverSignal} && ${hoverSignal} === datum.${MARK_ID}`;
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
 * @param staticPoint
 * @param source
 * @param isSparkline
 * @param isMethodLast
 * @returns
 */
export const getLineStaticPointData = (name: string, staticPoint: string | undefined, source: string, isSparkline: boolean | undefined, isMethodLast: boolean | undefined): SourceData => {
	return {
		name: `${name}_staticPointData`,
		source,
		transform: [
			{
				type: 'filter',
				expr: `${isSparkline && isMethodLast ? `datum === data('table')[data('table').length - 1]` : `datum.${staticPoint} === true`}`,
			},
		],
	};
};
