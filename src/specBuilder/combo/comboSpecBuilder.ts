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
import { DEFAULT_COLOR_SCHEME, DEFAULT_TIME_DIMENSION } from '@constants';
import { addBar } from '@specBuilder/bar/barSpecBuilder';
import { addLine } from '@specBuilder/line/lineSpecBuilder';
import { combineNames, toCamelCase } from '@utils';
import { produce } from 'immer';
import { Spec } from 'vega';

import { BarOptions, ColorScheme, ComboOptions, HighlightedItem, LineOptions } from '../../types';

export const addCombo = produce<
	Spec,
	[ComboOptions & { colorScheme?: ColorScheme; highlightedItem?: HighlightedItem; index?: number; idKey: string }]
>(
	(
		spec,
		{
			colorScheme = DEFAULT_COLOR_SCHEME,
			highlightedItem,
			idKey,
			index = 0,
			name,
			marks = [],
			dimension = DEFAULT_TIME_DIMENSION,
		}
	) => {
		let { barCount, lineCount } = initializeComponentCounts();
		const comboName = toCamelCase(name || `combo${index}`);

		spec = [...marks].reduce((acc: Spec, mark) => {
			switch (mark.markType) {
				case 'bar':
					barCount++;
					return addBar(acc, {
						...mark,
						colorScheme,
						highlightedItem,
						idKey,
						index: barCount,
						name: getComboMarkName(mark, comboName, barCount),
						dimension: getDimension(mark, dimension),
					});
				case 'line':
				default:
					lineCount++;
					return addLine(acc, {
						...mark,
						colorScheme,
						highlightedItem,
						idKey,
						index: lineCount,
						name: getComboMarkName(mark, comboName, lineCount),
						dimension: getDimension(mark, dimension),
					});
			}
		}, spec);

		return spec;
	}
);

const initializeComponentCounts = () => {
	return { barCount: -1, lineCount: -1 };
};

export const getComboMarkName = (mark: BarOptions | LineOptions, comboName: string, index: number) => {
	if (mark.name) {
		return mark.name;
	}
	const displayName = getDisplayName(mark.markType);
	return combineNames(comboName, `${displayName}${index}`);
};

const getDisplayName = (markType: string): string => {
	if (!markType) return '';
	return markType.charAt(0).toUpperCase() + markType.slice(1);
};

const getDimension = (mark: BarOptions | LineOptions, dimension?: string) => mark.dimension ?? dimension;
